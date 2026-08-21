document.addEventListener("DOMContentLoaded", function () {
  const actionCells = Array.from(document.querySelectorAll(".table-action-cell"));
  const filterButton = document.getElementById("filter-patients-button");
  const filterMenu = document.getElementById("filter-patients-menu");
  const filterOptions = Array.from(document.querySelectorAll(".filter-option"));
  const patientRows = Array.from(document.querySelectorAll(".patients-view .body .row, .patients-view .body .row-2"));

  function closeActionMenus() {
    actionCells.forEach(function (cell) {
      const menu = cell.querySelector(".action-menu");
      const trigger = cell.querySelector(".action-menu-trigger");
      if (!menu || !trigger) return;
      menu.setAttribute("hidden", "");
      trigger.setAttribute("aria-expanded", "false");
    });
  }

  function closeFilterMenu() {
    if (!filterMenu || !filterButton) return;
    filterMenu.setAttribute("hidden", "");
    filterButton.setAttribute("aria-expanded", "false");
  }

  function getRowRisk(row) {
    const riskBadge = row.querySelector(".background-wrapper");
    if (!riskBadge) return "";
    return riskBadge.textContent.trim().toLowerCase();
  }

  function applyFilter(filterKey) {
    patientRows.forEach(function (row) {
      const risk = getRowRisk(row);
      const visible = filterKey === "all" || risk.includes(filterKey);
      row.style.display = visible ? "" : "none";
    });

    filterOptions.forEach(function (option) {
      const isSelected = option.dataset.filter === filterKey;
      option.classList.toggle("is-selected", isSelected);
    });
  }

  actionCells.forEach(function (cell) {
    const trigger = cell.querySelector(".action-menu-trigger");
    const menu = cell.querySelector(".action-menu");
    if (!trigger || !menu) return;

    trigger.addEventListener("click", function (event) {
      event.stopPropagation();
      const isClosed = menu.hasAttribute("hidden");
      closeActionMenus();
      closeFilterMenu();

      if (isClosed) {
        menu.removeAttribute("hidden");
        trigger.setAttribute("aria-expanded", "true");
      }
    });
  });

  if (filterButton && filterMenu) {
    filterButton.addEventListener("click", function (event) {
      event.stopPropagation();
      const isClosed = filterMenu.hasAttribute("hidden");
      closeActionMenus();

      if (isClosed) {
        filterMenu.removeAttribute("hidden");
        filterButton.setAttribute("aria-expanded", "true");
      } else {
        closeFilterMenu();
      }
    });

    filterOptions.forEach(function (option) {
      option.addEventListener("click", function (event) {
        event.stopPropagation();
        const filterKey = option.dataset.filter || "all";
        applyFilter(filterKey);
        closeFilterMenu();
      });
    });

    applyFilter("all");
  }

  document.addEventListener("click", function () {
    closeActionMenus();
    closeFilterMenu();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeActionMenus();
      closeFilterMenu();
    }
  });
});
