(function () {
  function getPrecision(step) {
    const stepText = String(step);
    if (!stepText.includes(".")) {
      return 0;
    }

    return stepText.split(".")[1].length;
  }

  document.addEventListener("click", function (event) {
    const button = event.target.closest(".stepper-button");
    if (!button) {
      return;
    }

    const control = button.closest(".field-control");
    if (!control) {
      return;
    }

    const input = control.querySelector('input[type="number"]');
    if (!input) {
      return;
    }

    const step = Number(input.step) || 1;
    const min = input.min === "" ? -Infinity : Number(input.min);
    const max = input.max === "" ? Infinity : Number(input.max);
    const isUp = button.classList.contains("stepper-up");

    let nextValue;

    if (input.value === "") {
      if (isUp) {
        nextValue = Number.isFinite(min) ? min : step;
      } else {
        nextValue = Number.isFinite(max) ? max : 0;
      }
    } else {
      nextValue = Number(input.value) + (isUp ? step : -step);
    }

    if (nextValue < min) {
      nextValue = min;
    }

    if (nextValue > max) {
      nextValue = max;
    }

    const precision = getPrecision(step);
    input.value = Number(nextValue).toFixed(precision);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    input.focus();
  });
})();
