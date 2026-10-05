(() => {
  "use strict";

  const attempted = new WeakSet();

  function jpegFallbackUrl(value) {
    if (!value) return null;

    const source = String(value);

    if (/lessons-from-the-lives-of-the-twelve-disciples-hi-hd\.webp([?#].*)?$/i.test(source)) {
      return source.replace(
        /lessons-from-the-lives-of-the-twelve-disciples-hi-hd\.webp/i,
        "lessons-from-the-lives-of-the-twelve-disciples-hi.jpg"
      );
    }

    if (/verse-themes\/psalm-46-1-refuge\.webp([?#].*)?$/i.test(source)) {
      return source.replace(
        /psalm-46-1-refuge\.webp/i,
        "refuge.svg"
      );
    }

    const match = source.match(/^(.*)\.webp([?#].*)?$/i);
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