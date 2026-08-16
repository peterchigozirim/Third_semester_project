// API Configuration
const API_BASE_URL = "http://localhost:3000/api/v1";
const PAYSTACK_PUBLIC_KEY = "pk_test_your_key_here"; // Replace with your Paystack public key

// API Endpoints
const API_ENDPOINTS = {
	// Auth
	register: `${API_BASE_URL}/auth/register`,
	login: `${API_BASE_URL}/auth/login`,
	profile: `${API_BASE_URL}/auth/profile`,

	// Events
	events: `${API_BASE_URL}/events`,
	myEvents: `${API_BASE_URL}/events/my/events`,

	// Tickets
	tickets: `${API_BASE_URL}/tickets`,
	myTickets: `${API_BASE_URL}/tickets/my-tickets`,
	scanTicket: `${API_BASE_URL}/tickets/scan`,

	// Payments
	initiatePayment: `${API_BASE_URL}/payments/initiate`,
	verifyPayment: `${API_BASE_URL}/payments/verify`,
	paymentHistory: `${API_BASE_URL}/payments/history`,

	// Analytics
	analytics: `${API_BASE_URL}/analytics/dashboard`,
	creatorAnalytics: `${API_BASE_URL}/analytics/creator`,
	eventAnalytics: `${API_BASE_URL}/analytics/event`,

	// Notifications
	notifications: `${API_BASE_URL}/notifications`,
	reminders: `${API_BASE_URL}/notifications/reminders`,
};

// Helper function to get auth token
function getAuthToken() {
	return localStorage.getItem("token");
}

// Helper function to get auth headers
function getAuthHeaders() {
	const token = getAuthToken();
	return {
		"Content-Type": "application/json",
		...(token && { Authorization: `Bearer ${token}` }),
	};
}

// Helper function to make API calls
async function apiCall(url, options = {}) {
	try {
		console.log("API Call:", url); // Debug log

		const response = await fetch(url, {
			...options,
			headers: {
				"Content-Type": "application/json",
				...getAuthHeaders(),
				...options.headers,
			},
		});

		// Check if response is JSON
		const contentType = response.headers.get("content-type");
		if (!contentType || !contentType.includes("application/json")) {
			const text = await response.text();
			console.error("Non-JSON response:", text.substring(0, 200));
			throw new Error(
				`Server returned ${response.status}: Expected JSON but got ${contentType || "unknown type"}`,
			);
		}

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.message || "Something went wrong");
		}

		return data;
	} catch (error) {
		console.error("API Error:", error);
		throw error;
	}
}
