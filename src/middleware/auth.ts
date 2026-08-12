import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./errorHandler";
import { db } from "../config/database";
import { cacheService } from "../config/redis";

interface JWTPayload {
	userId: string;
	email: string;
	role: string;
}

export interface AuthRequest extends Request {
	user?: {
		id: string;
		email: string;
		role: "creator" | "eventee";
	};
}

export const authenticate = async (
	req: AuthRequest,
	_res: Response,
	next: NextFunction,
) => {
	try {
		const token = req.headers.authorization?.replace("Bearer ", "");

		if (!token) {
			throw new AppError("Authentication required", 401);
		}

		// Verify token
		const decoded = jwt.verify(
			token,
			process.env.JWT_SECRET || "default-secret",
		) as JWTPayload;

		// Check cache first
		const cachedUser = await cacheService.get(`user:${decoded.userId}`);

		if (cachedUser) {
			req.user = cachedUser as any;
			return next();
		}

		// Fetch user from database
		const user = await db.oneOrNone(
			"SELECT id, email, role, is_active FROM users WHERE id = $1",
			[decoded.userId],
		);

		if (!user || !user.is_active) {
			throw new AppError("User not found or inactive", 401);
		}

		req.user = {
			id: user.id,
			email: user.email,
			role: user.role,
		};

		// Cache user data
		await cacheService.set(`user:${user.id}`, req.user, 3600);

		next();
	} catch (error) {
		if (error instanceof jwt.JsonWebTokenError) {
			next(new AppError("Invalid token", 401));
		} else {
			next(error);
		}
	}
};

export const authorize = (...roles: string[]) => {
	return (req: AuthRequest, _res: Response, next: NextFunction) => {
		if (!req.user) {
			return next(new AppError("Authentication required", 401));
		}

		if (!roles.includes(req.user.role)) {
			return next(
				new AppError("You do not have permission to perform this action", 403),
			);
		}

		next();
	};
};
