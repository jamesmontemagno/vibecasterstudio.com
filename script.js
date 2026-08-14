import { getVerifiedSignInUrl, launchConfig } from "./launch-config.js";

const conditionToggle = document.querySelector("#condition-toggle");
const instrument = document.querySelector(".hero-instrument");
const conditionLabel = document.querySelector("#condition-label");
const connectionState = document.querySelector("#connection-state");
const guestTrackState = document.querySelector("#guest-track-state");
const waterValue = document.querySelector("#water-value");
const signInUrl = getVerifiedSignInUrl(launchConfig);

function renderInvitedHostAccess(container, className = "") {
  if (!container || !signInUrl) {
    return;
  }

  const signInLink = document.createElement("a");
  signInLink.className = className;
  signInLink.href = signInUrl;
  signInLink.textContent = "Invited hosts: sign in";
  container.replaceChildren(signInLink);
}

renderInvitedHostAccess(document.querySelector("#header-access"), "button button-small");
renderInvitedHostAccess(document.querySelector("#primary-access"), "button hero-button");

conditionToggle?.addEventListener("click", () => {
  const isRough = instrument.classList.toggle("is-rough");
  conditionToggle.setAttribute("aria-pressed", String(isRough));
  conditionToggle.textContent = isRough ? "Return to steady flow" : "Simulate rough weather";
  conditionLabel.textContent = isRough ? "Changing condition" : "Example condition";
  connectionState.textContent = isRough ? "Illustrative condition: changing" : "Illustrative condition: steady";
  guestTrackState.textContent = isRough ? "Example: changing condition" : "Example: steady condition";
  waterValue.textContent = isRough ? "03.8" : "01.4";
});

document.querySelector("#year").textContent = new Date().getFullYear();
