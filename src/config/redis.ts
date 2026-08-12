import { createClient } from "redis";
import { logger } from "../utils/logger";

const redisClient = createClient({
	url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => {
	logger.error("Redis Client Error:", err);
});

redisClient.on("connect", () => {
	logger.info("Redis Client Connected");
});

// Connect to Redis
(async () => {
	try {
		await redisClient.connect();
	} catch (error) {
		logger.error("Failed to connect to Redis:", error);
	}
})();

export { redisClient };

// Cache helper functions
export const cacheService = {
	async get<T>(key: string): Promise<T | null> {
		try {
			const data = await redisClient.get(key);
			return data ? JSON.parse(data) : null;
		} catch (error) {
			logger.error("Cache get error:", error);
			return null;
		}
	},

	async set(
		key: string,
		value: any,
		expirationInSeconds: number = 3600,
	): Promise<void> {
		try {
			await redisClient.setEx(key, expirationInSeconds, JSON.stringify(value));
		} catch (error) {
			logger.error("Cache set error:", error);
		}
	},

	async del(key: string): Promise<void> {
		try {
			await redisClient.del(key);
		} catch (error) {
			logger.error("Cache delete error:", error);
		}
	},

	async delPattern(pattern: string): Promise<void> {
		try {
			const keys = await redisClient.keys(pattern);
			if (keys.length > 0) {
				await redisClient.del(keys);
			}
		} catch (error) {
			logger.error("Cache delete pattern error:", error);
		}
	},
};
