import { apiRequest, normalizeArray } from "../../assets/js/api.js";

const elements = {
  searchInput: document.getElementById("searchInput"),
  eventsTable: document.getElementById("eventsTable"),
  emptyState: document.getElementById("emptyState"),
  adminName: document.getElementById("adminName"),
  adminRole: document.getElementById("adminRole"),
  adminAvatar: document.getElementById("adminAvatar"),
  filterButtons: document.querySelectorAll(".filter-btn")
};

let allEvents = [];
let currentFilter = "all";

function getEventStatus(event) {
  const status = String(event.status || "").toLowerCase();

  if (status === "cancelled" || status === "canceled") return "cancelled";
  if (status === "flagged") return "flagged";
  if (status === "draft") return "draft";

  return "published";
}

function getEventName(event) {
  return event.name || event.title || "Untitled Event";
}

function getOrganizerName(event) {
  if (typeof event.organizer === "object" && event.organizer) {
    return (
      event.organizer.fullName ||
      event.organizer.name ||
      event.organizer.organizationName ||
      "Organizer"
    );
  }

  return event.organizerName || "Organizer";
}

function getOrganizerEmail(event) {
  if (typeof event.organizer === "object" && event.organizer) {
    return event.organizer.email || "—";
  }

  return event.contactEmail || event.email || "—";
}

function getLocation(event) {
  if (typeof event.location === "string" && event.location.trim()) {
    return event.location;
  }

  if (event.location && typeof event.location === "object") {
    const venue = event.location.venue || "";
    const city = event.location.city || "";
    const state = event.location.state || "";
    return [venue, city || state].filter(Boolean).join(", ") || "—";
  }

  return event.city || "—";
}

function badgeText(status) {
  if (status === "cancelled") return "Cancelled";
  if (status === "flagged") return "Flagged";
  if (status === "draft") return "Draft";
  return "Published";
}

function renderEvents() {
  const query = elements.searchInput.value.trim().toLowerCase();

  const filteredEvents = allEvents.filter((event) => {
    const status = event._eventStatus;

    const matchesFilter =
      currentFilter === "all" ? true : status === currentFilter;

    const searchableText = `
      ${getEventName(event)}
      ${getOrganizerName(event)}
      ${getOrganizerEmail(event)}
      ${getLocation(event)}
      ${status}
    `.toLowerCase();

    return matchesFilter && searchableText.includes(query);
  });

  if (!filteredEvents.length) {
    elements.eventsTable.innerHTML = "";
    elements.emptyState.style.display = "flex";
    return;
  }

  elements.emptyState.style.display = "none";

  elements.eventsTable.innerHTML = filteredEvents
    .map((event) => {
      const id = event._id || event.id || "";
      const status = event._eventStatus;

      return `
        <tr>
          <td>
            <div class="org-cell">
              <div class="org-icon">
                <i class="fa-regular fa-calendar"></i>
              </div>
              <div class="org-info">
                <h4>${getEventName(event)}</h4>
                <p>${getOrganizerName(event)}</p>
              </div>
            </div>
          </td>
          <td>${getOrganizerEmail(event)}</td>
          <td>${getLocation(event)}</td>
          <td><span class="status-badge ${status}">${badgeText(status)}</span></td>
          <td><button class="details-btn" data-id="${id}">View Details</button></td>
        </tr>
      `;
    })
    .join("");

  attachDetailHandlers();
}

function attachDetailHandlers() {
  document.querySelectorAll(".details-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const eventId = button.dataset.id;
      window.location.href = `event-details.html?id=${encodeURIComponent(eventId)}`;
    });
  });
}

async function loadAdminProfile() {
  try {
    const profile = await apiRequest("/user/me");

    elements.adminName.textContent =
      profile.fullName || profile.name || "Admin User";

    elements.adminRole.textContent =
      profile.role
        ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
        : "Admin";

    if (profile.profileImage) {
      elements.adminAvatar.src = profile.profileImage;
    }
  } catch (error) {
    console.error("Failed to load admin profile:", error.message);
  }
}

async function loadEvents() {
  try {
    const eventsPayload = await apiRequest("/events");

    allEvents = normalizeArray(eventsPayload, ["events"]).map((event) => ({
      ...event,
      _eventStatus: getEventStatus(event)
    }));

    renderEvents();
  } catch (error) {
    console.error("Failed to load events:", error.message);
    elements.eventsTable.innerHTML = `
      <tr>
        <td colspan="5">Failed to load events.</td>
      </tr>
    `;
  }
}

function bindFilters() {
  elements.filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      elements.filterButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      currentFilter = button.dataset.filter;
      renderEvents();
    });
  });
}

function bindSearch() {
  elements.searchInput.addEventListener("input", renderEvents);
}

document.addEventListener("DOMContentLoaded", async () => {
  bindFilters();
  bindSearch();
  await loadAdminProfile();
  await loadEvents();
});