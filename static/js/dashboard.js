document.addEventListener("DOMContentLoaded", function () {
  const NS = "http://www.w3.org/2000/svg";

  const iconMap = {
    "container-3.svg": {
      viewBox: "0 0 24 24",
      markup:
        "<rect x='3' y='3' width='8' height='8' rx='1.5'></rect><rect x='13' y='3' width='8' height='5' rx='1.5'></rect><rect x='13' y='10' width='8' height='11' rx='1.5'></rect><rect x='3' y='13' width='8' height='8' rx='1.5'></rect>"
    },
    "container-2.svg": {
      viewBox: "0 0 24 24",
      markup:
        "<circle cx='9' cy='8' r='3'></circle><circle cx='16.5' cy='9.5' r='2.5'></circle><path d='M3.5 18.5c0-3 2.7-5.5 6-5.5s6 2.5 6 5.5'></path><path d='M14 18.5c.2-1.9 1.8-3.4 3.8-3.4 1.2 0 2.3.5 3 1.3'></path>"
    },
    "container.svg": {
      viewBox: "0 0 24 24",
      markup:
        "<path d='M6 3.5h9l4 4V20a.5.5 0 0 1-.5.5h-12A.5.5 0 0 1 6 20z'></path><path d='M15 3.5V8h4'></path><path d='M8.5 12h7M8.5 15h7'></path>"
    },
    "vector.svg": {
      viewBox: "0 0 24 24",
      markup:
        "<path d='M9 6 3 12l6 6'></path><path d='M3 12h10'></path><path d='M14 5h4a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-4'></path>"
    },
    "vector-2.svg": {
      viewBox: "0 0 24 24",
      markup: "<path d='m9 6 6 6-6 6'></path>"
    },
    "check.png": {
      viewBox: "0 0 24 24",
      markup: "<path d='m6 12 4 4 8-8'></path>"
    },
    "image.png": {
      viewBox: "0 0 24 24",
      markup: "<path d='m6 12 4 4 8-8'></path>"
    },
    "check.svg": {
      viewBox: "0 0 24 24",
      markup: "<path d='m6 12 4 4 8-8'></path>"
    },
    "iconify-icon.svg": {
      viewBox: "0 0 24 24",
      markup:
        "<rect x='4' y='3' width='16' height='18' rx='2'></rect><path d='M8 7h8M8 11h2M14 11h2M8 15h2M14 15h2'></path>"
    },
    "vector-3.svg": {
      viewBox: "0 0 24 24",
      markup:
        "<circle cx='12' cy='12' r='9'></circle><path d='M12 10v6M12 7.5h.01'></path>"
    },
    "image.svg": {
      viewBox: "0 0 24 24",
      markup:
        "<rect x='6' y='4' width='12' height='16' rx='2'></rect><path d='M9 9h6M9 13h6M9 17h4'></path>"
    },
    "vector-4.svg": {
      viewBox: "0 0 24 24",
      markup:
        "<circle cx='12' cy='12' r='9'></circle><path d='m8 12 2.5 2.5 5.5-5.5'></path>"
    },
    "margin.svg": {
      viewBox: "0 0 24 24",
      markup:
        "<circle cx='12' cy='12' r='9'></circle><path d='m8 12 2.5 2.5 5.5-5.5'></path>"
    },
    "margin-2.svg": {
      viewBox: "0 0 24 24",
      markup:
        "<circle cx='12' cy='12' r='9'></circle><path d='M12 7v5l3 2'></path>"
    },
    "vector-5.svg": {
      viewBox: "0 0 24 24",
      markup: "<path d='M4 6h16'></path><path d='M7 11h10'></path><path d='M10 16h4'></path>"
    },
    "container-4.svg": {
      viewBox: "0 0 24 24",
      markup:
        "<circle cx='12' cy='12' r='9'></circle><path d='m8.5 12 2.5 2.5 4.5-4.5'></path>"
    },
    "container-5.svg": {
      viewBox: "0 0 24 24",
      markup: "<circle cx='12' cy='12' r='9'></circle><path d='M12 7v6M12 16.5h.01'></path>"
    },
    "container-6.svg": {
      viewBox: "0 0 24 24",
      markup: "<circle cx='12' cy='12' r='9'></circle><path d='M8 12h8'></path>"
    },
    "container-7.svg": {
      viewBox: "0 0 24 24",
      markup:
        "<circle cx='12' cy='12' r='9'></circle><path d='m8.5 12 2.5 2.5 4.5-4.5'></path>"
    },
    "data.svg": {
      viewBox: "0 0 24 24",
      markup:
        "<circle cx='7' cy='12' r='1.5'></circle><circle cx='12' cy='12' r='1.5'></circle><circle cx='17' cy='12' r='1.5'></circle>"
    },
    "data-2.svg": {
      viewBox: "0 0 24 24",
      markup:
        "<circle cx='7' cy='12' r='1.5'></circle><circle cx='12' cy='12' r='1.5'></circle><circle cx='17' cy='12' r='1.5'></circle>"
    },
    "data-3.svg": {
      viewBox: "0 0 24 24",
      markup:
        "<circle cx='7' cy='12' r='1.5'></circle><circle cx='12' cy='12' r='1.5'></circle><circle cx='17' cy='12' r='1.5'></circle>"
    },
    "data-4.svg": {
      viewBox: "0 0 24 24",
      markup:
        "<circle cx='7' cy='12' r='1.5'></circle><circle cx='12' cy='12' r='1.5'></circle><circle cx='17' cy='12' r='1.5'></circle>"
    },
    "data-5.svg": {
      viewBox: "0 0 24 24",
      markup:
        "<circle cx='7' cy='12' r='1.5'></circle><circle cx='12' cy='12' r='1.5'></circle><circle cx='17' cy='12' r='1.5'></circle>"
    }
  };

  function toSvg(className, iconDef) {
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", iconDef.viewBox || "0 0 24 24");
    svg.setAttribute("class", className + " icon-svg");
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML = iconDef.markup;
    return svg;
  }

  document.querySelectorAll("img[src^='img/']").forEach(function (img) {
    const src = img.getAttribute("src") || "";
    const fileName = src.split("/").pop();
    const iconDef = iconMap[fileName];
    if (!iconDef) return;
    const svg = toSvg(img.className, iconDef);
    img.replaceWith(svg);
  });

  const navItems = Array.from(document.querySelectorAll(".nav .link, .nav .div"));
  const navRoutes = {
    dashboard: "dashboard.html",
    patients: "patients.html",
    reports: "reports.html"
  };
  const currentPage = (window.location.pathname.split("/").pop() || "").toLowerCase();

  navItems.forEach(function (item) {
    item.classList.add("sidebar-link");
    item.setAttribute("role", "button");
    item.setAttribute("tabindex", "0");

    const navText = item.textContent.trim().toLowerCase();
    const route = navRoutes[navText];
    if (route && route.toLowerCase() === currentPage) {
      item.classList.add("is-active");
    }

    const activate = function () {
      const selectedRoute = navRoutes[navText];
      if (selectedRoute) {
        if (selectedRoute.toLowerCase() === currentPage) {
          navItems.forEach(function (el) {
            el.classList.remove("is-active");
          });
          item.classList.add("is-active");
          return;
        }

        window.location.href = selectedRoute;
        return;
      }

      navItems.forEach(function (el) {
        el.classList.remove("is-active");
      });
      item.classList.add("is-active");
    };

    item.addEventListener("click", activate);
    item.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activate();
      }
    });
  });

  function injectControl(selector, config) {
    const container = document.querySelector(selector);
    if (!container) return;
    container.innerHTML = "";

    if (config.type === "select") {
      const select = document.createElement("select");
      select.className = "control-input";
      if (config.name) {
        select.name = config.name;
      }

      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.disabled = true;
      placeholder.selected = true;
      placeholder.textContent = config.placeholder;
      select.appendChild(placeholder);

      config.options.forEach(function (optionLabel) {
        const option = document.createElement("option");
        option.value = config.values && config.values[optionLabel] ? config.values[optionLabel] : optionLabel.toLowerCase().replace(/\s+/g, "-");
        option.textContent = optionLabel;
        select.appendChild(option);
      });

      container.appendChild(select);
      return;
    }

    const input = document.createElement("input");
    input.className = "control-input";
    input.type = config.type || "text";
    if (config.name) {
      input.name = config.name;
    }
    input.placeholder = config.placeholder || "";
    container.appendChild(input);
  }

  const fields = [
    {
      selector: ".section .container-11 .patient-id-field .input",
      type: "text",
      name: "patient_id",
      placeholder: "NEO-2024-001"
    },
    {
      selector: ".section .container-11 .sex-field .input",
      type: "select",
      name: "sex",
      placeholder: "Select Sex",
      options: ["Male", "Female"],
      values: { Male: "male", Female: "female" }
    },
    {
      selector: ".section .container-11 .gestational-age-field .input",
      type: "number",
      name: "gestational_age_weeks",
      placeholder: "e.g. 38"
    },
    {
      selector: ".section .container-14 .birth-weight-field .input",
      type: "number",
      name: "birth_weight_g",
      placeholder: "e.g. 3200"
    },
    {
      selector: ".section .container-14 .delivery-mode-field .input",
      type: "select",
      name: "delivery_mode",
      placeholder: "Delivery Mode",
      options: ["Vaginal", "Cesarean"],
      values: { Vaginal: "vaginal", Cesarean: "cesarean" }
    },
    {
      selector: ".section-2 .container-15 .container-16:nth-child(1) .input-2",
      type: "number",
      name: "maternal_age_years",
      placeholder: "e.g. 29"
    },
    {
      selector: ".section-2 .container-15 .container-16:nth-child(2) .input-3",
      type: "select",
      name: "anc_4plus",
      placeholder: "ANC Visits",
      options: ["Yes", "No"],
      values: { Yes: "1", No: "0" }
    },
    {
      selector: ".section-3 .container-15 .container-19:nth-child(1) .input-2",
      type: "number",
      name: "age_at_onset_hours",
      placeholder: "Age (h)"
    },
    {
      selector: ".section-3 .container-15 .container-19:nth-child(2) .input-2",
      type: "number",
      name: "apgar_5min",
      placeholder: "APGAR score"
    },
    {
      selector: ".section-3 .clinical-comorbidity-field .input-3",
      type: "select",
      name: "comorbidity",
      placeholder: "Select (0/1)",
      options: ["0 = No", "1 = Yes"],
      values: { "0 = No": "0", "1 = Yes": "1" }
    },
    {
      selector: ".sections-side-by .section-4:nth-child(1) .container-22 .container-23:nth-child(1) .input-5",
      type: "number",
      name: "crp_mg_l",
      placeholder: "CRP (mg/L)"
    },
    {
      selector: ".sections-side-by .section-4:nth-child(1) .container-22 .container-23:nth-child(2) .input-5",
      type: "number",
      name: "wbc_count",
      placeholder: "WBC Count"
    },
    {
      selector: ".sections-side-by .section-4:nth-child(1) .container-25 .input-5",
      type: "number",
      name: "platelet_count",
      placeholder: "Platelet Count"
    },
    {
      selector: ".sections-side-by .section-4:nth-child(2) .container-22 .container-23:nth-child(1) .input-5",
      type: "number",
      name: "heart_rate_bpm",
      placeholder: "HR (bpm)"
    },
    {
      selector: ".sections-side-by .section-4:nth-child(2) .container-22 .container-23:nth-child(2) .input-5",
      type: "number",
      name: "temperature_c",
      placeholder: "Temp (C)"
    },
    {
      selector: ".sections-side-by .section-4:nth-child(2) .container-28 .container-23:nth-child(1) .input-5",
      type: "text",
      name: "blood_pressure",
      placeholder: "SBP / DBP"
    },
    {
      selector: ".sections-side-by .section-4:nth-child(2) .container-28 .container-23:nth-child(2) .input-5",
      type: "number",
      name: "oxygen_saturation_pct",
      placeholder: "O2 Sat (%)"
    },
    {
      selector: ".sections-side-by .section-4:nth-child(2) .container-25 .input-5",
      type: "number",
      name: "respiratory_rate_bpm",
      placeholder: "Resp Rate (/min)"
    },
    {
      selector: ".section-5 .treatment-central-line-field .input-3",
      type: "select",
      name: "central_venous_line",
      placeholder: "Select (0/1)",
      options: ["0 = No", "1 = Yes"],
      values: { "0 = No": "0", "1 = Yes": "1" }
    },
    {
      selector: ".section-5 .treatment-inotrope-field .input-3",
      type: "select",
      name: "inotrope",
      placeholder: "Select (0/1)",
      options: ["0 = No", "1 = Yes"],
      values: { "0 = No": "0", "1 = Yes": "1" }
    },
    {
      selector: ".section-5 .treatment-intubate-field .input-3",
      type: "select",
      name: "intubate",
      placeholder: "Select (0/1)",
      options: ["0 = No", "1 = Yes"],
      values: { "0 = No": "0", "1 = Yes": "1" }
    },
    {
      selector: ".section-5 .treatment-duration-field .input-2",
      type: "number",
      name: "duration_days",
      placeholder: "Duration (days)"
    }
  ];

  fields.forEach(function (field) {
    injectControl(field.selector, field);
  });

  function injectOptionControl(selector, placeholder, options, name) {
    const container = document.querySelector(selector);
    if (!container) return;
    container.innerHTML = "";

    const select = document.createElement("select");
    select.className = "control-input option-control";
    if (name) {
      select.name = name;
    }

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    defaultOption.textContent = placeholder;
    select.appendChild(defaultOption);

    options.forEach(function (optionLabel) {
      const option = document.createElement("option");
      option.value = optionLabel.toLowerCase() === "yes" ? "1" : "0";
      option.textContent = optionLabel;
      select.appendChild(option);
    });

    container.appendChild(select);
  }

  injectOptionControl(
    ".section-2 .container-15 .container-16:nth-child(3) .background-3",
    "Select",
    ["YES", "NO"],
    "prom_over_18h"
  );
  injectOptionControl(
    ".section-2 .container-15 .container-16:nth-child(4) .background-3",
    "Select",
    ["YES", "NO"],
    "maternal_fever"
  );

  const toggleConfigs = [
    {
      selector: ".label-3",
      name: "multiple_birth",
      checked: false,
      textClass: "text-8",
      text: "Multiple Birth"
    }
  ];

  toggleConfigs.forEach(function (config) {
    const row = document.querySelector(config.selector);
    if (!row) return;
    row.classList.add("check-label");
    row.innerHTML = "";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "switch-input checkbox-control";
    checkbox.name = config.name;
    checkbox.checked = config.checked;

    const text = document.createElement("span");
    text.className = config.textClass;
    text.textContent = config.text;

    row.appendChild(checkbox);
    row.appendChild(text);
  });

  function replaceCheckbox(box, name) {
    if (!box || box.tagName.toLowerCase() === "input") return;
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = box.className + " checkbox-control";
    checkbox.name = name;
    box.replaceWith(checkbox);
  }

  [
    [".section-2 .label-5:nth-child(1) .input-4", "maternal_uti"],
    [".section-2 .label-5:nth-child(2) .input-4", "chorioamnionitis"],
    [".section-2 .label-5:nth-child(3) .input-4", "maternal_hiv"],
    [".section-3 .label-7 .input-4", "poor_feeding"],
    [".section-3 .label-8 .input-4", "lethargy"],
    [".section-3 .label-9 .input-4", "convulsions"],
    [".section-3 .label-10 .input-4", "respiratory_distress"],
    [".section-3 .label-margin-2 .input-4", "jaundice"],
    [".section-3 .label-margin-3 .input-4", "bulging_fontanelle"],
    [".section-5 .label-14 .input-4", "phototherapy"]
  ].forEach(function (config) {
    replaceCheckbox(document.querySelector(config[0]), config[1]);
  });

  document.querySelectorAll(".input-7").forEach(function (box) {
    if (box.tagName.toLowerCase() === "input") return;
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "input-7 checkbox-control";
    checkbox.name = "oxygen_therapy";
    box.replaceWith(checkbox);
  });

  document.querySelectorAll(".check-2").forEach(function (icon) {
    icon.remove();
  });

  document.querySelectorAll(".label-13").forEach(function (label) {
    label.classList.add("check-row");
  });

  function updateRiskDonutFromText() {
    const donut = document.querySelector(".container-33");
    const probability = document.querySelector(".text-wrapper-45");
    if (!donut || !probability) return;

    const match = probability.textContent.match(/\d+(?:\.\d+)?/);
    if (!match) return;

    const percent = Math.max(0, Math.min(100, parseFloat(match[0])));
    donut.style.setProperty("--risk-percent", String(percent));
  }

  updateRiskDonutFromText();

  function collectPredictionPayload() {
    const payload = {};
    document.querySelectorAll("input[name], select[name]").forEach(function (control) {
      if (control.type === "checkbox") {
        payload[control.name] = control.checked ? 1 : 0;
        return;
      }
      payload[control.name] = control.value;
    });
    return payload;
  }

  function riskClass(label) {
    return String(label || "LOW RISK").replace(" RISK", "").toLowerCase();
  }

  function setText(selector, value) {
    const element = document.querySelector(selector);
    if (element) element.textContent = value;
  }

  function updateRecommendedActions(actions) {
    const slots = [".recommended-actions .text-26", ".recommended-actions .text-wrapper-50", ".recommended-actions .text-wrapper-51"];
    slots.forEach(function (selector, index) {
      setText(selector, actions[index] || "");
    });
  }

  function updatePredictionResult(prediction) {
    const label = prediction.risk_label || "LOW RISK";
    const percent = Number(prediction.probability_percent || 0).toFixed(1).replace(".0", "") + "%";
    const badge = document.querySelector(".background-7");
    if (badge) {
      badge.classList.remove("risk-high", "risk-moderate", "risk-low");
      badge.classList.add("risk-" + riskClass(label));
    }
    setText(".text-wrapper-44", label);
    setText(".text-25", prediction.result_title || "EOS Risk Prediction");
    setText(".text-wrapper-45", percent);
    setText(".based-on-clinical", "Residual ensemble output from dashboard-entered clinical values");
    const interpretation = document.querySelector(".strong-alert");
    if (interpretation) {
      interpretation.textContent = prediction.interpretation || "";
    }
    updateRecommendedActions(prediction.recommended_actions || []);
    updateRiskDonutFromText();
  }

  const calculateButton = document.getElementById("calculate-risk");
  if (calculateButton) {
    calculateButton.addEventListener("click", async function () {
      const originalLabel = calculateButton.querySelector(".text-wrapper-42")?.textContent || "CALCULATE RISK SCORE";
      calculateButton.disabled = true;
      setText(".text-wrapper-42", "GENERATING...");
      try {
        const response = await fetch("/api/predictions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(collectPredictionPayload())
        });
        const prediction = await response.json();
        if (!response.ok) {
          throw new Error(prediction.error || "Prediction request failed");
        }
        updatePredictionResult(prediction);
        if (window.PALSEState) {
          window.PALSEState.notify("prediction-created", prediction);
          window.PALSEState.refreshDashboardHistory().catch(function () {});
        }
      } catch (error) {
        setText(".based-on-clinical", error.message || "Unable to generate prediction");
      } finally {
        calculateButton.disabled = false;
        setText(".text-wrapper-42", originalLabel);
      }
    });
  }
});
