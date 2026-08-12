import { db } from "../config/database";
import { AppError } from "../middleware/errorHandler";
import { cacheService } from "../config/redis";

export class AnalyticsService {
	async getCreatorAnalytics(creatorId: string, eventId?: string): Promise<any> {
		const cacheKey = eventId
			? `analytics:creator:${creatorId}:event:${eventId}`
			: `analytics:creator:${creatorId}`;

		// Check cache
		const cached = await cacheService.get(cacheKey);
		if (cached) {
			return cached;
		}

		let eventFilter = "";
		const params: any[] = [creatorId];

		if (eventId) {
			eventFilter = "AND e.id = $2";
			params.push(eventId);
		}

		// Get overall statistics
		const overallStats = await db.one(
			`SELECT 
        COUNT(DISTINCT t.user_id) as total_attendees,
        COUNT(t.id) as total_tickets_sold,
        COALESCE(SUM(p.amount), 0) as total_revenue,
        COUNT(CASE WHEN t.is_scanned = true THEN 1 END) as tickets_scanned
       FROM events e
       LEFT JOIN tickets t ON e.id = t.event_id
       LEFT JOIN payments p ON t.id = p.ticket_id AND p.payment_status = 'success'
       WHERE e.creator_id = $1 ${eventFilter}`,
			params,
		);

		// Get event-wise breakdown
		const eventBreakdown = await db.manyOrNone(
			`SELECT 
        e.id,
        e.title,
        e.start_date,
        e.end_date,
        e.total_tickets,
        e.available_tickets,
        (e.total_tickets - e.available_tickets) as tickets_sold,
        COUNT(DISTINCT t.user_id) as attendees,
        COALESCE(SUM(p.amount), 0) as revenue,
        COUNT(CASE WHEN t.is_scanned = true THEN 1 END) as tickets_scanned
       FROM events e
       LEFT JOIN tickets t ON e.id = t.event_id
       LEFT JOIN payments p ON t.id = p.ticket_id AND p.payment_status = 'success'
       WHERE e.creator_id = $1 ${eventFilter}
       GROUP BY e.id, e.title, e.start_date, e.end_date, e.total_tickets, e.available_tickets
       ORDER BY e.start_date DESC`,
			params,
		);

		// Get recent ticket purchases
		const recentPurchases = await db.manyOrNone(
			`SELECT 
        t.id,
        t.ticket_code,
        t.purchase_date,
        e.title as event_title,
        u.first_name,
        u.last_name,
        u.email,
        p.amount
       FROM tickets t
       JOIN events e ON t.event_id = e.id
       JOIN users u ON t.user_id = u.id
       LEFT JOIN payments p ON t.id = p.ticket_id
       WHERE e.creator_id = $1 ${eventFilter}
       ORDER BY t.purchase_date DESC
       LIMIT 10`,
			params,
		);

		// Get payment statistics
		const paymentStats = await db.manyOrNone(
			`SELECT 
        DATE(p.created_at) as date,
        COUNT(p.id) as transactions,
        SUM(p.amount) as revenue
       FROM payments p
       JOIN events e ON p.event_id = e.id
       WHERE e.creator_id = $1 ${eventFilter}
         AND p.payment_status = 'success'
       GROUP BY DATE(p.created_at)
       ORDER BY date DESC
       LIMIT 30`,
			params,
		);

		const analytics = {
			overall: {
				totalAttendees: parseInt(overallStats.total_attendees) || 0,
				totalTicketsSold: parseInt(overallStats.total_tickets_sold) || 0,
				totalRevenue: parseFloat(overallStats.total_revenue) || 0,
				ticketsScanned: parseInt(overallStats.tickets_scanned) || 0,
			},
			eventBreakdown: eventBreakdown || [],
			recentPurchases: recentPurchases || [],
			paymentStats: paymentStats || [],
		};

		// Cache for 5 minutes
		await cacheService.set(cacheKey, analytics, 300);

		return analytics;
	}

	async getEventAnalytics(eventId: string, creatorId: string): Promise<any> {
		// Verify ownership
		const event = await db.oneOrNone(
			"SELECT id FROM events WHERE id = $1 AND creator_id = $2",
			[eventId, creatorId],
		);

		if (!event) {
			throw new AppError("Event not found or unauthorized", 404);
		}

		return this.getCreatorAnalytics(creatorId, eventId);
	}

	async getDashboardStats(creatorId: string): Promise<any> {
		const cacheKey = `dashboard:creator:${creatorId}`;

		// Check cache
		const cached = await cacheService.get(cacheKey);
		if (cached) {
			return cached;
		}

		// Total events
		const totalEvents = await db.one(
			"SELECT COUNT(*) as count FROM events WHERE creator_id = $1",
			[creatorId],
		);

		// Published events
		const publishedEvents = await db.one(
			"SELECT COUNT(*) as count FROM events WHERE creator_id = $1 AND is_published = true",
			[creatorId],
		);

		// Upcoming events
		const upcomingEvents = await db.one(
			"SELECT COUNT(*) as count FROM events WHERE creator_id = $1 AND start_date > NOW()",
			[creatorId],
		);

		// Past events
		const pastEvents = await db.one(
			"SELECT COUNT(*) as count FROM events WHERE creator_id = $1 AND end_date < NOW()",
			[creatorId],
		);

		// Total revenue this month
		const monthlyRevenue = await db.one(
			`SELECT COALESCE(SUM(p.amount), 0) as revenue
       FROM payments p
       JOIN events e ON p.event_id = e.id
       WHERE e.creator_id = $1 
         AND p.payment_status = 'success'
         AND EXTRACT(MONTH FROM p.created_at) = EXTRACT(MONTH FROM NOW())
         AND EXTRACT(YEAR FROM p.created_at) = EXTRACT(YEAR FROM NOW())`,
			[creatorId],
		);

		// Tickets sold this month
		const monthlyTickets = await db.one(
			`SELECT COUNT(t.id) as count
       FROM tickets t
       JOIN events e ON t.event_id = e.id
       WHERE e.creator_id = $1
         AND EXTRACT(MONTH FROM t.purchase_date) = EXTRACT(MONTH FROM NOW())
         AND EXTRACT(YEAR FROM t.purchase_date) = EXTRACT(YEAR FROM NOW())`,
			[creatorId],
		);

		const stats = {
			totalEvents: parseInt(totalEvents.count) || 0,
			publishedEvents: parseInt(publishedEvents.count) || 0,
			upcomingEvents: parseInt(upcomingEvents.count) || 0,
			pastEvents: parseInt(pastEvents.count) || 0,
			monthlyRevenue: parseFloat(monthlyRevenue.revenue) || 0,
			monthlyTickets: parseInt(monthlyTickets.count) || 0,
		};

		// Cache for 5 minutes
		await cacheService.set(cacheKey, stats, 300);

		return stats;
	}
}
