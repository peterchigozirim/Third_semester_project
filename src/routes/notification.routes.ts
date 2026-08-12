import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller";
import { authenticate } from "../middleware/auth";

const router = Router();
const notificationController = new NotificationController();

// Protected routes
router.post(
	"/reminders",
	authenticate,
	NotificationController.createReminderValidation,
	notificationController.createReminder.bind(notificationController),
);

router.get(
	"/reminders",
	authenticate,
	notificationController.getReminders.bind(notificationController),
);

router.delete(
	"/reminders/:reminderId",
	authenticate,
	notificationController.deleteReminder.bind(notificationController),
);

router.get(
	"/",
	authenticate,
	notificationController.getNotifications.bind(notificationController),
);

export default router;
