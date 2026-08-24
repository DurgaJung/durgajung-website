(() => {
  "use strict";

  const targets = [
    ["Home", "/"], ["About", "/about.html"], ["Ministry", "/ministry.html"],
    ["Books", "/books.html"], ["Sermons", "/sermons.html"],
    ["Software", "/software.html"], ["Gallery", "/gallery.html"], ["Contact", "/contact.html"]
  ].map(([name, path]) => ({ name, path }));

  const $ = (id) => document.getElementById(id);
  const navItems = [...document.querySelectorAll(".nav-item[data-section]")];
  const sections = [...document.querySelectorAll(".admin-section")];
  const sidebar = $("sidebar");
  const menuToggle = $("menuToggle");

  function showSection(name) {
    const target = $(`section-${name}`);
    if (!target) return;
    navItems.forEach((item) => item.classList.toggle("active", item.dataset.section === name));
    sections.forEach((section) => section.classList.toggle("active", section === target));
    sidebar?.classList.remove("open");
    menuToggle?.setAttribute("aria-expanded", "false");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  navItems.forEach((item) => item.addEventListener("click", () => showSection(item.dataset.section)));
  menuToggle?.addEventListener("click", () => {
    const open = sidebar?.classList.toggle("open") ?? false;
    menuToggle.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("click", (event) => {
    if (window.innerWidth <= 820 && sidebar?.classList.contains("open") && !sidebar.contains(event.target) && !menuToggle?.contains(event.target)) {
      sidebar.classList.remove("open");
      menuToggle?.setAttribute("aria-expanded", "false");
    }
  });

  function updateClock() {
    const now = new Date();
    if ($("currentDate")) $("currentDate").textContent = new Intl.DateTimeFormat(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" }).format(now);
    if ($("currentTime")) $("currentTime").textContent = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(now);
  }

  function updateConnection() {
    const node = $("browserConnection");
    if (!node) return;
    node.textContent = navigator.onLine ? "Browser online" : "Browser offline";
    node.classList.toggle("online", navigator.onLine);
    node.classList.toggle("offline", !navigator.onLine);
  }

  async function checkTarget(target) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const start = performance.now();
    try {
      const response = await fetch(target.path, { method: "GET", cache: "no-store", credentials: "same-origin", signal: controller.signal });
      return { ...target, ok: response.ok, code: response.status, latency: Math.max(1, Math.round(performance.now() - start)) };
    } catch (error) {
      return { ...target, ok: false, code: error.name === "AbortError" ? "TIMEOUT" : "ERR", latency: null };
    } finally {
      clearTimeout(timeout);
    }
  }

  const badge = (result) => `<span class="health-state ${result.ok ? "ok" : "bad"}">${result.ok ? "ONLINE" : "CHECK"}</span>`;
  async function runHealthChecks() {
    const list = $("dashboardHealthList");
    const body = $("healthTableBody");
    if (list) list.innerHTML = '<div class="health-item"><span class="health-name">Running checks…</span><span></span><span class="health-state">WAIT</span></div>';
    if (body) body.innerHTML = '<tr><td colspan="4">Running health checks…</td></tr>';
    const results = await Promise.all(targets.map(checkTarget));
    if (list) list.innerHTML = results.slice(0, 5).map((r) => `<div class="health-item"><span class="health-name">${r.name}</span><span class="health-latency">${r.latency ? `${r.latency} ms` : "—"}</span>${badge(r)}</div>`).join("");
    if (body) body.innerHTML = results.map((r) => `<tr><td><strong>${r.name}</strong></td><td><code>${r.path}</code></td><td>${badge(r)} <small>${r.code}</small></td><td>${r.latency ? `${r.latency} ms` : "—"}</td></tr>`).join("");
    const home = results[0];
    const status = $("mainSiteStatus");
    if (status) { status.textContent = home.ok ? "ONLINE" : "CHECK REQUIRED"; status.classList.toggle("down", !home.ok); }
    if ($("mainSiteLatency")) $("mainSiteLatency").textContent = home.ok ? `Home responded in about ${home.latency} ms` : `Homepage check returned ${home.code}`;
  }

  $("refreshHealth")?.addEventListener("click", runHealthChecks);
  $("refreshAll")?.addEventListener("click", runHealthChecks);
  window.addEventListener("online", updateConnection);
  window.addEventListener("offline", updateConnection);
  updateClock();
  setInterval(updateClock, 1000);
  updateConnection();
  runHealthChecks();
})();
