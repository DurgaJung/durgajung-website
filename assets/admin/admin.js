(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const navItems = [
    ...document.querySelectorAll(".nav-item[data-section]")
  ];

  const sections = [
    ...document.querySelectorAll(".admin-section")
  ];

  const sidebar = $("sidebar");
  const menuToggle = $("menuToggle");

  let currentOrderId = null;
  let allOrders = [];
  let allSales = [];

  const healthTargets = [
    ["Home", "/"],
    ["About", "/about.html"],
    ["Ministry", "/ministry.html"],
    ["Books", "/books.html"],
    ["Sermons", "/sermons.html"],
    ["Software", "/software.html"],
    ["Gallery", "/gallery.html"],
    ["Contact", "/contact.html"]
  ].map(([name, path]) => ({
    name,
    path
  }));

  function showSection(name) {
    const target = $(`section-${name}`);

    if (!target) return;

    navItems.forEach((item) => {
      item.classList.toggle(
        "active",
        item.dataset.section === name
      );
    });

    sections.forEach((section) => {
      section.classList.toggle(
        "active",
        section === target
      );
    });

    sidebar?.classList.remove("open");

    menuToggle?.setAttribute(
      "aria-expanded",
      "false"
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

    if (name === "orders") {
      loadOrders();
    }

    if (name === "payments") {
      loadPayments();
    }

    if (name === "sales") {
      loadSales();
    }

    if (name === "activity") {
      loadActivity();
    }

    if (name === "website") {
      runHealthChecks();
    }
  }

  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      showSection(item.dataset.section);
    });
  });

  document
    .querySelectorAll("[data-open-section]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        showSection(
          button.dataset.openSection
        );
      });
    });

  menuToggle?.addEventListener(
    "click",
    () => {
      const open =
        sidebar?.classList.toggle("open") ??
        false;

      menuToggle.setAttribute(
        "aria-expanded",
        String(open)
      );
    }
  );

  document.addEventListener(
    "click",
    (event) => {
      if (
        window.innerWidth <= 820 &&
        sidebar?.classList.contains("open") &&
        !sidebar.contains(event.target) &&
        !menuToggle?.contains(event.target)
      ) {
        sidebar.classList.remove("open");

        menuToggle?.setAttribute(
          "aria-expanded",
          "false"
        );
      }
    }
  );

  function updateClock() {
    const now = new Date();

    if ($("currentDate")) {
      $("currentDate").textContent =
        new Intl.DateTimeFormat(
          undefined,
          {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric"
          }
        ).format(now);
    }

    if ($("currentTime")) {
      $("currentTime").textContent =
        new Intl.DateTimeFormat(
          undefined,
          {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
          }
        ).format(now);
    }
  }

  function money(value) {
    const number = Number(value || 0);

    return new Intl.NumberFormat(
      "en-IN",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }
    ).format(number);
  }

  function formatDate(value) {
    if (!value) return "—";

    const date = new Date(
      String(value).replace(" ", "T") + "Z"
    );

    if (
      Number.isNaN(date.getTime())
    ) {
      return value;
    }

    return new Intl.DateTimeFormat(
      undefined,
      {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      }
    ).format(date);
  }

  function escapeHtml(value) {
    return String(
      value ?? ""
    )
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function statusBadge(status) {
    const value =
      String(
        status || "unknown"
      ).toLowerCase();

    const label =
      value
        .replaceAll("_", " ")
        .replace(/\b\w/g, (m) =>
          m.toUpperCase()
        );

    return `
      <span class="status-badge ${escapeHtml(value)}">
        ${escapeHtml(label)}
      </span>
    `;
  }

  function yesNo(value) {
    return Number(value) === 1
      ? "Yes"
      : "No";
  }

  function toast(
    message,
    type = ""
  ) {
    const node = $("toast");

    if (!node) return;

    node.textContent = message;

    node.className =
      `toast ${type} show`;

    clearTimeout(
      node._timer
    );

    node._timer = setTimeout(
      () => {
        node.classList.remove(
          "show"
        );
      },
      3500
    );
  }

  async function api(
    path,
    options = {}
  ) {
    const response =
      await fetch(
        path,
        {
          cache: "no-store",
          credentials: "same-origin",
          ...options,
          headers: {
            "content-type":
              "application/json",
            ...(options.headers || {})
          }
        }
      );

    let data;

    try {
      data =
        await response.json();
    } catch {
      data = {
        success: false,
        error:
          `Unexpected server response (${response.status}).`
      };
    }

    if (!response.ok) {
      const error =
        new Error(
          data.error ||
            `Request failed (${response.status}).`
        );

      error.status =
        response.status;

      error.data = data;

      throw error;
    }

    return data;
  }

  async function checkApi() {
    const pill =
      $("apiConnection");

    const moduleStatus =
      $("moduleApiStatus");

    try {
      const data =
        await api(
          "/api/health"
        );

      if (
        data.success &&
        data.database === "online"
      ) {
        if (pill) {
          pill.textContent =
            "Admin API online";

          pill.classList.add(
            "online"
          );

          pill.classList.remove(
            "offline"
          );
        }

        if (moduleStatus) {
          moduleStatus.textContent =
            "ONLINE";

          moduleStatus.className =
            "status-ok";
        }

        return true;
      }

      throw new Error(
        "Database degraded"
      );
    } catch (error) {
      if (pill) {
        pill.textContent =
          "Admin API offline";

        pill.classList.remove(
          "online"
        );

        pill.classList.add(
          "offline"
        );
      }

      if (moduleStatus) {
        moduleStatus.textContent =
          "CHECK REQUIRED";

        moduleStatus.className =
          "status-warn";
      }

      return false;
    }
  }

  async function loadDashboard() {
    try {
      const data =
        await api(
          "/api/admin/dashboard"
        );

      const dashboard =
        data.dashboard || {};

      if ($("metricPendingOrders")) {
        $("metricPendingOrders").textContent =
          dashboard.pending_orders ?? 0;
      }

      if ($("metricConfirmedPayments")) {
        $("metricConfirmedPayments").textContent =
          dashboard.confirmed_payments ?? 0;
      }

      if ($("metricTotalSales")) {
        $("metricTotalSales").textContent =
          dashboard.total_sales ?? 0;
      }

      if ($("metricTotalRevenue")) {
        $("metricTotalRevenue").textContent =
          `NPR ${money(
            dashboard.total_sales_npr
          )}`;
      }

      if ($("metricPendingLicences")) {
        $("metricPendingLicences").textContent =
          dashboard.pending_licences ?? 0;
      }

      const badge =
        $("pendingOrderBadge");

      if (badge) {
        const count =
          Number(
            dashboard.pending_orders ||
              0
          );

        badge.textContent =
          count > 0
            ? String(count)
            : "";
      }
    } catch (error) {
      console.error(
        "Dashboard load failed:",
        error
      );
    }
  }

  async function loadRecentOrders() {
    const body =
      $("dashboardOrdersBody");

    if (!body) return;

    body.innerHTML = `
      <tr>
        <td colspan="4">
          Loading…
        </td>
      </tr>
    `;

    try {
      const data =
        await api(
          "/api/admin/orders"
        );

      const orders =
        (data.orders || [])
          .slice(0, 6);

      if (!orders.length) {
        body.innerHTML = `
          <tr>
            <td
              colspan="4"
              class="table-empty"
            >
              No orders yet.
            </td>
          </tr>
        `;

        return;
      }

      body.innerHTML =
        orders
          .map((order) => `
            <tr>
              <td>
                <strong>
                  ${escapeHtml(
                    order.order_number
                  )}
                </strong>
              </td>

              <td>
                ${escapeHtml(
                  order.customer_name
                )}
              </td>

              <td>
                NPR ${money(
                  order.amount_npr
                )}
              </td>

              <td>
                ${statusBadge(
                  order.status
                )}
              </td>
            </tr>
          `)
          .join("");
    } catch (error) {
      body.innerHTML = `
        <tr>
          <td
            colspan="4"
            class="table-empty"
          >
            Could not load orders.
          </td>
        </tr>
      `;
    }
  }

  function filterOrders() {
    const search =
      String(
        $("orderSearch")?.value ||
          ""
      )
        .trim()
        .toLowerCase();

    const status =
      $("orderStatusFilter")
        ?.value || "";

    return allOrders.filter(
      (order) => {
        const matchesStatus =
          !status ||
          order.status === status;

        const haystack =
          [
            order.order_number,
            order.customer_name,
            order.customer_email,
            order.customer_phone,
            order.transaction_reference
          ]
            .join(" ")
            .toLowerCase();

        const matchesSearch =
          !search ||
          haystack.includes(
            search
          );

        return (
          matchesStatus &&
          matchesSearch
        );
      }
    );
  }

  function renderOrders() {
    const body =
      $("ordersTableBody");

    if (!body) return;

    const orders =
      filterOrders();

    if (!orders.length) {
      body.innerHTML = `
        <tr>
          <td
            colspan="12"
            class="table-empty"
          >
            No matching orders.
          </td>
        </tr>
      `;

      return;
    }

    body.innerHTML =
      orders
        .map(
          (order, index) => {
            const receipt =
              order.receipt_file_url
                ? `
                  <a
                    class="receipt-link"
                    href="${escapeHtml(
                      order.receipt_file_url
                    )}"
                    target="_blank"
                    rel="noopener"
                  >
                    View
                  </a>
                `
                : "—";

            return `
              <tr>

                <td>
                  ${index + 1}
                </td>

                <td>
                  <strong>
                    ${escapeHtml(
                      order.order_number
                    )}
                  </strong>
                </td>

                <td>
                  ${escapeHtml(
                    order.customer_name
                  )}
                </td>

                <td>
                  ${escapeHtml(
                    order.customer_email
                  )}
                </td>

                <td>
                  ${escapeHtml(
                    order.customer_phone ||
                      "—"
                  )}
                </td>

                <td>
                  NPR ${money(
                    order.amount_npr
                  )}
                </td>

                <td>
                  ${escapeHtml(
                    order.payment_method ||
                      "—"
                  )}
                </td>

                <td>
                  ${escapeHtml(
                    order.transaction_reference ||
                      "—"
                  )}
                </td>

                <td>
                  ${receipt}
                </td>

                <td>
                  ${statusBadge(
                    order.status
                  )}
                </td>

                <td>
                  ${escapeHtml(
                    formatDate(
                      order.submitted_at
                    )
                  )}
                </td>

                <td>
                  <div class="table-actions">

                    <button
                      class="table-btn"
                      type="button"
                      data-view-order="${order.id}"
                    >
                      Review
                    </button>

                  </div>
                </td>

              </tr>
            `;
          }
        )
        .join("");

    body
      .querySelectorAll(
        "[data-view-order]"
      )
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            openOrder(
              Number(
                button.dataset
                  .viewOrder
              )
            );
          }
        );
      });
  }

  async function loadOrders() {
    const body =
      $("ordersTableBody");

    if (!body) return;

    body.innerHTML = `
      <tr>
        <td colspan="12">
          Loading orders…
        </td>
      </tr>
    `;

    try {
      const data =
        await api(
          "/api/admin/orders"
        );

      allOrders =
        data.orders || [];

      renderOrders();
    } catch (error) {
      console.error(error);

      body.innerHTML = `
        <tr>
          <td
            colspan="12"
            class="table-empty"
          >
            Failed to load orders.
          </td>
        </tr>
      `;

      toast(
        error.message,
        "error"
      );
    }
  }

  async function loadPayments() {
    const body =
      $("paymentsTableBody");

    if (!body) return;

    body.innerHTML = `
      <tr>
        <td colspan="10">
          Loading payments…
        </td>
      </tr>
    `;

    try {
      const data =
        await api(
          "/api/admin/orders"
        );

      const orders =
        data.orders || [];

      if (!orders.length) {
        body.innerHTML = `
          <tr>
            <td
              colspan="10"
              class="table-empty"
            >
              No payment submissions.
            </td>
          </tr>
        `;

        return;
      }

      body.innerHTML =
        orders
          .map(
            (order, index) => {
              const receipt =
                order.receipt_file_url
                  ? `
                    <a
                      class="receipt-link"
                      href="${escapeHtml(
                        order.receipt_file_url
                      )}"
                      target="_blank"
                      rel="noopener"
                    >
                      View
                    </a>
                  `
                  : "—";

              return `
                <tr>

                  <td>
                    ${index + 1}
                  </td>

                  <td>
                    ${escapeHtml(
                      order.order_number
                    )}
                  </td>

                  <td>
                    ${escapeHtml(
                      order.customer_name
                    )}
                  </td>

                  <td>
                    ${escapeHtml(
                      order.payment_method ||
                        "—"
                    )}
                  </td>

                  <td>
                    ${escapeHtml(
                      order.transaction_reference ||
                        "—"
                    )}
                  </td>

                  <td>
                    NPR ${money(
                      order.amount_npr
                    )}
                  </td>

                  <td>
                    ${escapeHtml(
                      order.payment_date ||
                        "—"
                    )}
                  </td>

                  <td>
                    ${receipt}
                  </td>

                  <td>
                    ${statusBadge(
                      order.payment_status ||
                        "submitted"
                    )}
                  </td>

                  <td>

                    <button
                      class="table-btn"
                      type="button"
                      data-view-order="${order.id}"
                    >
                      Review
                    </button>

                  </td>

                </tr>
              `;
            }
          )
          .join("");

      body
        .querySelectorAll(
          "[data-view-order]"
        )
        .forEach(
          (button) => {
            button.addEventListener(
              "click",
              () => {
                openOrder(
                  Number(
                    button.dataset
                      .viewOrder
                  )
                );
              }
            );
          }
        );

    } catch (error) {
      body.innerHTML = `
        <tr>
          <td
            colspan="10"
            class="table-empty"
          >
            Failed to load payments.
          </td>
        </tr>
      `;
    }
  }

  async function openOrder(id) {
    try {
      const data =
        await api(
          `/api/admin/orders/${id}`
        );

      const order =
        data.order;

      currentOrderId = id;

      if ($("orderModalTitle")) {
        $("orderModalTitle").textContent =
          order.order_number ||
          `Order ${id}`;
      }

      const receipt =
        order.receipt_file_url
          ? `
            <a
              class="receipt-link"
              href="${escapeHtml(
                order.receipt_file_url
              )}"
              target="_blank"
              rel="noopener"
            >
              Open payment receipt
            </a>
          `
          : "No receipt uploaded";

      if ($("orderModalContent")) {
        $("orderModalContent").innerHTML =
          `
          ${detail(
            "Customer Name",
            order.customer_name
          )}

          ${detail(
            "Email",
            order.customer_email
          )}

          ${detail(
            "Phone",
            order.customer_phone ||
              "—"
          )}

          ${detail(
            "Address",
            order.customer_address ||
              "—"
          )}

          ${detail(
            "Church / Organization",
            order.church_organization ||
              "—"
          )}

          ${detail(
            "Amount",
            `NPR ${money(
              order.amount_npr
            )}`
          )}

          ${detail(
            "Payment Method",
            order.payment_method ||
              "—"
          )}

          ${detail(
            "Transaction Reference",
            order.transaction_reference ||
              "—"
          )}

          ${detail(
            "Payment Date",
            order.payment_date ||
              "—"
          )}

          ${detail(
            "Order Status",
            order.status
          )}

          ${detail(
            "Payment Status",
            order.payment_status ||
              "submitted"
          )}

          ${detail(
            "Submitted",
            formatDate(
              order.submitted_at
            )
          )}

          <div class="detail-card full">

            <div class="detail-label">
              Payment Receipt
            </div>

            <div class="detail-value">
              ${receipt}
            </div>

          </div>
        `;
      }

      if ($("adminOrderNotes")) {
        $("adminOrderNotes").value =
          order.admin_notes ||
          order.payment_admin_notes ||
          "";
      }

      $("orderModal").hidden =
        false;

    } catch (error) {
      toast(
        error.message,
        "error"
      );
    }
  }

  function detail(
    label,
    value
  ) {
    return `
      <div class="detail-card">

        <div class="detail-label">
          ${escapeHtml(label)}
        </div>

        <div class="detail-value">
          ${escapeHtml(
            value ?? "—"
          )}
        </div>

      </div>
    `;
  }

  function closeOrderModal() {
    $("orderModal").hidden =
      true;

    currentOrderId = null;
  }

  async function updateOrderStatus(
    status
  ) {
    if (!currentOrderId) {
      return;
    }

    const notes =
      $("adminOrderNotes")
        ?.value || "";

    try {
      await api(
        `/api/admin/orders/${currentOrderId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status,
            admin_notes: notes
          })
        }
      );

      toast(
        `Order marked ${status.replaceAll("_", " ")}.`,
        "success"
      );

      closeOrderModal();

      await refreshAdminData();

    } catch (error) {
      toast(
        error.message,
        "error"
      );
    }
  }

  async function confirmPayment() {
    if (!currentOrderId) {
      return;
    }

    const notes =
      $("adminOrderNotes")
        ?.value || "";

    const confirmed =
      window.confirm(
        "Confirm this customer's payment and create the permanent Sales record?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const data =
        await api(
          `/api/admin/orders/${currentOrderId}/confirm-payment`,
          {
            method: "POST",
            body: JSON.stringify({
              admin_notes: notes
            })
          }
        );

      toast(
        data.message ||
          "Payment confirmed.",
        "success"
      );

      closeOrderModal();

      await refreshAdminData();

      showSection("sales");

    } catch (error) {
      toast(
        error.message,
        "error"
      );
    }
  }

  async function loadSales() {
    const body =
      $("salesTableBody");

    if (!body) return;

    body.innerHTML = `
      <tr>
        <td colspan="18">
          Loading sales…
        </td>
      </tr>
    `;

    try {
      const data =
        await api(
          "/api/admin/sales"
        );

      allSales =
        data.sales || [];

      if (!allSales.length) {
        body.innerHTML = `
          <tr>
            <td
              colspan="18"
              class="table-empty"
            >
              No completed sales yet.
            </td>
          </tr>
        `;

        return;
      }

      body.innerHTML =
        allSales
          .map(
            (sale, index) => `
              <tr>

                <td>
                  ${index + 1}
                </td>

                <td>
                  <strong>
                    ${escapeHtml(
                      sale.sale_number
                    )}
                  </strong>
                </td>

                <td>
                  ${escapeHtml(
                    sale.invoice_number ||
                      "—"
                  )}
                </td>

                <td>
                  ${escapeHtml(
                    sale.customer_name
                  )}
                </td>

                <td>
                  ${escapeHtml(
                    sale.customer_email
                  )}
                </td>

                <td>
                  ${escapeHtml(
                    sale.customer_phone ||
                      "—"
                  )}
                </td>

                <td>
                  ${escapeHtml(
                    sale.payment_date ||
                      "—"
                  )}
                </td>

                <td>
                  ${escapeHtml(
                    sale.payment_method ||
                      "—"
                  )}
                </td>

                <td>
                  ${escapeHtml(
                    sale.transaction_reference ||
                      "—"
                  )}
                </td>

                <td>
                  NPR ${money(
                    sale.total_paid_npr
                  )}
                </td>

                <td>
                  <code>
                    ${escapeHtml(
                      sale.licence_key ||
                        "Not issued"
                    )}
                  </code>
                </td>

                <td>
                  ${statusBadge(
                    sale.licence_status ||
                      "not_issued"
                  )}
                </td>

                <td>
                  ${escapeHtml(
                    sale.device_id ||
                      "—"
                  )}
                </td>

                <td>
                  ${Number(
                    sale.reset_count ||
                      0
                  )}
                </td>

                <td>
                  ${yesNo(
                    sale.invoice_sent
                  )}
                </td>

                <td>
                  ${yesNo(
                    sale.licence_email_sent
                  )}
                </td>

                <td>
                  ${escapeHtml(
                    formatDate(
                      sale.approved_at
                    )
                  )}
                </td>

                <td>
                  ${escapeHtml(
                    sale.notes ||
                      "—"
                  )}
                </td>

              </tr>
            `
          )
          .join("");

    } catch (error) {
      console.error(error);

      body.innerHTML = `
        <tr>
          <td
            colspan="18"
            class="table-empty"
          >
            Failed to load sales.
          </td>
        </tr>
      `;
    }
  }

  async function loadActivity() {
    const body =
      $("activityTableBody");

    if (!body) return;

    body.innerHTML = `
      <tr>
        <td colspan="5">
          Loading activity…
        </td>
      </tr>
    `;

    try {
      const data =
        await api(
          "/api/admin/activity"
        );

      const activity =
        data.activity || [];

      if (!activity.length) {
        body.innerHTML = `
          <tr>
            <td
              colspan="5"
              class="table-empty"
            >
              No admin activity recorded yet.
            </td>
          </tr>
        `;

        return;
      }

      body.innerHTML =
        activity
          .map((row) => `
            <tr>

              <td>
                ${escapeHtml(
                  formatDate(
                    row.created_at
                  )
                )}
              </td>

              <td>
                ${escapeHtml(
                  row.admin_email
                )}
              </td>

              <td>
                ${escapeHtml(
                  row.action
                )}
              </td>

              <td>
                ${escapeHtml(
                  row.entity_type ||
                    "—"
                )}
              </td>

              <td>
                ${escapeHtml(
                  row.description ||
                    "—"
                )}
              </td>

            </tr>
          `)
          .join("");

    } catch (error) {
      body.innerHTML = `
        <tr>
          <td
            colspan="5"
            class="table-empty"
          >
            Failed to load activity.
          </td>
        </tr>
      `;
    }
  }

  async function checkTarget(
    target
  ) {
    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () =>
          controller.abort(),
        8000
      );

    const start =
      performance.now();

    try {
      const response =
        await fetch(
          target.path,
          {
            method: "GET",
            cache: "no-store",
            credentials:
              "same-origin",
            signal:
              controller.signal
          }
        );

      return {
        ...target,
        ok:
          response.ok,
        code:
          response.status,
        latency:
          Math.max(
            1,
            Math.round(
              performance.now() -
                start
            )
          )
      };
    } catch (error) {
      return {
        ...target,
        ok: false,
        code:
          error.name ===
          "AbortError"
            ? "TIMEOUT"
            : "ERR",
        latency: null
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  function healthBadge(
    result
  ) {
    return `
      <span
        class="status-badge ${
          result.ok
            ? "active"
            : "disabled"
        }"
      >
        ${
          result.ok
            ? "ONLINE"
            : "CHECK"
        }
      </span>
    `;
  }

  async function runHealthChecks() {
    const body =
      $("healthTableBody");

    if (body) {
      body.innerHTML = `
        <tr>
          <td colspan="4">
            Running checks…
          </td>
        </tr>
      `;
    }

    const results =
      await Promise.all(
        healthTargets.map(
          checkTarget
        )
      );

    if (body) {
      body.innerHTML =
        results
          .map(
            (result) => `
              <tr>

                <td>
                  <strong>
                    ${escapeHtml(
                      result.name
                    )}
                  </strong>
                </td>

                <td>
                  <code>
                    ${escapeHtml(
                      result.path
                    )}
                  </code>
                </td>

                <td>
                  ${healthBadge(
                    result
                  )}
                  <small>
                    ${escapeHtml(
                      result.code
                    )}
                  </small>
                </td>

                <td>
                  ${
                    result.latency
                      ? `${result.latency} ms`
                      : "—"
                  }
                </td>

              </tr>
            `
          )
          .join("");
    }
  }

  async function refreshAdminData() {
    await Promise.allSettled([
      checkApi(),
      loadDashboard(),
      loadRecentOrders(),
      loadOrders(),
      loadPayments(),
      loadSales()
    ]);
  }

  $("refreshAll")
    ?.addEventListener(
      "click",
      refreshAdminData
    );

  $("refreshOrders")
    ?.addEventListener(
      "click",
      loadOrders
    );

  $("refreshSales")
    ?.addEventListener(
      "click",
      loadSales
    );

  $("orderSearch")
    ?.addEventListener(
      "input",
      renderOrders
    );

  $("orderStatusFilter")
    ?.addEventListener(
      "change",
      renderOrders
    );

  $("closeOrderModal")
    ?.addEventListener(
      "click",
      closeOrderModal
    );

  $("orderModal")
    ?.addEventListener(
      "click",
      (event) => {
        if (
          event.target ===
          $("orderModal")
        ) {
          closeOrderModal();
        }
      }
    );

  $("reviewOrderBtn")
    ?.addEventListener(
      "click",
      () =>
        updateOrderStatus(
          "under_review"
        )
    );

  $("rejectOrderBtn")
    ?.addEventListener(
      "click",
      () =>
        updateOrderStatus(
          "rejected"
        )
    );

  $("confirmPaymentBtn")
    ?.addEventListener(
      "click",
      confirmPayment
    );

  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key ===
          "Escape" &&
        !$("orderModal")?.hidden
      ) {
        closeOrderModal();
      }
    }
  );

  updateClock();

  setInterval(
    updateClock,
    1000
  );

  checkApi();
  loadDashboard();
  loadRecentOrders();
  runHealthChecks();

})();
