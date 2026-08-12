import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { Calendar, MapPin, Ticket, TrendingUp, Users } from "lucide-react";
import { eventsAPI } from "@/lib/api";
import { formatDate, formatCurrency } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Home() {
	const [events, setEvents] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [category, setCategory] = useState("");

	useEffect(() => {
		fetchEvents();
	}, [category]);

	const fetchEvents = async () => {
		try {
			setLoading(true);
			const response = await eventsAPI.getAll({ category, limit: 12 });
			setEvents(response.data.data.events);
		} catch (error) {
			console.error("Error fetching events:", error);
		} finally {
			setLoading(false);
		}
	};

	const categories = [
		"All",
		"Concert",
		"Conference",
		"Theater",
		"Sports",
		"Food & Drink",
	];

	return (
		<>
			<Head>
				<title>Eventful - Your Passport to Unforgettable Moments</title>
				<meta
					name="description"
					content="Discover and book tickets for amazing events"
				/>
			</Head>

			<Navbar />

			{/* Hero Section */}
			<section className="bg-gradient-to-r from-primary-600 to-primary-800 py-20 text-white">
				<div className="mx-auto px-4 container">
					<div className="mx-auto max-w-3xl text-center">
						<h1 className="mb-6 font-bold text-5xl md:text-6xl">
							Your Passport to Unforgettable Moments
						</h1>
						<p className="mb-8 text-primary-100 text-xl md:text-2xl">
							From concerts to conferences, discover events that match your
							passion
						</p>
						<div className="flex justify-center gap-4">
							<Link
								href="/events"
								className="px-8 py-3 text-lg btn btn-secondary">
								Explore Events
							</Link>
							<Link
								href="/register"
								className="bg-white hover:bg-gray-100 px-8 py-3 text-primary-600 text-lg btn">
								Get Started
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className="bg-white py-16">
				<div className="mx-auto px-4 container">
					<div className="gap-8 grid grid-cols-1 md:grid-cols-4">
						<div className="text-center">
							<div className="flex justify-center items-center bg-primary-100 mx-auto mb-4 rounded-full w-16 h-16">
								<Ticket className="w-8 h-8 text-primary-600" />
							</div>
							<h3 className="mb-2 font-semibold text-xl">Easy Booking</h3>
							<p className="text-gray-600">Book tickets in just a few clicks</p>
						</div>
						<div className="text-center">
							<div className="flex justify-center items-center bg-secondary-100 mx-auto mb-4 rounded-full w-16 h-16">
								<Users className="w-8 h-8 text-secondary-600" />
							</div>
							<h3 className="mb-2 font-semibold text-xl">Diverse Events</h3>
							<p className="text-gray-600">From concerts to conferences</p>
						</div>
						<div className="text-center">
							<div className="flex justify-center items-center bg-green-100 mx-auto mb-4 rounded-full w-16 h-16">
								<Calendar className="w-8 h-8 text-green-600" />
							</div>
							<h3 className="mb-2 font-semibold text-xl">Smart Reminders</h3>
							<p className="text-gray-600">Never miss an event</p>
						</div>
						<div className="text-center">
							<div className="flex justify-center items-center bg-purple-100 mx-auto mb-4 rounded-full w-16 h-16">
								<TrendingUp className="w-8 h-8 text-purple-600" />
							</div>
							<h3 className="mb-2 font-semibold text-xl">Analytics</h3>
							<p className="text-gray-600">Track your event success</p>
						</div>
					</div>
				</div>
			</section>

			{/* Events Section */}
			<section className="bg-gray-50 py-16">
				<div className="mx-auto px-4 container">
					<h2 className="mb-12 font-bold text-4xl text-center">
						Featured Events
					</h2>

					{/* Category Filter */}
					<div className="flex flex-wrap justify-center gap-3 mb-12">
						{categories.map((cat) => (
							<button
								key={cat}
								onClick={() => setCategory(cat === "All" ? "" : cat)}
								className={`px-6 py-2 rounded-full transition-all ${
									(cat === "All" && !category) || category === cat
										? "bg-primary-600 text-white"
										: "bg-white text-gray-700 hover:bg-gray-100"
								}`}>
								{cat}
							</button>
						))}
					</div>

					{/* Events Grid */}
					{loading ? (
						<div className="py-12 text-center">
							<div className="inline-block border-4 border-primary-600 border-t-transparent rounded-full w-12 h-12 animate-spin"></div>
						</div>
					) : (
						<div className="gap-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
							{events.map((event) => (
								<Link key={event.id} href={`/events/${event.id}`}>
									<div className="hover:shadow-xl transition-shadow cursor-pointer card">
										<div className="relative bg-gradient-to-r from-primary-400 to-secondary-400 h-48">
											<div className="top-4 right-4 absolute bg-white px-3 py-1 rounded-full font-semibold text-sm">
												{event.category}
											</div>
										</div>
										<div className="p-6">
											<h3 className="mb-2 font-bold text-xl">{event.title}</h3>
											<p className="mb-4 text-gray-600 line-clamp-2">
												{event.description}
											</p>
											<div className="space-y-2 text-gray-500 text-sm">
												<div className="flex items-center gap-2">
													<Calendar className="w-4 h-4" />
													{formatDate(event.start_date)}
												</div>
												<div className="flex items-center gap-2">
													<MapPin className="w-4 h-4" />
													{event.venue}
												</div>
												<div className="flex items-center gap-2">
													<Ticket className="w-4 h-4" />
													{event.available_tickets} tickets available
												</div>
											</div>
											<div className="flex justify-between items-center mt-4 pt-4 border-gray-200 border-t">
												<span className="font-bold text-primary-600 text-2xl">
													{formatCurrency(event.ticket_price)}
												</span>
												<span className="btn btn-primary">View Details</span>
											</div>
										</div>
									</div>
								</Link>
							))}
						</div>
					)}
				</div>
			</section>

			{/* CTA Section */}
			<section className="bg-primary-600 py-16 text-white">
				<div className="mx-auto px-4 text-center container">
					<h2 className="mb-6 font-bold text-4xl">
						Ready to Create Your Event?
					</h2>
					<p className="mb-8 text-primary-100 text-xl">
						Join thousands of event creators on Eventful
					</p>
					<Link
						href="/register?role=creator"
						className="bg-white hover:bg-gray-100 px-8 py-3 text-primary-600 text-lg btn">
						Become a Creator
					</Link>
				</div>
			</section>

			<Footer />
		</>
	);
}
