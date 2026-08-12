import axios from "axios";

const API_URL =
	process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

const api = axios.create({
	baseURL: API_URL,
	headers: {
		"Content-Type": "application/json",
	},
});

// Request interceptor to add auth token
api.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem("token");
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	},
);

// Response interceptor to handle errors
api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			localStorage.removeItem("token");
			localStorage.removeItem("user");
			window.location.href = "/login";
		}
		return Promise.reject(error);
	},
);

export default api;

// API functions
export const authAPI = {
	register: (data: any) => api.post("/auth/register", data),
	login: (data: any) => api.post("/auth/login", data),
	getProfile: () => api.get("/auth/profile"),
	updateProfile: (data: any) => api.put("/auth/profile", data),
};

export const eventsAPI = {
	getAll: (params?: any) => api.get("/events", { params }),
	getOne: (id: string) => api.get(`/events/${id}`),
	create: (data: any) => api.post("/events", data),
	update: (id: string, data: any) => api.put(`/events/${id}`, data),
	delete: (id: string) => api.delete(`/events/${id}`),
	share: (id: string, platform: string) =>
		api.post(`/events/${id}/share`, { platform }),
	getAttendees: (id: string) => api.get(`/events/${id}/attendees`),
	getMyEvents: () => api.get("/events/my/events"),
};

export const ticketsAPI = {
	getMyTickets: () => api.get("/tickets/my-tickets"),
	getOne: (id: string) => api.get(`/tickets/${id}`),
	scan: (data: any) => api.post("/tickets/scan", data),
	verify: (qrData: string) => api.post("/tickets/verify", { qrData }),
};

export const paymentsAPI = {
	initiate: (eventId: string) => api.post("/payments/initiate", { eventId }),
	verify: (reference: string) =>
		api.get(`/payments/verify?reference=${reference}`),
	getHistory: () => api.get("/payments/history"),
	getCreatorPayments: (eventId?: string) =>
		api.get("/payments/creator/payments", { params: { eventId } }),
};

export const analyticsAPI = {
	getCreatorAnalytics: (eventId?: string) =>
		api.get("/analytics/creator", { params: { eventId } }),
	getEventAnalytics: (eventId: string) =>
		api.get(`/analytics/event/${eventId}`),
	getDashboard: () => api.get("/analytics/dashboard"),
};

export const notificationsAPI = {
	getAll: () => api.get("/notifications"),
	getReminders: () => api.get("/notifications/reminders"),
	createReminder: (data: any) => api.post("/notifications/reminders", data),
	deleteReminder: (id: string) => api.delete(`/notifications/reminders/${id}`),
};
