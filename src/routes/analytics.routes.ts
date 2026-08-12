import { Router } from "express";
import { AnalyticsController } from "../controllers/analytics.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();
const analyticsController = new AnalyticsController();

// Protected routes - Creator only
router.get(
	"/creator",
	authenticate,
	authorize("creator"),
	analyticsController.getCreatorAnalytics.bind(analyticsController),
);

router.get(
	"/event/:eventId",
	authenticate,
	authorize("creator"),
	analyticsController.getEventAnalytics.bind(analyticsController),
);

router.get(
	"/dashboard",
	authenticate,
	authorize("creator"),
	analyticsController.getDashboardStats.bind(analyticsController),
);

export default router;
