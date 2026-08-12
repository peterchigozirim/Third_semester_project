import { Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { NotificationService } from "../services/notification.service";
import { AppError } from "../middleware/errorHandler";
import { AuthRequest } from "../middleware/auth";

const notificationService = new NotificationService();

export class NotificationController {
	static createReminderValidation = [
		body("eventId").notEmpty().withMessage("Event ID is required"),
		body("remindBeforeDays")
			.isInt({ min: 0 })
			.withMessage("Days must be a positive number"),
		body("remindBeforeHours")
			.isInt({ min: 0 })
			.withMessage("Hours must be a positive number"),
	];

	async createReminder(req: AuthRequest, res: Response, next: NextFunction) {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				throw new AppError(errors.array()[0]?.msg || "Validation error", 400);
			}

			if (!req.user) {
				throw new AppError("Authentication required", 401);
			}

			const { eventId, remindBeforeDays, remindBeforeHours } = req.body;

			const reminder = await notificationService.createReminder(
				req.user.id,
				eventId,
				remindBeforeDays,
				remindBeforeHours,
			);

			res.status(201).json({
				status: "success",
				message: "Reminder created successfully",
				data: reminder,
			});
		} catch (error) {
			next(error);
		}
	}

	async getNotifications(req: AuthRequest, res: Response, next: NextFunction) {
		try {
			if (!req.user) {
				throw new AppError("Authentication required", 401);
			}

			const notifications = await notificationService.getUserNotifications(
				req.user.id,
			);

			res.status(200).json({
				status: "success",
				data: notifications,
			});
		} catch (error) {
			next(error);
		}
	}

	async getReminders(req: AuthRequest, res: Response, next: NextFunction) {
		try {
			if (!req.user) {
				throw new AppError("Authentication required", 401);
			}

			const reminders = await notificationService.getUserReminders(req.user.id);

			res.status(200).json({
				status: "success",
				data: reminders,
			});
		} catch (error) {
			next(error);
		}
	}

	async deleteReminder(req: AuthRequest, res: Response, next: NextFunction) {
		try {
			if (!req.user) {
				throw new AppError("Authentication required", 401);
			}

			const { reminderId } = req.params;

			await notificationService.deleteReminder(
				reminderId as string,
				req.user.id,
			);

			res.status(200).json({
				status: "success",
				message: "Reminder deleted successfully",
			});
		} catch (error) {
			next(error);
		}
	}
}
