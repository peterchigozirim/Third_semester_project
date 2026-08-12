import { Response, NextFunction } from "express";
import { AnalyticsService } from "../services/analytics.service";
import { AppError } from "../middleware/errorHandler";
import { AuthRequest } from "../middleware/auth";

const analyticsService = new AnalyticsService();

export class AnalyticsController {
	async getCreatorAnalytics(
		req: AuthRequest,
		res: Response,
		next: NextFunction,
	) {
		try {
			if (!req.user || req.user.role !== "creator") {
				throw new AppError("Only creators can view analytics", 403);
			}

			const { eventId } = req.query;

			const analytics = await analyticsService.getCreatorAnalytics(
				req.user.id,
				eventId as string | undefined,
			);

			res.status(200).json({
				status: "success",
				data: analytics,
			});
		} catch (error) {
			next(error);
		}
	}

	async getEventAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
		try {
			if (!req.user || req.user.role !== "creator") {
				throw new AppError("Only creators can view analytics", 403);
			}

			const { eventId } = req.params;

			const analytics = await analyticsService.getEventAnalytics(
				eventId as string,
				req.user.id,
			);

			res.status(200).json({
				status: "success",
				data: analytics,
			});
		} catch (error) {
			next(error);
		}
	}

	async getDashboardStats(req: AuthRequest, res: Response, next: NextFunction) {
		try {
			if (!req.user || req.user.role !== "creator") {
				throw new AppError("Only creators can view dashboard stats", 403);
			}

			const stats = await analyticsService.getDashboardStats(req.user.id);

			res.status(200).json({
				status: "success",
				data: stats,
			});
		} catch (error) {
			next(error);
		}
	}
}
