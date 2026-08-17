import { Response, NextFunction } from "express";
import { TicketService } from "../services/ticket.service";
import { AppError } from "../middleware/errorHandler";
import { AuthRequest } from "../middleware/auth";

const ticketService = new TicketService();

export class TicketController {
	async getMyTickets(req: AuthRequest, res: Response, next: NextFunction) {
		try {
			if (!req.user) {
				throw new AppError("Authentication required", 401);
			}

			const tickets = await ticketService.getMyTickets(req.user.id);

			res.status(200).json({
				status: "success",
				data: tickets,
			});
		} catch (error) {
			next(error);
		}
	}

	async getEventTickets(req: AuthRequest, res: Response, next: NextFunction) {
		try {
			if (!req.user) {
				throw new AppError("Authentication required", 401);
			}

			if (req.user.role !== "creator") {
				throw new AppError("Only creators can view event tickets", 403);
			}

			const { eventId } = req.params;
			const tickets = await ticketService.getEventTickets(eventId, req.user.id);

			res.status(200).json({
				status: "success",
				data: tickets,
			});
		} catch (error) {
			next(error);
		}
	}

	async getTicket(req: AuthRequest, res: Response, next: NextFunction) {
		try {
			if (!req.user) {
				throw new AppError("Authentication required", 401);
			}

			const { ticketId } = req.params;
			const ticket = await ticketService.getTicket(
				ticketId as string,
				req.user.id,
			);

			res.status(200).json({
				status: "success",
				data: ticket,
			});
		} catch (error) {
			next(error);
		}
	}

	async scanTicket(req: AuthRequest, res: Response, next: NextFunction) {
		try {
			if (!req.user || req.user.role !== "creator") {
				throw new AppError("Only creators can scan tickets", 403);
			}

			const { ticketCode, eventId } = req.body;

			if (!ticketCode || !eventId) {
				throw new AppError("Ticket code and event ID are required", 400);
			}

			const result = await ticketService.scanTicket(ticketCode, eventId);

			res.status(200).json({
				status: "success",
				data: result,
			});
		} catch (error) {
			next(error);
		}
	}

	async verifyQRCode(req: AuthRequest, res: Response, next: NextFunction) {
		try {
			const { qrData } = req.body;

			if (!qrData) {
				throw new AppError("QR code data is required", 400);
			}

			const result = await ticketService.verifyQRCode(qrData);

			res.status(200).json({
				status: "success",
				data: result,
			});
		} catch (error) {
			next(error);
		}
	}
}
