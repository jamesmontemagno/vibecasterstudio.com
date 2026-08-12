const conditionToggle = document.querySelector("#condition-toggle");
const instrument = document.querySelector(".hero-instrument");
const conditionLabel = document.querySelector("#condition-label");
const connectionState = document.querySelector("#connection-state");
const guestTrackState = document.querySelector("#guest-track-state");
const waterValue = document.querySelector("#water-value");

conditionToggle?.addEventListener("click", () => {
  const isRough = instrument.classList.toggle("is-rough");
  conditionToggle.setAttribute("aria-pressed", String(isRough));
  conditionToggle.textContent = isRough ? "Return to steady flow" : "Simulate rough weather";
  conditionLabel.textContent = isRough ? "Rough weather" : "Steady flow";
  connectionState.textContent = isRough ? "Connection: unstable" : "Connection: clear";
  guestTrackState.textContent = isRough ? "Local track protected" : "Local track secure";
  waterValue.textContent = isRough ? "03.8" : "01.4";
});

document.querySelector("#year").textContent = new Date().getFullYear();
