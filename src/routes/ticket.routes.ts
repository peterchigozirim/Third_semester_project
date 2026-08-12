import { Router } from "express";
import { TicketController } from "../controllers/ticket.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();
const ticketController = new TicketController();

// Protected routes - Eventees
router.get(
	"/my-tickets",
	authenticate,
	ticketController.getMyTickets.bind(ticketController),
);

router.get(
	"/:ticketId",
	authenticate,
	ticketController.getTicket.bind(ticketController),
);

// Protected routes - Creators only
router.post(
	"/scan",
	authenticate,
	authorize("creator"),
	ticketController.scanTicket.bind(ticketController),
);

router.post(
	"/verify",
	authenticate,
	ticketController.verifyQRCode.bind(ticketController),
);

export default router;
