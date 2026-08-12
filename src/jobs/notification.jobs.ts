import cron from "node-cron";
import { NotificationService } from "../services/notification.service";
import { logger } from "../utils/logger";

const notificationService = new NotificationService();

export function startCronJobs() {
	logger.info("Starting cron jobs...");

	// Run every 5 minutes to check for pending notifications
	cron.schedule("*/5 * * * *", async () => {
		logger.info("Running notification job...");
		try {
			await notificationService.processPendingNotifications();
		} catch (error) {
			logger.error("Error in notification cron job:", error);
		}
	});

	logger.info("Cron jobs started successfully");
}
