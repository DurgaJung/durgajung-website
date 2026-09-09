(() => {
  "use strict";

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
      .slice(0, 90);
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
      if (!this.statusMessage) {
        return;
      }

      this.statusMessage.textContent = message;
      this.statusMessage.dataset.state = type;
      this.statusMessage.hidden = !message;
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

    async share() {
      if (!this.shareButton || this.shareButton.disabled) {
        return;
      }

      this.shareButton.disabled = true;
      this.setStatus("");

      try {
        if (
          navigator.share &&
          typeof navigator.share === "function"
        ) {
          try {
            await navigator.share({
              title: this.contentTitle,
              url: this.shareUrl
            });

            await this.recordShare("native_share");
            this.setStatus("Thank you for sharing.", "success");
          } catch (error) {
            if (error && error.name === "AbortError") {
              return;
            }

            throw error;
          }
        } else {
          await this.copyShareLink();
          await this.recordShare("copy_link");
          this.setStatus(
            "Link copied. You can now share it.",
            "success"
          );
        }

        await this.load();
      } catch (error) {
        this.setStatus(
          error.message || "Unable to share this content.",
          "error"
        );
      } finally {
        this.shareButton.disabled = false;
      }
    }

    bindEvents() {
      if (this.likeButton) {
        this.likeButton.addEventListener("click", () =>
          this.toggleLike()
        );
      }

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

  engagementRoots.forEach((root) => {
    const controller = new EngagementController(root);
    controller.initialize();
  });
})();
