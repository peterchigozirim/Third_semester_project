import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Menu, X, User, LogOut, Calendar, BarChart3 } from "lucide-react";

export default function Navbar() {
	const [isOpen, setIsOpen] = useState(false);
	const router = useRouter();
	const [user, setUser] = useState(() => {
		if (typeof window !== "undefined") {
			const userData = localStorage.getItem("user");
			return userData ? JSON.parse(userData) : null;
		}
		return null;
	});

	const handleLogout = () => {
		localStorage.removeItem("token");
		localStorage.removeItem("user");
		setUser(null);
		router.push("/");
	};

	return (
		<nav className="top-0 z-50 sticky bg-white shadow-md">
			<div className="mx-auto px-4 container">
				<div className="flex justify-between items-center h-16">
					{/* Logo */}
					<Link href="/" className="font-bold text-primary-600 text-2xl">
						Eventful
					</Link>

					{/* Desktop Navigation */}
					<div className="hidden md:flex items-center space-x-8">
						<Link
							href="/events"
							className="text-gray-700 hover:text-primary-600 transition">
							Events
						</Link>
						{user ? (
							<>
								{user.role === "creator" ? (
									<>
										<Link
											href="/dashboard"
											className="flex items-center gap-2 text-gray-700 hover:text-primary-600 transition">
											<BarChart3 className="w-4 h-4" />
											Dashboard
										</Link>
										<Link
											href="/events/create"
											className="flex items-center gap-2 text-gray-700 hover:text-primary-600 transition">
											<Calendar className="w-4 h-4" />
											Create Event
										</Link>
									</>
								) : (
									<Link
										href="/my-tickets"
										className="text-gray-700 hover:text-primary-600 transition">
										My Tickets
									</Link>
								)}
								<div className="group relative">
									<button className="flex items-center gap-2 text-gray-700 hover:text-primary-600">
										<User className="w-5 h-5" />
										{user.first_name}
									</button>
									<div className="hidden group-hover:block right-0 absolute bg-white shadow-lg mt-2 py-2 rounded-lg w-48">
										<Link
											href="/profile"
											className="block hover:bg-gray-100 px-4 py-2 text-gray-700">
											Profile
										</Link>
										<button
											onClick={handleLogout}
											className="flex items-center gap-2 hover:bg-gray-100 px-4 py-2 w-full text-gray-700 text-left">
											<LogOut className="w-4 h-4" />
											Logout
										</button>
									</div>
								</div>
							</>
						) : (
							<>
								<Link
									href="/login"
									className="text-gray-700 hover:text-primary-600 transition">
									Login
								</Link>
								<Link href="/register" className="btn btn-primary">
									Get Started
								</Link>
							</>
						)}
					</div>

					{/* Mobile menu button */}
					<button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
						{isOpen ? <X /> : <Menu />}
					</button>
				</div>

				{/* Mobile Navigation */}
				{isOpen && (
					<div className="md:hidden space-y-4 py-4">
						<Link
							href="/events"
							className="block text-gray-700 hover:text-primary-600">
							Events
						</Link>
						{user ? (
							<>
								{user.role === "creator" ? (
									<>
										<Link
											href="/dashboard"
											className="block text-gray-700 hover:text-primary-600">
											Dashboard
										</Link>
										<Link
											href="/events/create"
											className="block text-gray-700 hover:text-primary-600">
											Create Event
										</Link>
									</>
								) : (
									<Link
										href="/my-tickets"
										className="block text-gray-700 hover:text-primary-600">
										My Tickets
									</Link>
								)}
								<Link
									href="/profile"
									className="block text-gray-700 hover:text-primary-600">
									Profile
								</Link>
								<button
									onClick={handleLogout}
									className="block w-full text-gray-700 hover:text-primary-600 text-left">
									Logout
								</button>
							</>
						) : (
							<>
								<Link
									href="/login"
									className="block text-gray-700 hover:text-primary-600">
									Login
								</Link>
								<Link
									href="/register"
									className="block w-full text-center btn btn-primary">
									Get Started
								</Link>
							</>
						)}
					</div>
				)}
			</div>
		</nav>
	);
}
