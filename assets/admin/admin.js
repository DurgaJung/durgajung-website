(() => {
  "use strict";

  /*
   * Permanent Admin API routing shim.
   *
   * Cloudflare Access protects /admin/*, while the existing Admin Control
   * Center code historically requests /api/admin/*. Requests to the latter
   * path do not reliably carry the Access identity, which causes browser
   * fetch failures. Keep the original admin application untouched in
   * admin-core.js and transparently route only admin API requests through
   * the protected /admin/api/* namespace.
   */

  const nativeFetch = window.fetch.bind(window);

  function protectedAdminUrl(value) {
    const url = new URL(value, window.location.href);

    if (
      url.origin === window.location.origin &&
      (
        url.pathname === "/api/admin" ||
        url.pathname.startsWith("/api/admin/")
      )
    ) {
      const suffix = url.pathname.slice("/api/admin".length);
      url.pathname = `/admin/api${suffix}`;
    }

    return url;
  }

  window.fetch = function adminProtectedFetch(input, init) {
    try {
      if (typeof input === "string" || input instanceof URL) {
        const url = protectedAdminUrl(String(input));
        return nativeFetch(url.toString(), init);
      }

      if (input instanceof Request) {
        const url = protectedAdminUrl(input.url);

        if (url.toString() !== input.url) {
          return nativeFetch(new Request(url.toString(), input), init);
        }
      }
    } catch (error) {
      console.error("Admin API route mapping failed:", error);
    }

    return nativeFetch(input, init);
  };

  const core = document.createElement("script");
  core.src = "/assets/admin/admin-core.js?v=20261005-4";
  core.async = false;
  core.dataset.adminCore = "true";

  core.addEventListener("error", () => {
    console.error("Admin core JavaScript failed to load.");

    const toast = document.getElementById("toast");
    if (toast) {
      toast.textContent = "Admin application failed to load. Please refresh the page.";
      toast.className = "toast error show";
    }
  });

  document.head.appendChild(core);
})();


/* ADMIN DAILY VERSE HEALTH */
(() => {
  "use strict";

  async function loadAdminDailyVerse() {
    const card = document.getElementById("dailyVerseAdminCard");
    if (!card) return;

    const health = document.getElementById("adminVerseHealth");
    const date = document.getElementById("adminVerseDate");
    const reference = document.getElementById("adminVerseReference");
    const text = document.getElementById("adminVerseText");
    const version = document.getElementById("adminVerseVersion");
    const image = document.getElementById("adminVerseImage");

    try {
      const response = await fetch("/assets/data/verse-of-day.json?ts=" + Date.now(), {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error("Verse data returned HTTP " + response.status);
      }

      const data = await response.json();
      const dateParts = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Bahrain",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).formatToParts(new Date());

      const part = (type) =>
        dateParts.find((item) => item.type === type)?.value || "";

      const today =
        part("year") + "-" +
        part("month") + "-" +
        part("day");

      const current = data.date === today;

      date.textContent = [data.ad_date, data.bs_date].filter(Boolean).join(" · ");
      reference.textContent = [data.reference, data.english_reference].filter(Boolean).join(" / ");
      text.textContent = data.verse || data.english_verse || "";
      version.textContent = [data.version, data.english_version].filter(Boolean).join(" / ");

      if (data.image) {
        image.src = data.image;
        image.alt = "Today's Verse of the Day image";
      }

      health.textContent = current ? "Published today" : "Needs update";
      health.className = "daily-verse-health " + (current ? "ok" : "stale");
    } catch (error) {
      console.error("Verse status check failed:", error);
      health.textContent = "Check failed";
      health.className = "daily-verse-health error";
      reference.textContent = "Could not read Verse of the Day data.";
      text.textContent = "";
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadAdminDailyVerse, { once: true });
  } else {
    loadAdminDailyVerse();
  }
})();
