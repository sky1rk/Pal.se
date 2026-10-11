document.addEventListener("DOMContentLoaded", function () {
  if (window.PALSEState) {
    window.PALSEState.refreshReports().catch(function () {});
  }
});
