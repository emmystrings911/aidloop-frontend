const API_BASE_URL = "https://aidloop-backend.onrender.com/api";

const elements = {
  userTitle: document.getElementById("userTitle"),
  roleBadge: document.getElementById("roleBadge"),
  nameLabel: document.getElementById("nameLabel"),
  displayName: document.getElementById("displayName"),
  email: document.getElementById("email"),
  phoneNumber: document.getElementById("phoneNumber"),
  location: document.getElementById("location"),
  dateJoined: document.getElementById("dateJoined"),
  statusBadge: document.getElementById("statusBadge"),
  description: document.getElementById("description"),
  feedback: document.getElementById("feedback"),
  deactivateBtn: document.getElementById("deactivateBtn"),
  reactivateBtn: document.getElementById("reactivateBtn")
};

let currentUser = null;
let userId = null;

function getUserIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new Error(
      (data && data.message) ||
      (data && data.error) ||
      "Request failed"
    );
  }

  return data;
}

function normalizeUsers(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.users)) return payload.users;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function getDisplayName(user) {
  return user.fullName || user.name || user.organizationName || "Unnamed User";
}

function getRole(user) {
  const role = String(user.role || "user").toLowerCase();
  if (role === "organizer") return "Organizer";
  if (role === "volunteer") return "Volunteer";
  if (role === "admin") return "Admin";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function isUserActive(user) {
  if (typeof user.isActive === "boolean") return user.isActive;
  const status = String(user.status || "").toLowerCase();
  return status !== "deactivated" && status !== "inactive";
}

function formatDate(dateValue) {
  if (!dateValue) return "—";
  const date = new Date(dateValue);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function setStatusBadge(user) {
  const active = isUserActive(user);
  elements.statusBadge.className = `status-badge ${active ? "active" : "inactive"}`;
  elements.statusBadge.textContent = active ? "Active" : "Inactive";
}

function renderUser(user) {
  currentUser = user;

  const displayName = getDisplayName(user);

  elements.userTitle.textContent = displayName;
  elements.roleBadge.textContent = getRole(user);
  elements.displayName.textContent = displayName;
  elements.email.textContent = user.email || "—";
  elements.phoneNumber.textContent = user.phoneNumber || user.phone || "—";
  elements.location.textContent = user.city || "—";
  elements.dateJoined.textContent = formatDate(user.createdAt);
  elements.description.textContent = user.description || "No description available.";

  setStatusBadge(user);
}

async function loadUserDetails() {
  userId = getUserIdFromURL();

  try {
    const usersPayload = await apiRequest("/user");
    const users = normalizeUsers(usersPayload);

    const user = users.find(
      (item) => String(item._id || item.id) === String(userId)
    );

    if (!user) throw new Error("User not found.");

    renderUser(user);
  } catch (error) {
    elements.feedback.textContent = error.message;
  }
}

async function deactivateUser() {
  if (!currentUser) return;

  const confirmed = window.confirm("Deactivate this user?");
  if (!confirmed) return;

  try {
    await apiRequest(`/admin/users/${userId}/deactivate`, {
      method: "PATCH"
    });

    currentUser.isActive = false;
    renderUser(currentUser);

    elements.feedback.textContent = "User deactivated successfully.";
  } catch (error) {
    elements.feedback.textContent = error.message;
  }
}

elements.deactivateBtn.addEventListener("click", deactivateUser);
elements.reactivateBtn.addEventListener("click", loadUserDetails);

document.addEventListener("DOMContentLoaded", loadUserDetails);