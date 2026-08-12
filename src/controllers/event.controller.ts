import { Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { EventService } from "../services/event.service";
import { AppError } from "../middleware/errorHandler";
import { AuthRequest } from "../middleware/auth";

const eventService = new EventService();

export class EventController {
	static createEventValidation = [
		body("title").notEmpty().withMessage("Title is required"),
		body("description").notEmpty().withMessage("Description is required"),
		body("category").notEmpty().withMessage("Category is required"),
		body("venue").notEmpty().withMessage("Venue is required"),
		body("address").notEmpty().withMessage("Address is required"),
		body("startDate").isISO8601().withMessage("Valid start date is required"),
		body("endDate").isISO8601().withMessage("Valid end date is required"),
		body("ticketPrice")
			.isNumeric()
			.withMessage("Valid ticket price is required"),
		body("totalTickets")
			.isInt({ min: 1 })
			.withMessage("Total tickets must be at least 1"),
	];

	async createEvent(req: AuthRequest, res: Response, next: NextFunction) {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				throw new AppError(errors.array()[0]?.msg || "Validation error", 400);
			}

			if (!req.user || req.user.role !== "creator") {
				throw new AppError("Only creators can create events", 403);
			}

			const event = await eventService.createEvent(req.user.id, req.body);

			res.status(201).json({
				status: "success",
				message: "Event created successfully",
				data: event,
			});
		} catch (error) {
			next(error);
		}
	}

	async updateEvent(req: AuthRequest, res: Response, next: NextFunction) {
		try {
			if (!req.user || req.user.role !== "creator") {
				throw new AppError("Only creators can update events", 403);
			}

			const { eventId } = req.params;
			const event = await eventService.updateEvent(
				eventId,
				req.user.id,
				req.body,
			);

			res.status(200).json({
				status: "success",
				message: "Event updated successfully",
				data: event,
			});
		} catch (error) {
			next(error);
		}
	}

	async getEvent(req: AuthRequest, res: Response, next: NextFunction) {
		try {
			const { eventId } = req.params;
			const event = await eventService.getEvent(eventId);

			res.status(200).json({
				status: "success",
				data: event,
			});
		} catch (error) {
			next(error);
		}
	}

	async getAllEvents(req: AuthRequest, res: Response, next: NextFunction) {
		try {
			const {
				category,
				search,
				startDate,
				endDate,
				minPrice,
				maxPrice,
				page,
				limit,
			} = req.query;

			const result = await eventService.getAllEvents({
				category: category as string,
				search: search as string,
				startDate: startDate ? new Date(startDate as string) : undefined,
				endDate: endDate ? new Date(endDate as string) : undefined,
				minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
				maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
				page: page ? parseInt(page as string) : undefined,
				limit: limit ? parseInt(limit as string) : undefined,
			});

			res.status(200).json({
				status: "success",
				data: result,
			});
		} catch (error) {
			next(error);
		}
	}

	async getMyEvents(req: AuthRequest, res: Response, next: NextFunction) {
		try {
			if (!req.user) {
				throw new AppError("Authentication required", 401);
			}

			const events = await eventService.getCreatorEvents(req.user.id);

			res.status(200).json({
				status: "success",
				data: events,
			});
		} catch (error) {
			next(error);
		}
	}

	async deleteEvent(req: AuthRequest, res: Response, next: NextFunction) {
		try {
			if (!req.user || req.user.role !== "creator") {
				throw new AppError("Only creators can delete events", 403);
			}

			const { eventId } = req.params;
			await eventService.deleteEvent(eventId, req.user.id);

			res.status(200).json({
				status: "success",
				message: "Event deleted successfully",
			});
		} catch (error) {
			next(error);
		}
	}

	async shareEvent(req: AuthRequest, res: Response, next: NextFunction) {
		try {
			if (!req.user) {
				throw new AppError("Authentication required", 401);
			}

			const { eventId } = req.params;
			const { platform } = req.body;

			if (!platform) {
				throw new AppError("Platform is required", 400);
			}

			const result = await eventService.shareEvent(
				eventId,
				req.user.id,
				platform,
			);

			res.status(200).json({
				status: "success",
				message: "Event shared successfully",
				data: result,
			});
		} catch (error) {
			next(error);
		}
	}

	async getEventAttendees(req: AuthRequest, res: Response, next: NextFunction) {
		try {
			if (!req.user || req.user.role !== "creator") {
				throw new AppError("Only creators can view attendees", 403);
			}

			const { eventId } = req.params;
			const attendees = await eventService.getEventAttendees(
				eventId,
				req.user.id,
			);

			res.status(200).json({
				status: "success",
				data: attendees,
			});
		} catch (error) {
			next(error);
		}
	}
}
