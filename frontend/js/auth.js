// Authentication functions

function getUser() {
	const userStr = localStorage.getItem("user");
	return userStr ? JSON.parse(userStr) : null;
}

function isAuthenticated() {
	return !!getAuthToken() && !!getUser();
}

function logout() {
	localStorage.removeItem("token");
	localStorage.removeItem("user");
	showToast("Logged out successfully", "success");
	setTimeout(() => {
		window.location.href = "index.html";
	}, 1000);
}

function updateUIForAuth() {
	const user = getUser();
	const loginLink = document.getElementById("loginLink");
	const registerLink = document.getElementById("registerLink");
	const userMenu = document.getElementById("userMenu");
	const userName = document.getElementById("userName");
	const dashboardLink = document.getElementById("dashboardLink");

	if (user) {
		if (loginLink) loginLink.style.display = "none";
		if (registerLink) registerLink.style.display = "none";
		if (userMenu) userMenu.classList.remove("hidden");
		if (userName) userName.textContent = `${user.first_name} ${user.last_name}`;

		// Show/hide dashboard based on role
		if (dashboardLink) {
			dashboardLink.style.display = user.role === "creator" ? "inline" : "none";
		}
	} else {
		if (loginLink) loginLink.style.display = "inline";
		if (registerLink) registerLink.style.display = "inline";
		if (userMenu) userMenu.classList.add("hidden");
	}
}

// Check authentication on protected pages
function requireAuth() {
	if (!isAuthenticated()) {
		showToast("Please login to continue", "error");
		setTimeout(() => {
			window.location.href = "login.html";
		}, 1500);
		return false;
	}
	return true;
}

// Check if user is creator
function requireCreator() {
	if (!requireAuth()) return false;

	const user = getUser();
	if (user.role !== "creator") {
		showToast("Access denied. Creator account required.", "error");
		setTimeout(() => {
			window.location.href = "index.html";
		}, 1500);
		return false;
	}
	return true;
}

// Initialize auth UI
document.addEventListener("DOMContentLoaded", () => {
	updateUIForAuth();
});
