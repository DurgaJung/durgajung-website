(() => {
  "use strict";

  document.documentElement.classList.add("js");


  /* =========================================================
     SITE LANGUAGE SWITCHER — English / Nepali
     ========================================================= */

  const siteLanguageStorageKey = "dj_site_language";

  const sharedPageNames = {
    "index.html": {
      en: "Home",
      np: "गृहपृष्ठ"
    },
    "about.html": {
      en: "About Me",
      np: "मेरो बारेमा"
    },
    "ministry.html": {
      en: "Ministry",
      np: "सेवकाई"
    },
    "books.html": {
      en: "Books & Translations",
      np: "पुस्तक तथा अनुवाद"
    },
    "sermons.html": {
      en: "Sermons",
      np: "प्रवचनहरू"
    },
    "software.html": {
      en: "Software Projects",
      np: "सफ्टवेयर परियोजनाहरू"
    },
    "gallery.html": {
      en: "Gallery",
      np: "ग्यालरी"
    },
    "contact.html": {
      en: "Contact",
      np: "सम्पर्क"
    }
  };

  function currentPageFile() {
    const path = window.location.pathname.replace(/\/+$/, "");
    const file = path.split("/").pop();
    return file || "index.html";
  }

  function safeStoredLanguage() {
    try {
      const value = localStorage.getItem(siteLanguageStorageKey);
      return value === "np" ? "np" : "en";
    } catch (error) {
      return "en";
    }
  }

  function storeLanguage(value) {
    try {
      localStorage.setItem(siteLanguageStorageKey, value);
    } catch (error) {
      // Language still works for this page if storage is unavailable.
    }
  }

  function setElementText(selector, value) {
    const element = document.querySelector(selector);
    if (element && typeof value === "string") {
      element.textContent = value;
    }
  }

  function setElementsText(selector, values) {
    const elements = document.querySelectorAll(selector);
    elements.forEach((element, index) => {
      if (typeof values[index] === "string") {
        element.textContent = values[index];
      }
    });
  }

  function translateNavigation(language) {
    document.querySelectorAll(".nav-links a").forEach((link) => {
      let file = "";

      try {
        file = new URL(link.href, window.location.href).pathname
          .split("/")
          .pop() || "index.html";
      } catch (error) {
        return;
      }

      const entry = sharedPageNames[file];
      if (entry) {
        link.textContent = entry[language];
      }
    });

    const menuButton = document.querySelector(".menu-btn");
    if (menuButton) {
      menuButton.setAttribute(
        "aria-label",
        language === "np" ? "मुख्य मेनु खोल्नुहोस्" : "Toggle navigation"
      );
    }
  }

  function translatePageHero(language) {
    const file = currentPageFile();
    const entry = sharedPageNames[file];
    const pageHeading = document.querySelector(".page-hero h1");
    const localSubtitle = document.querySelector(".page-hero .nepali");

    if (entry && pageHeading) {
      pageHeading.textContent = entry[language];
    }

    // The H1 itself becomes the selected language, so avoid duplicating
    // the same title underneath it.
    if (localSubtitle) {
      localSubtitle.hidden = true;
    }
  }

  function translateFooter(language) {
    const footer = document.querySelector(".site-footer");
    if (!footer) return;

    const rights = footer.querySelector(".rights");
    if (rights) {
      rights.textContent =
        language === "np"
          ? "© २०२६ दुर्गा जङ्ग कुँवर । सर्वाधिकार सुरक्षित ।"
          : "© 2026 Durga Jung Kunwar. All rights reserved.";
    }

    const footerLabels = {
      "ministry.html": {
        en: "Ministry",
        np: "सेवकाई"
      },
      "books.html": {
        en: "Translation",
        np: "अनुवाद"
      },
      "sermons.html": {
        en: "Sermons",
        np: "प्रवचनहरू"
      },
      "software.html": {
        en: "Software Projects",
        np: "सफ्टवेयर परियोजनाहरू"
      }
    };

    footer.querySelectorAll(".footer-nav a").forEach((link) => {
      let file = "";

      try {
        file = new URL(link.href, window.location.href).pathname
          .split("/")
          .pop();
      } catch (error) {
        return;
      }

      if (footerLabels[file]) {
        link.textContent = footerLabels[file][language];
      }
    });
  }

  function translateHomepage(language) {
    if (currentPageFile() !== "index.html") return;

    const heroLead = document.querySelector(".hero .lead");
    const heroNepali = document.querySelector(".hero p.nepali");

    setElementText(
      ".hero .eyebrow",
      language === "np" ? "आधिकारिक वेबसाइट" : "Official Website"
    );

    setElementText(
      ".hero h1",
      language === "np"
        ? "मेरो आधिकारिक वेबसाइटमा हार्दिक स्वागत छ"
        : "Welcome to My Official Website"
    );

    setElementText(
      ".hero h2",
      language === "np"
        ? "सेवकाई • बाइबल शिक्षण • अनुवाद • प्रविधि"
        : "Ministry • Bible Teaching • Translation • Technology"
    );

    if (heroLead) {
      heroLead.hidden = language === "np";
    }

    if (heroNepali) {
      heroNepali.hidden = language !== "np";
    }

    const heroActionLabels = language === "np"
      ? ["मेरो परिचय", "प्रवचनहरू हेर्नुहोस्"]
      : ["Read My Story", "Explore Sermons"];

    setElementsText(".hero-actions .btn", heroActionLabels);

    const focusLabels = language === "np"
      ? ["ख्रीष्टियन सेवकाई", "बाइबल शिक्षण", "पुस्तक तथा अनुवाद", "सफ्टवेयर विकास"]
      : ["Christian Ministry", "Bible Teaching", "Books & Translation", "Software Development"];

    setElementsText(".home-focus-pill", focusLabels);

    const sectionHeadings = language === "np"
      ? ["वेबसाइटका मुख्य खण्डहरू", "नयाँ जानकारी"]
      : ["Explore the Website", "Latest Updates"];

    const sectionSubs = language === "np"
      ? ["मुख्य सेवकाई तथा स्रोतहरू", "हालका सामग्री र परियोजनाहरू"]
      : ["Main areas and resources", "Recent resources and projects"];

    setElementsText(".section-head h2", sectionHeadings);
    setElementsText(".section-head .sub", sectionSubs);

    const featureHeadings = language === "np"
      ? ["सेवकाई", "पुस्तक तथा अनुवाद", "प्रवचनहरू", "सफ्टवेयर परियोजनाहरू"]
      : ["Ministry", "Books & Translations", "Sermons", "Software Projects"];

    const featureDescriptions = language === "np"
      ? [
          "शिक्षण, प्रचार र चेलापनमार्फत परमेश्वर र उहाँका जनहरूको सेवा ।",
          "विश्वासीहरूलाई सुदृढ पार्न विश्वसनीय अनुवाद तथा ख्रीष्टियन स्रोतहरू ।",
          "उत्साह, सुसज्जित र प्रेरित गर्ने बाइबलीय सन्देशहरू ।",
          "मण्डली तथा ख्रीष्टियन सेवकाईलाई सहयोग गर्ने उपयोगी सफ्टवेयर समाधानहरू ।"
        ]
      : [
          "Serving God and His people through teaching, preaching, and discipleship.",
          "Faithful translations and Christian resources to strengthen believers.",
          "Biblical messages to encourage, equip, and inspire.",
          "Innovative software solutions to support churches and Christian ministry."
        ];

    setElementsText(".feature-card h3", featureHeadings);
    setElementsText(".feature-card p", featureDescriptions);

    document.querySelectorAll(".feature-card .btn").forEach((button) => {
      button.textContent = language === "np" ? "थप हेर्नुहोस्" : "Learn More";
    });

    const updateHeadings = language === "np"
      ? ["नयाँ पुस्तक", "प्रवचन र बाइबल अध्ययन", "सफ्टवेयर परियोजनाहरू"]
      : ["Latest Book", "Sermons & Bible Studies", "Software Projects"];

    setElementsText(".update-card h3", updateHeadings);

    document.querySelectorAll(".update-card").forEach((card) => {
      const nepaliText = card.querySelector("p.nepali");
      const englishParagraphs = Array.from(
        card.querySelectorAll("p:not(.nepali)")
      ).filter((paragraph) => !paragraph.classList.contains("title-line"));

      if (nepaliText) {
        nepaliText.hidden = language !== "np";
      }

      englishParagraphs.forEach((paragraph) => {
        paragraph.hidden = language === "np";
      });

      const titleLine = card.querySelector(".title-line");
      if (titleLine) {
        titleLine.hidden = language === "np";
      }
    });

    const updateButtonLabels = language === "np"
      ? ["पुस्तक हेर्नुहोस्", "प्रवचनहरू", "परियोजनाहरू हेर्नुहोस्"]
      : ["View Book", "Sermons", "View Projects"];

    setElementsText(".update-card .btn", updateButtonLabels);
  }

  function translateEngagement(language) {
    const root = document.querySelector("[data-engagement-root]");
    if (!root) return;

    const mainTitle = root.querySelector("#engagement-title, .engagement-heading h2");
    if (mainTitle) {
      mainTitle.textContent =
        language === "np" ? "सम्पर्क र प्रतिक्रिया" : "Connect & Respond";
    }

    const intro = root.querySelector(".engagement-heading p");
    if (intro) {
      intro.textContent =
        language === "np"
          ? "यो पृष्ठ हेर्नुहोस्, मन पराउनुहोस्, टिप्पणी गर्नुहोस् वा साझा गर्नुहोस् ।"
          : "View, like, comment, or share this page.";
    }

    const labelMap = {
      Views: "हेराइ",
      Like: "मन पराउनुहोस्",
      Comments: "टिप्पणीहरू",
      Share: "साझा गर्नुहोस्"
    };

    root.querySelectorAll(".engagement-action-label").forEach((label) => {
      const english =
        label.dataset.englishLabel ||
        label.textContent.trim();

      if (!label.dataset.englishLabel) {
        label.dataset.englishLabel = english;
      }

      label.textContent =
        language === "np"
          ? (labelMap[english] || english)
          : english;
    });

    root.querySelectorAll("h3").forEach((heading) => {
      const english =
        heading.dataset.englishHeading ||
        heading.textContent.trim();

      if (!heading.dataset.englishHeading) {
        heading.dataset.englishHeading = english;
      }

      if (language === "np") {
        if (english === "Leave a Comment") {
          heading.textContent = "टिप्पणी लेख्नुहोस्";
        } else if (english === "Comments") {
          heading.textContent = "टिप्पणीहरू";
        }
      } else {
        heading.textContent = english;
      }
    });

    const submit = root.querySelector("#comment-submit");
    if (submit) {
      submit.textContent =
        language === "np" ? "टिप्पणी पठाउनुहोस्" : "Post Comment";
    }
  }

  function translateDataLanguage(language) {
    document.querySelectorAll("[data-en][data-np]").forEach((element) => {
      const value =
        language === "np"
          ? element.getAttribute("data-np")
          : element.getAttribute("data-en");

      if (value !== null) {
        element.textContent = value;
      }

      if (
        element.closest &&
        element.closest(".daily-verse-dialog-explanation")
      ) {
        element.setAttribute(
          "lang",
          language === "np" ? "ne" : "en"
        );
      }
    });

    const explanation =
      document.querySelector(".daily-verse-dialog-explanation");

    if (explanation) {
      explanation.dataset.language = language;
      explanation.setAttribute(
        "aria-label",
        language === "np"
          ? "आजको बाइबल पदको व्याख्या"
          : "Explanation of today's Bible verse"
      );
    }
  }

  function updateLanguageButtons(language) {
    document.querySelectorAll(".site-language-btn").forEach((button) => {
      const active = button.dataset.language === language;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function applySiteLanguage(language) {
    const normalized = language === "np" ? "np" : "en";

    document.documentElement.lang =
      normalized === "np" ? "ne" : "en";

    document.body.dataset.siteLanguage = normalized;

    translateNavigation(normalized);
    translatePageHero(normalized);
    translateFooter(normalized);
    translateHomepage(normalized);
    translateEngagement(normalized);
    translateDataLanguage(normalized);
    updateLanguageButtons(normalized);

    const file = currentPageFile();
    const pageName = sharedPageNames[file];

    if (pageName) {
      document.title =
        pageName[normalized] + " | Durga Jung Kunwar";
    }

    storeLanguage(normalized);
  }

  function createLanguageSwitcher() {
    const navWrap = document.querySelector(".nav-wrap");

    if (!navWrap || document.querySelector(".site-language-bar")) {
      return;
    }

    const bar = document.createElement("div");
    bar.className = "site-language-bar";

    bar.innerHTML = `
      <div class="container">
        <span class="site-language-label">Language</span>
        <div
          class="site-language-switcher"
          role="group"
          aria-label="Choose website language"
        >
          <button
            class="site-language-btn"
            type="button"
            data-language="en"
            aria-pressed="false"
          >English</button>
          <button
            class="site-language-btn"
            type="button"
            data-language="np"
            aria-pressed="false"
          >नेपाली</button>
        </div>
      </div>
    `;

    navWrap.parentNode.insertBefore(bar, navWrap);

    bar.querySelectorAll(".site-language-btn").forEach((button) => {
      button.addEventListener("click", () => {
        applySiteLanguage(button.dataset.language);
      });
    });
  }

  createLanguageSwitcher();

  const initialSiteLanguage = safeStoredLanguage();

  applySiteLanguage(initialSiteLanguage);

  // Some page widgets are prepared later in this file. Reapply once the
  // current event loop completes so dynamically prepared shared UI uses
  // the selected language as well.
  window.setTimeout(() => {
    applySiteLanguage(safeStoredLanguage());
  }, 0);

  /* =========================================================
     SUBTLE SCROLL REVEAL
     ========================================================= */

  function initializeRevealSections() {
    const sections = document.querySelectorAll(".reveal-section");

    if (!sections.length) {
      return;
    }

    const reducedMotion =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (
      reducedMotion ||
      !("IntersectionObserver" in window)
    ) {
      sections.forEach((section) => {
        section.classList.add("is-visible");
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries, activeObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add("is-visible");
          activeObserver.unobserve(entry.target);
        });
      },
      {
        rootMargin: "0px 0px -8% 0px",
        threshold: 0.08
      }
    );

    sections.forEach((section) => {
      observer.observe(section);
    });
  }

  initializeRevealSections();

  /* =========================================================
     MOBILE NAVIGATION
     ========================================================= */

  const menuButton = document.querySelector(".menu-btn");
  const navLinks = document.querySelector(".nav-links");

  if (menuButton && navLinks) {
    menuButton.addEventListener("click", () => {
      navLinks.classList.toggle("open");
      menuButton.setAttribute(
        "aria-expanded",
        String(navLinks.classList.contains("open"))
      );
    });

    document.querySelectorAll(".nav-links a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("open");
        menuButton.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* =========================================================
     SHARED HELPERS
     ========================================================= */

  function createVisitorKey() {
    if (
      window.crypto &&
      typeof window.crypto.randomUUID === "function"
    ) {
      return window.crypto.randomUUID();
    }

    return (
      "dj-" +
      Date.now() +
      "-" +
      Math.random().toString(36).slice(2) +
      "-" +
      Math.random().toString(36).slice(2)
    );
  }

  function getVisitorKey() {
    const storageKey = "dj_visitor_key";

    try {
      let visitorKey = localStorage.getItem(storageKey);

      if (!visitorKey) {
        visitorKey = createVisitorKey();
        localStorage.setItem(storageKey, visitorKey);
      }

      return visitorKey;
    } catch (error) {
      return createVisitorKey();
    }
  }

  const visitorKey = getVisitorKey();

  async function apiRequest(url, options = {}) {
    const requestOptions = {
      method: options.method || "GET",
      headers: {
        Accept: "application/json",
        ...(options.headers || {})
      }
    };

    if (options.body !== undefined) {
      requestOptions.headers["Content-Type"] = "application/json";
      requestOptions.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, requestOptions);

    let data;

    try {
      data = await response.json();
    } catch (error) {
      throw new Error("The server returned an invalid response.");
    }

    if (!response.ok || !data.success) {
      throw new Error(
        data.error ||
          data.message ||
          "The request could not be completed."
      );
    }

    return data;
  }

  function formatCommentDate(value) {
    if (!value) {
      return "";
    }

    try {
      const normalized = value.includes("T")
        ? value
        : value.replace(" ", "T") + "Z";

      const date = new Date(normalized);

      if (Number.isNaN(date.getTime())) {
        return value;
      }

      return date.toLocaleString();
    } catch (error) {
      return value;
    }
  }

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 72);
  }

  function sermonKeyFromPath(pathname) {
    const cleanPath = String(pathname || "")
      .split("?")[0]
      .split("#")[0];

    const fileName = cleanPath.split("/").pop() || "";
    const stem = fileName.replace(/\.html?$/i, "");

    if (/^sermon-[a-z0-9-]+$/i.test(stem)) {
      return stem.toLowerCase();
    }

    return "";
  }

  function currentSermonKey() {
    return sermonKeyFromPath(window.location.pathname);
  }

  function getBestPageTitle() {
    const heading =
      document.querySelector("main h1") ||
      document.querySelector("main h2") ||
      document.querySelector("h1") ||
      document.querySelector("h2");

    return (
      (heading && heading.textContent && heading.textContent.trim()) ||
      document.title ||
      "Sermon"
    );
  }

  function iconSvg(type) {
    const common =
      'viewBox="0 0 24 24" aria-hidden="true" focusable="false"';

    if (type === "views") {
      return (
        `<svg ${common}><path d="M2.4 12s3.5-6 9.6-6 9.6 6 9.6 6-3.5 6-9.6 6S2.4 12 2.4 12Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="2.7" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>`
      );
    }

    if (type === "like") {
      return (
        `<svg ${common}><path d="M7 10v10H4a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h3Z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 10 11 3a2.1 2.1 0 0 1 3.9 1.3L14.2 8H20a2 2 0 0 1 2 2.4l-1.5 7A3.2 3.2 0 0 1 17.4 20H7V10Z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>`
      );
    }

    if (type === "comments") {
      return (
        `<svg ${common}><path d="M21 11.5a8.3 8.3 0 0 1-9 8.2 9.3 9.3 0 0 1-3.6-.9L3 20l1.4-4.5A8.2 8.2 0 1 1 21 11.5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`
      );
    }

    return (
      `<svg ${common}><path d="M14 4h6v6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 14 20 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M20 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    );
  }

  function normalizeAbsoluteUrl(value) {
    try {
      return new URL(value, window.location.origin).href;
    } catch (error) {
      return window.location.href;
    }
  }

  function ensureShareChooserStyles() {
    if (document.getElementById("dj-share-chooser-styles")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "dj-share-chooser-styles";
    style.textContent = `
      .dj-share-backdrop{
        position:fixed;
        inset:0;
        z-index:99999;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:20px;
        background:rgba(15,23,42,.48);
        backdrop-filter:blur(4px);
      }

      .dj-share-dialog{
        width:min(520px,100%);
        max-height:min(88vh,720px);
        overflow:auto;
        border:1px solid rgba(148,163,184,.28);
        border-radius:22px;
        background:#ffffff;
        box-shadow:0 28px 80px rgba(15,23,42,.24);
        padding:22px;
      }

      .dj-share-head{
        display:flex;
        align-items:flex-start;
        justify-content:space-between;
        gap:16px;
        margin-bottom:18px;
      }

      .dj-share-title{
        margin:0;
        color:#111827;
        font-size:22px;
        line-height:1.2;
        font-weight:800;
      }

      .dj-share-subtitle{
        margin:5px 0 0;
        color:#6b7280;
        font-size:13px;
        line-height:1.45;
      }

      .dj-share-close{
        width:36px;
        height:36px;
        flex:0 0 36px;
        display:grid;
        place-items:center;
        border:1px solid #e5e7eb;
        border-radius:999px;
        background:#ffffff;
        color:#374151;
        font-size:22px;
        line-height:1;
        cursor:pointer;
      }

      .dj-share-grid{
        display:grid;
        grid-template-columns:repeat(4,minmax(0,1fr));
        gap:12px;
      }

      .dj-share-option{
        appearance:none;
        min-width:0;
        min-height:96px;
        display:flex;
        flex-direction:column;
        align-items:center;
        justify-content:center;
        gap:9px;
        border:1px solid #e5e7eb;
        border-radius:16px;
        background:#ffffff;
        color:#1f2937;
        padding:12px 8px;
        font:inherit;
        font-size:12px;
        font-weight:750;
        cursor:pointer;
        transition:transform .16s ease,box-shadow .16s ease,border-color .16s ease;
      }

      .dj-share-option:hover{
        transform:translateY(-2px);
        border-color:#cbd5e1;
        box-shadow:0 10px 24px rgba(15,23,42,.08);
      }

      .dj-share-option:focus-visible,
      .dj-share-close:focus-visible{
        outline:3px solid rgba(37,99,235,.28);
        outline-offset:2px;
      }

      .dj-share-icon{
        width:44px;
        height:44px;
        display:grid;
        place-items:center;
        border-radius:14px;
        font-size:20px;
        font-weight:900;
        color:#ffffff;
      }

      .dj-share-facebook{background:#1877f2;}
      .dj-share-whatsapp{background:#22c55e;}
      .dj-share-messenger{background:linear-gradient(135deg,#00b2ff,#7c3aed);}
      .dj-share-telegram{background:#229ed9;}
      .dj-share-email{background:#64748b;}
      .dj-share-copy{background:#334155;}
      .dj-share-more{background:#111827;}

      .dj-share-note{
        margin:16px 0 0;
        color:#6b7280;
        font-size:11.5px;
        line-height:1.5;
        text-align:center;
      }

      @media(max-width:560px){
        .dj-share-dialog{
          padding:18px;
          border-radius:18px;
        }

        .dj-share-grid{
          grid-template-columns:repeat(3,minmax(0,1fr));
          gap:9px;
        }

        .dj-share-option{
          min-height:88px;
          border-radius:14px;
          font-size:11px;
        }

        .dj-share-icon{
          width:40px;
          height:40px;
          border-radius:12px;
          font-size:18px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function openShareWindow(url) {
    const popup = window.open(
      url,
      "_blank",
      "noopener,noreferrer,width=760,height=680"
    );

    if (popup) {
      try {
        popup.opener = null;
      } catch (error) {
        // Ignore browsers that prevent access to opener.
      }
    }

    return popup;
  }

  /* =========================================================
     SERMON PAGE PREPARATION
     ========================================================= */

  function createFullSermonEngagementRoot() {
    const key = currentSermonKey();

    if (!key) {
      return null;
    }

    const existing = document.querySelector("[data-engagement-root]");

    if (existing) {
      existing.dataset.contentKey = key;
      existing.dataset.pagePath = window.location.pathname;
      existing.dataset.contentTitle = getBestPageTitle();
      existing.dataset.contentType = "sermon";
      existing.dataset.shareUrl = window.location.href;
      existing.dataset.recordView = "true";
      return existing;
    }

    const main = document.querySelector("main");

    if (!main) {
      return null;
    }

    const section = document.createElement("section");
    section.className = "engagement-section sermon-detail-engagement";
    section.dataset.engagementRoot = "";
    section.dataset.contentKey = key;
    section.dataset.pagePath = window.location.pathname;
    section.dataset.contentTitle = getBestPageTitle();
    section.dataset.contentType = "sermon";
    section.dataset.shareUrl = window.location.href;
    section.dataset.recordView = "true";
    section.dataset.engagementMode = "full";

    section.innerHTML = `
      <div class="container">
        <div class="engagement-card">
          <div class="engagement-heading">
            <h2>Connect &amp; Respond</h2>
            <p>View, like, comment, or share this sermon.</p>
          </div>
          ${engagementActionsMarkup("full")}
          ${engagementCommentPanelMarkup("full")}
        </div>
      </div>
    `;

    main.appendChild(section);
    return section;
  }

  function prepareExistingSermonsPageRoot() {
    const path = window.location.pathname.replace(/\/+$/, "") || "/";

    if (path !== "/sermons" && path !== "/sermons.html") {
      return;
    }

    document
      .querySelectorAll('[data-engagement-root][data-content-key="sermons"]')
      .forEach((root) => root.remove());
  }

  function engagementActionsMarkup(mode = "compact") {
    const isCompact = mode === "compact";

    return `
      <div class="engagement-actions ${isCompact ? "sermon-engagement-actions" : ""}" aria-label="Engagement">
        <div class="engagement-action engagement-action--views" data-engagement-action="views" aria-label="Views">
          <span class="engagement-icon">${iconSvg("views")}</span>
          <span class="engagement-action-label">Views</span>
          <span class="engagement-count" data-role="views-count">0</span>
        </div>

        <button class="engagement-action engagement-action--like" data-engagement-action="like" data-role="like-button" type="button" aria-pressed="false" aria-label="Like this sermon">
          <span class="engagement-icon">${iconSvg("like")}</span>
          <span class="engagement-action-label" data-role="like-label">Like</span>
          <span class="engagement-count" data-role="likes-count">0</span>
        </button>

        <button class="engagement-action engagement-action--comments" data-engagement-action="comments" data-role="comments-button" type="button" aria-label="Open comments">
          <span class="engagement-icon">${iconSvg("comments")}</span>
          <span class="engagement-action-label">Comments</span>
          <span class="engagement-count" data-role="comments-count">0</span>
        </button>

        <button class="engagement-action engagement-action--share" data-engagement-action="share" data-role="share-button" type="button" aria-label="Share this sermon">
          <span class="engagement-icon">${iconSvg("share")}</span>
          <span class="engagement-action-label">Share</span>
          <span class="engagement-count" data-role="shares-count">0</span>
        </button>
      </div>
    `;
  }

  function engagementCommentPanelMarkup(mode = "compact") {
    const compact = mode === "compact";

    return `
      <div class="engagement-body ${compact ? "sermon-comment-panel" : ""}" data-role="comment-panel" ${compact ? "hidden" : ""}>
        <p class="engagement-status" data-role="status" role="status" aria-live="polite" hidden></p>

        <div class="sermon-comment-panel-head">
          <h3>Comments</h3>
          ${
            compact
              ? '<button class="sermon-comment-close" data-role="comment-close" type="button" aria-label="Close comments">×</button>'
              : ""
          }
        </div>

        <form class="comment-form" data-role="comment-form">
          <div class="comment-form-grid">
            <div class="comment-field">
              <label>Name</label>
              <input data-role="commenter-name" name="commenter_name" type="text" maxlength="80" autocomplete="name" required>
            </div>

            <div class="comment-field">
              <label>Email <span class="muted">(optional)</span></label>
              <input data-role="commenter-email" name="commenter_email" type="email" maxlength="254" autocomplete="email">
            </div>

            <div class="comment-field full">
              <label>Comment</label>
              <textarea data-role="comment-text" name="comment_text" maxlength="2000" required></textarea>
              <p class="comment-help">Maximum 2,000 characters. Your email address is not displayed publicly.</p>
            </div>
          </div>

          <div class="comment-submit-row">
            <button class="btn gold" data-role="comment-submit" type="submit">Post Comment</button>
          </div>
        </form>

        <div class="engagement-comments-wrap">
          <div class="engagement-comments-title">
            <h3>Recent Comments</h3>
          </div>
          <div class="engagement-comments-list" data-role="comments-list" aria-live="polite">
            <p class="engagement-empty">Loading comments...</p>
          </div>
        </div>
      </div>
    `;
  }

  function addSermonEngagementToListing() {
    const path = window.location.pathname.replace(/\/+$/, "") || "/";

    if (path !== "/sermons" && path !== "/sermons.html") {
      return;
    }

    const sermonItems = [
      ...document.querySelectorAll("article.featured, .library article.card")
    ];

    sermonItems.forEach((article, index) => {
      if (article.querySelector("[data-engagement-root]")) {
        return;
      }

      const readLink = article.querySelector(
        'a[href^="/sermon-"][href$=".html"], a[href*="/sermon-"][href*=".html"]'
      );

      const titleElement = article.querySelector("h2, h3");
      const title =
        (titleElement && titleElement.textContent.trim()) ||
        `Sermon ${index + 1}`;

      let key = readLink
        ? sermonKeyFromPath(readLink.getAttribute("href"))
        : "";

      if (!key) {
        const titleSlug = slugify(title);
        key = titleSlug
          ? `sermon-${titleSlug}`
          : `sermon-item-${index + 1}`;
      }

      const targetPath = readLink
        ? new URL(readLink.getAttribute("href"), window.location.origin).pathname
        : `/sermons.html#${key}`;

      if (!readLink && !article.id) {
        article.id = key;
      }

      const shareUrl = normalizeAbsoluteUrl(targetPath);

      const root = document.createElement("div");
      root.className = "sermon-engagement";
      root.dataset.engagementRoot = "";
      root.dataset.contentKey = key;
      root.dataset.pagePath = targetPath;
      root.dataset.contentTitle = title;
      root.dataset.contentType = "sermon";
      root.dataset.shareUrl = shareUrl;
      root.dataset.recordView = "false";
      root.dataset.engagementMode = "compact";

      root.innerHTML = `
        ${engagementActionsMarkup("compact")}
        <p
          class="sermon-engagement-inline-status"
          data-role="inline-status"
          role="status"
          aria-live="polite"
          hidden
        ></p>
        ${engagementCommentPanelMarkup("compact")}
      `;

      article.appendChild(root);
    });
  }

  prepareExistingSermonsPageRoot();
  createFullSermonEngagementRoot();
  addSermonEngagementToListing();

  /* =========================================================
     ENGAGEMENT CONTROLLER
     Supports both legacy single-page markup and new sermon cards.
     ========================================================= */

  class EngagementController {
    constructor(root) {
      this.root = root;
      this.contentKey = (root.dataset.contentKey || "").trim();
      this.pagePath =
        (root.dataset.pagePath || "").trim() ||
        window.location.pathname ||
        "/";
      this.contentTitle =
        (root.dataset.contentTitle || "").trim() ||
        document.title ||
        this.contentKey;
      this.contentType =
        (root.dataset.contentType || "page").trim() || "page";
      this.shareUrl = normalizeAbsoluteUrl(
        (root.dataset.shareUrl || "").trim() || window.location.href
      );
      this.recordViewEnabled =
        String(root.dataset.recordView || "true").toLowerCase() !== "false";
      this.mode = (root.dataset.engagementMode || "full").trim();
      this.currentLiked = false;

      this.viewsCount = this.find(
        '[data-role="views-count"]',
        "#engagement-views"
      );
      this.likesCount = this.find(
        '[data-role="likes-count"]',
        "#engagement-likes"
      );
      this.commentsCount = this.find(
        '[data-role="comments-count"]',
        "#engagement-comments"
      );
      this.sharesCount = this.find(
        '[data-role="shares-count"]',
        "#engagement-shares"
      );

      this.likeButton = this.find(
        '[data-role="like-button"]',
        "#engagement-like-btn"
      );
      this.likeLabel = this.find(
        '[data-role="like-label"]',
        "#engagement-like-label"
      );
      this.commentsButton = this.find(
        '[data-role="comments-button"]',
        "#engagement-comments-btn"
      );
      this.shareButton = this.find(
        '[data-role="share-button"]',
        "#engagement-share-btn"
      );

      this.commentPanel = this.find('[data-role="comment-panel"]');
      this.commentClose = this.find('[data-role="comment-close"]');
      this.commentForm = this.find(
        '[data-role="comment-form"]',
        "#engagement-comment-form"
      );
      this.commenterName = this.find(
        '[data-role="commenter-name"]',
        "#commenter-name"
      );
      this.commenterEmail = this.find(
        '[data-role="commenter-email"]',
        "#commenter-email"
      );
      this.commentText = this.find(
        '[data-role="comment-text"]',
        "#comment-text"
      );
      this.commentSubmit = this.find(
        '[data-role="comment-submit"]',
        "#comment-submit"
      );
      this.commentsList = this.find(
        '[data-role="comments-list"]',
        "#engagement-comments-list"
      );
      this.statusMessage = this.find(
        '[data-role="status"]',
        "#engagement-status"
      );

      this.inlineStatusMessage = this.find(
        '[data-role="inline-status"]'
      );

      this.enhanceLegacyVisuals();
    }

    find(...selectors) {
      for (const selector of selectors) {
        if (!selector) {
          continue;
        }

        const element = this.root.querySelector(selector);

        if (element) {
          return element;
        }
      }

      return null;
    }

    payload() {
      return {
        content_key: this.contentKey,
        page_path: this.pagePath,
        title: this.contentTitle,
        content_type: this.contentType,
        visitor_key: visitorKey
      };
    }

    setStatus(message = "", type = "") {
      const targets = [
        this.statusMessage,
        this.inlineStatusMessage
      ].filter(Boolean);

      if (targets.length === 0) {
        return;
      }

      targets.forEach((target) => {
        target.textContent = message;
        target.dataset.state = type;
        target.hidden = !message;
      });
    }

    setCount(element, value) {
      if (!element) {
        return;
      }

      const number = Number(value || 0);
      element.textContent = Number.isFinite(number)
        ? number.toLocaleString()
        : "0";
    }

    enhanceLegacyVisuals() {
      const actionInfo = [
        [this.viewsCount, "views"],
        [this.likesCount, "like"],
        [this.commentsCount, "comments"],
        [this.sharesCount, "share"]
      ];

      actionInfo.forEach(([countElement, type]) => {
        if (!countElement) {
          return;
        }

        const action = countElement.closest(".engagement-action");

        if (!action) {
          return;
        }

        action.classList.add(`engagement-action--${type}`);
        action.dataset.engagementAction = type;

        const icon = action.querySelector(".engagement-icon");

        if (icon) {
          icon.innerHTML = iconSvg(type);
        }
      });
    }

    renderComments(comments) {
      if (!this.commentsList) {
        return;
      }

      this.commentsList.replaceChildren();

      if (!Array.isArray(comments) || comments.length === 0) {
        const empty = document.createElement("p");
        empty.className = "engagement-empty";
        empty.textContent =
          "No comments yet. Be the first to leave a comment.";

        this.commentsList.appendChild(empty);
        return;
      }

      comments.forEach((comment) => {
        const article = document.createElement("article");
        article.className = "public-comment";

        const avatar = document.createElement("div");
        avatar.className = "public-comment-avatar";
        avatar.setAttribute("aria-hidden", "true");
        avatar.textContent = String(
          comment.commenter_name || "V"
        )
          .trim()
          .charAt(0)
          .toUpperCase();

        const body = document.createElement("div");
        body.className = "public-comment-body";

        const header = document.createElement("div");
        header.className = "public-comment-head";

        const name = document.createElement("strong");
        name.className = "public-comment-name";
        name.textContent = comment.commenter_name || "Website Visitor";

        const time = document.createElement("time");
        time.className = "public-comment-date";
        time.textContent = formatCommentDate(comment.created_at);

        const text = document.createElement("p");
        text.className = "public-comment-text";
        text.textContent = comment.comment_text || "";

        header.appendChild(name);
        header.appendChild(time);
        body.appendChild(header);
        body.appendChild(text);

        article.appendChild(avatar);
        article.appendChild(body);

        this.commentsList.appendChild(article);
      });
    }

    render(data) {
      if (!data || !data.engagement) {
        return;
      }

      const engagement = data.engagement;

      this.setCount(this.viewsCount, engagement.views);
      this.setCount(this.likesCount, engagement.likes);
      this.setCount(this.commentsCount, engagement.comments);
      this.setCount(this.sharesCount, engagement.shares);

      this.currentLiked = Boolean(engagement.liked);

      if (this.likeButton) {
        this.likeButton.classList.toggle("is-liked", this.currentLiked);
        this.likeButton.setAttribute(
          "aria-pressed",
          String(this.currentLiked)
        );
      }

      if (this.likeLabel) {
        this.likeLabel.textContent = this.currentLiked ? "Liked" : "Like";
      }

      this.renderComments(data.comments || []);
    }

    async load() {
      const url =
        "/api/engagement?content_key=" +
        encodeURIComponent(this.contentKey) +
        "&visitor_key=" +
        encodeURIComponent(visitorKey);

      const data = await apiRequest(url);
      this.render(data);
      return data;
    }

    async recordView() {
      return apiRequest("/api/engagement/view", {
        method: "POST",
        body: this.payload()
      });
    }

    async toggleLike() {
      if (!this.likeButton || this.likeButton.disabled) {
        return;
      }

      const wasLiked = this.currentLiked;
      const nextLiked = !wasLiked;

      const previousCount = Number(
        String(this.likesCount ? this.likesCount.textContent : "0")
          .replace(/[^0-9.-]/g, "") || 0
      );

      const optimisticCount = Math.max(
        0,
        previousCount + (nextLiked ? 1 : -1)
      );

      this.likeButton.disabled = true;
      this.setStatus("");

      /* Show the requested state immediately. */
      this.currentLiked = nextLiked;

      this.likeButton.classList.toggle(
        "is-liked",
        nextLiked
      );

      this.likeButton.setAttribute(
        "aria-pressed",
        String(nextLiked)
      );

      if (this.likeLabel) {
        this.likeLabel.textContent =
          nextLiked ? "Liked" : "Like";
      }

      this.setCount(
        this.likesCount,
        optimisticCount
      );

      try {
        let result;

        if (wasLiked) {
          result = await apiRequest(
            "/api/engagement/like",
            {
              method: "DELETE",
              body: {
                content_key: this.contentKey,
                visitor_key: visitorKey
              }
            }
          );
        } else {
          result = await apiRequest(
            "/api/engagement/like",
            {
              method: "POST",
              body: this.payload()
            }
          );
        }

        /*
         * Do not depend on a particular server response field for
         * liked/unliked state. A successful request means the requested
         * action succeeded. Use the server count only when it is valid.
         */
        this.currentLiked = nextLiked;

        this.likeButton.classList.toggle(
          "is-liked",
          nextLiked
        );

        this.likeButton.setAttribute(
          "aria-pressed",
          String(nextLiked)
        );

        if (this.likeLabel) {
          this.likeLabel.textContent =
            nextLiked ? "Liked" : "Like";
        }

        const serverLikes = Number(result.likes);

        this.setCount(
          this.likesCount,
          Number.isFinite(serverLikes)
            ? serverLikes
            : optimisticCount
        );
      } catch (error) {
        /* Restore the old state only when the API request actually fails. */
        this.currentLiked = wasLiked;

        this.likeButton.classList.toggle(
          "is-liked",
          wasLiked
        );

        this.likeButton.setAttribute(
          "aria-pressed",
          String(wasLiked)
        );

        if (this.likeLabel) {
          this.likeLabel.textContent =
            wasLiked ? "Liked" : "Like";
        }

        this.setCount(
          this.likesCount,
          previousCount
        );

        this.setStatus(
          error.message ||
            "Unable to update your like.",
          "error"
        );

        console.error(
          `Like update failed for ${this.contentKey}:`,
          error
        );
      } finally {
        this.likeButton.disabled = false;
      }
    }

    openComments() {
      if (this.commentPanel) {
        this.commentPanel.hidden = false;
        this.commentPanel.classList.add("is-open");
      }

      const target = this.commentPanel || this.commentForm;

      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "nearest"
        });
      }

      window.setTimeout(() => {
        if (this.commenterName) {
          this.commenterName.focus();
        }
      }, 300);
    }

    closeComments() {
      if (!this.commentPanel) {
        return;
      }

      this.commentPanel.classList.remove("is-open");
      this.commentPanel.hidden = true;
    }

    async submitComment(event) {
      event.preventDefault();

      if (!this.commenterName || !this.commentText) {
        return;
      }

      const name = this.commenterName.value.trim();
      const email = this.commenterEmail
        ? this.commenterEmail.value.trim()
        : "";
      const text = this.commentText.value.trim();

      if (!name) {
        this.setStatus("Please enter your name.", "error");
        this.commenterName.focus();
        return;
      }

      if (!text) {
        this.setStatus("Please enter your comment.", "error");
        this.commentText.focus();
        return;
      }

      if (name.length > 80) {
        this.setStatus("Your name is too long.", "error");
        return;
      }

      if (email.length > 254) {
        this.setStatus("Your email address is too long.", "error");
        return;
      }

      if (text.length > 2000) {
        this.setStatus(
          "Your comment must be 2,000 characters or fewer.",
          "error"
        );
        return;
      }

      if (this.commentSubmit) {
        this.commentSubmit.disabled = true;
        this.commentSubmit.textContent = "Posting...";
      }

      this.setStatus("");

      try {
        await apiRequest("/api/engagement/comment", {
          method: "POST",
          body: {
            ...this.payload(),
            commenter_name: name,
            commenter_email: email,
            comment_text: text
          }
        });

        this.commentText.value = "";
        this.setStatus(
          "Thank you. Your comment has been posted.",
          "success"
        );

        await this.load();
      } catch (error) {
        this.setStatus(
          error.message || "Unable to post your comment.",
          "error"
        );
      } finally {
        if (this.commentSubmit) {
          this.commentSubmit.disabled = false;
          this.commentSubmit.textContent = "Post Comment";
        }
      }
    }

    async recordShare(shareType) {
      await apiRequest("/api/engagement/share", {
        method: "POST",
        body: {
          ...this.payload(),
          share_type: shareType
        }
      });
    }

    async copyShareLink() {
      if (
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        await navigator.clipboard.writeText(this.shareUrl);
        return;
      }

      const temporaryInput = document.createElement("textarea");
      temporaryInput.value = this.shareUrl;
      temporaryInput.setAttribute("readonly", "");
      temporaryInput.style.position = "fixed";
      temporaryInput.style.left = "-9999px";
      temporaryInput.style.top = "0";

      document.body.appendChild(temporaryInput);
      temporaryInput.select();

      const copied = document.execCommand("copy");
      temporaryInput.remove();

      if (!copied) {
        throw new Error("The page link could not be copied.");
      }
    }

    async completeShareAction(shareType, successMessage = "") {
      try {
        await this.recordShare(shareType);
        await this.load();

        if (successMessage) {
          this.setStatus(successMessage, "success");
        }
      } catch (error) {
        this.setStatus(
          error.message || "Unable to record this share.",
          "error"
        );
      }
    }

    openShareChooser() {
      if (!this.shareButton) {
        return;
      }

      ensureShareChooserStyles();
      this.setStatus("");

      document
        .querySelectorAll(".dj-share-backdrop")
        .forEach((item) => item.remove());

      const backdrop = document.createElement("div");
      backdrop.className = "dj-share-backdrop";

      const dialog = document.createElement("div");
      dialog.className = "dj-share-dialog";
      dialog.setAttribute("role", "dialog");
      dialog.setAttribute("aria-modal", "true");
      dialog.setAttribute("aria-label", "Share options");

      const head = document.createElement("div");
      head.className = "dj-share-head";

      const headingWrap = document.createElement("div");
      const title = document.createElement("h2");
      title.className = "dj-share-title";
      title.textContent = "Share";

      const subtitle = document.createElement("p");
      subtitle.className = "dj-share-subtitle";
      subtitle.textContent = this.contentTitle || "Choose where you want to share.";

      headingWrap.appendChild(title);
      headingWrap.appendChild(subtitle);

      const closeButton = document.createElement("button");
      closeButton.className = "dj-share-close";
      closeButton.type = "button";
      closeButton.setAttribute("aria-label", "Close share options");
      closeButton.textContent = "×";

      head.appendChild(headingWrap);
      head.appendChild(closeButton);

      const grid = document.createElement("div");
      grid.className = "dj-share-grid";

      const options = [
        ["facebook", "f", "Facebook", "dj-share-facebook"],
        ["whatsapp", "W", "WhatsApp", "dj-share-whatsapp"],
        ["messenger", "M", "Messenger", "dj-share-messenger"],
        ["telegram", "T", "Telegram", "dj-share-telegram"],
        ["email", "@", "Email", "dj-share-email"],
        ["copy_link", "⧉", "Copy link", "dj-share-copy"],
        ["native_share", "⋯", "More apps", "dj-share-more"]
      ];

      const closeChooser = () => {
        document.removeEventListener("keydown", onKeyDown);
        backdrop.remove();
        this.shareButton.focus();
      };

      const onKeyDown = (event) => {
        if (event.key === "Escape") {
          closeChooser();
        }
      };

      options.forEach(([platform, symbol, label, iconClass]) => {
        if (
          platform === "native_share" &&
          !(navigator.share && typeof navigator.share === "function")
        ) {
          return;
        }

        const button = document.createElement("button");
        button.className = "dj-share-option";
        button.type = "button";
        button.dataset.sharePlatform = platform;

        const icon = document.createElement("span");
        icon.className = `dj-share-icon ${iconClass}`;
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = symbol;

        const text = document.createElement("span");
        text.textContent = label;

        button.appendChild(icon);
        button.appendChild(text);

        button.addEventListener("click", async () => {
          button.disabled = true;

          const encodedUrl = encodeURIComponent(this.shareUrl);
          const encodedTitle = encodeURIComponent(this.contentTitle || "");
          const combinedText = encodeURIComponent(
            `${this.contentTitle || ""} ${this.shareUrl}`.trim()
          );

          try {
            if (platform === "facebook") {
              openShareWindow(
                `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
              );
              closeChooser();
              await this.completeShareAction(
                "facebook",
                "Facebook sharing opened."
              );
              return;
            }

            if (platform === "whatsapp") {
              openShareWindow(
                `https://wa.me/?text=${combinedText}`
              );
              closeChooser();
              await this.completeShareAction(
                "whatsapp",
                "WhatsApp sharing opened."
              );
              return;
            }

            if (platform === "telegram") {
              openShareWindow(
                `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`
              );
              closeChooser();
              await this.completeShareAction(
                "telegram",
                "Telegram sharing opened."
              );
              return;
            }

            if (platform === "email") {
              window.location.href =
                `mailto:?subject=${encodedTitle}&body=${combinedText}`;
              closeChooser();
              await this.completeShareAction(
                "email",
                "Email sharing opened."
              );
              return;
            }

            if (platform === "copy_link") {
              await this.copyShareLink();
              closeChooser();
              await this.completeShareAction(
                "copy_link",
                "Link copied."
              );
              return;
            }

            if (platform === "messenger") {
              if (
                navigator.share &&
                typeof navigator.share === "function"
              ) {
                try {
                  await navigator.share({
                    title: this.contentTitle,
                    text: this.contentTitle,
                    url: this.shareUrl
                  });
                } catch (error) {
                  if (error && error.name === "AbortError") {
                    button.disabled = false;
                    return;
                  }

                  throw error;
                }

                closeChooser();
                await this.completeShareAction(
                  "messenger",
                  "Sharing completed."
                );
                return;
              }

              await this.copyShareLink();
              openShareWindow("https://www.messenger.com/");
              closeChooser();
              await this.completeShareAction(
                "messenger",
                "Messenger opened."
              );
              return;
            }

            if (platform === "native_share") {
              try {
                await navigator.share({
                  title: this.contentTitle,
                  text: this.contentTitle,
                  url: this.shareUrl
                });
              } catch (error) {
                if (error && error.name === "AbortError") {
                  button.disabled = false;
                  return;
                }

                throw error;
              }

              closeChooser();
              await this.completeShareAction(
                "native_share",
                "Sharing completed."
              );
            }
          } catch (error) {
            button.disabled = false;
            this.setStatus(
              error.message || "Unable to share this content.",
              "error"
            );
          }
        });

        grid.appendChild(button);
      });

      const note = document.createElement("p");
      note.className = "dj-share-note";
      note.textContent =
        "Choose a platform. On supported phones and computers, More apps opens your system sharing menu.";

      dialog.appendChild(head);
      dialog.appendChild(grid);
      dialog.appendChild(note);
      backdrop.appendChild(dialog);
      document.body.appendChild(backdrop);

      closeButton.addEventListener("click", closeChooser);

      backdrop.addEventListener("click", (event) => {
        if (event.target === backdrop) {
          closeChooser();
        }
      });

      document.addEventListener("keydown", onKeyDown);

      const firstOption = grid.querySelector(".dj-share-option");
      if (firstOption) {
        firstOption.focus();
      }
    }

    share() {
      this.openShareChooser();
    }

    bindEvents() {
      if (this.commentsButton) {
        this.commentsButton.addEventListener("click", () =>
          this.openComments()
        );
      }

      if (this.commentClose) {
        this.commentClose.addEventListener("click", () =>
          this.closeComments()
        );
      }

      if (this.commentForm) {
        this.commentForm.addEventListener("submit", (event) =>
          this.submitComment(event)
        );
      }

      if (this.shareButton) {
        this.shareButton.addEventListener("click", () => this.share());
      }
    }

    async initialize() {
      if (!this.contentKey) {
        return;
      }

      this.bindEvents();
      this.setStatus("");

      if (this.recordViewEnabled) {
        try {
          await this.recordView();
        } catch (error) {
          console.warn(
            `View recording failed for ${this.contentKey}:`,
            error
          );
        }
      }

      try {
        await this.load();
      } catch (error) {
        this.setStatus(
          "Engagement information is temporarily unavailable.",
          "error"
        );
      }
    }
  }

  /* =========================================================
     START ALL ENGAGEMENT ROOTS
     ========================================================= */

  const engagementRoots = [
    ...document.querySelectorAll("[data-engagement-root]")
  ];

  const engagementControllerMap = new WeakMap();

  engagementRoots.forEach((root) => {
    const controller = new EngagementController(root);
    engagementControllerMap.set(root, controller);
    controller.initialize();
  });

  /*
   * Robust Like handling.
   * Use one document-level capture listener so the Like action still works
   * even if a sermon card or another page element has its own click handler.
   */
  document.addEventListener(
    "click",
    (event) => {
      const target =
        event.target instanceof Element
          ? event.target
          : event.target && event.target.parentElement;

      if (!target) {
        return;
      }

      const likeButton = target.closest(
        '[data-role="like-button"], #engagement-like-btn'
      );

      if (!likeButton) {
        return;
      }

      const root = likeButton.closest("[data-engagement-root]");

      if (!root) {
        return;
      }

      const controller = engagementControllerMap.get(root);

      if (!controller) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      controller.toggleLike();
    },
    true
  );
})();
