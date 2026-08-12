import rateLimit from "express-rate-limit";

export const globalLimiter = rateLimit({
	windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutes
	max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"),
	message: "Too many requests from this IP, please try again later.",
	standardHeaders: true,
	legacyHeaders: false,
});

export const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 5,
	skipSuccessfulRequests: true,
	message: "Too many authentication attempts, please try again later.",
});

export const paymentLimiter = rateLimit({
	windowMs: 60 * 1000, // 1 minute
	max: 3,
	message: "Too many payment requests, please try again later.",
});

export const createEventLimiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 hour
	max: 10,
	message: "Too many events created, please try again later.",
});
