// Main JavaScript file

// Toast notification function
function showToast(message, type = "info") {
	const toast = document.createElement("div");
	toast.className = `toast ${type}`;
	toast.innerHTML = `
        <div class="flex items-center gap-3">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="text-gray-500 hover:text-gray-700">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>
    `;
	document.body.appendChild(toast);

	setTimeout(() => {
		toast.remove();
	}, 5000);
}

// Format date
function formatDate(dateString) {
	const date = new Date(dateString);
	return date.toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

// Format time
function formatTime(dateString) {
	const date = new Date(dateString);
	return date.toLocaleTimeString("en-US", {
		hour: "2-digit",
		minute: "2-digit",
	});
}

// Format date and time
function formatDateTime(dateString) {
	const date = new Date(dateString);
	return date.toLocaleString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

// Format currency
function formatCurrency(amount) {
	return new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency: "NGN",
	}).format(amount);
}

// Mobile menu toggle
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const mobileMenu = document.getElementById("mobileMenu");

if (mobileMenuBtn && mobileMenu) {
	mobileMenuBtn.addEventListener("click", () => {
		mobileMenu.classList.toggle("hidden");
	});
}

// Load events on home page
if (document.getElementById("eventsGrid")) {
	loadEvents();
}

async function loadEvents(category = "") {
	const loading = document.getElementById("loading");
	const eventsGrid = document.getElementById("eventsGrid");
	const noEvents = document.getElementById("noEvents");

	try {
		loading.classList.remove("hidden");
		eventsGrid.classList.add("hidden");
		noEvents.classList.add("hidden");

		const url = category
			? `${API_ENDPOINTS.events}?category=${encodeURIComponent(category)}&limit=12`
			: `${API_ENDPOINTS.events}?limit=12`;

		const response = await apiCall(url);
		const events = response.data.events;

		if (events.length === 0) {
			noEvents.classList.remove("hidden");
		} else {
			renderEvents(events);
			eventsGrid.classList.remove("hidden");
		}
	} catch (error) {
		showToast("Failed to load events", "error");
		console.error(error);
	} finally {
		loading.classList.add("hidden");
	}
}

function renderEvents(events) {
	const eventsGrid = document.getElementById("eventsGrid");
	eventsGrid.innerHTML = "";

	events.forEach((event) => {
		const eventCard = createEventCard(event);
		eventsGrid.appendChild(eventCard);
	});
}

function createEventCard(event) {
	const card = document.createElement("a");
	card.href = `event-details.html?id=${event.id}`;
	card.className =
		"card hover:shadow-xl transition-shadow cursor-pointer block";

	card.innerHTML = `
        <div class="h-48 bg-gradient-to-r from-primary-400 to-blue-400 relative">
            <div class="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-sm font-semibold">
                ${event.category}
            </div>
        </div>
        <div class="p-6">
            <h3 class="text-xl font-bold mb-2">${event.title}</h3>
            <p class="text-gray-600 mb-4 line-clamp-2">${event.description}</p>
            <div class="space-y-2 text-sm text-gray-500">
                <div class="flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    ${formatDate(event.start_date)}
                </div>
                <div class="flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    ${event.venue}
                </div>
                <div class="flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path>
                    </svg>
                    ${event.available_tickets} tickets available
                </div>
            </div>
            <div class="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                <span class="text-2xl font-bold text-primary-600">
                    ${formatCurrency(event.ticket_price)}
                </span>
                <span class="btn btn-primary">View Details</span>
            </div>
        </div>
    `;

	return card;
}

// Category filter
const categoryBtns = document.querySelectorAll(".category-btn");
categoryBtns.forEach((btn) => {
	btn.addEventListener("click", () => {
		categoryBtns.forEach((b) => b.classList.remove("active"));
		btn.classList.add("active");
		const category = btn.dataset.category;
		loadEvents(category);
	});
});
