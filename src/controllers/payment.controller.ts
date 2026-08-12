import { Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { PaymentService } from "../services/payment.service";
import { TicketService } from "../services/ticket.service";
import { AppError } from "../middleware/errorHandler";
import { AuthRequest } from "../middleware/auth";

const paymentService = new PaymentService();
const ticketService = new TicketService();

export class PaymentController {
	static initiatePaymentValidation = [
		body("eventId").notEmpty().withMessage("Event ID is required"),
	];

	async initiatePayment(req: AuthRequest, res: Response, next: NextFunction) {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				throw new AppError(errors.array()[0]?.msg || "Validation error", 400);
			}

			if (!req.user) {
				throw new AppError("Authentication required", 401);
			}

			const { eventId } = req.body;

			const result = await paymentService.initiatePayment(
				req.user.id,
				eventId,
				req.user.email,
			);

			res.status(200).json({
				status: "success",
				message: "Payment initiated successfully",
				data: result,
			});
		} catch (error) {
			next(error);
		}
	}

	async verifyPayment(req: AuthRequest, res: Response, next: NextFunction) {
		try {
			const { reference } = req.query;

			if (!reference || typeof reference !== "string") {
				throw new AppError("Payment reference is required", 400);
			}

			const result = await paymentService.verifyPayment(reference);

			// If payment is successful, create ticket
			if (result.success && result.payment.payment_status === "success") {
				const ticket = await ticketService.purchaseTicket(
					result.payment.user_id,
					result.payment.event_id,
					result.payment.id,
				);

				res.status(200).json({
					status: "success",
					message: "Payment verified and ticket generated successfully",
					data: {
						payment: result.payment,
						ticket,
					},
				});
			} else {
				res.status(400).json({
					status: "error",
					message: "Payment verification failed",
					data: result,
				});
			}
		} catch (error) {
			next(error);
		}
	}

	async handleCallback(req: AuthRequest, res: Response, next: NextFunction) {
		try {
			const { reference } = req.query;

			if (!reference || typeof reference !== "string") {
				throw new AppError("Payment reference is required", 400);
			}

			const result = await paymentService.verifyPayment(reference);

			if (result.success) {
				// Create ticket
				await ticketService.purchaseTicket(
					result.payment.user_id,
					result.payment.event_id,
					result.payment.id,
				);

				// Redirect to frontend success page
				const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001";
				res.redirect(`${frontendUrl}/payment/success?reference=${reference}`);
			} else {
				const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001";
				res.redirect(`${frontendUrl}/payment/failed?reference=${reference}`);
			}
		} catch (error) {
			next(error);
		}
	}

	async handleWebhook(req: AuthRequest, res: Response, next: NextFunction) {
		try {
			// Verify webhook signature (implement based on Paystack documentation)
			await paymentService.handleWebhook(req.body);

			res.status(200).json({ status: "success" });
		} catch (error) {
			next(error);
		}
	}

	async getPaymentHistory(req: AuthRequest, res: Response, next: NextFunction) {
		try {
			if (!req.user) {
				throw new AppError("Authentication required", 401);
			}

			const payments = await paymentService.getPaymentHistory(req.user.id);

			res.status(200).json({
				status: "success",
				data: payments,
			});
		} catch (error) {
			next(error);
		}
	}

	async getCreatorPayments(
		req: AuthRequest,
		res: Response,
		next: NextFunction,
	) {
		try {
			if (!req.user || req.user.role !== "creator") {
				throw new AppError("Only creators can view payment details", 403);
			}

			const { eventId } = req.query;

			const payments = await paymentService.getCreatorPayments(
				req.user.id,
				eventId as string | undefined,
			);

			res.status(200).json({
				status: "success",
				data: payments,
			});
		} catch (error) {
			next(error);
		}
	}
}
