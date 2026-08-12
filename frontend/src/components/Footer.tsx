import Link from "next/link";
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

export default function Footer() {
	return (
		<footer className="bg-gray-900 py-12 text-white">
			<div className="mx-auto px-4 container">
				<div className="gap-8 grid grid-cols-1 md:grid-cols-4">
					{/* Brand */}
					<div>
						<h3 className="mb-4 font-bold text-2xl">Eventful</h3>
						<p className="text-gray-400">
							Your passport to unforgettable moments
						</p>
					</div>

					{/* Quick Links */}
					<div>
						<h4 className="mb-4 font-semibold">Quick Links</h4>
						<ul className="space-y-2">
							<li>
								<Link
									href="/events"
									className="text-gray-400 hover:text-white transition">
									Browse Events
								</Link>
							</li>
							<li>
								<Link
									href="/register"
									className="text-gray-400 hover:text-white transition">
									Create Account
								</Link>
							</li>
							<li>
								<Link
									href="/about"
									className="text-gray-400 hover:text-white transition">
									About Us
								</Link>
							</li>
						</ul>
					</div>

					{/* For Creators */}
					<div>
						<h4 className="mb-4 font-semibold">For Creators</h4>
						<ul className="space-y-2">
							<li>
								<Link
									href="/register?role=creator"
									className="text-gray-400 hover:text-white transition">
									Become a Creator
								</Link>
							</li>
							<li>
								<Link
									href="/dashboard"
									className="text-gray-400 hover:text-white transition">
									Dashboard
								</Link>
							</li>
							<li>
								<Link
									href="/help"
									className="text-gray-400 hover:text-white transition">
									Help Center
								</Link>
							</li>
						</ul>
					</div>

					{/* Social Media */}
					<div>
						<h4 className="mb-4 font-semibold">Follow Us</h4>
						<div className="flex gap-4">
							<a
								href="#"
								className="flex justify-center items-center bg-gray-800 hover:bg-primary-600 rounded-full w-10 h-10 transition">
								<Facebook className="w-5 h-5" />
							</a>
							<a
								href="#"
								className="flex justify-center items-center bg-gray-800 hover:bg-primary-600 rounded-full w-10 h-10 transition">
								<Twitter className="w-5 h-5" />
							</a>
							<a
								href="#"
								className="flex justify-center items-center bg-gray-800 hover:bg-primary-600 rounded-full w-10 h-10 transition">
								<Instagram className="w-5 h-5" />
							</a>
							<a
								href="#"
								className="flex justify-center items-center bg-gray-800 hover:bg-primary-600 rounded-full w-10 h-10 transition">
								<Linkedin className="w-5 h-5" />
							</a>
						</div>
					</div>
				</div>

				<div className="mt-8 pt-8 border-gray-800 border-t text-gray-400 text-center">
					<p>
						&copy; {new Date().getFullYear()} Eventful. All rights reserved.
					</p>
				</div>
			</div>
		</footer>
	);
}
