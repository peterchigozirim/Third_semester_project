import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth";
import { authLimiter } from "../middleware/rateLimiter";

const router = Router();
const authController = new AuthController();

// Public routes
router.post(
	"/register",
	authLimiter,
	AuthController.registerValidation,
	authController.register.bind(authController),
);

router.post(
	"/login",
	authLimiter,
	AuthController.loginValidation,
	authController.login.bind(authController),
);

router.post("/refresh-token", authController.refreshToken.bind(authController));

// Protected routes
router.get(
	"/profile",
	authenticate,
	authController.getProfile.bind(authController),
);
router.put(
	"/profile",
	authenticate,
	authController.updateProfile.bind(authController),
);

export default router;
