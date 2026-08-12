import QRCode from "qrcode";

export class QRCodeService {
	async generateQRCode(data: string): Promise<string> {
		try {
			// Generate QR code as base64 data URL
			const qrCodeDataUrl = await QRCode.toDataURL(data, {
				width: 300,
				margin: 2,
				color: {
					dark: "#000000",
					light: "#FFFFFF",
				},
			});

			return qrCodeDataUrl;
		} catch (error) {
			throw new Error(`Failed to generate QR code: ${error}`);
		}
	}

	async generateQRCodeBuffer(data: string): Promise<Buffer> {
		try {
			const buffer = await QRCode.toBuffer(data, {
				width: 300,
				margin: 2,
			});

			return buffer;
		} catch (error) {
			throw new Error(`Failed to generate QR code buffer: ${error}`);
		}
	}

	generateTicketData(
		ticketId: string,
		eventId: string,
		userId: string,
	): string {
		return JSON.stringify({
			ticketId,
			eventId,
			userId,
			timestamp: new Date().toISOString(),
		});
	}

	verifyTicketData(qrData: string): {
		ticketId: string;
		eventId: string;
		userId: string;
	} {
		try {
			const data = JSON.parse(qrData);
			return {
				ticketId: data.ticketId,
				eventId: data.eventId,
				userId: data.userId,
			};
		} catch (error) {
			throw new Error("Invalid QR code data");
		}
	}
}
