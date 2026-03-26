import { apiRequest, normalizeArray } from "../../assets/js/api.js";
import { logout } from "../../assets/js/logout.js";

const els = {
  adminName: document.getElementById("adminName"),
  adminRole: document.getElementById("adminRole"),
  adminAvatar: document.getElementById("adminAvatar"),
  organizationCount: document.getElementById("organizationCount"),
  pendingCount: document.getElementById("pendingCount"),
  eventsCount: document.getElementById("eventsCount"),
  activeUsersCount: document.getElementById("activeUsersCount"),
  activityTable: document.getElementById("activityTable"),
  searchInput: document.getElementById("searchInput"),
  goVerificationQueue: document.getElementById("goVerificationQueue"),
  viewOrganizations: document.getElementById("viewOrganizations"),
  viewEvents: document.getElementById("viewEvents"),
  logoutBtn: document.getElementById("logoutBtn")
};

let activityRowsCache = [];



function formatDate(dateValue) {
  if (!dateValue) return "—";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function setStatValue(element, target) {
  const safeTarget = Number.isFinite(Number(target)) ? Number(target) : 0;
  const duration = 600;
  const steps = 24;
  const increment = safeTarget / steps;
  let current = 0;
  let step = 0;

  const timer = setInterval(() => {
    step += 1;
    current += increment;

    if (step >= steps) {
      element.textContent = safeTarget;
      clearInterval(timer);
      return;
    }

    element.textContent = Math.round(current);
  }, duration / steps);
}

function normalizeUsers(usersPayload) {
  if (Array.isArray(usersPayload)) return usersPayload;
  if (Array.isArray(usersPayload?.users)) return usersPayload.users;
  if (Array.isArray(usersPayload?.data)) return usersPayload.data;
  return [];
}

function buildRecentActivity(users, events) {
  const activities = [];

  users.slice(0, 5).forEach((user) => {
    const isOrganizer = String(user.role || "").toLowerCase() === "organizer";
    const isPending =
      String(user.status || "").toLowerCase() === "pending" ||
      String(user.approvalStatus || "").toLowerCase() === "pending";

    if (isOrganizer && isPending) {
      activities.push({
        activity: "Submitted for Verification",
        entity: user.fullName || user.name || user.email || "Organizer",
        date: formatDate(user.createdAt || user.updatedAt),
        status: "Pending"
      });
    }
  });

  events.slice(0, 5).forEach((event) => {
    activities.push({
      activity: "Event Created",
      entity: event.name || "Untitled Event",
      date: formatDate(event.createdAt || event.date),
      status: event.status || "Published"
    });
  });

  return activities
    .sort((a, b) => {
      const aDate = new Date(a.date);
      const bDate = new Date(b.date);
      return bDate - aDate;
    })
    .slice(0, 8);
}

function renderRecentActivity(rows) {
  activityRowsCache = rows;
  applyActivitySearch();
}

function getStatusBadgeClass(status) {
  const normalized = String(status).toLowerCase();

  if (normalized.includes("pending")) return "pending";
  if (normalized.includes("published")) return "published";
  if (normalized.includes("completed")) return "completed";
  if (normalized.includes("approved")) return "published";
  return "pending";
}

function applyActivitySearch() {
  const query = els.searchInput.value.trim().toLowerCase();
  const filtered = activityRowsCache.filter((row) =>
    `${row.activity} ${row.entity} ${row.date} ${row.status}`
      .toLowerCase()
      .includes(query)
  );

  if (!filtered.length) {
    els.activityTable.innerHTML = `
      <tr>
        <td colspan="4">No matching activity found.</td>
      </tr>
    `;
    return;
  }

  els.activityTable.innerHTML = filtered
    .map(
      (row) => `
        <tr>
          <td>${row.activity}</td>
          <td>${row.entity}</td>
          <td>${row.date}</td>
          <td>
            <span class="status-badge ${getStatusBadgeClass(row.status)}">
              ${row.status}
            </span>
          </td>
        </tr>
      `
    )
    .join("");
}

async function loadAdminProfile() {
  try {
    const profile = await apiRequest("/user/me");

    els.adminName.textContent =
      profile.fullName ||
      profile.name ||
      "Admin User";

    els.adminRole.textContent =
      profile.role
        ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
        : "Admin";

    if (profile.profileImage) {
      els.adminAvatar.src = profile.profileImage;
    }
  } catch (error) {
    console.error("Failed to load admin profile:", error.message);
  }
}

async function loadDashboardData() {
  try {
    const [stats, eventsPayload] = await Promise.all([
      apiRequest("/admin/stats"),
      apiRequest("/events")
    ]);

    const events = normalizeArray(eventsPayload, ["events"]);

    setStatValue(els.organizationCount, stats.totalOrganizers);
    setStatValue(els.pendingCount, stats.pendingOrganizers);
    setStatValue(els.eventsCount, stats.totalEvents || events.length);
    setStatValue(els.activeUsersCount, stats.activeUsers);

    const recentActivity = buildRecentActivity([], events);
    renderRecentActivity(recentActivity);

  } catch (error) {
    console.error("Failed to load dashboard data:", error.message);
    els.activityTable.innerHTML = `
      <tr>
        <td colspan="4">Failed to load dashboard data.</td>
      </tr>
    `;
  }
}

function bindUI() {
  els.goVerificationQueue.addEventListener("click", () => {
    window.location.href = "../verification/verification-queue.html";
  });

  els.viewOrganizations.addEventListener("click", () => {
    window.location.href = "../organizations/organization-directory.html";
  });

  els.viewEvents.addEventListener("click", () => {
    window.location.href = "../events/events-oversight.html";
  });

  els.searchInput.addEventListener("input", applyActivitySearch);
}

document.addEventListener("DOMContentLoaded", async () => {
  bindUI();
  await loadAdminProfile();
  await loadDashboardData();
});

els.logoutBtn.addEventListener("click", () => {
  logout("../login/admin-login.html");
});











// import { apiRequest, normalizeArray } from "../../assets/js/api.js";
// import { requireAdmin } from "../../assets/js/auth.js";
// import { logout } from "../../assets/js/logout.js";
// import { ROUTES } from "../../assets/js/config.js";
// import { formatDate } from "../../assets/js/utils.js";

// const els = {
//   totalOrganizations: document.getElementById("totalOrganizations"),
//   pendingVerifications: document.getElementById("pendingVerifications"),
//   totalEvents: document.getElementById("totalEvents"),
//   activeUsers: document.getElementById("activeUsers"),
//   activityTable: document.getElementById("activityTable"),
//   logoutBtn: document.getElementById("logoutBtn")
// };

// document.addEventListener("DOMContentLoaded", async () => {
//   await requireAdmin();
//   els.logoutBtn.addEventListener("click", () => logout(ROUTES.home));
//   try {
//     const [usersPayload, eventsPayload] = await Promise.all([apiRequest("/user"), apiRequest("/events")]);
//     const users = normalizeArray(usersPayload, ["users"]);
//     const events = normalizeArray(eventsPayload, ["events"]);
//     const organizers = users.filter((u) => String(u.role || "").toLowerCase() === "organizer");

//     const pending = organizers.filter((u) => {
//       const status = String(u.status || "").toLowerCase();
//       const approvalStatus = String(u.approvalStatus || "").toLowerCase();
//       return !(status === "verified" || approvalStatus === "approved" || u.isVerified);
//     }).length;

//     els.totalOrganizations.textContent = organizers.length;
//     els.pendingVerifications.textContent = pending;
//     els.totalEvents.textContent = events.length;
//     els.activeUsers.textContent = users.length;

//     const activityRows = [
//       ...organizers.slice(0, 2).map((o) => ({ activity: "Submitted for Verification", entity: o.fullName || o.name || "Organizer", date: o.createdAt, status: "Pending" })),
//       ...events.slice(0, 2).map((e) => ({ activity: "Event Created", entity: e.name || "Event", date: e.createdAt || e.date, status: e.status || "Published" }))
//     ];

//     els.activityTable.innerHTML = activityRows.map((row) => `
//       <tr>
//         <td>${row.activity}</td>
//         <td>${row.entity}</td>
//         <td>${formatDate(row.date, "long")}</td>
//         <td>${row.status}</td>
//       </tr>
//     `).join("") || `<tr><td colspan="4">No recent activity.</td></tr>`;
//   } catch {
//     els.activityTable.innerHTML = `<tr><td colspan="4">Failed to load dashboard data.</td></tr>`;
//   }
// });
