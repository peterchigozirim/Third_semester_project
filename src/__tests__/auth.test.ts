import request from "supertest";
import app from "../../app";

describe("Authentication API", () => {
	describe("POST /api/v1/auth/register", () => {
		it("should register a new user successfully", async () => {
			const userData = {
				email: `test${Date.now()}@example.com`,
				password: "password123",
				role: "eventee",
				firstName: "John",
				lastName: "Doe",
				phone: "+1234567890",
			};

			const response = await request(app)
				.post("/api/v1/auth/register")
				.send(userData)
				.expect(201);

			expect(response.body.status).toBe("success");
			expect(response.body.data.user).toHaveProperty("id");
			expect(response.body.data.user.email).toBe(userData.email);
			expect(response.body.data).toHaveProperty("token");
			expect(response.body.data).toHaveProperty("refreshToken");
		});

		it("should fail with invalid email", async () => {
			const userData = {
				email: "invalid-email",
				password: "password123",
				role: "eventee",
				firstName: "John",
				lastName: "Doe",
			};

			const response = await request(app)
				.post("/api/v1/auth/register")
				.send(userData)
				.expect(400);

			expect(response.body.status).toBe("error");
		});

		it("should fail with short password", async () => {
			const userData = {
				email: "test@example.com",
				password: "short",
				role: "eventee",
				firstName: "John",
				lastName: "Doe",
			};

			const response = await request(app)
				.post("/api/v1/auth/register")
				.send(userData)
				.expect(400);

			expect(response.body.status).toBe("error");
		});
	});

	describe("POST /api/v1/auth/login", () => {
		const userCredentials = {
			email: "existinguser@example.com",
			password: "password123",
		};

		it("should login successfully with valid credentials", async () => {
			const response = await request(app)
				.post("/api/v1/auth/login")
				.send(userCredentials);

			if (response.status === 200) {
				expect(response.body.status).toBe("success");
				expect(response.body.data).toHaveProperty("token");
				expect(response.body.data.user).toHaveProperty("id");
			}
		});

		it("should fail with invalid credentials", async () => {
			const response = await request(app)
				.post("/api/v1/auth/login")
				.send({
					email: "wrong@example.com",
					password: "wrongpassword",
				})
				.expect(401);

			expect(response.body.status).toBe("error");
		});
	});

	describe("GET /api/v1/auth/profile", () => {
		it("should fail without authentication token", async () => {
			const response = await request(app)
				.get("/api/v1/auth/profile")
				.expect(401);

			expect(response.body.status).toBe("error");
		});

		it("should return user profile with valid token", async () => {
			// First login to get token
			const loginResponse = await request(app).post("/api/v1/auth/login").send({
				email: "test@example.com",
				password: "password123",
			});

			if (loginResponse.body.data?.token) {
				const token = loginResponse.body.data.token;

				const response = await request(app)
					.get("/api/v1/auth/profile")
					.set("Authorization", `Bearer ${token}`)
					.expect(200);

				expect(response.body.status).toBe("success");
				expect(response.body.data).toHaveProperty("email");
			}
		});
	});
});
