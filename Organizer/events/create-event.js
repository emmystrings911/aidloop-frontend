import { apiRequest } from "../../assets/js/api.js";
import { ROUTES, API_BASE_URL } from "../../assets/js/config.js";
import { logout } from "../../assets/js/logout.js";
import { requireRole } from "../../assets/js/auth.js";

const roles = [];

const els = {
  form: document.getElementById("eventForm"),
  roleInput: document.getElementById("roleInput"),
  addRole: document.getElementById("addRole"),
  rolesList: document.getElementById("rolesList"),
  imageInput: document.getElementById("imageInput"),
  imageBox: document.getElementById("imageBox"),
  formMsg: document.getElementById("formMsg"),
  saveDraft: document.getElementById("saveDraft"),
  logoutBtn: document.getElementById("logoutBtn"),
};

let selectedFile = null;
let existingImage = "";
const eventId = new URLSearchParams(window.location.search).get("id");

/* ---------------- IMAGE SELECT ---------------- */
els.imageBox.addEventListener("click", () => els.imageInput.click());

els.imageInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  selectedFile = file;

  const tempUrl = URL.createObjectURL(file);
  els.imageBox.innerHTML = `<img src="${tempUrl}" style="max-width:100%;">`;
});

/* ---------------- ROLES ---------------- */
els.addRole.addEventListener("click", () => {
  const val = els.roleInput.value.trim();
  if (!val) return;

  roles.push(val);
  els.roleInput.value = "";
  renderRoles();
});

function renderRoles() {
  els.rolesList.innerHTML = roles.map((r) => `<span>${r}</span>`).join("");
}

/* ---------------- UPLOAD IMAGE ---------------- */
async function uploadImage(file) {
  if (!file) return existingImage || "";

  try {
    els.formMsg.textContent = "Uploading image...";

    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(`${API_BASE_URL}/upload/event-image`, {
      method: "POST",
      credentials: "include",
      body: formData
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || "Upload failed");
    }

    const data = await res.json();
    return data.imageUrl;

  } catch (err) {
    els.formMsg.textContent = err.message;
    return "";
  }
}

/* ---------------- LOAD EVENT FOR EDIT ---------------- */
async function loadEventForEdit() {
  if (!eventId) return;

  try {
    els.formMsg.textContent = "Loading event...";

    const payload = await apiRequest(`/events/${eventId}`);
    const event = payload.data;

    document.getElementById("name").value = event.name || "";
    document.getElementById("category").value = event.category || "";
    document.getElementById("description").value = event.description || "";
    document.getElementById("date").value = event.date?.split("T")[0] || "";
    document.getElementById("startTime").value = event.startTime || "";
    document.getElementById("endTime").value = event.endTime || "";
    document.getElementById("venue").value = event.location?.venue || "";
    document.getElementById("city").value = event.location?.city || "";
    document.getElementById("slots").value = event.volunteerSlots || "";
    document.getElementById("requirements").value = (event.requirements || []).join("\n");
    document.getElementById("certificateEnabled").checked = event.certificateEnabled || false;

    existingImage = event.image || "";
    if (existingImage) {
      els.imageBox.innerHTML = `<img src="${existingImage}" style="max-width:100%;">`;
    }

    if (event.roles) {
      roles.push(...event.roles);
      renderRoles();
    }

    els.formMsg.textContent = "Editing event";

  } catch (err) {
    els.formMsg.textContent = "Failed to load event";
  }
}

/* ---------------- SAVE / UPDATE EVENT ---------------- */
async function saveEvent(status = "draft") {
  try {
    let imageUrl = await uploadImage(selectedFile);

    if (!imageUrl) {
      els.formMsg.textContent = "Please upload event image.";
      return;
    }

    const payload = {
      name: document.getElementById("name").value.trim(),
      category: document.getElementById("category").value.trim(),
      description: document.getElementById("description").value.trim(),
      location: {
        venue: document.getElementById("venue").value.trim(),
        city: document.getElementById("city").value.trim(),
      },
      image: imageUrl,
      date: document.getElementById("date").value,
      startTime: document.getElementById("startTime").value,
      endTime: document.getElementById("endTime").value,
      volunteerSlots: Number(document.getElementById("slots").value),
      roles,
      certificateEnabled: document.getElementById("certificateEnabled").checked,
      requirements: document
        .getElementById("requirements")
        .value.split("\n")
        .map((r) => r.trim())
        .filter(Boolean),
    };

    let id = eventId;

    if (eventId) {
      // UPDATE
      await apiRequest(`/events/${eventId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      id = eventId;
    } else {
      // CREATE
      const res = await apiRequest("/events", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      id = res.data._id || res.data.id;
    }

    // SET STATUS
    await apiRequest(`/events/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });

    els.formMsg.textContent = eventId
      ? "Event updated successfully!"
      : "Event created successfully!";

    setTimeout(() => {
      window.location.href = "../events/event-listing.html";
    }, 1000);

  } catch (err) {
    els.formMsg.textContent = err.message || "Failed to save event.";
  }
}

/* ---------------- ACTIONS ---------------- */
els.form.addEventListener("submit", (e) => {
  e.preventDefault();
  saveEvent("published");
});

els.saveDraft.addEventListener("click", () => saveEvent("draft"));

/* ---------------- INIT ---------------- */
document.addEventListener("DOMContentLoaded", async () => {
  await requireRole("organizer", "../login/login.html");
  await loadEventForEdit();
});

/* ---------------- LOGOUT ---------------- */
els.logoutBtn.addEventListener("click", () => logout(ROUTES.organizerLogin));