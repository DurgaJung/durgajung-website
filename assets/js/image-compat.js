(function () {
  "use strict";

  /*
   * Legacy Safari compatibility:
   * iPad 2 is limited to iOS 9.3.x, whose Safari cannot decode WebP.
   * Keep this file ES5-only so the fallback itself runs on older iPads.
   */
  var attempted = [];

  function hasAttempted(img) {
    var i;
    for (i = 0; i < attempted.length; i += 1) {
      if (attempted[i] === img) return true;
    }
    return false;
  }

  function jpegFallbackUrl(value) {
    var source, match;

    if (!value) return null;
    source = String(value);

    if (/lessons-from-the-lives-of-the-twelve-disciples-hi-hd\.webp([?#].*)?$/i.test(source)) {
      return source.replace(
        /lessons-from-the-lives-of-the-twelve-disciples-hi-hd\.webp/i,
        "lessons-from-the-lives-of-the-twelve-disciples-hi.jpg"
      );
    }

    if (/verse-themes\/psalm-46-1-refuge\.webp([?#].*)?$/i.test(source)) {
      return source.replace(/psalm-46-1-refuge\.webp/i, "refuge.svg");
    }

    match = source.match(/^(.*)\.webp([?#].*)?$/i);
    if (!match) return null;
    return match[1] + ".jpg" + (match[2] || "");
  }

  function useJpegFallback(img) {
    var source, fallback;

    if (!img || hasAttempted(img)) return;

    source = img.getAttribute("src") || "";
    if (img.currentSrc && /\.webp([?#].*)?$/i.test(img.currentSrc)) {
      source = img.currentSrc;
    }

    fallback = jpegFallbackUrl(source);
    if (!fallback) return;

    attempted.push(img);
    img.removeAttribute("srcset");
    img.removeAttribute("sizes");
    img.setAttribute("src", fallback);
  }

  function checkImages() {
    var images = document.getElementsByTagName("img");
    var i, src;

    for (i = 0; i < images.length; i += 1) {
      src = images[i].getAttribute("src") || "";
      if (/\.webp([?#].*)?$/i.test(src) &&
          images[i].complete && images[i].naturalWidth === 0) {
        useJpegFallback(images[i]);
      }
    }
  }

  if (document.addEventListener) {
    document.addEventListener("error", function (event) {
      var target = event.target || event.srcElement;
      if (target && String(target.tagName).toLowerCase() === "img") {
        useJpegFallback(target);
      }
    }, true);

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", checkImages, false);
    } else {
      checkImages();
    }
  } else if (window.attachEvent) {
    window.attachEvent("onload", checkImages);
  }
})();