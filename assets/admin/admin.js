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
  core.src = "/assets/admin/admin-core.js?v=20260910-1";
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
