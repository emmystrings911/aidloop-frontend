import { apiRequest } from "../../assets/js/api.js";
import { requireRole } from "../../assets/js/auth.js";
import { logout } from "../../assets/js/logout.js";

const els = {
  name: document.getElementById("eventName"),
  image: document.getElementById("eventImage"),
  description: document.getElementById("eventDescription"),
  time: document.getElementById("eventTime"),
  date: document.getElementById("eventDate"),
  location: document.getElementById("eventLocation"),
  requirements: document.getElementById("requirementsList"),
  totalSlots: document.getElementById("totalSlots"),
  registered: document.getElementById("registered"),
  remaining: document.getElementById("remaining"),
  table: document.getElementById("volunteerTable"),
  statusBadge: document.getElementById("statusBadge"),
  cancelBtn: document.getElementById("cancelBtn"),
  editBtn: document.getElementById("editBtn"),
  logoutBtn: document.getElementById("logoutBtn")
};

const eventId = new URLSearchParams(window.location.search).get("id");

let eventData = null;

/* ---------------- STATUS BADGE ---------------- */
function setStatus(status) {
  els.statusBadge.textContent = status;
  els.statusBadge.className = `status-badge status-${status}`;

  // Control buttons based on status
  if (status === "draft") {
    els.cancelBtn.style.display = "none";
  }

  if (status === "cancelled" || status === "completed") {
    els.cancelBtn.style.display = "none";
    els.editBtn.style.display = "none";
  }
}

/* ---------------- LOAD EVENT ---------------- */
async function loadEvent() {
  if (!eventId) {
    alert("Event ID missing");
    return;
  }

  try {
   const payload = await apiRequest(`/events/${eventId}`);
if (!payload || !payload.data) {
  throw new Error("Invalid event response");
}
eventData = payload.data;

    els.name.textContent = eventData.name || "Untitled Event";
    els.image.src =
      eventData.image || "../../assets/Images/volunteer.png";
    els.description.textContent =
      eventData.description || "No description provided";

    els.time.textContent =
      `${eventData.startTime || ""} - ${eventData.endTime || ""}`;

    els.date.textContent = new Date(eventData.date).toDateString();

    els.location.textContent = [
  eventData.location?.venue,
  eventData.location?.city
].filter(Boolean).join(", ") || "—";

    setStatus(eventData.status);

    els.requirements.innerHTML = (eventData.requirements || [])
      .map((r) => `<li>${r}</li>`)
      .join("");

    els.totalSlots.textContent = eventData.volunteerSlots || 0;

    await loadVolunteers();

  } catch (error) {
    console.error(error);
    alert("Failed to load event details");
  }
}

/* ---------------- LOAD VOLUNTEERS ---------------- */
async function loadVolunteers() {
  try {
    const data = await apiRequest(
      `/applications/events/${eventId}/registrations`
    );

    const volunteers = Array.isArray(data)
      ? data
      : data.data || data || [];

    const registeredCount = volunteers.length;

    els.registered.textContent = registeredCount;
    els.remaining.textContent =
      (eventData.volunteerSlots || 0) - registeredCount;

    if (!registeredCount) {
      els.table.innerHTML =
        `<tr><td colspan="4">No volunteers yet</td></tr>`;
      return;
    }

    els.table.innerHTML = volunteers
      .map(
        (v) => `
      <tr>
        <td>${v.volunteerId?.fullName || "Unknown"}</td>
        <td>${v.volunteerId?.email || "—"}</td>
        <td>${new Date(v.createdAt).toDateString()}</td>
        <td><span class="status-badge status-published">Registered</span></td>
      </tr>
    `
      )
      .join("");
  } catch (error) {
    console.error(error);
    els.table.innerHTML =
      `<tr><td colspan="4">Failed to load volunteers</td></tr>`;
  }
}

/* ---------------- CANCEL EVENT ---------------- */
els.cancelBtn.addEventListener("click", async () => {
  if (!confirm("Cancel this event?")) return;

  try {
    await apiRequest(`/events/${eventId}/cancel`, {
      method: "PATCH",
      body: JSON.stringify({
        reason: "Cancelled by organizer"
      })
    });

    alert("Event cancelled");
    location.reload();
  } catch (error) {
    alert(error.message || "Failed to cancel event");
  }
});

/* ---------------- EDIT EVENT ---------------- */
els.editBtn.addEventListener("click", () => {
  window.location.href = `create-event.html?id=${eventId}`;
});

/* ---------------- LOGOUT ---------------- */
els.logoutBtn.addEventListener("click", () => {
  logout("../login/login.html");
});

/* ---------------- INIT ---------------- */
document.addEventListener("DOMContentLoaded", async () => {
  await requireRole("organizer", "../login/login.html");
  await loadEvent();
});

document.getElementById("viewVolunteersBtn").addEventListener("click", () => {
  window.location.href = `../volunteers/volunteers.html?eventId=${eventId}`;
});

document.getElementById("viewCertificatesBtn").addEventListener("click", () => {
  window.location.href = `../certificates/organizer-certificates.html?eventId=${eventId}`;
});