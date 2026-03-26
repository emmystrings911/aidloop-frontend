import { apiRequest } from "../../assets/js/api.js";
import { requireRole } from "../../assets/js/auth.js";
import { logout } from "../../assets/js/logout.js";
import { ROUTES } from "../../assets/js/config.js";

const eventId = new URLSearchParams(window.location.search).get("eventId");

const els = {
  table: document.getElementById("volunteerTable"),
  total: document.getElementById("totalRegistered"),
  attended: document.getElementById("attendedCount"),
  noShow: document.getElementById("noShowCount"),
  searchInput: document.getElementById("searchInput"),
  tableCountText: document.getElementById("tableCountText"),
  filterBtns: document.querySelectorAll(".filter-btn"),
  logoutBtn: document.getElementById("logoutBtn")
};

let allVolunteers = [];
let currentFilter = "all";

/* ---------------- HELPERS ---------------- */
function getStatus(v) {
  return String(v.status || "confirmed").toLowerCase();
}

function getAttendance(v) {
  return String(v.attendance || v.status || "").toLowerCase();
}

function getDisplayName(v) {
  return v.volunteerId?.fullName || "Unknown";
}

function getEmail(v) {
  return v.volunteerId?.email || "—";
}

function getAvatar(v) {
  return v.volunteerId?.profileImage || "https://i.pravatar.cc/100?img=12";
}

/* ---------------- STATS ---------------- */
function renderStats() {
  const total = allVolunteers.length;
  const attended = allVolunteers.filter((v) => getAttendance(v) === "attended").length;
  const noShow = Math.max(0, total - attended);

  els.total.textContent = total;
  els.attended.textContent = attended;
  els.noShow.textContent = noShow;
}

/* ---------------- TABLE ---------------- */
function renderTable() {
  const query = els.searchInput.value.trim().toLowerCase();

  let filtered = [...allVolunteers];

  if (currentFilter !== "all") {
    filtered = filtered.filter((v) => getStatus(v) === currentFilter);
  }

  if (query) {
    filtered = filtered.filter((v) => {
      const searchable = `${getDisplayName(v)} ${getEmail(v)}`.toLowerCase();
      return searchable.includes(query);
    });
  }

  els.tableCountText.textContent = `Showing ${filtered.length} of ${allVolunteers.length} entries`;

  if (!filtered.length) {
    els.table.innerHTML = `<tr><td colspan="6">No volunteers found</td></tr>`;
    return;
  }

  els.table.innerHTML = filtered.map((v) => {
    const id = v._id;
    const attended = getAttendance(v) === "attended";

    return `
      <tr>
        <td>
          <div class="volunteer-name">
            <img class="avatar" src="${getAvatar(v)}" />
            <span>${getDisplayName(v)}</span>
          </div>
        </td>
        <td>${getEmail(v)}</td>
        <td><span class="badge confirmed">Confirmed</span></td>
        <td>
          <button class="attendance-box ${attended ? "checked" : ""}" data-id="${id}">
            ${attended ? "✓" : ""}
          </button>
        </td>
        <td class="${attended ? "qualified" : "pending"}">
          ${attended ? "Qualified" : "Pending"}
        </td>
        <td>...</td>
      </tr>
    `;
  }).join("");

  attachAttendanceHandlers();
}

/* ---------------- ATTENDANCE ---------------- */
function attachAttendanceHandlers() {
  document.querySelectorAll(".attendance-box").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const volunteer = allVolunteers.find((v) => v._id === id);

      if (getAttendance(volunteer) === "attended") return;

      try {
        await apiRequest(`/applications/registrations/${id}/attendance`, {
          method: "PATCH",
          body: JSON.stringify({ status: "attended" })
        });

        allVolunteers = allVolunteers.map((v) =>
  v._id === id ? { ...v, attendance: "attended", status: "attended" } : v
);

        renderStats();
        renderTable();
      } catch (err) {
        alert(err.message || "Failed to update attendance");
      }
    });
  });
}

/* ---------------- LOAD DATA ---------------- */
async function loadVolunteers() {
  const data = await apiRequest(`/applications/events/${eventId}/registrations`);
  allVolunteers = Array.isArray(data)
  ? data
  : data.data || data || [];

  renderStats();
  renderTable();
}

/* ---------------- FILTERS ---------------- */
function bindFilters() {
  els.filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      els.filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      renderTable();
    });
  });
}

/* ---------------- INIT ---------------- */
document.addEventListener("DOMContentLoaded", async () => {
  await requireRole("organizer", ROUTES.organizerLogin);

  if (!eventId) {
    alert("No event selected");
    window.location.href = ROUTES.eventListing;
    return;
  }

  bindFilters();

  try {
    await loadVolunteers();
  } catch {
    els.table.innerHTML = `<tr><td colspan="6">Failed to load volunteers</td></tr>`;
  }
});

/* ---------------- SEARCH ---------------- */
els.searchInput.addEventListener("input", renderTable);

/* ---------------- LOGOUT ---------------- */
els.logoutBtn.addEventListener("click", () => {
  logout(ROUTES.organizerLogin);
});