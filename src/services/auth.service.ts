import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { db } from "../config/database";
import { AppError } from "../middleware/errorHandler";
import { User } from "../types/models";
import { cacheService } from "../config/redis";

export class AuthService {
	private generateToken(userId: string, email: string, role: string): string {
		const payload = { userId, email, role };
		const secret = process.env.JWT_SECRET || "default-secret";
		const options = {
			expiresIn: process.env.JWT_EXPIRES_IN || "7d",
		};
		return jwt.sign(payload, secret, options as any);
	}

	private generateRefreshToken(userId: string): string {
		const payload = { userId };
		const secret = process.env.REFRESH_TOKEN_SECRET || "default-refresh-secret";
		const options = {
			expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "30d",
		};
		return jwt.sign(payload, secret, options as any);
	}

	async register(data: {
		email: string;
		password: string;
		role: "creator" | "eventee";
		firstName: string;
		lastName: string;
		phone?: string;
	}): Promise<{ user: Partial<User>; token: string; refreshToken: string }> {
		// Check if user exists
		const existingUser = await db.oneOrNone(
			"SELECT id FROM users WHERE email = $1",
			[data.email],
		);

		if (existingUser) {
			throw new AppError("User with this email already exists", 400);
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(data.password, 12);

		// Create user
		const user = await db.one<User>(
			`INSERT INTO users (id, email, password, role, first_name, last_name, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, role, first_name, last_name, phone, created_at`,
			[
				uuidv4(),
				data.email,
				hashedPassword,
				data.role,
				data.firstName,
				data.lastName,
				data.phone || null,
			],
		);

		// Generate tokens
		const token = this.generateToken(user.id, user.email, user.role);
		const refreshToken = this.generateRefreshToken(user.id);

		// Cache user data
		await cacheService.set(
			`user:${user.id}`,
			{
				id: user.id,
				email: user.email,
				role: user.role,
			},
			3600,
		);

		return {
			user: {
				id: user.id,
				email: user.email,
				role: user.role,
				first_name: user.first_name,
				last_name: user.last_name,
				phone: user.phone,
			},
			token,
			refreshToken,
		};
	}

	async login(
		email: string,
		password: string,
	): Promise<{ user: Partial<User>; token: string; refreshToken: string }> {
		// Find user
		const user = await db.oneOrNone<User>(
			"SELECT * FROM users WHERE email = $1 AND is_active = true",
			[email],
		);

		if (!user) {
			throw new AppError("Invalid email or password", 401);
		}

		// Verify password
		const isPasswordValid = await bcrypt.compare(password, user.password);

		if (!isPasswordValid) {
			throw new AppError("Invalid email or password", 401);
		}

		// Generate tokens
		const token = this.generateToken(user.id, user.email, user.role);
		const refreshToken = this.generateRefreshToken(user.id);

		// Cache user data
		await cacheService.set(
			`user:${user.id}`,
			{
				id: user.id,
				email: user.email,
				role: user.role,
			},
			3600,
		);

		return {
			user: {
				id: user.id,
				email: user.email,
				role: user.role,
				first_name: user.first_name,
				last_name: user.last_name,
				phone: user.phone,
			},
			token,
			refreshToken,
		};
	}

	async refreshToken(
		refreshToken: string,
	): Promise<{ token: string; refreshToken: string }> {
		try {
			const decoded = jwt.verify(
				refreshToken,
				process.env.REFRESH_TOKEN_SECRET || "default-refresh-secret",
			) as { userId: string };

			const user = await db.oneOrNone<User>(
				"SELECT id, email, role FROM users WHERE id = $1 AND is_active = true",
				[decoded.userId],
			);

			if (!user) {
				throw new AppError("User not found", 404);
			}

			const newToken = this.generateToken(user.id, user.email, user.role);
			const newRefreshToken = this.generateRefreshToken(user.id);

			return {
				token: newToken,
				refreshToken: newRefreshToken,
			};
		} catch (error) {
			throw new AppError("Invalid refresh token", 401);
		}
	}

	async getProfile(userId: string): Promise<Partial<User>> {
		const user = await db.oneOrNone<User>(
			"SELECT id, email, role, first_name, last_name, phone, created_at FROM users WHERE id = $1",
			[userId],
		);

		if (!user) {
			throw new AppError("User not found", 404);
		}

		return user;
	}

	async updateProfile(
		userId: string,
		data: {
			firstName?: string;
			lastName?: string;
			phone?: string;
		},
	): Promise<Partial<User>> {
		const updates: string[] = [];
		const values: any[] = [];
		let paramCount = 1;

		if (data.firstName) {
			updates.push(`first_name = $${paramCount++}`);
			values.push(data.firstName);
		}

		if (data.lastName) {
			updates.push(`last_name = $${paramCount++}`);
			values.push(data.lastName);
		}

		if (data.phone !== undefined) {
			updates.push(`phone = $${paramCount++}`);
			values.push(data.phone);
		}

		if (updates.length === 0) {
			throw new AppError("No fields to update", 400);
		}

		values.push(userId);

		const user = await db.one<User>(
			`UPDATE users SET ${updates.join(", ")} WHERE id = $${paramCount}
       RETURNING id, email, role, first_name, last_name, phone`,
			values,
		);

		// Clear cache
		await cacheService.del(`user:${userId}`);

		return user;
	}
}
