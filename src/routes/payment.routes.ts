import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller";
import { authenticate, authorize } from "../middleware/auth";
import { paymentLimiter } from "../middleware/rateLimiter";

const router = Router();
const paymentController = new PaymentController();

// Protected routes - All authenticated users
router.post(
	"/initiate",
	authenticate,
	paymentLimiter,
	PaymentController.initiatePaymentValidation,
	paymentController.initiatePayment.bind(paymentController),
);

router.get(
	"/verify",
	authenticate,
	paymentController.verifyPayment.bind(paymentController),
);

router.get(
	"/history",
	authenticate,
	paymentController.getPaymentHistory.bind(paymentController),
);

// Public callback route (called by Paystack)
router.get(
	"/callback",
	paymentController.handleCallback.bind(paymentController),
);

// Webhook route (called by Paystack)
router.post(
	"/webhook",
	paymentController.handleWebhook.bind(paymentController),
);

// Protected routes - Creator only
router.get(
	"/creator/payments",
	authenticate,
	authorize("creator"),
	paymentController.getCreatorPayments.bind(paymentController),
);

export default router;
