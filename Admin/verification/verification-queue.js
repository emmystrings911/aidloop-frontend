import { apiRequest, normalizeArray } from "../../assets/js/api.js";

const elements = {
  searchInput: document.getElementById("searchInput"),
  orgTable: document.getElementById("orgTable"),
  pendingCount: document.getElementById("pendingCount"),
  adminName: document.getElementById("adminName"),
  adminAvatar: document.getElementById("adminAvatar"),
  filterButtons: document.querySelectorAll(".filter-btn")
};

let organizers = [];
let currentFilter = "awaiting";

function getDisplayName(user) {
  return user.fullName || user.name || user.organizationName || "Unnamed Organizer";
}

function getLocation(user) {
  if (typeof user.location === "string" && user.location.trim()) {
    return user.location;
  }

  if (user.location && typeof user.location === "object") {
    return user.location.city || user.location.state || user.location.venue || "—";
  }

  return user.city || user.state || "—";
}

function badgeText(status) {
  if (status === "verified") return "Verified";
  if (status === "rejected") return "Rejected";
  return "Awaiting Verification";
}

function updatePendingCount() {
  const count = organizers.filter(o => o.status === "awaiting").length;
  elements.pendingCount.textContent = count;
}

function renderTable() {
  const query = elements.searchInput.value.trim().toLowerCase();

  const filtered = organizers.filter((org) => {
    const matchesFilter =
      currentFilter === "all"
        ? true
        : org.status === currentFilter;

    const searchableText = `
      ${getDisplayName(org)}
      ${org.email || ""}
      ${getLocation(org)}
      ${org.status}
    `.toLowerCase();

    return matchesFilter && searchableText.includes(query);
  });

  if (!filtered.length) {
    elements.orgTable.innerHTML = `
      <tr>
        <td colspan="5">No organizations found.</td>
      </tr>
    `;
    return;
  }

  elements.orgTable.innerHTML = filtered
    .map((org) => {
      const id = org._id || org.id || "";
      const status = org.status || "awaiting";

      return `
        <tr>
          <td>${getDisplayName(org)}</td>
          <td>${org.email || "—"}</td>
          <td>${getLocation(org)}</td>
          <td><span class="badge ${status}">${badgeText(status)}</span></td>
          <td>
            <button class="view" data-id="${id}">View Details</button>
          </td>
        </tr>
      `;
    })
    .join("");

  attachViewDetailsHandlers();
}

function attachViewDetailsHandlers() {
  document.querySelectorAll(".view").forEach((button) => {
    button.addEventListener("click", () => {
      const organizerId = button.dataset.id;
      window.location.href = `verification-details.html?id=${encodeURIComponent(organizerId)}`;
    });
  });
}

async function loadAdminProfile() {
  try {
    const profile = await apiRequest("/user/me");

    elements.adminName.textContent =
      profile.fullName ||
      profile.name ||
      "Admin User";

    if (profile.profileImage) {
      elements.adminAvatar.src = profile.profileImage;
    }
  } catch (error) {
    console.error("Failed to load admin profile:", error.message);
  }
}

async function loadVerificationQueue() {
  try {
    let endpoint = "/admin/organizers";

    if (currentFilter === "awaiting") {
      endpoint = "/admin/organizers/pending";
    }

    const payload = await apiRequest(endpoint);
    let data = normalizeArray(payload, ["organizers", "users"]);

    // Map backend status to frontend status
    organizers = data.map((org) => {
      let status = "awaiting";

      const s = String(org.status || org.approvalStatus || "").toLowerCase();

      if (s === "approved" || s === "verified") status = "verified";
      if (s === "rejected") status = "rejected";

      return {
        ...org,
        status
      };
    });

    updatePendingCount();
    renderTable();
  } catch (error) {
    console.error("Failed to load verification queue:", error.message);
    elements.orgTable.innerHTML = `
      <tr>
        <td colspan="5">Failed to load verification queue.</td>
      </tr>
    `;
  }
}

function bindFilters() {
  elements.filterButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      elements.filterButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      currentFilter = button.dataset.filter;
      await loadVerificationQueue();
    });
  });
}

function bindSearch() {
  elements.searchInput.addEventListener("input", renderTable);
}

document.addEventListener("DOMContentLoaded", async () => {
  bindFilters();
  bindSearch();
  await loadAdminProfile();
  await loadVerificationQueue();
});