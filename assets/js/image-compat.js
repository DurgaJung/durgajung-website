(() => {
  "use strict";

  const attempted = new WeakSet();

  function jpegFallbackUrl(value) {
    if (!value) return null;
    const match = String(value).match(/^(.*)\.webp([?#].*)?$/i);
    if (!match) return null;
    return match[1] + ".jpg" + (match[2] || "");
  }

  function useJpegFallback(img) {
    if (!img || attempted.has(img)) return;
    const source = img.currentSrc || img.getAttribute("src") || "";
    const fallback = jpegFallbackUrl(source);
    if (!fallback) return;

    attempted.add(img);
    img.removeAttribute("srcset");
    img.src = fallback;
  }

  document.addEventListener("error", (event) => {
    const target = event.target;
    if (target && target.tagName === "IMG") {
      useJpegFallback(target);
    }
  }, true);

  window.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("img[src$='.webp'], img[src*='.webp?']").forEach((img) => {
      if (img.complete && img.naturalWidth === 0) {
        useJpegFallback(img);
      }
    });
  }, { once: true });
})();