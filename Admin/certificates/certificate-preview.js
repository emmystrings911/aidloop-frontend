import { apiRequest, API_BASE_URL } from "../assets/js/api.js";

const elements = {
  overlay: document.getElementById("overlay"),
  closeBtn: document.getElementById("closeBtn"),
  volunteerName: document.getElementById("volunteerName"),
  eventName: document.getElementById("eventName"),
  phoneNumber: document.getElementById("phoneNumber"),
  organizerName: document.getElementById("organizerName"),
  eventDate: document.getElementById("eventDate"),
  certificateStatus: document.getElementById("certificateStatus"),
  feedback: document.getElementById("feedback"),
  downloadBtn: document.getElementById("downloadBtn")
};

let certificateId = null;
let certificateRecord = null;

function getCertificateIdFromURL() {
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

function renderCertificate(record) {
  certificateRecord = record;

  elements.volunteerName.textContent =
    record.volunteerName || "—";

  elements.eventName.textContent =
    record.eventName || "—";

  elements.phoneNumber.textContent =
    record.phoneNumber || "—";

  elements.organizerName.textContent =
    record.organizerName || "—";

  elements.eventDate.textContent = formatDate(
    record.eventDate || record.issuedAt
  );

  elements.certificateStatus.textContent =
    (record.status || "ISSUED").toUpperCase();
}

async function loadCertificatePreview() {
  certificateId = getCertificateIdFromURL();

  if (!certificateId) {
    elements.feedback.textContent = "Certificate ID not found in URL.";
    elements.feedback.className = "feedback error";
    return;
  }

  try {
    const data = await apiRequest(`/certificates/verify/${certificateId}`);
    renderCertificate(data);
  } catch (error) {
    elements.feedback.textContent = error.message;
    elements.feedback.className = "feedback error";
  }
}

function downloadCertificate() {
  if (!certificateId) return;

  elements.feedback.textContent = "";
  elements.downloadBtn.disabled = true;
  elements.downloadBtn.textContent = "Opening...";

  const downloadUrl = `${API_BASE_URL}/certificates/download/${certificateId}`;

  // Redirect browser to download endpoint
  window.location.href = downloadUrl;

  setTimeout(() => {
    elements.downloadBtn.disabled = false;
    elements.downloadBtn.textContent = "Download Certificate";
  }, 2000);
}

function closeModal() {
  window.location.href = "certificates.html";
}

elements.closeBtn.addEventListener("click", closeModal);
elements.downloadBtn.addEventListener("click", downloadCertificate);

elements.overlay.addEventListener("click", (event) => {
  if (event.target === elements.overlay) {
    closeModal();
  }
});

document.addEventListener("DOMContentLoaded", loadCertificatePreview);