import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";

import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFoundHandler";
import authRoutes from "./routes/auth.routes";
import eventRoutes from "./routes/event.routes";
import ticketRoutes from "./routes/ticket.routes";
import paymentRoutes from "./routes/payment.routes";
import analyticsRoutes from "./routes/analytics.routes";
import notificationRoutes from "./routes/notification.routes";
import { logger } from "./utils/logger";
import { db } from "./config/database";
import { redisClient } from "./config/redis";
import { startCronJobs } from "./jobs/notification.jobs";

dotenv.config();

const app = express();

// Security middleware
app.use(helmet());
app.use(
	cors({
		origin: process.env.FRONTEND_URL || "*",
		credentials: true,
	}),
);

// Logging
app.use(
	morgan("combined", {
		stream: {
			write: (message: string) => logger.info(message.trim()),
		},
	}),
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (_req, res) => {
	res.json({
		status: "OK",
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
	});
});

// API Documentation
try {
	const swaggerDocument = YAML.load(path.join(__dirname, "../swagger.yaml"));
	app.use("/app-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (error) {
	logger.warn("Swagger documentation not available");
}

// API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/events", eventRoutes);
app.use("/api/v1/tickets", ticketRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/notifications", notificationRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async () => {
	logger.info("Shutting down gracefully...");

	try {
		await db.$pool.end();
		await redisClient.quit();
		logger.info("Database and Redis connections closed");
		process.exit(0);
	} catch (error) {
		logger.error("Error during shutdown:", error);
		process.exit(1);
	}
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

export default app;

// Start cron jobs
if (process.env.NODE_ENV !== "test") {
	startCronJobs();
}
