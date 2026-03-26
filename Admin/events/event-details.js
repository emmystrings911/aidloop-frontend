import { apiRequest } from "../../assets/js/api.js";

const elements = {
  overlay: document.getElementById("overlay"),
  closeBtn: document.getElementById("closeBtn"),
  flagBtn: document.getElementById("flagBtn"),
  eventTitle: document.getElementById("eventTitle"),
  orgName: document.getElementById("orgName"),
  socialLinks: document.getElementById("socialLinks"),
  email: document.getElementById("email"),
  phoneNumber: document.getElementById("phoneNumber"),
  dateTime: document.getElementById("dateTime"),
  slotsFilled: document.getElementById("slotsFilled"),
  description: document.getElementById("description"),
  statusBadge: document.getElementById("statusBadge"),
  feedback: document.getElementById("feedback")
};

let eventId = null;
let currentEvent = null;

function getEventIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function formatDate(dateValue) {
  if (!dateValue) return "—";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function getEventStatus(event) {
  const status = String(event.status || "").toLowerCase();
  if (status === "cancelled" || status === "canceled") return "cancelled";
  if (status === "flagged") return "flagged";
  return "published";
}

function setStatusBadge(status) {
  elements.statusBadge.className = `status-badge ${status}`;

  if (status === "cancelled") {
    elements.statusBadge.textContent = "Cancelled";
    return;
  }

  if (status === "flagged") {
    elements.statusBadge.textContent = "Flagged";
    return;
  }

  elements.statusBadge.textContent = "Published";
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

function getOrganizerPhone(event) {
  if (typeof event.organizer === "object" && event.organizer) {
    return event.organizer.phoneNumber || event.organizer.phone || "—";
  }

  return event.phoneNumber || event.phone || "—";
}

function getSlotsText(event) {
  const filled =
    event.filledSlots ??
    event.registrationsCount ??
    event.registeredCount ??
    0;

  const total =
    event.volunteerSlots ??
    event.totalSlots ??
    event.capacity ??
    "—";

  return `${filled} / ${total} Volunteers`;
}

function renderEvent(event) {
  currentEvent = event;

  const status = getEventStatus(event);

  elements.eventTitle.textContent = event.name || event.title || "Untitled Event";
  elements.orgName.textContent = getOrganizerName(event);
  elements.email.textContent = getOrganizerEmail(event);
  elements.phoneNumber.textContent = getOrganizerPhone(event);

  const datePart = formatDate(event.date);
  const start = event.startTime || "";
  const end = event.endTime ? ` - ${event.endTime}` : "";
  elements.dateTime.innerHTML = `${datePart}${start ? `<br>${start}${end}` : ""}`;

  elements.slotsFilled.textContent = getSlotsText(event);
  elements.description.textContent = event.description || "No event description available.";

  setStatusBadge(status);
}

async function loadEventDetails() {
  eventId = getEventIdFromURL();

  if (!eventId) {
    elements.eventTitle.textContent = "Event not found";
    return;
  }

  try {
    const event = await apiRequest(`/events/${eventId}`);
    renderEvent(event);
  } catch (error) {
    elements.eventTitle.textContent = "Error loading event";
    elements.description.textContent = error.message;
  }
}

async function flagEvent() {
  if (!currentEvent) return;

  const confirmed = window.confirm("Flag this event? This will cancel it.");
  if (!confirmed) return;

  try {
    elements.flagBtn.disabled = true;
    elements.flagBtn.textContent = "Processing...";

    await apiRequest(`/events/${eventId}/cancel`, {
      method: "PATCH",
      body: JSON.stringify({
        reason: "Flagged by admin"
      })
    });

    currentEvent.status = "cancelled";
    renderEvent(currentEvent);

    elements.feedback.textContent = "Event flagged successfully.";
    elements.feedback.className = "feedback success";
  } catch (error) {
    elements.feedback.textContent = error.message;
    elements.feedback.className = "feedback error";
  }
}

function closeModal() {
  window.location.href = "events-oversight.html";
}

elements.closeBtn.addEventListener("click", closeModal);
elements.flagBtn.addEventListener("click", flagEvent);

elements.overlay.addEventListener("click", (event) => {
  if (event.target === elements.overlay) {
    closeModal();
  }
});

document.addEventListener("DOMContentLoaded", loadEventDetails);