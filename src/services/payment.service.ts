import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { db } from "../config/database";
import { AppError } from "../middleware/errorHandler";
import { Payment } from "../types/models";

export class PaymentService {
	private paystackSecretKey: string;
	private paystackBaseUrl = "https://api.paystack.co";

	constructor() {
		this.paystackSecretKey = process.env.PAYSTACK_SECRET_KEY || "";
		if (!this.paystackSecretKey) {
			throw new Error("PAYSTACK_SECRET_KEY is required");
		}
	}

	async initiatePayment(
		userId: string,
		eventId: string,
		email: string,
	): Promise<{
		authorizationUrl: string;
		reference: string;
		payment: Payment;
	}> {
		// Get event details
		const event = await db.oneOrNone(
			"SELECT id, title, ticket_price, available_tickets FROM events WHERE id = $1 AND is_published = true",
			[eventId],
		);

		if (!event) {
			throw new AppError("Event not found or not published", 404);
		}

		if (event.available_tickets <= 0) {
			throw new AppError("No tickets available", 400);
		}

		// Check if user already has a ticket
		const existingTicket = await db.oneOrNone(
			"SELECT id FROM tickets WHERE event_id = $1 AND user_id = $2",
			[eventId, userId],
		);

		if (existingTicket) {
			throw new AppError("You already have a ticket for this event", 400);
		}

		const paymentReference = `PAY-${Date.now()}-${uuidv4().substring(0, 8)}`;
		const amount = event.ticket_price * 100; // Convert to kobo

		// Create payment record
		const payment = await db.one<Payment>(
			`INSERT INTO payments (
        id, user_id, event_id, amount, currency, payment_reference, payment_status, payment_gateway
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
			[
				uuidv4(),
				userId,
				eventId,
				event.ticket_price,
				"NGN",
				paymentReference,
				"pending",
				"paystack",
			],
		);

		// Initialize Paystack payment
		try {
			const response = await axios.post(
				`${this.paystackBaseUrl}/transaction/initialize`,
				{
					email,
					amount,
					reference: paymentReference,
					callback_url: process.env.PAYSTACK_CALLBACK_URL,
					metadata: {
						user_id: userId,
						event_id: eventId,
						payment_id: payment.id,
						event_title: event.title,
					},
				},
				{
					headers: {
						Authorization: `Bearer ${this.paystackSecretKey}`,
						"Content-Type": "application/json",
					},
				},
			);

			if (!response.data.status) {
				throw new AppError("Failed to initialize payment", 500);
			}

			// Update payment with Paystack reference
			await db.none(
				"UPDATE payments SET paystack_reference = $1 WHERE id = $2",
				[response.data.data.reference, payment.id],
			);

			return {
				authorizationUrl: response.data.data.authorization_url,
				reference: response.data.data.reference,
				payment,
			};
		} catch (error: any) {
			throw new AppError(
				error.response?.data?.message || "Payment initialization failed",
				500,
			);
		}
	}

	async verifyPayment(
		reference: string,
	): Promise<{ success: boolean; payment: Payment }> {
		try {
			// Verify with Paystack
			const response = await axios.get(
				`${this.paystackBaseUrl}/transaction/verify/${reference}`,
				{
					headers: {
						Authorization: `Bearer ${this.paystackSecretKey}`,
					},
				},
			);

			if (!response.data.status) {
				throw new AppError("Payment verification failed", 400);
			}

			const paystackData = response.data.data;

			// Update payment status
			const payment = await db.one<Payment>(
				`UPDATE payments 
         SET payment_status = $1, paystack_reference = $2
         WHERE payment_reference = $3 OR paystack_reference = $3
         RETURNING *`,
				[
					paystackData.status === "success" ? "success" : "failed",
					paystackData.reference,
					reference,
				],
			);

			return {
				success: paystackData.status === "success",
				payment,
			};
		} catch (error: any) {
			throw new AppError(
				error.response?.data?.message || "Payment verification failed",
				500,
			);
		}
	}

	async getPaymentHistory(userId: string): Promise<Payment[]> {
		const payments = await db.manyOrNone<Payment>(
			`SELECT p.*, e.title as event_title
       FROM payments p
       JOIN events e ON p.event_id = e.id
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC`,
			[userId],
		);

		return payments || [];
	}

	async getCreatorPayments(
		creatorId: string,
		eventId?: string,
	): Promise<any[]> {
		let query = `
      SELECT p.*, e.title as event_title, u.first_name, u.last_name, u.email
      FROM payments p
      JOIN events e ON p.event_id = e.id
      JOIN users u ON p.user_id = u.id
      WHERE e.creator_id = $1
    `;

		const params: any[] = [creatorId];

		if (eventId) {
			query += " AND p.event_id = $2";
			params.push(eventId);
		}

		query += " ORDER BY p.created_at DESC";

		const payments = await db.manyOrNone(query, params);

		return payments || [];
	}

	async handleWebhook(payload: any): Promise<void> {
		const { event, data } = payload;

		if (event === "charge.success") {
			const reference = data.reference;

			// Update payment status
			const payment = await db.oneOrNone<Payment>(
				`UPDATE payments 
         SET payment_status = 'success'
         WHERE paystack_reference = $1 OR payment_reference = $1
         RETURNING *`,
				[reference],
			);

			if (payment) {
				// Here you would trigger ticket creation
				// This will be handled by the ticket service
				console.log("Payment successful, ticket will be created:", payment.id);
			}
		}
	}
}
