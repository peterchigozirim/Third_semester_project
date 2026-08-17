import { v4 as uuidv4 } from "uuid";
import { db } from "../config/database";
import { AppError } from "../middleware/errorHandler";
import { Ticket } from "../types/models";
import { QRCodeService } from "./qrcode.service";

const qrCodeService = new QRCodeService();

export class TicketService {
	async purchaseTicket(
		userId: string,
		eventId: string,
		paymentId: string,
	): Promise<Ticket> {
		// Check if event exists and has available tickets
		const event = await db.oneOrNone(
			"SELECT id, available_tickets, ticket_price FROM events WHERE id = $1 AND is_published = true",
			[eventId],
		);

		if (!event) {
			throw new AppError("Event not found or not published", 404);
		}

		if (event.available_tickets <= 0) {
			throw new AppError("No tickets available", 400);
		}

		// Check if user already has a ticket for this event
		const existingTicket = await db.oneOrNone(
			"SELECT id FROM tickets WHERE event_id = $1 AND user_id = $2",
			[eventId, userId],
		);

		if (existingTicket) {
			throw new AppError("You already have a ticket for this event", 400);
		}

		const ticketId = uuidv4();
		const ticketCode = `TKT-${Date.now()}-${ticketId.substring(0, 8).toUpperCase()}`;

		// Generate QR code data
		const qrData = qrCodeService.generateTicketData(ticketId, eventId, userId);
		const qrCode = await qrCodeService.generateQRCode(qrData);

		// Create ticket in a transaction
		const ticket = await db.tx(async (t) => {
			// Create ticket
			const newTicket = await t.one<Ticket>(
				`INSERT INTO tickets (id, event_id, user_id, ticket_code, qr_code)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
				[ticketId, eventId, userId, ticketCode, qrCode],
			);

			// Update available tickets
			await t.none(
				"UPDATE events SET available_tickets = available_tickets - 1 WHERE id = $1",
				[eventId],
			);

			// Update payment with ticket ID
			await t.none("UPDATE payments SET ticket_id = $1 WHERE id = $2", [
				ticketId,
				paymentId,
			]);

			return newTicket;
		});

		return ticket;
	}

	async getMyTickets(userId: string): Promise<any[]> {
		const tickets = await db.manyOrNone(
			`SELECT 
        t.*,
        e.title as event_title,
        e.description as event_description,
        e.venue,
        e.address,
        e.start_date,
        e.end_date,
        e.category,
        e.image_url
       FROM tickets t
       JOIN events e ON t.event_id = e.id
       WHERE t.user_id = $1
       ORDER BY e.start_date DESC`,
			[userId],
		);

		return tickets || [];
	}

	async getEventTickets(eventId: string, creatorId: string): Promise<any[]> {
		// First verify the event belongs to the creator
		const event = await db.oneOrNone(
			"SELECT id FROM events WHERE id = $1 AND creator_id = $2",
			[eventId, creatorId],
		);

		if (!event) {
			throw new AppError(
				"Event not found or you don't have permission to view these tickets",
				404,
			);
		}

		// Get all tickets for this event with user information
		const tickets = await db.manyOrNone(
			`SELECT 
        t.*,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        p.amount as paid_amount,
        p.payment_status,
        p.created_at as payment_date
       FROM tickets t
       JOIN users u ON t.user_id = u.id
       LEFT JOIN payments p ON p.ticket_id = t.id
       WHERE t.event_id = $1
       ORDER BY t.created_at DESC`,
			[eventId],
		);
		return tickets || [];
	}

	async getTicket(ticketId: string, userId: string): Promise<Ticket> {
		const ticket = await db.oneOrNone<Ticket>(
			"SELECT * FROM tickets WHERE id = $1 AND user_id = $2",
			[ticketId, userId],
		);

		if (!ticket) {
			throw new AppError("Ticket not found", 404);
		}

		return ticket;
	}

	async scanTicket(
		ticketCode: string,
		eventId: string,
	): Promise<{ valid: boolean; message: string; ticket?: any }> {
		const ticket = await db.oneOrNone(
			`SELECT t.*, u.first_name, u.last_name, u.email, e.title as event_title
       FROM tickets t
       JOIN users u ON t.user_id = u.id
       JOIN events e ON t.event_id = e.id
       WHERE t.ticket_code = $1 AND t.event_id = $2`,
			[ticketCode, eventId],
		);

		if (!ticket) {
			return {
				valid: false,
				message: "Invalid ticket or wrong event",
			};
		}

		if (ticket.is_scanned) {
			return {
				valid: false,
				message: `Ticket already scanned on ${new Date(ticket.scanned_at).toLocaleString()}`,
				ticket,
			};
		}

		// Mark ticket as scanned
		await db.none(
			"UPDATE tickets SET is_scanned = true, scanned_at = NOW() WHERE id = $1",
			[ticket.id],
		);

		return {
			valid: true,
			message: "Ticket is valid",
			ticket: {
				...ticket,
				is_scanned: true,
				scanned_at: new Date(),
			},
		};
	}

	async verifyQRCode(
		qrData: string,
	): Promise<{ valid: boolean; ticket?: any }> {
		try {
			const data = qrCodeService.verifyTicketData(qrData);

			const ticket = await db.oneOrNone(
				`SELECT t.*, e.title as event_title, u.first_name, u.last_name
         FROM tickets t
         JOIN events e ON t.event_id = e.id
         JOIN users u ON t.user_id = u.id
         WHERE t.id = $1`,
				[data.ticketId],
			);

			if (!ticket) {
				return { valid: false };
			}

			return {
				valid: true,
				ticket,
			};
		} catch (error) {
			return { valid: false };
		}
	}
}
