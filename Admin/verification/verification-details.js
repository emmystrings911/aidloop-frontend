import { apiRequest } from "../../assets/js/api.js";

const els = {
  orgTitle: document.getElementById("orgTitle"),
  orgName: document.getElementById("orgName"),
  socialLinks: document.getElementById("socialLinks"),
  email: document.getElementById("email"),
  phoneNumber: document.getElementById("phoneNumber"),
  location: document.getElementById("location"),
  description: document.getElementById("description"),
  statusBadge: document.getElementById("statusBadge"),
  rejectBtn: document.getElementById("rejectBtn"),
  approveBtn: document.getElementById("approveBtn"),
  feedback: document.getElementById("feedback")
};

let organizerId = null;

function getOrganizerIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function detectStatus(user) {
  const status = String(user.status || "").toLowerCase();
  const approvalStatus = String(user.approvalStatus || "").toLowerCase();
  const isVerified = Boolean(user.isVerified);

  if (status === "rejected" || approvalStatus === "rejected") return "rejected";

  if (
    status === "verified" ||
    status === "approved" ||
    approvalStatus === "verified" ||
    approvalStatus === "approved" ||
    isVerified
  ) {
    return "approved";
  }

  return "awaiting";
}

function getLocationText(user) {
  if (typeof user.location === "string" && user.location.trim()) {
    return user.location;
  }

  if (user.location && typeof user.location === "object") {
    return user.location.city || user.location.venue || user.location.state || "—";
  }

  return user.city || user.state || "—";
}

function renderSocialLinks(user) {
  const links = user.socialLinks || user.website || user.socialLink || user.link || "";

  if (!links) {
    els.socialLinks.textContent = "—";
    return;
  }

  if (Array.isArray(links)) {
    els.socialLinks.innerHTML = links
      .map(link => `<a href="${link}" target="_blank">${link}</a>`)
      .join("<br>");
    return;
  }

  els.socialLinks.innerHTML = `<a href="${links}" target="_blank">${links}</a>`;
}

function setBadge(status) {
  els.statusBadge.className = "status-badge";

  if (status === "approved") {
    els.statusBadge.classList.add("approved");
    els.statusBadge.textContent = "Approved";
    return;
  }

  if (status === "rejected") {
    els.statusBadge.classList.add("rejected");
    els.statusBadge.textContent = "Rejected";
    return;
  }

  els.statusBadge.classList.add("awaiting");
  els.statusBadge.textContent = "Awaiting Verification";
}

function renderOrganizer(user) {
  const displayName = user.fullName || user.name || user.organizationName || "Unnamed Organizer";
  const currentStatus = detectStatus(user);

  els.orgTitle.textContent = displayName;
  els.orgName.textContent = displayName;
  els.email.textContent = user.email || "—";
  els.phoneNumber.textContent = user.phoneNumber || user.phone || "—";
  els.location.textContent = getLocationText(user);
  els.description.textContent = user.description || user.bio || "No description available.";

  renderSocialLinks(user);
  setBadge(currentStatus);

  if (currentStatus === "approved" || currentStatus === "rejected") {
    els.approveBtn.disabled = true;
    els.rejectBtn.disabled = true;
  }
}

function setLoadingState(isLoading) {
  els.approveBtn.disabled = isLoading;
  els.rejectBtn.disabled = isLoading;

  els.approveBtn.textContent = isLoading ? "Processing..." : "Approve";
  els.rejectBtn.textContent = isLoading ? "Processing..." : "Reject";
}

async function loadOrganizer() {
  organizerId = getOrganizerIdFromURL();

  if (!organizerId) {
    els.feedback.textContent = "Organizer ID not found.";
    return;
  }

  try {
    const organizer = await apiRequest(`/admin/organizers/${organizerId}`);
    renderOrganizer(organizer);
  } catch (error) {
    els.feedback.textContent = error.message;
  }
}

async function approveOrganizer() {
  try {
    setLoadingState(true);
    await apiRequest(`/admin/organizers/${organizerId}/approve`, { method: "PATCH" });
    setBadge("approved");
    els.feedback.textContent = "Organizer approved successfully.";

    setTimeout(() => {
      window.location.href = "verification-queue.html";
    }, 1000);
  } finally {
    setLoadingState(false);
  }
}

async function rejectOrganizer() {
  try {
    setLoadingState(true);
    await apiRequest(`/admin/organizers/${organizerId}/reject`, { method: "PATCH" });
    setBadge("rejected");
    els.feedback.textContent = "Organizer rejected successfully.";

    setTimeout(() => {
      window.location.href = "verification-queue.html";
    }, 1000);
  } finally {
    setLoadingState(false);
  }
}

els.approveBtn.addEventListener("click", approveOrganizer);
els.rejectBtn.addEventListener("click", rejectOrganizer);

document.addEventListener("DOMContentLoaded", loadOrganizer);