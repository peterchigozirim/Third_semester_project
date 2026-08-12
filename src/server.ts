import app from "./app";
import { logger } from "./utils/logger";
import { db } from "./config/database";
import { redisClient } from "./config/redis";

const PORT = process.env.PORT || 3000;

const startServer = async () => {
	try {
		// Test database connection
		await db.one("SELECT NOW()");
		logger.info("✅ Database connected successfully");

		// Test Redis connection
		await redisClient.ping();
		logger.info("✅ Redis connected successfully");

		// Start server
		app.listen(PORT, () => {
			logger.info(`🚀 Eventful server running on port ${PORT}`);
			logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
			logger.info(`🏥 Health Check: http://localhost:${PORT}/health`);
		});
	} catch (error) {
		logger.error("Failed to start server:", error);
		process.exit(1);
	}
};

startServer();
