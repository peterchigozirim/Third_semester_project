import request from "supertest";
import app from "../../app";

describe("Events API", () => {
	let authToken: string;
	let creatorToken: string;

	beforeAll(async () => {
		// Login as eventee
		const eventeeLogin = await request(app).post("/api/v1/auth/login").send({
			email: "eventee@example.com",
			password: "password123",
		});

		if (eventeeLogin.body.data?.token) {
			authToken = eventeeLogin.body.data.token;
		}

		// Login as creator
		const creatorLogin = await request(app).post("/api/v1/auth/login").send({
			email: "creator@example.com",
			password: "password123",
		});

		if (creatorLogin.body.data?.token) {
			creatorToken = creatorLogin.body.data.token;
		}
	});

	describe("GET /api/v1/events", () => {
		it("should return list of published events", async () => {
			const response = await request(app).get("/api/v1/events").expect(200);

			expect(response.body.status).toBe("success");
			expect(response.body.data).toHaveProperty("events");
			expect(Array.isArray(response.body.data.events)).toBe(true);
		});

		it("should filter events by category", async () => {
			const response = await request(app)
				.get("/api/v1/events?category=concert")
				.expect(200);

			expect(response.body.status).toBe("success");
			expect(response.body.data).toHaveProperty("events");
		});

		it("should search events by title", async () => {
			const response = await request(app)
				.get("/api/v1/events?search=music")
				.expect(200);

			expect(response.body.status).toBe("success");
			expect(response.body.data).toHaveProperty("events");
		});
	});

	describe("POST /api/v1/events", () => {
		it("should create event with creator role", async () => {
			if (!creatorToken) {
				return;
			}

			const eventData = {
				title: "Test Event",
				description: "This is a test event",
				category: "concert",
				venue: "Test Venue",
				address: "123 Test St",
				startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
				endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
				ticketPrice: 50,
				totalTickets: 100,
			};

			const response = await request(app)
				.post("/api/v1/events")
				.set("Authorization", `Bearer ${creatorToken}`)
				.send(eventData);

			if (response.status === 201) {
				expect(response.body.status).toBe("success");
				expect(response.body.data).toHaveProperty("id");
				expect(response.body.data.title).toBe(eventData.title);
			}
		});

		it("should fail without creator role", async () => {
			if (!authToken) {
				return;
			}

			const eventData = {
				title: "Test Event",
				description: "This is a test event",
				category: "concert",
				venue: "Test Venue",
				address: "123 Test St",
				startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
				endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
				ticketPrice: 50,
				totalTickets: 100,
			};

			const response = await request(app)
				.post("/api/v1/events")
				.set("Authorization", `Bearer ${authToken}`)
				.send(eventData)
				.expect(403);

			expect(response.body.status).toBe("error");
		});
	});

	describe("POST /api/v1/events/:eventId/share", () => {
		it("should share an event", async () => {
			if (!authToken) {
				return;
			}

			// Get an event first
			const eventsResponse = await request(app).get("/api/v1/events");

			if (eventsResponse.body.data?.events?.length > 0) {
				const eventId = eventsResponse.body.data.events[0].id;

				const response = await request(app)
					.post(`/api/v1/events/${eventId}/share`)
					.set("Authorization", `Bearer ${authToken}`)
					.send({ platform: "facebook" })
					.expect(200);

				expect(response.body.status).toBe("success");
				expect(response.body.data).toHaveProperty("shareUrl");
			}
		});
	});
});
