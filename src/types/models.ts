export interface User {
	id: string;
	email: string;
	password: string;
	role: "creator" | "eventee";
	first_name: string;
	last_name: string;
	phone?: string;
	is_active: boolean;
	created_at: Date;
	updated_at: Date;
}

export interface Event {
	id: string;
	creator_id: string;
	title: string;
	description: string;
	category: string;
	venue: string;
	address: string;
	start_date: Date;
	end_date: Date;
	ticket_price: number;
	total_tickets: number;
	available_tickets: number;
	image_url?: string;
	is_published: boolean;
	created_at: Date;
	updated_at: Date;
}

export interface Ticket {
	id: string;
	event_id: string;
	user_id: string;
	ticket_code: string;
	qr_code: string;
	purchase_date: Date;
	is_scanned: boolean;
	scanned_at?: Date;
	created_at: Date;
}

export interface Payment {
	id: string;
	user_id: string;
	event_id: string;
	ticket_id: string;
	amount: number;
	currency: string;
	payment_reference: string;
	payment_status: "pending" | "success" | "failed";
	payment_gateway: string;
	paystack_reference?: string;
	created_at: Date;
	updated_at: Date;
}

export interface Notification {
	id: string;
	user_id: string;
	event_id: string;
	type: "reminder" | "ticket_purchase" | "event_update";
	title: string;
	message: string;
	scheduled_for: Date;
	sent_at?: Date;
	is_sent: boolean;
	created_at: Date;
}

export interface EventReminder {
	id: string;
	event_id: string;
	user_id: string;
	reminder_type: "creator_default" | "user_custom";
	remind_before_days: number;
	remind_before_hours: number;
	is_active: boolean;
	created_at: Date;
}

export interface ShareEvent {
	id: string;
	event_id: string;
	shared_by: string;
	platform: string;
	share_count: number;
	created_at: Date;
}

export interface Analytics {
	total_attendees: number;
	total_tickets_sold: number;
	total_revenue: number;
	tickets_scanned: number;
}
