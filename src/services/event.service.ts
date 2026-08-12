import { v4 as uuidv4 } from "uuid";
import { db } from "../config/database";
import { AppError } from "../middleware/errorHandler";
import { Event } from "../types/models";
import { cacheService } from "../config/redis";

export class EventService {
	async createEvent(
		creatorId: string,
		data: {
			title: string;
			description: string;
			category: string;
			venue: string;
			address: string;
			startDate: Date;
			endDate: Date;
			ticketPrice: number;
			totalTickets: number;
			imageUrl?: string;
			reminderDays?: number;
			reminderHours?: number;
		},
	): Promise<Event> {
		// Validate dates
		if (new Date(data.startDate) >= new Date(data.endDate)) {
			throw new AppError("End date must be after start date", 400);
		}

		if (new Date(data.startDate) < new Date()) {
			throw new AppError("Start date must be in the future", 400);
		}

		const eventId = uuidv4();

		const event = await db.one<Event>(
			`INSERT INTO events (
        id, creator_id, title, description, category, venue, address,
        start_date, end_date, ticket_price, total_tickets, available_tickets,
        image_url, is_published
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
			[
				eventId,
				creatorId,
				data.title,
				data.description,
				data.category,
				data.venue,
				data.address,
				data.startDate,
				data.endDate,
				data.ticketPrice,
				data.totalTickets,
				data.totalTickets, // available_tickets same as total initially
				data.imageUrl || null,
				false, // not published by default
			],
		);

		// Create default reminder if provided
		if (data.reminderDays !== undefined || data.reminderHours !== undefined) {
			await db.none(
				`INSERT INTO event_reminders (
          id, event_id, user_id, reminder_type, remind_before_days, remind_before_hours
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
				[
					uuidv4(),
					eventId,
					creatorId,
					"creator_default",
					data.reminderDays || 0,
					data.reminderHours || 0,
				],
			);
		}

		return event;
	}

	async updateEvent(
		eventId: string,
		creatorId: string,
		data: Partial<{
			title: string;
			description: string;
			category: string;
			venue: string;
			address: string;
			startDate: Date;
			endDate: Date;
			ticketPrice: number;
			totalTickets: number;
			imageUrl: string;
			isPublished: boolean;
		}>,
	): Promise<Event> {
		// Check ownership
		const event = await db.oneOrNone(
			"SELECT * FROM events WHERE id = $1 AND creator_id = $2",
			[eventId, creatorId],
		);

		if (!event) {
			throw new AppError("Event not found or unauthorized", 404);
		}

		const updates: string[] = [];
		const values: any[] = [];
		let paramCount = 1;

		Object.entries(data).forEach(([key, value]) => {
			if (value !== undefined) {
				const snakeKey = key.replace(
					/[A-Z]/g,
					(letter) => `_${letter.toLowerCase()}`,
				);
				updates.push(`${snakeKey} = $${paramCount++}`);
				values.push(value);
			}
		});

		if (updates.length === 0) {
			return event;
		}

		values.push(eventId);

		const updatedEvent = await db.one<Event>(
			`UPDATE events SET ${updates.join(", ")} WHERE id = $${paramCount}
       RETURNING *`,
			values,
		);

		// Clear cache
		await cacheService.del(`event:${eventId}`);
		await cacheService.delPattern(`events:*`);

		return updatedEvent;
	}

	async getEvent(eventId: string): Promise<Event> {
		// Check cache
		const cached = await cacheService.get<Event>(`event:${eventId}`);
		if (cached) {
			return cached;
		}

		const event = await db.oneOrNone<Event>(
			"SELECT * FROM events WHERE id = $1",
			[eventId],
		);

		if (!event) {
			throw new AppError("Event not found", 404);
		}

		// Cache for 1 hour
		await cacheService.set(`event:${eventId}`, event, 3600);

		return event;
	}

	async getAllEvents(filters: {
		category?: string;
		search?: string;
		startDate?: Date;
		endDate?: Date;
		minPrice?: number;
		maxPrice?: number;
		page?: number;
		limit?: number;
	}): Promise<{
		events: Event[];
		total: number;
		page: number;
		totalPages: number;
	}> {
		const page = filters.page || 1;
		const limit = filters.limit || 20;
		const offset = (page - 1) * limit;

		const conditions: string[] = ["is_published = true"];
		const values: any[] = [];
		let paramCount = 1;

		if (filters.category) {
			conditions.push(`category = $${paramCount++}`);
			values.push(filters.category);
		}

		if (filters.search) {
			conditions.push(
				`(title ILIKE $${paramCount} OR description ILIKE $${paramCount})`,
			);
			values.push(`%${filters.search}%`);
			paramCount++;
		}

		if (filters.startDate) {
			conditions.push(`start_date >= $${paramCount++}`);
			values.push(filters.startDate);
		}

		if (filters.endDate) {
			conditions.push(`end_date <= $${paramCount++}`);
			values.push(filters.endDate);
		}

		if (filters.minPrice !== undefined) {
			conditions.push(`ticket_price >= $${paramCount++}`);
			values.push(filters.minPrice);
		}

		if (filters.maxPrice !== undefined) {
			conditions.push(`ticket_price <= $${paramCount++}`);
			values.push(filters.maxPrice);
		}

		const whereClause =
			conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

		// Get total count
		const countResult = await db.one<{ count: string }>(
			`SELECT COUNT(*) as count FROM events ${whereClause}`,
			values,
		);
		const total = parseInt(countResult.count);

		// Get events
		const events = await db.manyOrNone<Event>(
			`SELECT * FROM events ${whereClause}
       ORDER BY start_date ASC
       LIMIT $${paramCount++} OFFSET $${paramCount}`,
			[...values, limit, offset],
		);

		return {
			events: events || [],
			total,
			page,
			totalPages: Math.ceil(total / limit),
		};
	}

	async getCreatorEvents(creatorId: string): Promise<Event[]> {
		const events = await db.manyOrNone<Event>(
			"SELECT * FROM events WHERE creator_id = $1 ORDER BY created_at DESC",
			[creatorId],
		);

		return events || [];
	}

	async deleteEvent(eventId: string, creatorId: string): Promise<void> {
		const result = await db.result(
			"DELETE FROM events WHERE id = $1 AND creator_id = $2",
			[eventId, creatorId],
		);

		if (result.rowCount === 0) {
			throw new AppError("Event not found or unauthorized", 404);
		}

		// Clear cache
		await cacheService.del(`event:${eventId}`);
		await cacheService.delPattern(`events:*`);
	}

	async shareEvent(
		eventId: string,
		userId: string,
		platform: string,
	): Promise<{ shareUrl: string }> {
		// Verify event exists
		await this.getEvent(eventId);

		// Record the share
		await db.none(
			"INSERT INTO event_shares (id, event_id, shared_by, platform) VALUES ($1, $2, $3, $4)",
			[uuidv4(), eventId, userId, platform],
		);

		const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001";
		const shareUrl = `${frontendUrl}/events/${eventId}`;

		return { shareUrl };
	}

	async getEventAttendees(eventId: string, creatorId: string): Promise<any[]> {
		// Verify ownership
		const event = await db.oneOrNone(
			"SELECT id FROM events WHERE id = $1 AND creator_id = $2",
			[eventId, creatorId],
		);

		if (!event) {
			throw new AppError("Event not found or unauthorized", 404);
		}

		const attendees = await db.manyOrNone(
			`SELECT 
        u.id, u.email, u.first_name, u.last_name, u.phone,
        t.ticket_code, t.purchase_date, t.is_scanned, t.scanned_at,
        p.amount, p.payment_status
       FROM tickets t
       JOIN users u ON t.user_id = u.id
       LEFT JOIN payments p ON t.id = p.ticket_id
       WHERE t.event_id = $1
       ORDER BY t.purchase_date DESC`,
			[eventId],
		);

		return attendees || [];
	}
}
