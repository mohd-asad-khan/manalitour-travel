// ===== CONFIG =====
// Put your WhatsApp number here with country code.
// Example: "+919876543210"
const BUSINESS_WHATSAPP = "+919927236252"; // TODO: replace with your real number

// ===== Helpers =====
const ls = {
  get: (key, fallback = []) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  },
  set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
  push: (key, obj) => { const arr = ls.get(key); arr.push(obj); ls.set(key, arr); }
};

const toCSV = (rows) => {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  rows.forEach(r => {
    const vals = headers.map(h => {
      const v = r[h] ?? "";
      const s = String(v).replace(/"/g,'""');
      return `"${s}"`;
    });
    lines.push(vals.join(","));
  });
  return lines.join("\n");
};

const download = (filename, content, mime="text/csv") => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const openWhatsApp = (text) => {
  const encoded = encodeURIComponent(text);
  const url = `https://wa.me/${BUSINESS_WHATSAPP.replace(/\+/g,"")}?text=${encoded}`;
  window.open(url, "_blank");
};

// ===== Forms =====
document.addEventListener("DOMContentLoaded", () => {
  const bookingForm = document.getElementById("booking-form");
  const contactForm = document.getElementById("contact-form");

  // FAB button
  const fab = document.getElementById("whatsapp-fab");
  fab.href = `https://wa.me/${BUSINESS_WHATSAPP.replace(/\+/g,"")}`;
  fab.addEventListener("click", (e) => {
    // Opens chat, no preset text
  });

  // Booking form
  bookingForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(bookingForm);
    const booking = {
      timestamp: new Date().toISOString(),
      name: formData.get("name"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      destination: formData.get("destination"),
      trip_date: formData.get("date"),
      guests: formData.get("guests"),
      notes: formData.get("notes") || ""
    };

    // Save locally
    ls.push("mtat_bookings", booking);

    // WhatsApp message
    const message =
      `New Booking Request (%0aManali Tour and Travels)%0a` +
      `Name: ${booking.name}%0a` +
      `Phone: ${booking.phone}%0a` +
      `Email: ${booking.email}%0a` +
      `Destination: ${booking.destination}%0a` +
      `Trip date: ${booking.trip_date}%0a` +
      `Guests: ${booking.guests}%0a` +
      `Notes: ${booking.notes}`;
    openWhatsApp(decodeURIComponent(message));

    bookingForm.reset();
    alert("Booking submitted! WhatsApp will open to send details.");
    renderTables();
  });

  // Contact form
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(contactForm);
    const msg = {
      timestamp: new Date().toISOString(),
      name: formData.get("name"),
      email: formData.get("email"),
      message: formData.get("message")
    };

    ls.push("mtat_messages", msg);

    const text =
      `New Message (%0aManali Tour and Travels)%0a` +
      `Name: ${msg.name}%0a` +
      `Email: ${msg.email}%0a` +
      `Message: ${msg.message}`;
    openWhatsApp(decodeURIComponent(text));

    contactForm.reset();
    alert("Message submitted! WhatsApp will open to send details.");
    renderTables();
  });

  // Admin actions
  document.getElementById("export-bookings").addEventListener("click", () => {
    const rows = ls.get("mtat_bookings");
    const csv = toCSV(rows);
    download("bookings.csv", csv);
  });
  document.getElementById("export-messages").addEventListener("click", () => {
    const rows = ls.get("mtat_messages");
    const csv = toCSV(rows);
    download("messages.csv", csv);
  });
  document.getElementById("clear-data").addEventListener("click", () => {
    if (confirm("Clear all local bookings and messages?")) {
      localStorage.removeItem("mtat_bookings");
      localStorage.removeItem("mtat_messages");
      renderTables();
    }
  });

  // Initial render
  renderTables();
});

// ===== Tables =====
function renderTables() {
  const bookings = ls.get("mtat_bookings");
  const messages = ls.get("mtat_messages");

  const bt = document.querySelector("#bookings-table tbody");
  const mt = document.querySelector("#messages-table tbody");
  bt.innerHTML = "";
  mt.innerHTML = "";

  bookings.forEach(b => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${formatDT(b.timestamp)}</td>
      <td>${escapeHTML(b.name)}</td>
      <td>${escapeHTML(b.phone)}</td>
      <td>${escapeHTML(b.email)}</td>
      <td>${escapeHTML(b.destination)}</td>
      <td>${escapeHTML(b.trip_date)}</td>
      <td>${escapeHTML(b.guests)}</td>
      <td>${escapeHTML(b.notes)}</td>
    `;
    bt.appendChild(tr);
  });

  messages.forEach(m => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${formatDT(m.timestamp)}</td>
      <td>${escapeHTML(m.name)}</td>
      <td>${escapeHTML(m.email)}</td>
      <td>${escapeHTML(m.message)}</td>
    `;
    mt.appendChild(tr);
  });
}

function formatDT(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch { return iso; }
}

function escapeHTML(str) {
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
document.getElementById("pay-button").addEventListener("click", function () {
  var options = {
    "key": "rzp_test_1234567890abcdef", // Replace with your Razorpay Key ID
    "amount": 100000, // Amount in paise (1000 INR = 100000 paise)
    "currency": "INR",
    "name": "Manali Tour and Travels",
    "description": "Trip Booking Advance",
    "image": "https://source.unsplash.com/100x100/?mountain", // optional logo
    "handler": function (response) {
      alert("Payment successful! Payment ID: " + response.razorpay_payment_id);
    },
    "prefill": {
      "name": "Customer Name",
      "email": "customer@example.com",
      "contact": "9999999999"
    },
    "theme": {
      "color": "#2c3e50"
    }
  };
  var rzp1 = new Razorpay(options);
  rzp1.open();
});