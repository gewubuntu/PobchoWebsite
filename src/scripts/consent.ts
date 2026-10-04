// Cookie consent: Google Analytics is only loaded after the visitor accepts.
// The choice is stored in localStorage; "Cookie settings" in the footer reopens the banner.

import { site } from "../data/site";

type Choice = "granted" | "denied";

const KEY = "poncho-consent-v1";
const GA_ID = site.analyticsId;

function readChoice(): Choice | null {
  try {
    const value = localStorage.getItem(KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

function storeChoice(choice: Choice) {
  try {
    localStorage.setItem(KEY, choice);
  } catch {
    // Storage blocked: the choice applies to this page view only.
  }
}

let analyticsLoaded = false;

function loadAnalytics() {
  if (analyticsLoaded) return;
  analyticsLoaded = true;
  const w = window as unknown as { dataLayer: unknown[]; gtag: (...args: unknown[]) => void } & Record<string, unknown>;
  w[`ga-disable-${GA_ID}`] = false;
  w.dataLayer = w.dataLayer || [];
  w.gtag = function gtag() {
    // gtag.js expects the arguments object, not an array.
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer.push(arguments);
  };
  w.gtag("js", new Date());
  w.gtag("config", GA_ID);
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.append(script);
}

function disableAnalytics() {
  (window as unknown as Record<string, unknown>)[`ga-disable-${GA_ID}`] = true;
  // Remove cookies Google Analytics may already have set (_ga, _ga_<id>) on this host and its parent domain.
  const domains = ["", location.hostname, `.${location.hostname.replace(/^www\./, "")}`];
  for (const name of document.cookie.split(";").map((c) => c.split("=")[0]!.trim())) {
    if (!name.startsWith("_ga")) continue;
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ""}`;
    }
  }
}

export function initConsent() {
  const banner = document.querySelector<HTMLElement>("[data-consent]");
  if (!banner) return;

  const show = () => {
    banner.hidden = false;
    banner.querySelector<HTMLButtonElement>("[data-consent-choice]")?.focus({ preventScroll: true });
  };

  const apply = (choice: Choice) => {
    storeChoice(choice);
    banner.hidden = true;
    if (choice === "granted") loadAnalytics();
    else disableAnalytics();
  };

  banner.querySelectorAll<HTMLButtonElement>("[data-consent-choice]").forEach((button) => {
    button.addEventListener("click", () => apply(button.dataset.consentChoice as Choice));
  });

  document.addEventListener("click", (event) => {
    if ((event.target as Element | null)?.closest?.("[data-consent-open]")) {
      event.preventDefault();
      show();
    }
  });

  const choice = readChoice();
  if (choice === "granted") loadAnalytics();
  else if (choice === null) banner.hidden = false;
}
