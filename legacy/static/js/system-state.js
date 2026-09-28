(function () {
  const channel = "BroadcastChannel" in window ? new BroadcastChannel("palse-updates") : null;

  function riskKey(label) {
    return String(label || "LOW").replace(" RISK", "").toLowerCase();
  }

  function pct(value) {
    return Number(value || 0).toFixed(1).replace(".0", "") + "%";
  }

  function formatDate(value) {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return "Now";
    return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  async function getJson(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Unable to load " + url);
    return response.json();
  }

  function notify(type, payload) {
    localStorage.setItem("palse:last-update", JSON.stringify({ type, at: Date.now(), payload }));
    if (channel) channel.postMessage({ type, payload });
  }

  function bindRefresh(callback) {
    if (channel) {
      channel.addEventListener("message", callback);
    }
    window.addEventListener("storage", function (event) {
      if (event.key === "palse:last-update") callback();
    });
  }

  function renderDashboardHistory(predictions) {
    const container = document.querySelector(".prediction-history .container-40");
    if (!container) return;
    container.classList.add("palse-history-list");
    if (!predictions.length) {
      container.innerHTML = "<div class='palse-history-head'><span>DATE</span><span>LEVEL</span><span>PROB</span></div><div class='palse-history-empty'>No predictions yet</div>";
      return;
    }
    container.innerHTML =
      "<div class='palse-history-head'><span>DATE</span><span>LEVEL</span><span>PROB</span></div>" +
      predictions.slice(0, 6).map(function (item) {
        const level = String(item.risk_label || "").replace(" RISK", "");
        return "<div class='palse-history-row'>" +
          "<div class='palse-history-date'>" + formatDate(item.created_at) + "</div>" +
          "<div class='palse-history-level " + riskKey(item.risk_label) + "'>" + escapeHtml(level) + "</div>" +
          "<div class='palse-history-prob'>" + pct(item.probability_percent) + "</div>" +
          "</div>";
      }).join("");
  }

  async function refreshDashboardHistory() {
    const data = await getJson("/api/predictions");
    renderDashboardHistory(data.predictions || []);
  }

  function renderPatients(patients) {
    const body = document.querySelector(".patients-view .body");
    if (!body) return;
    body.classList.add("palse-dynamic-body");
    body.innerHTML = "";
    if (!patients.length) {
      body.innerHTML = "<div class='palse-patient-empty'>No patients recorded yet.</div>";
    }
    patients.forEach(function (patient) {
      const row = document.createElement("div");
      const level = String(patient.latest_risk_label || "LOW RISK").replace(" RISK", "");
      row.className = "palse-patient-row";
      row.innerHTML =
        "<div>" + escapeHtml(patient.patient_id) + "</div>" +
        "<div>Newborn Patient</div>" +
        "<div>" + escapeHtml(patient.sex || "-") + "</div>" +
        "<div>" + escapeHtml(patient.gestational_age_weeks || "-") + "</div>" +
        "<div>" + escapeHtml(patient.birth_weight_g || "-") + "</div>" +
        "<div>" + escapeHtml(patient.age_at_onset_hours || "-") + "h</div>" +
        "<div><span class='palse-risk " + riskKey(patient.latest_risk_label) + "'>" + escapeHtml(level) + "</span></div>" +
        "<div>" + escapeHtml(patient.status || "Active") + "</div>" +
        "<div>" + formatDate(patient.created_at) + "</div>";
      body.appendChild(row);
    });
    const total = document.querySelector(".patients-view .background-border-3:nth-child(1) .text-4");
    const high = document.querySelector(".patients-view .background-border-3:nth-child(2) .text-6");
    const moderate = document.querySelector(".patients-view .background-border-3:nth-child(3) .text-8");
    if (total) total.textContent = String(patients.length);
    if (high) high.textContent = String(patients.filter((p) => riskKey(p.latest_risk_label) === "high").length);
    if (moderate) moderate.textContent = String(patients.filter((p) => riskKey(p.latest_risk_label) === "moderate").length);
  }

  async function refreshPatients() {
    const data = await getJson("/api/patients");
    renderPatients(data.patients || []);
  }

  function renderReports(reports) {
    const list = document.getElementById("reports-list");
    if (!list) return;
    if (!reports.length) {
      list.innerHTML = "<div class='empty-state'>No reports generated yet.</div>";
      return;
    }
    list.innerHTML = reports.map(function (report) {
      const level = String(report.risk_label || "").replace(" RISK", "");
      return "<article class='report-card'>" +
        "<h2 class='report-title'>" + escapeHtml(report.title) + "</h2>" +
        "<p class='report-meta'>Patient " + escapeHtml(report.patient_id) + " - " + formatDate(report.created_at) + "</p>" +
        "<p class='report-summary'>" + escapeHtml(report.summary) + "</p>" +
        "<span class='report-pill " + riskKey(report.risk_label) + "'>" + escapeHtml(level) + " - " + pct(report.probability_percent) + "</span>" +
        "</article>";
    }).join("");
  }

  async function refreshReports() {
    const data = await getJson("/api/reports");
    renderReports(data.reports || []);
  }

  window.PALSEState = {
    notify,
    bindRefresh,
    refreshDashboardHistory,
    refreshPatients,
    refreshReports
  };

  document.addEventListener("DOMContentLoaded", function () {
    if (document.querySelector(".prediction-history")) refreshDashboardHistory().catch(function () {});
    if (document.querySelector(".patients-view")) refreshPatients().catch(function () {});
    if (document.getElementById("reports-list")) refreshReports().catch(function () {});
    bindRefresh(function () {
      refreshDashboardHistory().catch(function () {});
      refreshPatients().catch(function () {});
      refreshReports().catch(function () {});
    });
  });
})();
