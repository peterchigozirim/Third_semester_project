import { v4 as uuidv4 } from "uuid";
import { db } from "../config/database";
import { AppError } from "../middleware/errorHandler";
import { EmailService } from "./email.service";
import { logger } from "../utils/logger";

const emailService = new EmailService();

export class NotificationService {
	async createReminder(
		userId: string,
		eventId: string,
		remindBeforeDays: number,
		remindBeforeHours: number,
	): Promise<any> {
		// Verify event exists
		const event = await db.oneOrNone(
			"SELECT id, start_date FROM events WHERE id = $1",
			[eventId],
		);

		if (!event) {
			throw new AppError("Event not found", 404);
		}

		// Check if user has a ticket for this event
		const ticket = await db.oneOrNone(
			"SELECT id FROM tickets WHERE event_id = $1 AND user_id = $2",
			[eventId, userId],
		);

		if (!ticket) {
			throw new AppError("You must have a ticket to set a reminder", 400);
		}

		// Delete existing custom reminder if exists
		await db.none(
			"DELETE FROM event_reminders WHERE event_id = $1 AND user_id = $2 AND reminder_type = $3",
			[eventId, userId, "user_custom"],
		);

		// Create new reminder
		const reminder = await db.one(
			`INSERT INTO event_reminders (
        id, event_id, user_id, reminder_type, remind_before_days, remind_before_hours, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
			[
				uuidv4(),
				eventId,
				userId,
				"user_custom",
				remindBeforeDays,
				remindBeforeHours,
				true,
			],
		);

		// Calculate scheduled time for notification
		const scheduledFor = new Date(event.start_date);
		scheduledFor.setDate(scheduledFor.getDate() - remindBeforeDays);
		scheduledFor.setHours(scheduledFor.getHours() - remindBeforeHours);

		// Create notification record
		await this.createNotification(
			userId,
			eventId,
			"reminder",
			"Event Reminder",
			`Your event is coming up soon!`,
			scheduledFor,
		);

		return reminder;
	}

	async createNotification(
		userId: string,
		eventId: string,
		type: "reminder" | "ticket_purchase" | "event_update",
		title: string,
		message: string,
		scheduledFor: Date,
	): Promise<any> {
		const notification = await db.one(
			`INSERT INTO notifications (
        id, user_id, event_id, type, title, message, scheduled_for, is_sent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
			[uuidv4(), userId, eventId, type, title, message, scheduledFor, false],
		);

		return notification;
	}

	async getUserNotifications(userId: string): Promise<any[]> {
		const notifications = await db.manyOrNone(
			`SELECT n.*, e.title as event_title
       FROM notifications n
       JOIN events e ON n.event_id = e.id
       WHERE n.user_id = $1
       ORDER BY n.scheduled_for DESC
       LIMIT 50`,
			[userId],
		);

		return notifications || [];
	}

	async getUserReminders(userId: string): Promise<any[]> {
		const reminders = await db.manyOrNone(
			`SELECT er.*, e.title as event_title, e.start_date
       FROM event_reminders er
       JOIN events e ON er.event_id = e.id
       WHERE er.user_id = $1 AND er.is_active = true
       ORDER BY e.start_date ASC`,
			[userId],
		);

		return reminders || [];
	}

	async deleteReminder(reminderId: string, userId: string): Promise<void> {
		const result = await db.result(
			"DELETE FROM event_reminders WHERE id = $1 AND user_id = $2",
			[reminderId, userId],
		);

		if (result.rowCount === 0) {
			throw new AppError("Reminder not found", 404);
		}
	}

	async processPendingNotifications(): Promise<void> {
		try {
			// Get notifications that should be sent now
			const notifications = await db.manyOrNone(
				`SELECT n.*, u.email, u.first_name, e.title, e.start_date, e.venue
         FROM notifications n
         JOIN users u ON n.user_id = u.id
         JOIN events e ON n.event_id = e.id
         WHERE n.is_sent = false 
           AND n.scheduled_for <= NOW()
         LIMIT 100`,
			);

			if (!notifications || notifications.length === 0) {
				return;
			}

			logger.info(`Processing ${notifications.length} pending notifications`);

			for (const notification of notifications) {
				try {
					// Send email based on notification type
					if (notification.type === "reminder") {
						await emailService.sendEventReminder(
							notification.email,
							notification.title,
							notification.start_date,
							notification.venue,
						);
					} else if (notification.type === "event_update") {
						await emailService.sendEventUpdate(
							notification.email,
							notification.title,
							notification.message,
						);
					}

					// Mark as sent
					await db.none(
						"UPDATE notifications SET is_sent = true, sent_at = NOW() WHERE id = $1",
						[notification.id],
					);

					logger.info(`Notification sent to ${notification.email}`);
				} catch (error) {
					logger.error(
						`Failed to send notification ${notification.id}:`,
						error,
					);
				}
			}
		} catch (error) {
			logger.error("Error processing notifications:", error);
		}
	}

	async sendTicketPurchaseNotification(
		userId: string,
		eventId: string,
		ticketCode: string,
	): Promise<void> {
		try {
			const data = await db.one(
				`SELECT u.email, u.first_name, e.title, e.start_date, e.venue
         FROM users u, events e
         WHERE u.id = $1 AND e.id = $2`,
				[userId, eventId],
			);

			await emailService.sendTicketPurchaseConfirmation(
				data.email,
				data.title,
				ticketCode,
				data.start_date,
				data.venue,
			);

			// Create notification record
			await this.createNotification(
				userId,
				eventId,
				"ticket_purchase",
				"Ticket Purchase Confirmed",
				`Your ticket for ${data.title} has been confirmed`,
				new Date(),
			);
		} catch (error) {
			logger.error("Error sending ticket purchase notification:", error);
		}
	}
}
