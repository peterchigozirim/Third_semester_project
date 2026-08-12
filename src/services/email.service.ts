import nodemailer from "nodemailer";
import { logger } from "../utils/logger";

export class EmailService {
	private transporter: nodemailer.Transporter;

	constructor() {
		this.transporter = nodemailer.createTransport({
			host: process.env.SMTP_HOST || "smtp.gmail.com",
			port: parseInt(process.env.SMTP_PORT || "587"),
			secure: false,
			auth: {
				user: process.env.SMTP_USER,
				pass: process.env.SMTP_PASSWORD,
			},
		});
	}

	async sendEmail(to: string, subject: string, html: string): Promise<void> {
		try {
			await this.transporter.sendMail({
				from: process.env.EMAIL_FROM || "noreply@eventful.com",
				to,
				subject,
				html,
			});

			logger.info(`Email sent to ${to}`);
		} catch (error) {
			logger.error("Failed to send email:", error);
			throw error;
		}
	}

	async sendEventReminder(
		to: string,
		eventTitle: string,
		eventDate: Date,
		venue: string,
	): Promise<void> {
		const subject = `Reminder: ${eventTitle} is coming up!`;
		const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Event Reminder</h2>
        <p>Hi there!</p>
        <p>This is a friendly reminder about your upcoming event:</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #555; margin-top: 0;">${eventTitle}</h3>
          <p><strong>Date:</strong> ${new Date(eventDate).toLocaleString()}</p>
          <p><strong>Venue:</strong> ${venue}</p>
        </div>
        <p>We look forward to seeing you there!</p>
        <p style="color: #888; font-size: 12px; margin-top: 30px;">
          This is an automated reminder from Eventful.
        </p>
      </div>
    `;

		await this.sendEmail(to, subject, html);
	}

	async sendTicketPurchaseConfirmation(
		to: string,
		eventTitle: string,
		ticketCode: string,
		eventDate: Date,
		venue: string,
	): Promise<void> {
		const subject = `Ticket Confirmation: ${eventTitle}`;
		const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Ticket Purchase Confirmed!</h2>
        <p>Hi there!</p>
        <p>Your ticket has been successfully purchased. Here are the details:</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #555; margin-top: 0;">${eventTitle}</h3>
          <p><strong>Ticket Code:</strong> <code style="background-color: #fff; padding: 5px 10px; border-radius: 3px;">${ticketCode}</code></p>
          <p><strong>Date:</strong> ${new Date(eventDate).toLocaleString()}</p>
          <p><strong>Venue:</strong> ${venue}</p>
        </div>
        <p>Please keep this email for your records. You'll need to show your QR code at the event entrance.</p>
        <p style="color: #888; font-size: 12px; margin-top: 30px;">
          Thank you for using Eventful!
        </p>
      </div>
    `;

		await this.sendEmail(to, subject, html);
	}

	async sendEventUpdate(
		to: string,
		eventTitle: string,
		updateMessage: string,
	): Promise<void> {
		const subject = `Update: ${eventTitle}`;
		const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Event Update</h2>
        <p>Hi there!</p>
        <p>There's an update regarding <strong>${eventTitle}</strong>:</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p>${updateMessage}</p>
        </div>
        <p style="color: #888; font-size: 12px; margin-top: 30px;">
          This is an automated notification from Eventful.
        </p>
      </div>
    `;

		await this.sendEmail(to, subject, html);
	}
}
