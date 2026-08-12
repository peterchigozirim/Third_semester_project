import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { AuthService } from "../services/auth.service";
import { AppError } from "../middleware/errorHandler";
import { AuthRequest } from "../middleware/auth";

const authService = new AuthService();

export class AuthController {
	// Validation rules
	static registerValidation = [
		body("email").isEmail().withMessage("Valid email is required"),
		body("password")
			.isLength({ min: 8 })
			.withMessage("Password must be at least 8 characters"),
		body("role")
			.isIn(["creator", "eventee"])
			.withMessage("Role must be either creator or eventee"),
		body("firstName").notEmpty().withMessage("First name is required"),
		body("lastName").notEmpty().withMessage("Last name is required"),
		body("phone").optional().isMobilePhone("any"),
	];

	static loginValidation = [
		body("email").isEmail().withMessage("Valid email is required"),
		body("password").notEmpty().withMessage("Password is required"),
	];

	async register(req: Request, res: Response, next: NextFunction) {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				throw new AppError(errors.array()[0]?.msg || "Validation error", 400);
			}

			const { email, password, role, firstName, lastName, phone } = req.body;

			const result = await authService.register({
				email,
				password,
				role,
				firstName,
				lastName,
				phone,
			});

			res.status(201).json({
				status: "success",
				message: "User registered successfully",
				data: result,
			});
		} catch (error) {
			next(error);
		}
	}

	async login(req: Request, res: Response, next: NextFunction) {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				throw new AppError(errors.array()[0]?.msg || "Validation error", 400);
			}

			const { email, password } = req.body;

			const result = await authService.login(email, password);

			res.status(200).json({
				status: "success",
				message: "Login successful",
				data: result,
			});
		} catch (error) {
			next(error);
		}
	}

	async refreshToken(req: Request, res: Response, next: NextFunction) {
		try {
			const { refreshToken } = req.body;

			if (!refreshToken) {
				throw new AppError("Refresh token is required", 400);
			}

			const result = await authService.refreshToken(refreshToken);

			res.status(200).json({
				status: "success",
				data: result,
			});
		} catch (error) {
			next(error);
		}
	}

	async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
		try {
			const userId = req.user?.id;

			if (!userId) {
				throw new AppError("User not authenticated", 401);
			}

			const user = await authService.getProfile(userId);

			res.status(200).json({
				status: "success",
				data: user,
			});
		} catch (error) {
			next(error);
		}
	}

	async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
		try {
			const userId = req.user?.id;

			if (!userId) {
				throw new AppError("User not authenticated", 401);
			}

			const { firstName, lastName, phone } = req.body;

			const user = await authService.updateProfile(userId, {
				firstName,
				lastName,
				phone,
			});

			res.status(200).json({
				status: "success",
				message: "Profile updated successfully",
				data: user,
			});
		} catch (error) {
			next(error);
		}
	}
}
