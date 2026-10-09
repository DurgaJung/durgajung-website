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
        "lessons-from-the-lives-of-the-twelve-disciples-hi.png"
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

  function supportsWebP() {
    var canvas, data;
    try {
      canvas = document.createElement("canvas");
      if (!canvas.getContext || !canvas.getContext("2d")) return false;
      data = canvas.toDataURL("image/webp");
      return data.indexOf("data:image/webp") === 0;
    } catch (error) {
      return false;
    }
  }

  function checkImages() {
    var images = document.getElementsByTagName("img");
    var i, src, webpSupported = supportsWebP();

    for (i = 0; i < images.length; i += 1) {
      src = images[i].getAttribute("src") || "";
      if (/\\.webp([?#].*)?$/i.test(src) &&
          (!webpSupported || (images[i].complete && images[i].naturalWidth === 0))) {
        useJpegFallback(images[i]);
      }
    }
  }

  function supportsModernSyntax() {
    try {
      new Function("return (() => true)();");
      return true;
    } catch (error) {
      return false;
    }
  }

  function each(nodes, callback) {
    var i;
    for (i = 0; i < nodes.length; i += 1) callback(nodes[i], i);
  }

  function initLegacySiteControls() {
    var navWrap = document.querySelector(".nav-wrap");
    var navLinks = document.querySelector(".nav-links");
    var menuButton = document.querySelector(".menu-btn");
    var bar, buttons, links, filterButtons, sections, searchInput, activeLanguage;
    var navEnglish = ["Home", "About Me", "Ministry", "Books & Translations", "Sermons", "Software Projects", "Gallery", "Contact"];
    var navNepali = ["गृहपृष्ठ", "मेरो बारेमा", "सेवकाई", "पुस्तक तथा अनुवाद", "प्रवचनहरू", "सफ्टवेयर परियोजनाहरू", "ग्यालरी", "सम्पर्क"];

    if (menuButton && navLinks && !menuButton.getAttribute("data-legacy-ready")) {
      menuButton.setAttribute("data-legacy-ready", "1");
      menuButton.onclick = function () {
        var open = (" " + navLinks.className + " ").indexOf(" open ") !== -1;
        navLinks.className = open ? navLinks.className.replace(/\bopen\b/g, "") : navLinks.className + " open";
        menuButton.setAttribute("aria-expanded", open ? "false" : "true");
      };
      links = navLinks.getElementsByTagName("a");
      each(links, function (link) {
        link.onclick = function () {
          navLinks.className = navLinks.className.replace(/\bopen\b/g, "");
          menuButton.setAttribute("aria-expanded", "false");
        };
      });
    }

    if (navWrap && !document.querySelector(".site-language-bar")) {
      bar = document.createElement("div");
      bar.className = "site-language-bar legacy-language-bar";
      bar.innerHTML = '<div class="container"><span class="site-language-label">Language / भाषा</span> <button type="button" class="site-language-btn is-active" data-language="en">English</button> <button type="button" class="site-language-btn" data-language="np">नेपाली</button></div>';
      navWrap.parentNode.insertBefore(bar, navWrap);
      buttons = bar.getElementsByTagName("button");

      function applyLegacyLanguage(language) {
        var isNepali = language === "np";
        var pageFile = window.location.pathname.split("/").pop() || "index.html";
        var i, nodes, node, value;
        document.documentElement.lang = isNepali ? "ne" : "en";
        if (document.body) document.body.setAttribute("data-site-language", isNepali ? "np" : "en");
        try { window.localStorage.setItem("dj_site_language", isNepali ? "np" : "en"); } catch (ignore) {}
        each(buttons, function (button) {
          var active = button.getAttribute("data-language") === language;
          button.className = active ? "site-language-btn is-active" : "site-language-btn";
          button.setAttribute("aria-pressed", active ? "true" : "false");
        });
        links = document.querySelectorAll(".nav-links a");
        each(links, function (link, index) {
          if (index < navEnglish.length) link.textContent = isNepali ? navNepali[index] : navEnglish[index];
        });
        nodes = document.querySelectorAll("[data-en][data-np]");
        each(nodes, function (item) {
          value = item.getAttribute(isNepali ? "data-np" : "data-en");
          if (value !== null) item.textContent = value;
        });
        nodes = document.querySelectorAll("[data-lang-block]");
        each(nodes, function (item) {
          var blockLanguage = item.getAttribute("data-lang-block");
          item.style.display = (isNepali ? blockLanguage === "np" : blockLanguage === "en") ? "" : "none";
        });
        nodes = document.querySelectorAll(".about-nepali");
        each(nodes, function (item) { item.style.display = isNepali ? "" : "none"; });
        nodes = document.querySelectorAll(".about-english");
        each(nodes, function (item) { item.style.display = isNepali ? "none" : ""; });
        var pageHeadings = {
          "index.html": ["Home", "गृहपृष्ठ"],
          "about.html": ["About Me", "मेरो बारेमा"],
          "ministry.html": ["Ministry", "सेवकाई"],
          "books.html": ["Books & Translations", "पुस्तक तथा अनुवाद"],
          "sermons.html": ["Sermons", "प्रवचनहरू"],
          "software.html": ["Software Projects", "सफ्टवेयर परियोजनाहरू"],
          "gallery.html": ["Gallery", "ग्यालरी"],
          "contact.html": ["Contact", "सम्पर्क"]
        };
        var heading = document.querySelector(".page-hero h1");
        if (heading && pageHeadings[pageFile]) heading.textContent = pageHeadings[pageFile][isNepali ? 1 : 0];
        activeLanguage = isNepali ? "hindi" : "nepali";
        if (filterButtons && filterButtons.length) {
          activeLanguage = "nepali";
          applyBookFilters();
        }
      }

      each(buttons, function (button) {
        button.onclick = function () { applyLegacyLanguage(button.getAttribute("data-language")); };
      });
      var stored = "en";
      try { stored = window.localStorage.getItem("dj_site_language") === "np" ? "np" : "en"; } catch (ignore2) {}
      applyLegacyLanguage(stored);
    }

    filterButtons = document.querySelectorAll("[data-book-filter]");
    sections = document.querySelectorAll("[data-book-language]");
    searchInput = document.getElementById("book-catalog-search");
    if (filterButtons.length && sections.length) {
      activeLanguage = "nepali";
      function applyBookFilters() {
        var query = searchInput ? String(searchInput.value || "").toLowerCase() : "";
        var visible = 0;
        each(sections, function (section) {
          var matchesLanguage = section.getAttribute("data-book-language") === activeLanguage;
          var cards = section.querySelectorAll(".book-card");
          var sectionVisible = 0;
          each(cards, function (card) {
            var matchesQuery = !query || String(card.textContent || "").toLowerCase().indexOf(query) !== -1;
            card.style.display = matchesLanguage && matchesQuery ? "" : "none";
            if (matchesLanguage && matchesQuery) { visible += 1; sectionVisible += 1; }
          });
          section.style.display = matchesLanguage && sectionVisible ? "" : "none";
        });
        each(filterButtons, function (button) {
          var selected = button.getAttribute("data-book-filter") === activeLanguage;
          button.className = selected ? "is-active" : "";
          button.setAttribute("aria-pressed", selected ? "true" : "false");
        });
        var count = document.getElementById("book-search-count");
        if (count) count.textContent = visible + " books";
      }
      each(filterButtons, function (button) {
        button.onclick = function () {
          activeLanguage = button.getAttribute("data-book-filter");
          applyBookFilters();
        };
      });
      if (searchInput) searchInput.onkeyup = searchInput.oninput = applyBookFilters;
      applyBookFilters();
    }
  }

  function startLegacyControls() {
    if (!supportsModernSyntax()) {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initLegacySiteControls, false);
      } else {
        initLegacySiteControls();
      }
    }
  }

  if (document.addEventListener) {
    document.addEventListener("error", function (event) {
      var target = event.target || event.srcElement;
      if (target && String(target.tagName).toLowerCase() === "img") useJpegFallback(target);
    }, true);
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", checkImages, false);
    } else {
      checkImages();
    }
  } else if (window.attachEvent) {
    window.attachEvent("onload", checkImages);
  }

  startLegacyControls();
})();
