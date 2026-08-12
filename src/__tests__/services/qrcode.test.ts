import { QRCodeService } from "../../services/qrcode.service";

describe("QRCodeService", () => {
	let qrCodeService: QRCodeService;

	beforeEach(() => {
		qrCodeService = new QRCodeService();
	});

	describe("generateQRCode", () => {
		it("should generate a QR code data URL", async () => {
			const data = "test-data";
			const qrCode = await qrCodeService.generateQRCode(data);

			expect(qrCode).toContain("data:image/png;base64");
			expect(qrCode.length).toBeGreaterThan(0);
		});

		it("should generate different QR codes for different data", async () => {
			const qrCode1 = await qrCodeService.generateQRCode("data1");
			const qrCode2 = await qrCodeService.generateQRCode("data2");

			expect(qrCode1).not.toBe(qrCode2);
		});
	});

	describe("generateTicketData", () => {
		it("should generate valid JSON ticket data", () => {
			const ticketId = "123";
			const eventId = "456";
			const userId = "789";

			const data = qrCodeService.generateTicketData(ticketId, eventId, userId);
			const parsed = JSON.parse(data);

			expect(parsed.ticketId).toBe(ticketId);
			expect(parsed.eventId).toBe(eventId);
			expect(parsed.userId).toBe(userId);
			expect(parsed).toHaveProperty("timestamp");
		});
	});

	describe("verifyTicketData", () => {
		it("should verify valid ticket data", () => {
			const ticketData = JSON.stringify({
				ticketId: "123",
				eventId: "456",
				userId: "789",
				timestamp: new Date().toISOString(),
			});

			const result = qrCodeService.verifyTicketData(ticketData);

			expect(result.ticketId).toBe("123");
			expect(result.eventId).toBe("456");
			expect(result.userId).toBe("789");
		});

		it("should throw error for invalid ticket data", () => {
			const invalidData = "invalid-json";

			expect(() => {
				qrCodeService.verifyTicketData(invalidData);
			}).toThrow("Invalid QR code data");
		});
	});

	describe("generateQRCodeBuffer", () => {
		it("should generate a QR code buffer", async () => {
			const data = "test-data";
			const buffer = await qrCodeService.generateQRCodeBuffer(data);

			expect(buffer).toBeInstanceOf(Buffer);
			expect(buffer.length).toBeGreaterThan(0);
		});
	});
});
