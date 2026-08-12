import { Router } from "express";
import { EventController } from "../controllers/event.controller";
import { authenticate, authorize } from "../middleware/auth";
import { createEventLimiter } from "../middleware/rateLimiter";

const router = Router();
const eventController = new EventController();

// Public routes
router.get("/", eventController.getAllEvents.bind(eventController));
router.get("/:eventId", eventController.getEvent.bind(eventController));

// Protected routes - All users
router.post(
	"/:eventId/share",
	authenticate,
	eventController.shareEvent.bind(eventController),
);

// Protected routes - Creator only
router.post(
	"/",
	authenticate,
	authorize("creator"),
	createEventLimiter,
	EventController.createEventValidation,
	eventController.createEvent.bind(eventController),
);

router.put(
	"/:eventId",
	authenticate,
	authorize("creator"),
	eventController.updateEvent.bind(eventController),
);

router.delete(
	"/:eventId",
	authenticate,
	authorize("creator"),
	eventController.deleteEvent.bind(eventController),
);

router.get(
	"/my/events",
	authenticate,
	authorize("creator"),
	eventController.getMyEvents.bind(eventController),
);

router.get(
	"/:eventId/attendees",
	authenticate,
	authorize("creator"),
	eventController.getEventAttendees.bind(eventController),
);

export default router;
