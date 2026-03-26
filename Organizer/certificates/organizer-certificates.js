const API_BASE = "https://aidloop-backend.onrender.com/api";

const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get("eventId");

const tableBody = document.getElementById("certificatesTable");

const totalCertificates = document.getElementById("totalCertificates");
const issuedCertificates = document.getElementById("issuedCertificates");
const pendingCertificates = document.getElementById("pendingCertificates");
const tableCountText = document.getElementById("tableCountText");


/* ---------------- HELPERS ---------------- */

function getAvatar(volunteer){
  return volunteer?.profileImage || "https://i.pravatar.cc/100?img=12";
}


/* ---------------- LOAD DATA ---------------- */

async function loadCertificates(){

try{

const [regRes, certRes] = await Promise.all([

fetch(`${API_BASE}/applications/events/${eventId}/registrations`,{
credentials:"include"
}),

fetch(`${API_BASE}/certificates/event/${eventId}`,{
credentials:"include"
})

]);

const regData = await regRes.json();
const certData = await certRes.json();

const registrations = regData.data || [];
const certificates = certData.data || [];

buildTable(registrations,certificates);

}catch(error){

console.error(error);

tableBody.innerHTML = `
<tr>
<td colspan="6">Failed to load certificates</td>
</tr>
`;

}

}


/* ---------------- BUILD TABLE ---------------- */

function buildTable(registrations,certificates){

tableBody.innerHTML="";

const issuedVolunteerIds = new Set(

certificates.map(c=>String(c.volunteerId?._id || c.volunteerId))

);

const rows=[];


/* ---------- Issued Certificates ---------- */

certificates.forEach(cert=>{

const volunteer = cert.volunteerId;
const event = cert.eventId;

rows.push({

status:"Issued",
name:volunteer?.fullName || "Unknown",
email:volunteer?.email || "-",
avatar:getAvatar(volunteer),
eventName:event?.title || "-",
date:cert.createdAt,
certificateId:cert._id

});

});


/* ---------- Pending Certificates ---------- */

registrations.forEach(reg=>{

if(reg.status !== "attended") return;

const volunteer = reg.volunteerId;

if(!volunteer) return;

if(issuedVolunteerIds.has(String(volunteer._id))) return;

rows.push({

status:"Pending",
name:volunteer.fullName,
email:volunteer.email,
avatar:getAvatar(volunteer),
eventName:reg.eventId?.title || "-",
date:reg.createdAt

});

});


/* ---------- Empty ---------- */

if(!rows.length){

tableBody.innerHTML=`
<tr>
<td colspan="6">No certificate records found</td>
</tr>
`;

return;

}

const hoverCard = document.getElementById("volunteerHoverCard");

function showHoverCard(e,row){

hoverCard.innerHTML = `
<img src="${row.avatar}">
<strong>${row.name}</strong>
<p>${row.email}</p>
<p>${row.eventName}</p>
`;

hoverCard.style.top = e.pageY + 10 + "px";
hoverCard.style.left = e.pageX + 10 + "px";

hoverCard.classList.remove("hidden");
}

function hideHoverCard(){
hoverCard.classList.add("hidden");
}
/* ---------- Stats ---------- */

const issuedCount = rows.filter(r=>r.status==="Issued").length;
const pendingCount = rows.filter(r=>r.status==="Pending").length;

totalCertificates.textContent = rows.length;
issuedCertificates.textContent = issuedCount;
pendingCertificates.textContent = pendingCount;

tableCountText.textContent=`Showing ${rows.length} certificates`;


/* ---------- Render Rows ---------- */

rows.forEach(row=>{

const tr=document.createElement("tr");

tr.innerHTML=`

<td>
<div class="person-cell"
onmouseenter="showHoverCard(event, ${JSON.stringify(row).replace(/"/g,'&quot;')})"
onmouseleave="hideHoverCard()">

<img class="avatar"
src="${row.avatar}"
onclick="openVolunteerModal('${row.email}')">

<span>${row.name}</span>

</div>
</td>

<td>${row.email}</td>

<td>${row.eventName}</td>

<td>${new Date(row.date).toLocaleDateString()}</td>

<td>
<span class="status-badge ${
row.status==="Issued" ? "status-issued" : "status-pending"
}">
${row.status}
</span>
</td>

<td>

${row.status==="Issued"

? `<button class="download-btn"
onclick="downloadCertificate('${row.certificateId}')">
Download
</button>`

: `<span class="text-muted">Waiting</span>`

}

</td>

`;

tableBody.appendChild(tr);

});

}


/* ---------------- DOWNLOAD ---------------- */

window.downloadCertificate=function(id){

window.open(
`${API_BASE}/certificates/download/${id}`,
"_blank"
);

};


/* ---------------- INIT ---------------- */

if(!eventId){

tableBody.innerHTML=`
<tr>
<td colspan="6">Event ID missing</td>
</tr>
`;

}else{

loadCertificates();

}