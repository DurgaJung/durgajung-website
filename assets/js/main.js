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
     WEBSITE ENGAGEMENT
     Views + Likes + Comments + Shares
     ========================================================= */

  const engagementRoot = document.querySelector("[data-engagement-root]");

  if (!engagementRoot) {
    return;
  }

  const contentKey = (engagementRoot.dataset.contentKey || "").trim();
  const pagePath =
    (engagementRoot.dataset.pagePath || "").trim() ||
    window.location.pathname ||
    "/";
  const contentTitle =
    (engagementRoot.dataset.contentTitle || "").trim() ||
    document.title ||
    contentKey;
  const contentType =
    (engagementRoot.dataset.contentType || "page").trim() || "page";

  if (!contentKey) {
    return;
  }

  const viewsCount = document.getElementById("engagement-views");
  const likesCount = document.getElementById("engagement-likes");
  const commentsCount = document.getElementById("engagement-comments");
  const sharesCount = document.getElementById("engagement-shares");

  const likeButton = document.getElementById("engagement-like-btn");
  const likeLabel = document.getElementById("engagement-like-label");

  const commentsButton = document.getElementById(
    "engagement-comments-btn"
  );

  const shareButton = document.getElementById("engagement-share-btn");

  const commentForm = document.getElementById(
    "engagement-comment-form"
  );

  const commenterName = document.getElementById("commenter-name");
  const commenterEmail = document.getElementById("commenter-email");
  const commentText = document.getElementById("comment-text");
  const commentSubmit = document.getElementById("comment-submit");

  const commentsList = document.getElementById(
    "engagement-comments-list"
  );

  const statusMessage = document.getElementById(
    "engagement-status"
  );

  let currentLiked = false;

  /* =========================================================
     VISITOR KEY
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

  /* =========================================================
     GENERAL HELPERS
     ========================================================= */

  function engagementPayload() {
    return {
      content_key: contentKey,
      page_path: pagePath,
      title: contentTitle,
      content_type: contentType,
      visitor_key: visitorKey
    };
  }

  async function apiRequest(url, options = {}) {
    const requestOptions = {
      method: options.method || "GET",
      headers: {
        Accept: "application/json",
        ...(options.headers || {})
      }
    };

    if (options.body !== undefined) {
      requestOptions.headers["Content-Type"] =
        "application/json";

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

  function setStatus(message = "", type = "") {
    if (!statusMessage) {
      return;
    }

    statusMessage.textContent = message;
    statusMessage.dataset.state = type;
    statusMessage.hidden = !message;
  }

  function setCount(element, value) {
    if (!element) {
      return;
    }

    const number = Number(value || 0);
    element.textContent = Number.isFinite(number)
      ? number.toLocaleString()
      : "0";
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

  /* =========================================================
     COMMENT RENDERING
     ========================================================= */

  function renderComments(comments) {
    if (!commentsList) {
      return;
    }

    commentsList.replaceChildren();

    if (!Array.isArray(comments) || comments.length === 0) {
      const empty = document.createElement("p");
      empty.className = "engagement-empty";
      empty.textContent =
        "No comments yet. Be the first to leave a comment.";

      commentsList.appendChild(empty);
      return;
    }

    comments.forEach((comment) => {
      const article = document.createElement("article");
      article.className = "public-comment";

      const header = document.createElement("div");
      header.className = "public-comment-head";

      const name = document.createElement("strong");
      name.className = "public-comment-name";
      name.textContent =
        comment.commenter_name || "Website Visitor";

      const time = document.createElement("time");
      time.className = "public-comment-date";
      time.textContent = formatCommentDate(
        comment.created_at
      );

      const text = document.createElement("p");
      text.className = "public-comment-text";
      text.textContent = comment.comment_text || "";

      header.appendChild(name);
      header.appendChild(time);

      article.appendChild(header);
      article.appendChild(text);

      commentsList.appendChild(article);
    });
  }

  /* =========================================================
     ENGAGEMENT DISPLAY
     ========================================================= */

  function renderEngagement(data) {
    if (!data || !data.engagement) {
      return;
    }

    const engagement = data.engagement;

    setCount(viewsCount, engagement.views);
    setCount(likesCount, engagement.likes);
    setCount(commentsCount, engagement.comments);
    setCount(sharesCount, engagement.shares);

    currentLiked = Boolean(engagement.liked);

    if (likeButton) {
      likeButton.classList.toggle(
        "is-liked",
        currentLiked
      );

      likeButton.setAttribute(
        "aria-pressed",
        String(currentLiked)
      );
    }

    if (likeLabel) {
      likeLabel.textContent = currentLiked
        ? "Liked"
        : "Like";
    }

    renderComments(data.comments || []);
  }

  /* =========================================================
     LOAD CURRENT COUNTS
     ========================================================= */

  async function loadEngagement() {
    const url =
      "/api/engagement?content_key=" +
      encodeURIComponent(contentKey) +
      "&visitor_key=" +
      encodeURIComponent(visitorKey);

    const data = await apiRequest(url);

    renderEngagement(data);

    return data;
  }

  /* =========================================================
     RECORD PAGE VIEW
     Backend prevents the same visitor from being counted
     repeatedly within its configured time window.
     ========================================================= */

  async function recordView() {
    return apiRequest("/api/engagement/view", {
      method: "POST",
      body: engagementPayload()
    });
  }

  /* =========================================================
     LIKE / UNLIKE
     ========================================================= */

  async function toggleLike() {
    if (!likeButton || likeButton.disabled) {
      return;
    }

    likeButton.disabled = true;
    setStatus("");

    try {
      if (currentLiked) {
        await apiRequest("/api/engagement/like", {
          method: "DELETE",
          body: {
            content_key: contentKey,
            visitor_key: visitorKey
          }
        });
      } else {
        await apiRequest("/api/engagement/like", {
          method: "POST",
          body: engagementPayload()
        });
      }

      await loadEngagement();
    } catch (error) {
      setStatus(
        error.message || "Unable to update your like.",
        "error"
      );
    } finally {
      likeButton.disabled = false;
    }
  }

  if (likeButton) {
    likeButton.addEventListener("click", toggleLike);
  }

  /* =========================================================
     COMMENT BUTTON
     ========================================================= */

  if (commentsButton && commentForm) {
    commentsButton.addEventListener("click", () => {
      commentForm.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

      window.setTimeout(() => {
        if (commenterName) {
          commenterName.focus();
        }
      }, 450);
    });
  }

  /* =========================================================
     ADD COMMENT
     ========================================================= */

  if (commentForm) {
    commentForm.addEventListener(
      "submit",
      async (event) => {
        event.preventDefault();

        if (!commenterName || !commentText) {
          return;
        }

        const name = commenterName.value.trim();
        const email = commenterEmail
          ? commenterEmail.value.trim()
          : "";
        const text = commentText.value.trim();

        if (!name) {
          setStatus(
            "Please enter your name.",
            "error"
          );
          commenterName.focus();
          return;
        }

        if (!text) {
          setStatus(
            "Please enter your comment.",
            "error"
          );
          commentText.focus();
          return;
        }

        if (name.length > 80) {
          setStatus(
            "Your name is too long.",
            "error"
          );
          return;
        }

        if (email.length > 254) {
          setStatus(
            "Your email address is too long.",
            "error"
          );
          return;
        }

        if (text.length > 2000) {
          setStatus(
            "Your comment must be 2,000 characters or fewer.",
            "error"
          );
          return;
        }

        if (commentSubmit) {
          commentSubmit.disabled = true;
          commentSubmit.textContent = "Posting...";
        }

        setStatus("");

        try {
          await apiRequest(
            "/api/engagement/comment",
            {
              method: "POST",
              body: {
                ...engagementPayload(),
                commenter_name: name,
                commenter_email: email,
                comment_text: text
              }
            }
          );

          commentText.value = "";

          setStatus(
            "Thank you. Your comment has been posted.",
            "success"
          );

          await loadEngagement();
        } catch (error) {
          setStatus(
            error.message ||
              "Unable to post your comment.",
            "error"
          );
        } finally {
          if (commentSubmit) {
            commentSubmit.disabled = false;
            commentSubmit.textContent =
              "Post Comment";
          }
        }
      }
    );
  }

  /* =========================================================
     SHARE
     Mobile devices use the native share sheet when available.
     Desktop browsers copy the page link to the clipboard.
     A share is recorded only after the share/copy action succeeds.
     ========================================================= */

  async function recordShare(shareType) {
    await apiRequest("/api/engagement/share", {
      method: "POST",
      body: {
        ...engagementPayload(),
        share_type: shareType
      }
    });
  }

  async function copyPageLink() {
    const pageUrl = window.location.href;

    if (
      navigator.clipboard &&
      typeof navigator.clipboard.writeText ===
        "function"
    ) {
      await navigator.clipboard.writeText(pageUrl);
      return;
    }

    const temporaryInput =
      document.createElement("textarea");

    temporaryInput.value = pageUrl;
    temporaryInput.setAttribute(
      "readonly",
      ""
    );

    temporaryInput.style.position = "fixed";
    temporaryInput.style.left = "-9999px";
    temporaryInput.style.top = "0";

    document.body.appendChild(temporaryInput);

    temporaryInput.select();

    const copied = document.execCommand("copy");

    temporaryInput.remove();

    if (!copied) {
      throw new Error(
        "The page link could not be copied."
      );
    }
  }

  async function sharePage() {
    if (!shareButton || shareButton.disabled) {
      return;
    }

    shareButton.disabled = true;
    setStatus("");

    try {
      if (
        navigator.share &&
        typeof navigator.share === "function"
      ) {
        try {
          await navigator.share({
            title: contentTitle,
            url: window.location.href
          });

          await recordShare("native_share");

          setStatus(
            "Thank you for sharing this page.",
            "success"
          );
        } catch (error) {
          if (error && error.name === "AbortError") {
            return;
          }

          throw error;
        }
      } else {
        await copyPageLink();

        await recordShare("copy_link");

        setStatus(
          "Page link copied. You can now share it.",
          "success"
        );
      }

      await loadEngagement();
    } catch (error) {
      setStatus(
        error.message ||
          "Unable to share this page.",
        "error"
      );
    } finally {
      shareButton.disabled = false;
    }
  }

  if (shareButton) {
    shareButton.addEventListener("click", sharePage);
  }

  /* =========================================================
     INITIAL LOAD
     ========================================================= */

  async function initializeEngagement() {
    setStatus("");

    try {
      await recordView();
    } catch (error) {
      console.warn(
        "View recording failed:",
        error
      );
    }

    try {
      await loadEngagement();
    } catch (error) {
      setStatus(
        "Engagement information is temporarily unavailable.",
        "error"
      );
    }
  }

  initializeEngagement();
})();
