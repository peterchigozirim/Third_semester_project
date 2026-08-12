import { db } from "../config/database";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../utils/logger";

async function seed() {
	try {
		logger.info("Starting database seed...");

		// Create test users
		const hashedPassword = await bcrypt.hash("password123", 12);

		// Create creator
		const creator = await db.one(
			`INSERT INTO users (id, email, password, role, first_name, last_name, phone, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
       RETURNING *`,
			[
				uuidv4(),
				"creator@eventful.com",
				hashedPassword,
				"creator",
				"John",
				"Creator",
				"+1234567890",
				true,
			],
		);

		logger.info("✅ Creator user created");

		// Create eventees
		await db.one(
			`INSERT INTO users (id, email, password, role, first_name, last_name, phone, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
       RETURNING *`,
			[
				uuidv4(),
				"eventee1@eventful.com",
				hashedPassword,
				"eventee",
				"Jane",
				"Doe",
				"+1234567891",
				true,
			],
		);

		await db.one(
			`INSERT INTO users (id, email, password, role, first_name, last_name, phone, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
       RETURNING *`,
			[
				uuidv4(),
				"eventee2@eventful.com",
				hashedPassword,
				"eventee",
				"Bob",
				"Smith",
				"+1234567892",
				true,
			],
		);

		logger.info("✅ Eventee users created");

		// Create sample events
		const events = [
			{
				title: "Summer Music Festival 2026",
				description:
					"Join us for an unforgettable night of music featuring top artists from around the world. Experience the magic of live performances under the stars.",
				category: "Concert",
				venue: "Central Park Arena",
				address: "123 Park Avenue, New York, NY 10001",
				startDate: new Date("2026-08-20T18:00:00"),
				endDate: new Date("2026-08-20T23:00:00"),
				ticketPrice: 75.0,
				totalTickets: 500,
				imageUrl: "https://example.com/music-festival.jpg",
			},
			{
				title: "Tech Conference 2026",
				description:
					"The biggest tech conference of the year! Learn from industry leaders, network with innovators, and discover the future of technology.",
				category: "Conference",
				venue: "Silicon Valley Convention Center",
				address: "456 Tech Boulevard, San Jose, CA 95113",
				startDate: new Date("2026-09-15T09:00:00"),
				endDate: new Date("2026-09-17T17:00:00"),
				ticketPrice: 299.0,
				totalTickets: 1000,
				imageUrl: "https://example.com/tech-conference.jpg",
			},
			{
				title: "Broadway Show: The Musical",
				description:
					"Experience the award-winning Broadway musical that has captivated audiences worldwide. A story of love, hope, and redemption.",
				category: "Theater",
				venue: "Broadway Theater",
				address: "789 Broadway, New York, NY 10019",
				startDate: new Date("2026-08-25T19:30:00"),
				endDate: new Date("2026-08-25T22:00:00"),
				ticketPrice: 120.0,
				totalTickets: 300,
				imageUrl: "https://example.com/broadway-show.jpg",
			},
			{
				title: "International Food Festival",
				description:
					"Taste flavors from around the world! Join us for a culinary journey featuring dishes from 30+ countries.",
				category: "Food & Drink",
				venue: "Waterfront Park",
				address: "321 Harbor Drive, Seattle, WA 98101",
				startDate: new Date("2026-09-01T11:00:00"),
				endDate: new Date("2026-09-01T20:00:00"),
				ticketPrice: 45.0,
				totalTickets: 800,
				imageUrl: "https://example.com/food-festival.jpg",
			},
			{
				title: "Championship Basketball Game",
				description:
					"Watch the finals live! The most anticipated basketball game of the season.",
				category: "Sports",
				venue: "Madison Square Garden",
				address: "4 Pennsylvania Plaza, New York, NY 10001",
				startDate: new Date("2026-10-05T19:00:00"),
				endDate: new Date("2026-10-05T22:00:00"),
				ticketPrice: 150.0,
				totalTickets: 2000,
				imageUrl: "https://example.com/basketball-game.jpg",
			},
		];

		for (const eventData of events) {
			const event = await db.one(
				`INSERT INTO events (
          id, creator_id, title, description, category, venue, address,
          start_date, end_date, ticket_price, total_tickets, available_tickets,
          image_url, is_published
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
				[
					uuidv4(),
					creator.id,
					eventData.title,
					eventData.description,
					eventData.category,
					eventData.venue,
					eventData.address,
					eventData.startDate,
					eventData.endDate,
					eventData.ticketPrice,
					eventData.totalTickets,
					eventData.totalTickets,
					eventData.imageUrl,
					true, // Published
				],
			);

			logger.info(`✅ Created event: ${event.title}`);
		}

		logger.info("🎉 Database seeding completed successfully!");
		logger.info("\n📋 Test Credentials:");
		logger.info("Creator: creator@eventful.com / password123");
		logger.info("Eventee 1: eventee1@eventful.com / password123");
		logger.info("Eventee 2: eventee2@eventful.com / password123");

		process.exit(0);
	} catch (error) {
		logger.error("Error seeding database:", error);
		process.exit(1);
	}
}

seed();
