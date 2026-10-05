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
  let currentOrderProductCode = null;
  let allOrders = [];
  let allSales = [];
  let allComments = [];
  let allMedia = [];

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


  /* =====================================================
     SECTION NAVIGATION
  ====================================================== */

  function showSection(name) {
    const target = $(`section-${name}`);

    if (!target) {
      return;
    }

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

    switch (name) {
      case "orders":
        loadOrders();
        break;

      case "payments":
        loadPayments();
        break;

      case "software":
        loadSoftware();
        break;

      case "licenses":
        loadIssuedLicenses();
        loadSoftware();
        break;

      case "downloads":
        loadSoftware();
        break;

      case "books":
        loadBooks();
        break;

      case "sales":
        loadSales();
        break;

      case "invoices":
        loadInvoices();
        break;

      case "customers":
        loadCustomers();
        break;

      case "activity":
        loadActivity();
        break;

      case "website":
        runHealthChecks();
        runPublishingDiagnostics();
        break;

      case "media":
        loadMediaLibrary();
        break;

      case "revisions":
        loadRevisions();
        break;

      case "engagement":
        loadEngagementSection();
        break;
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


  /* =====================================================
     FORMAT HELPERS
  ====================================================== */

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
    const number =
      Number(value || 0);

    return new Intl.NumberFormat(
      "en-IN",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }
    ).format(number);
  }


  function numberValue(value) {
    const number = Number(value || 0);

    return Number.isFinite(number)
      ? number
      : 0;
  }


  function toDate(value) {
    if (!value) {
      return null;
    }

    const raw = String(value);

    let date;

    if (
      raw.includes("T") ||
      raw.endsWith("Z")
    ) {
      date = new Date(raw);
    } else {
      date = new Date(
        raw.replace(" ", "T") + "Z"
      );
    }

    return Number.isNaN(
      date.getTime()
    )
      ? null
      : date;
  }


  function formatDate(value) {
    if (!value) {
      return "—";
    }

    const date =
      toDate(value);

    if (!date) {
      return String(value);
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
    const node =
      $("toast");

    if (!node) {
      return;
    }

    node.textContent =
      message;

    node.className =
      `toast ${type} show`;

    clearTimeout(
      node._timer
    );

    node._timer =
      setTimeout(
        () => {
          node.classList.remove(
            "show"
          );
        },
        3500
      );
  }


  /* =====================================================
     API HELPER
  ====================================================== */

  async function api(
    path,
    options = {}
  ) {
    const headers = {
      ...(options.headers || {})
    };

    if (
      options.body !== undefined &&
      !headers["content-type"] &&
      !headers["Content-Type"]
    ) {
      headers["content-type"] =
        "application/json";
    }

    const response =
      await fetch(
        path,
        {
          cache: "no-store",
          credentials: "same-origin",
          ...options,
          headers
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

      error.data =
        data;

      throw error;
    }

    return data;
  }


  /* =====================================================
     API STATUS
  ====================================================== */

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
        "Database unavailable"
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


  /* =====================================================
     DASHBOARD
  ====================================================== */

  function updateDashboardEngagementMetrics(
    dashboard = {}
  ) {
    if ($("metricTotalViews")) {
      $("metricTotalViews").textContent =
        numberValue(
          dashboard.total_views
        );
    }

    if ($("metricTotalLikes")) {
      $("metricTotalLikes").textContent =
        numberValue(
          dashboard.total_likes
        );
    }

    if ($("metricTotalComments")) {
      $("metricTotalComments").textContent =
        numberValue(
          dashboard.total_comments
        );
    }

    if ($("metricTotalShares")) {
      $("metricTotalShares").textContent =
        numberValue(
          dashboard.total_shares
        );
    }

    if ($("metricHiddenComments")) {
      $("metricHiddenComments").textContent =
        numberValue(
          dashboard.hidden_comments
        );
    }

    updateHiddenCommentBadge(
      dashboard.hidden_comments
    );
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

      updateDashboardEngagementMetrics(
        dashboard
      );

    } catch (error) {
      console.error(
        "Dashboard load failed:",
        error
      );
    }
  }


  /* =====================================================
     RECENT ORDERS
  ====================================================== */

  async function loadRecentOrders() {
    const body =
      $("dashboardOrdersBody");

    if (!body) {
      return;
    }

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
        orders.map((order) => `
          <tr>

            <td>
              <strong>
                ${escapeHtml(
                  order.order_number
                )}
              </strong>

              <br>

              <small>
                ${escapeHtml(
                  order.product_name ||
                  order.product_code ||
                  ""
                )}
              </small>
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
        `).join("");

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


  /* =====================================================
     ORDERS
  ====================================================== */

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

        const haystack = [
          order.order_number,
          order.product_code,
          order.product_name,
          order.product_type,
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

    if (!body) {
      return;
    }

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
      orders.map(
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

                <br>

                <small>
                  ${escapeHtml(
                    order.product_name ||
                    "—"
                  )}
                </small>
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
                ${
                  order.status ===
                    "completed" &&
                  (
                    order.product_type ===
                      "software" ||
                    order.product_code ===
                      "SOFTWARE-COMBO-7500" ||
                    order.product_code ===
                      "MERO-MANDALI" ||
                    order.product_code ===
                      "NEPALI-BIBLE-QUIZ"
                  )
                    ? `<br><small>${
                        Number(
                          order.licence_email_sent
                        ) === 1
                          ? "Email sent"
                          : "Email not sent"
                      }</small>`
                    : ""
                }
                ${
                  order.licence_device_id
                    ? `<br><small>${escapeHtml(
                        order.licence_device_id
                      )}</small>`
                    : ""
                }
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
      ).join("");


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
                button.dataset.viewOrder
              )
            );
          }
        );

      });
  }


  async function loadOrders() {
    const body =
      $("ordersTableBody");

    if (!body) {
      return;
    }

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


  /* =====================================================
     PAYMENTS
  ====================================================== */

  async function loadPayments() {
    const body =
      $("paymentsTableBody");

    if (!body) {
      return;
    }

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
        orders.map(
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

                  <br>

                  <small>
                    ${escapeHtml(
                      order.product_name ||
                      ""
                    )}
                  </small>
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
        ).join("");


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
                  button.dataset.viewOrder
                )
              );
            }
          );

        });

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


  /* =====================================================
     ORDER MODAL
  ====================================================== */

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


  async function openOrder(id) {
    try {
      const data =
        await api(
          `/api/admin/orders/${id}`
        );

      const order =
        data.order;

      currentOrderId =
        id;
      currentOrderProductCode =
        order.product_code ||
        null;

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
        $("orderModalContent").innerHTML = `

          ${detail(
            "Product Type",
            order.product_type ||
            "—"
          )}

          ${detail(
            "Product",
            order.product_name ||
            order.product_code ||
            "—"
          )}

          ${detail(
            "Product Code",
            order.product_code ||
            "—"
          )}

          ${
            order.product_code ===
            "NEPALI-BIBLE-QUIZ"
              ? `
                <div class="detail-card full">
                  <div class="detail-label">
                    Nepali Bible Quiz licence
                  </div>
                  <div class="detail-value">
                    Approve & Send Email issues the Nepali Bible Quiz customer licence and sends the key, download link, and guides in the same step. The installer is never attached. The order stays incomplete until that email is accepted.
                  </div>
                </div>
              `
              : order.product_code ===
                "SOFTWARE-COMBO-7500"
                ? `
                <div class="detail-card full">
                  <div class="detail-label">
                    Combo pack
                  </div>
                  <div class="detail-value">
                    Approve & Send Email issues both customer licences and sends one NPR 7,500 combo email immediately, with both keys, both download links, and both document packs. Installers are never attached. The order is not completed until that email is accepted.
                  </div>
                </div>
              `
              : ""
          }

          ${detail(
            "Quantity",
            order.quantity || 1
          )}

          ${detail(
            "Unit Price",
            `NPR ${money(
              order.unit_price_npr ||
              order.amount_npr
            )}`
          )}

          ${detail(
            "Total Amount",
            `NPR ${money(
              order.amount_npr
            )}`
          )}

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
            "Delivery Format",
            order.delivery_format ||
            "—"
          )}

          ${detail(
            "Delivery Method",
            order.delivery_method ||
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


  function closeOrderModal() {
    if ($("orderModal")) {
      $("orderModal").hidden =
        true;
    }

    currentOrderId =
      null;
    currentOrderProductCode =
      null;
  }


  async function updateOrderStatus(status) {
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
        currentOrderProductCode ===
        "NEPALI-BIBLE-QUIZ"
          ? "Approve this Nepali Bible Quiz payment and send the licence email now? The customer receives the key, download link, and guides immediately."
          : currentOrderProductCode ===
            "SOFTWARE-COMBO-7500"
            ? "Approve this NPR 7,500 combo payment and send the licence email now? The customer receives both keys, both download links, and the documents immediately."
            : "Approve this payment and send the customer email now?"
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


  /* =====================================================
     ISSUED LICENCES / DEVICE INSTALLS
  ====================================================== */

  async function loadIssuedLicenses() {
    const body =
      $("issuedLicensesTableBody");

    if (!body) {
      return;
    }

    body.innerHTML = `
      <tr>
        <td colspan="10">
          Checking licence servers for installed devices…
        </td>
      </tr>
    `;

    try {
      const data =
        await api(
          "/api/admin/issued-licenses"
        );

      const licenses =
        data.licenses || [];

      if (!licenses.length) {
        body.innerHTML = `
          <tr>
            <td
              colspan="10"
              class="table-empty"
            >
              No customer licences issued yet.
            </td>
          </tr>
        `;
        return;
      }

      body.innerHTML =
        licenses.map(
          (item, index) => {
            const installed =
              item.install_status ===
                "installed" ||
              Boolean(
                item.device_id
              );

            const device =
              item.device_label &&
              item.device_id
                ? item.device_label +
                  " · " +
                  item.device_id
                : (
                    item.device_id ||
                    "—"
                  );

            return `
              <tr>
                <td>
                  ${index + 1}
                </td>
                <td>
                  <strong>
                    ${escapeHtml(
                      item.product_name ||
                      item.product_code ||
                      "Software"
                    )}
                  </strong>
                </td>
                <td>
                  <code>
                    ${escapeHtml(
                      item.license_key ||
                      "—"
                    )}
                  </code>
                </td>
                <td>
                  ${escapeHtml(
                    item.customer_name ||
                    "—"
                  )}
                </td>
                <td>
                  ${escapeHtml(
                    item.customer_email ||
                    "—"
                  )}
                </td>
                <td>
                  ${escapeHtml(
                    item.sale_number ||
                    "—"
                  )}
                </td>
                <td>
                  <strong>
                    ${escapeHtml(
                      device
                    )}
                  </strong>
                </td>
                <td>
                  ${statusBadge(
                    installed
                      ? "installed"
                      : "not_installed"
                  )}
                </td>
                <td>
                  ${escapeHtml(
                    formatDate(
                      item.activated_at
                    )
                  )}
                </td>
                <td>
                  ${escapeHtml(
                    formatDate(
                      item.last_seen_at
                    )
                  )}
                </td>
              </tr>
            `;
          }
        ).join("");
    } catch (error) {
      console.error(error);
      body.innerHTML = `
        <tr>
          <td
            colspan="10"
            class="table-empty"
          >
            Could not load licence installs.
          </td>
        </tr>
      `;
      toast(
        error.message,
        "error"
      );
    }
  }


  /* =====================================================
     SOFTWARE PRODUCTS
  ====================================================== */

  async function loadSoftware() {
    const body =
      $("softwareTableBody");
    const licensesBody =
      $("licensesTableBody");

    if (!body && !licensesBody) {
      return;
    }

    if (body) {
      body.innerHTML = `
        <tr>
          <td colspan="6">
            Loading software products…
          </td>
        </tr>
      `;
    }

    if (licensesBody) {
      licensesBody.innerHTML = `
        <tr>
          <td colspan="6">
            Loading licensed software…
          </td>
        </tr>
      `;
    }

    try {
      const data =
        await api(
          "/api/admin/software"
        );

      const software =
        data.software || [];

      if (!software.length) {
        const empty = `
          <tr>
            <td
              colspan="6"
              class="table-empty"
            >
              No software products registered.
            </td>
          </tr>
        `;

        if (body) {
          body.innerHTML = empty;
        }

        if (licensesBody) {
          licensesBody.innerHTML = empty;
        }

        return;
      }

      if (body) {
        body.innerHTML =
          software.map(
            (item) => `
              <tr>

                <td>
                  <code>
                    ${escapeHtml(
                      item.product_code
                    )}
                  </code>
                </td>

                <td>
                  <strong>
                    ${escapeHtml(
                      item.product_name
                    )}
                  </strong>

                  ${
                    item.description
                      ? `
                        <br>
                        <small>
                          ${escapeHtml(
                            item.description
                          )}
                        </small>
                      `
                      : ""
                  }
                </td>

                <td>
                  ${escapeHtml(
                    item.version ||
                    "—"
                  )}
                </td>

                <td>
                  NPR ${money(
                    item.price_npr
                  )}
                </td>

                <td>
                  ${
                    Number(
                      item.licence_required
                    ) === 1
                      ? "Yes"
                      : "No"
                  }
                </td>

                <td>
                  ${statusBadge(
                    item.status
                  )}
                </td>

              </tr>
            `
          ).join("");
      }

      if (licensesBody) {
        licensesBody.innerHTML =
          software.map(
            (item) => `
              <tr>
                <td>
                  <code>
                    ${escapeHtml(
                      item.product_code
                    )}
                  </code>
                </td>
                <td>
                  <strong>
                    ${escapeHtml(
                      item.product_name
                    )}
                  </strong>
                </td>
                <td>
                  ${escapeHtml(
                    item.version ||
                    "—"
                  )}
                </td>
                <td>
                  ${
                    Number(
                      item.licence_required
                    ) === 1
                      ? "Yes"
                      : "No"
                  }
                </td>
                <td>
                  ${escapeHtml(
                    item.licence_type_default ||
                    "customer"
                  )}
                </td>
                <td>
                  ${statusBadge(
                    item.status
                  )}
                </td>
              </tr>
            `
          ).join("");
      }

    } catch (error) {
      console.error(error);

      const failed = `
        <tr>
          <td
            colspan="6"
            class="table-empty"
          >
            Failed to load software products.
          </td>
        </tr>
      `;

      if (body) {
        body.innerHTML = failed;
      }

      if (licensesBody) {
        licensesBody.innerHTML = failed;
      }

      toast(
        error.message,
        "error"
      );
    }
  }


  /* =====================================================
     BOOK PRODUCTS
  ====================================================== */

  function bookFormats(book) {
    const formats = [];

    if (
      Number(
        book.print_available
      ) === 1
    ) {
      formats.push("Print");
    }

    if (
      Number(
        book.pdf_available
      ) === 1
    ) {
      formats.push("PDF");
    }

    if (
      Number(
        book.epub_available
      ) === 1
    ) {
      formats.push("EPUB");
    }

    return formats.length
      ? formats.join(", ")
      : "—";
  }


  async function loadBooks() {
    const body =
      $("booksTableBody");

    if (!body) {
      return;
    }

    body.innerHTML = `
      <tr>
        <td colspan="7">
          Loading books…
        </td>
      </tr>
    `;

    try {
      const data =
        await api(
          "/api/admin/books"
        );

      const books =
        data.books || [];

      if (!books.length) {
        body.innerHTML = `
          <tr>
            <td
              colspan="7"
              class="table-empty"
            >
              No books registered yet.
            </td>
          </tr>
        `;

        return;
      }

      body.innerHTML =
        books.map(
          (book) => `
            <tr>

              <td>
                <code>
                  ${escapeHtml(
                    book.product_code
                  )}
                </code>
              </td>

              <td>
                <strong>
                  ${escapeHtml(
                    book.product_name
                  )}
                </strong>
              </td>

              <td>
                ${escapeHtml(
                  book.author_name ||
                  "—"
                )}
              </td>

              <td>
                ${escapeHtml(
                  bookFormats(book)
                )}
              </td>

              <td>
                NPR ${money(
                  book.price_npr
                )}
              </td>

              <td>
                ${
                  book.stock_quantity ===
                  null
                    ? "—"
                    : Number(
                        book.stock_quantity
                      )
                }
              </td>

              <td>
                ${statusBadge(
                  book.status
                )}
              </td>

            </tr>
          `
        ).join("");

    } catch (error) {
      console.error(error);

      body.innerHTML = `
        <tr>
          <td
            colspan="7"
            class="table-empty"
          >
            Failed to load books.
          </td>
        </tr>
      `;

      toast(
        error.message,
        "error"
      );
    }
  }


  /* =====================================================
     SALES
  ====================================================== */

  function deviceLines(sale) {
    if (
      sale.product_type !==
      "software"
    ) {
      return "N/A";
    }

    const bindings =
      Array.isArray(
        sale.device_bindings
      )
        ? sale.device_bindings
        : [];

    if (!bindings.length) {
      return escapeHtml(
        sale.device_id ||
        "Not installed"
      );
    }

    return bindings
      .map((binding) => {
        const installed =
          Boolean(
            binding.device_id
          ) ||
          binding.install_status ===
            "installed";

        const where =
          binding.device_label &&
          binding.device_id
            ? binding.device_label +
              " · " +
              binding.device_id
            : (
                binding.device_label ||
                binding.device_id ||
                ""
              );

        return `
          <div>
            <small>
              ${escapeHtml(
                binding.product ||
                "Licence"
              )}
            </small>
            <br>
            ${statusBadge(
              installed
                ? "installed"
                : "not_installed"
            )}
            ${
              where
                ? `<br><strong>${escapeHtml(
                    where
                  )}</strong>`
                : ""
            }
          </div>
        `;
      })
      .join("");
  }


  function comboQuizKey(sale) {
    const match =
      String(
        sale.notes || ""
      ).match(
        /COMBO_NBQ_KEY=(\S+)/
      );

    return match
      ? match[1]
      : "";
  }


  function updateSalesMetrics() {
    const totalRevenue =
      allSales.reduce(
        (sum, sale) =>
          sum +
          numberValue(
            sale.total_paid_npr
          ),
        0
      );

    const softwareCount =
      allSales.filter(
        (sale) =>
          String(
            sale.product_type || ""
          ).toLowerCase() ===
          "software"
      ).length;

    const bookCount =
      allSales.length -
      softwareCount;

    if ($("salesMetricCount")) {
      $("salesMetricCount").textContent =
        String(allSales.length);
    }

    if ($("salesMetricRevenue")) {
      $("salesMetricRevenue").textContent =
        "NPR " +
        money(totalRevenue);
    }

    if ($("salesMetricSoftware")) {
      $("salesMetricSoftware").textContent =
        String(softwareCount);
    }

    if ($("salesMetricBooks")) {
      $("salesMetricBooks").textContent =
        String(bookCount);
    }
  }


  function saleFulfilmentHtml(sale) {
    const type =
      String(
        sale.product_type || ""
      ).toLowerCase();

    if (type === "software") {
      const combo =
        sale.product_code ===
        "SOFTWARE-COMBO-7500";

      const quizKey =
        combo
          ? comboQuizKey(sale)
          : "";

      const primaryKey =
        sale.licence_key ||
        (
          sale.product_code ===
          "NEPALI-BIBLE-QUIZ"
            ? "Quiz Worker"
            : "Not issued"
        );

      const licenceText =
        combo
          ? `
              <div class="sales-license-line">
                <span>MM</span>
                <code>${escapeHtml(primaryKey)}</code>
              </div>
              <div class="sales-license-line">
                <span>NBQ</span>
                <code>${escapeHtml(quizKey || "Pending")}</code>
              </div>
            `
          : `
              <div class="sales-license-line">
                <code>${escapeHtml(primaryKey)}</code>
              </div>
            `;

      return `
        <div class="sales-fulfilment">
          ${licenceText}
          <div class="sales-status-row">
            ${statusBadge(
              sale.licence_status ||
              "not_issued"
            )}
          </div>
          <div class="sales-device-lines">
            ${deviceLines(sale)}
          </div>
        </div>
      `;
    }

    return `
      <div class="sales-fulfilment">
        <strong>
          ${escapeHtml(
            sale.delivery_method ||
            sale.delivery_format ||
            "Book delivery"
          )}
        </strong>
        <small>
          ${escapeHtml(
            sale.tracking_reference ||
            "No tracking reference"
          )}
        </small>
        ${
          sale.delivery_status
            ? statusBadge(
                sale.delivery_status
              )
            : ""
        }
      </div>
    `;
  }


  function renderSales() {
    const body =
      $("salesTableBody");

    if (!body) {
      return;
    }

    const query =
      String(
        $("salesSearch")?.value ||
        ""
      )
        .trim()
        .toLocaleLowerCase();

    const type =
      String(
        $("salesTypeFilter")?.value ||
        ""
      ).toLowerCase();

    const filtered =
      allSales.filter((sale) => {
        const saleType =
          String(
            sale.product_type || ""
          ).toLowerCase();

        const typeMatches =
          !type ||
          saleType === type;

        const haystack =
          [
            sale.sale_number,
            sale.invoice_number,
            sale.customer_name,
            sale.customer_email,
            sale.customer_phone,
            sale.product_name,
            sale.product_code,
            sale.payment_method,
            sale.transaction_reference,
            sale.licence_key,
            sale.delivery_status
          ]
            .filter(Boolean)
            .join(" ")
            .toLocaleLowerCase();

        return (
          typeMatches &&
          (
            !query ||
            haystack.includes(query)
          )
        );
      });

    if ($("salesResultCount")) {
      $("salesResultCount").textContent =
        filtered.length +
        (
          filtered.length === 1
            ? " sale"
            : " sales"
        );
    }

    if (!filtered.length) {
      body.innerHTML = `
        <tr>
          <td
            colspan="9"
            class="table-empty"
          >
            No sales match this filter.
          </td>
        </tr>
      `;

      return;
    }

    body.innerHTML =
      filtered.map(
        (sale, index) => {
          const quantity =
            Number(
              sale.quantity || 1
            );

          const typeLabel =
            String(
              sale.product_type || ""
            ).toLowerCase() ===
            "software"
              ? "Software"
              : "Book";

          const approvalDate =
            formatDate(
              sale.approved_at
            );

          return `
            <tr>

              <td class="sales-number-cell">
                ${index + 1}
              </td>

              <td class="sales-id-cell">
                <strong>
                  ${escapeHtml(
                    sale.sale_number ||
                    "—"
                  )}
                </strong>
                <small>
                  Invoice:
                  ${escapeHtml(
                    sale.invoice_number ||
                    "—"
                  )}
                </small>
              </td>

              <td class="sales-date-cell">
                <strong>
                  ${escapeHtml(
                    sale.payment_date ||
                    "—"
                  )}
                </strong>
              </td>

              <td class="sales-customer-cell">
                <strong>
                  ${escapeHtml(
                    sale.customer_name ||
                    "—"
                  )}
                </strong>
                <small>
                  ${escapeHtml(
                    sale.customer_email ||
                    "—"
                  )}
                </small>
                <small>
                  ${escapeHtml(
                    sale.customer_phone ||
                    "—"
                  )}
                </small>
              </td>

              <td class="sales-product-cell">
                <strong>
                  ${escapeHtml(
                    sale.product_name ||
                    sale.product_code ||
                    "—"
                  )}
                </strong>
                <small>
                  ${escapeHtml(typeLabel)}
                  · Qty ${quantity}
                </small>
                <small>
                  ${escapeHtml(
                    sale.product_code ||
                    ""
                  )}
                </small>
              </td>

              <td class="sales-payment-cell">
                <strong>
                  ${escapeHtml(
                    sale.payment_method ||
                    "—"
                  )}
                </strong>
                <small>
                  ${escapeHtml(
                    sale.transaction_reference ||
                    "No reference"
                  )}
                </small>
              </td>

              <td class="sales-amount-cell">
                <strong>
                  NPR ${money(
                    sale.total_paid_npr
                  )}
                </strong>
              </td>

              <td class="sales-fulfilment-cell">
                ${saleFulfilmentHtml(
                  sale
                )}
              </td>

              <td class="sales-approval-cell">
                <strong>
                  ${escapeHtml(
                    approvalDate
                  )}
                </strong>
                <small>
                  Invoice:
                  ${yesNo(
                    sale.invoice_sent
                  )}
                </small>
                <small>
                  ${
                    String(
                      sale.product_type ||
                      ""
                    ).toLowerCase() ===
                    "software"
                      ? "Licence: " +
                        yesNo(
                          sale.licence_email_sent
                        )
                      : "Delivery: " +
                        escapeHtml(
                          sale.delivery_status ||
                          "—"
                        )
                  }
                </small>
              </td>

            </tr>
          `;
        }
      ).join("");
  }


  async function loadSales() {
    const body =
      $("salesTableBody");

    if (!body) {
      return;
    }

    body.innerHTML = `
      <tr>
        <td colspan="9">
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
        Array.isArray(data.sales)
          ? data.sales
          : [];

      updateSalesMetrics();

      if (!allSales.length) {
        body.innerHTML = `
          <tr>
            <td
              colspan="9"
              class="table-empty"
            >
              No completed sales yet.
            </td>
          </tr>
        `;

        if ($("salesResultCount")) {
          $("salesResultCount").textContent =
            "0 sales";
        }

        return;
      }

      renderSales();

    } catch (error) {
      console.error(error);

      body.innerHTML = `
        <tr>
          <td
            colspan="9"
            class="table-empty"
          >
            Failed to load sales.
          </td>
        </tr>
      `;
    }
  }


  /* =====================================================
     INVOICES
  ====================================================== */

  async function loadInvoices() {
    const body =
      $("invoiceTableBody");

    if (!body) {
      return;
    }

    body.innerHTML = `
      <tr>
        <td colspan="7">
          Loading invoices…
        </td>
      </tr>
    `;

    try {
      const data =
        await api(
          "/api/admin/invoices"
        );

      const invoices =
        data.invoices || [];

      if (!invoices.length) {
        body.innerHTML = `
          <tr>
            <td
              colspan="7"
              class="table-empty"
            >
              No invoices yet.
            </td>
          </tr>
        `;

        return;
      }

      body.innerHTML =
        invoices.map(
          (invoice) => {

            const pdf =
              invoice.pdf_file_url
                ? `
                  <a
                    class="receipt-link"
                    href="${escapeHtml(
                      invoice.pdf_file_url
                    )}"
                    target="_blank"
                    rel="noopener"
                  >
                    Open PDF
                  </a>
                `
                : invoice.pdf_file_name
                  ? `
                    <span class="status-badge confirmed">
                      Generated
                    </span>
                  `
                  : "Not generated";

            return `
              <tr>

                <td>
                  <strong>
                    ${escapeHtml(
                      invoice.invoice_number
                    )}
                  </strong>

                  <br>

                  <small>
                    ${escapeHtml(
                      invoice.sale_number ||
                      ""
                    )}
                  </small>
                </td>

                <td>
                  ${escapeHtml(
                    invoice.customer_name
                  )}
                </td>

                <td>
                  ${escapeHtml(
                    invoice.customer_email
                  )}
                </td>

                <td>
                  NPR ${money(
                    invoice.amount_npr
                  )}
                </td>

                <td>
                  ${escapeHtml(
                    formatDate(
                      invoice.invoice_date
                    )
                  )}
                </td>

                <td>
                  ${
                    Number(
                      invoice.email_sent
                    ) === 1
                      ? statusBadge("confirmed")
                      : statusBadge("pending")
                  }
                </td>

                <td>
                  ${pdf}
                </td>

              </tr>
            `;
          }
        ).join("");

    } catch (error) {
      console.error(error);

      body.innerHTML = `
        <tr>
          <td
            colspan="7"
            class="table-empty"
          >
            Failed to load invoices.
          </td>
        </tr>
      `;
    }
  }


  /* =====================================================
     CUSTOMERS
  ====================================================== */

  async function loadCustomers() {
    const body =
      $("customersTableBody");

    if (!body) {
      return;
    }

    body.innerHTML = `
      <tr>
        <td colspan="6">
          Loading customers…
        </td>
      </tr>
    `;

    try {
      const data =
        await api(
          "/api/admin/customers"
        );

      const customers =
        data.customers || [];

      if (!customers.length) {
        body.innerHTML = `
          <tr>
            <td
              colspan="6"
              class="table-empty"
            >
              No completed-sale customers yet.
            </td>
          </tr>
        `;

        return;
      }

      body.innerHTML =
        customers.map(
          (customer) => `
            <tr>

              <td>
                <strong>
                  ${escapeHtml(
                    customer.customer_name
                  )}
                </strong>
              </td>

              <td>
                ${escapeHtml(
                  customer.customer_email
                )}
              </td>

              <td>
                ${escapeHtml(
                  customer.customer_phone ||
                  "—"
                )}
              </td>

              <td>
                —
              </td>

              <td>
                ${Number(
                  customer.total_sales ||
                  0
                )}
              </td>

              <td>
                NPR ${money(
                  customer.total_spent_npr
                )}
              </td>

            </tr>
          `
        ).join("");

    } catch (error) {
      console.error(error);

      body.innerHTML = `
        <tr>
          <td
            colspan="6"
            class="table-empty"
          >
            Failed to load customers.
          </td>
        </tr>
      `;
    }
  }


  /* =====================================================
     WEBSITE ENGAGEMENT
  ====================================================== */

  function updateHiddenCommentBadge(value) {
    const badge =
      $("hiddenCommentBadge");

    if (!badge) {
      return;
    }

    const count =
      numberValue(value);

    badge.textContent =
      count > 0
        ? String(count)
        : "";
  }


  function setEngagementTotals(
    totals = {}
  ) {
    const views =
      numberValue(
        totals.views
      );

    const likes =
      numberValue(
        totals.likes
      );

    const comments =
      numberValue(
        totals.comments
      );

    const shares =
      numberValue(
        totals.shares
      );

    const hidden =
      numberValue(
        totals.hidden_comments
      );


    if ($("engagementMetricViews")) {
      $("engagementMetricViews").textContent =
        views;
    }

    if ($("engagementMetricLikes")) {
      $("engagementMetricLikes").textContent =
        likes;
    }

    if ($("engagementMetricComments")) {
      $("engagementMetricComments").textContent =
        comments;
    }

    if ($("engagementMetricShares")) {
      $("engagementMetricShares").textContent =
        shares;
    }

    if ($("engagementMetricHidden")) {
      $("engagementMetricHidden").textContent =
        hidden;
    }


    if ($("metricTotalViews")) {
      $("metricTotalViews").textContent =
        views;
    }

    if ($("metricTotalLikes")) {
      $("metricTotalLikes").textContent =
        likes;
    }

    if ($("metricTotalComments")) {
      $("metricTotalComments").textContent =
        comments;
    }

    if ($("metricTotalShares")) {
      $("metricTotalShares").textContent =
        shares;
    }

    if ($("metricHiddenComments")) {
      $("metricHiddenComments").textContent =
        hidden;
    }

    updateHiddenCommentBadge(
      hidden
    );
  }


  function renderEngagementPages(
    pages
  ) {
    const body =
      $("engagementTableBody");

    if (!body) {
      return;
    }

    if (!pages.length) {
      body.innerHTML = `
        <tr>
          <td
            colspan="7"
            class="table-empty"
          >
            No engagement records yet.
          </td>
        </tr>
      `;

      return;
    }

    body.innerHTML =
      pages.map(
        (page) => `
          <tr>

            <td>
              <strong>
                ${escapeHtml(
                  page.title ||
                  page.content_key ||
                  "Untitled"
                )}
              </strong>

              <br>

              <small>
                ${escapeHtml(
                  page.content_key ||
                  ""
                )}
              </small>
            </td>

            <td>
              <code>
                ${escapeHtml(
                  page.page_path ||
                  "—"
                )}
              </code>
            </td>

            <td>
              ${escapeHtml(
                page.content_type ||
                "page"
              )}
            </td>

            <td>
              <strong>
                ${numberValue(
                  page.views
                )}
              </strong>
            </td>

            <td>
              ${numberValue(
                page.likes
              )}
            </td>

            <td>
              ${numberValue(
                page.comments
              )}
            </td>

            <td>
              ${numberValue(
                page.shares
              )}
            </td>

          </tr>
        `
      ).join("");
  }


  async function loadEngagement() {
    const body =
      $("engagementTableBody");

    if (body) {
      body.innerHTML = `
        <tr>
          <td colspan="7">
            Loading engagement statistics…
          </td>
        </tr>
      `;
    }

    try {
      const data =
        await api(
          "/api/admin/engagement"
        );

      const totals =
        data.totals || {};

      const pages =
        Array.isArray(
          data.pages
        )
          ? data.pages
          : [];

      setEngagementTotals(
        totals
      );

      renderEngagementPages(
        pages
      );

      return data;

    } catch (error) {
      console.error(
        "Engagement load failed:",
        error
      );

      if (body) {
        body.innerHTML = `
          <tr>
            <td
              colspan="7"
              class="table-empty"
            >
              Failed to load engagement statistics.
            </td>
          </tr>
        `;
      }

      throw error;
    }
  }


  /* =====================================================
     COMMENT MODERATION
  ====================================================== */

  function commentPageLabel(
    comment
  ) {
    return (
      comment.title ||
      comment.content_title ||
      comment.page_title ||
      comment.content_key ||
      "—"
    );
  }


  function commentPagePath(
    comment
  ) {
    return (
      comment.page_path ||
      comment.path ||
      ""
    );
  }


  function filterComments() {
    const search =
      String(
        $("commentSearch")?.value ||
        ""
      )
        .trim()
        .toLowerCase();

    const status =
      String(
        $("commentStatusFilter")?.value ||
        ""
      );

    return allComments.filter(
      (comment) => {

        const commentStatus =
          String(
            comment.status ||
            "approved"
          );

        const matchesStatus =
          !status ||
          commentStatus === status;

        const haystack = [
          comment.id,
          comment.content_key,
          commentPageLabel(comment),
          commentPagePath(comment),
          comment.commenter_name,
          comment.commenter_email,
          comment.comment_text,
          comment.status
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


  function createCell(
    row,
    text,
    className = ""
  ) {
    const cell =
      document.createElement("td");

    if (className) {
      cell.className =
        className;
    }

    cell.textContent =
      text ?? "—";

    row.appendChild(
      cell
    );

    return cell;
  }


  function createCommentStatusBadge(
    status
  ) {
    const value =
      String(
        status ||
        "approved"
      ).toLowerCase();

    const span =
      document.createElement("span");

    span.className =
      `status-badge ${value}`;

    span.textContent =
      value
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) =>
          letter.toUpperCase()
        );

    return span;
  }


  function createModerationButton(
    label,
    className,
    handler
  ) {
    const button =
      document.createElement("button");

    button.type =
      "button";

    button.className =
      className;

    button.textContent =
      label;

    button.addEventListener(
      "click",
      handler
    );

    return button;
  }


  function renderComments() {
    const body =
      $("commentsTableBody");

    if (!body) {
      return;
    }

    const comments =
      filterComments();

    body.textContent =
      "";

    if (!comments.length) {
      const row =
        document.createElement("tr");

      const cell =
        document.createElement("td");

      cell.colSpan =
        8;

      cell.className =
        "table-empty";

      cell.textContent =
        "No matching comments.";

      row.appendChild(
        cell
      );

      body.appendChild(
        row
      );

      return;
    }


    comments.forEach(
      (comment) => {

        const row =
          document.createElement("tr");

        createCell(
          row,
          String(
            comment.id ?? "—"
          )
        );


        const pageCell =
          document.createElement("td");

        const pageStrong =
          document.createElement("strong");

        pageStrong.textContent =
          commentPageLabel(
            comment
          );

        pageCell.appendChild(
          pageStrong
        );

        const path =
          commentPagePath(
            comment
          );

        if (path) {
          pageCell.appendChild(
            document.createElement("br")
          );

          const small =
            document.createElement("small");

          small.textContent =
            path;

          pageCell.appendChild(
            small
          );
        }

        row.appendChild(
          pageCell
        );


        createCell(
          row,
          comment.commenter_name ||
          "—",
          "comment-name-cell"
        );


        createCell(
          row,
          comment.commenter_email ||
          "—",
          "comment-email-cell"
        );


        createCell(
          row,
          comment.comment_text ||
          "",
          "comment-text-cell"
        );


        const statusCell =
          document.createElement("td");

        statusCell.appendChild(
          createCommentStatusBadge(
            comment.status
          )
        );

        row.appendChild(
          statusCell
        );


        createCell(
          row,
          formatDate(
            comment.created_at
          )
        );


        const actionCell =
          document.createElement("td");

        const actions =
          document.createElement("div");

        actions.className =
          "table-actions comment-actions";


        const status =
          String(
            comment.status ||
            "approved"
          ).toLowerCase();


        if (status === "hidden") {
          actions.appendChild(
            createModerationButton(
              "Approve",
              "table-btn comment-approve-btn",
              () => {
                updateCommentStatus(
                  comment.id,
                  "approved"
                );
              }
            )
          );
        } else {
          actions.appendChild(
            createModerationButton(
              "Hide",
              "table-btn comment-hide-btn",
              () => {
                updateCommentStatus(
                  comment.id,
                  "hidden"
                );
              }
            )
          );
        }


        actions.appendChild(
          createModerationButton(
            "Delete",
            "table-btn comment-delete-btn",
            () => {
              deleteComment(
                comment.id,
                comment.commenter_name,
                comment.comment_text
              );
            }
          )
        );


        actionCell.appendChild(
          actions
        );

        row.appendChild(
          actionCell
        );

        body.appendChild(
          row
        );
      }
    );
  }


  async function loadComments() {
    const body =
      $("commentsTableBody");

    if (body) {
      body.innerHTML = `
        <tr>
          <td colspan="8">
            Loading comments…
          </td>
        </tr>
      `;
    }

    try {
      const data =
        await api(
          "/api/admin/comments"
        );

      allComments =
        Array.isArray(
          data.comments
        )
          ? data.comments
          : [];

      renderComments();

      return data;

    } catch (error) {
      console.error(
        "Comments load failed:",
        error
      );

      allComments =
        [];

      if (body) {
        body.innerHTML = `
          <tr>
            <td
              colspan="8"
              class="table-empty"
            >
              Failed to load comments.
            </td>
          </tr>
        `;
      }

      throw error;
    }
  }


  async function updateCommentStatus(
    id,
    status
  ) {
    const commentId =
      Number(id);

    if (
      !Number.isInteger(commentId) ||
      commentId <= 0
    ) {
      toast(
        "Invalid comment ID.",
        "error"
      );

      return;
    }

    try {
      const data =
        await api(
          `/api/admin/comments/${commentId}/status`,
          {
            method: "PATCH",
            body: JSON.stringify({
              status
            })
          }
        );

      toast(
        data.message ||
        (
          status === "hidden"
            ? "Comment hidden."
            : "Comment approved."
        ),
        "success"
      );

      await Promise.allSettled([
        loadEngagement(),
        loadComments(),
        loadDashboard()
      ]);

    } catch (error) {
      toast(
        error.message ||
        "Could not update comment.",
        "error"
      );
    }
  }


  async function deleteComment(
    id,
    commenterName,
    commentText
  ) {
    const commentId =
      Number(id);

    if (
      !Number.isInteger(commentId) ||
      commentId <= 0
    ) {
      toast(
        "Invalid comment ID.",
        "error"
      );

      return;
    }

    const preview =
      String(
        commentText || ""
      )
        .trim()
        .slice(0, 100);

    const message =
      [
        "Permanently delete this comment?",
        "",
        commenterName
          ? `Name: ${commenterName}`
          : "",
        preview
          ? `Comment: ${preview}${String(commentText || "").length > 100 ? "…" : ""}`
          : "",
        "",
        "This cannot be undone."
      ]
        .filter(
          (line) =>
            line !== ""
        )
        .join("\n");

    const confirmed =
      window.confirm(
        message
      );

    if (!confirmed) {
      return;
    }

    try {
      const data =
        await api(
          `/api/admin/comments/${commentId}`,
          {
            method: "DELETE"
          }
        );

      toast(
        data.message ||
        "Comment permanently deleted.",
        "success"
      );

      await Promise.allSettled([
        loadEngagement(),
        loadComments(),
        loadDashboard()
      ]);

    } catch (error) {
      toast(
        error.message ||
        "Could not delete comment.",
        "error"
      );
    }
  }


  async function loadEngagementSection() {
    await Promise.allSettled([
      loadEngagement(),
      loadComments()
    ]);
  }


  /* =====================================================
     MEDIA LIBRARY
  ====================================================== */

  function formatBytes(value) {
    const bytes = Number(value || 0);

    if (!Number.isFinite(bytes) || bytes <= 0) {
      return "—";
    }

    const units = ["B", "KB", "MB", "GB"];
    let amount = bytes;
    let unit = 0;

    while (amount >= 1024 && unit < units.length - 1) {
      amount /= 1024;
      unit += 1;
    }

    return (
      amount.toLocaleString(
        undefined,
        {
          maximumFractionDigits:
            unit === 0 ? 0 : 1
        }
      ) +
      " " +
      units[unit]
    );
  }


  function mediaSourceItems() {
    const paths =
      new Set(
        allMedia.map(
          (item) => item.path
        )
      );

    return allMedia.filter((item) => {
      if (item.format !== "JPG") {
        return true;
      }

      const possibleWebp =
        item.path.replace(
          /\.jpg$/i,
          ".webp"
        );

      return !paths.has(possibleWebp);
    });
  }


  function renderMediaLibrary() {
    const grid = $("mediaGrid");

    if (!grid) {
      return;
    }

    const query =
      String(
        $("mediaSearch")?.value || ""
      )
        .trim()
        .toLocaleLowerCase();

    const category =
      String(
        $("mediaCategory")?.value || ""
      );

    const items =
      mediaSourceItems()
        .filter((item) => {
          const matchesCategory =
            !category ||
            item.category === category;

          const haystack =
            [
              item.name,
              item.path,
              item.format,
              item.category
            ]
              .join(" ")
              .toLocaleLowerCase();

          const matchesSearch =
            !query ||
            haystack.includes(query);

          return (
            matchesCategory &&
            matchesSearch
          );
        });

    if ($("mediaResultCount")) {
      $("mediaResultCount").textContent =
        items.length +
        (items.length === 1
          ? " item"
          : " items");
    }

    if (!items.length) {
      grid.innerHTML = `
        <div class="table-empty">
          No media matches this filter.
        </div>
      `;
      return;
    }

    grid.innerHTML =
      items.map((item) => {
        const preview =
          item.jpeg_fallback ||
          item.path;

        const dimensions =
          item.width && item.height
            ? item.width + " × " + item.height
            : "Vector / unknown size";

        return `
          <article class="admin-media-card">
            <div class="admin-media-preview">
              <img
                src="${escapeHtml(preview)}"
                alt=""
                loading="lazy"
              >
            </div>

            <div class="admin-media-body">
              <strong
                class="admin-media-name"
                title="${escapeHtml(item.name)}"
              >
                ${escapeHtml(item.name)}
              </strong>

              <code
                class="admin-media-path"
                title="${escapeHtml(item.path)}"
              >
                ${escapeHtml(item.path)}
              </code>

              <div class="admin-media-meta">
                <span class="media-chip">
                  ${escapeHtml(item.format)}
                </span>
                <span class="media-chip">
                  ${escapeHtml(dimensions)}
                </span>
                <span class="media-chip">
                  ${escapeHtml(formatBytes(item.bytes))}
                </span>
                ${
                  item.jpeg_fallback
                    ? '<span class="media-chip compat">iPad JPEG fallback</span>'
                    : ""
                }
              </div>

              <div class="admin-media-actions">
                <a
                  href="${escapeHtml(preview)}"
                  target="_blank"
                  rel="noopener"
                >
                  Preview
                </a>
                <button
                  type="button"
                  data-copy-media="${escapeHtml(item.path)}"
                >
                  Copy Path
                </button>
              </div>
            </div>
          </article>
        `;
      }).join("");
  }


  async function loadMediaLibrary() {
    const grid = $("mediaGrid");

    if (grid) {
      grid.innerHTML = `
        <div class="table-empty">
          Loading media library…
        </div>
      `;
    }

    try {
      const response =
        await fetch(
          "/assets/data/media-index.json?ts=" +
          Date.now(),
          {
            cache: "no-store",
            credentials: "same-origin"
          }
        );

      if (!response.ok) {
        throw new Error(
          "Media index returned HTTP " +
          response.status
        );
      }

      const data =
        await response.json();

      allMedia =
        Array.isArray(data.items)
          ? data.items
          : [];

      const webpCount =
        allMedia.filter(
          (item) =>
            item.format === "WEBP"
        ).length;

      const fallbackCount =
        allMedia.filter(
          (item) =>
            Boolean(item.jpeg_fallback)
        ).length;

      if ($("mediaMetricTotal")) {
        $("mediaMetricTotal").textContent =
          String(data.count || allMedia.length);
      }

      if ($("mediaMetricWebp")) {
        $("mediaMetricWebp").textContent =
          String(webpCount);
      }

      if ($("mediaMetricFallbacks")) {
        $("mediaMetricFallbacks").textContent =
          String(fallbackCount);
      }

      if ($("mediaMetricUpdated")) {
        const updated =
          data.generated_at
            ? new Date(data.generated_at)
            : null;

        $("mediaMetricUpdated").textContent =
          updated &&
          !Number.isNaN(updated.getTime())
            ? new Intl.DateTimeFormat(
                undefined,
                {
                  month: "short",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit"
                }
              ).format(updated)
            : "—";
      }

      const select =
        $("mediaCategory");

      if (select) {
        const current =
          select.value;

        const categories =
          [...new Set(
            allMedia
              .map((item) => item.category)
              .filter(Boolean)
          )].sort();

        select.innerHTML =
          '<option value="">All categories</option>' +
          categories.map(
            (value) =>
              '<option value="' +
              escapeHtml(value) +
              '">' +
              escapeHtml(value) +
              "</option>"
          ).join("");

        if (
          current &&
          categories.includes(current)
        ) {
          select.value = current;
        }
      }

      renderMediaLibrary();

    } catch (error) {
      console.error(
        "Media library failed:",
        error
      );

      if (grid) {
        grid.innerHTML = `
          <div class="error-box">
            Media inventory could not be loaded.
          </div>
        `;
      }

      toast(
        "Could not load media library.",
        "error"
      );
    }
  }


  /* =====================================================
     REVISION HISTORY
  ====================================================== */

  async function loadRevisions() {
    const list =
      $("revisionList");

    if (!list) {
      return;
    }

    list.innerHTML = `
      <div class="table-empty">
        Loading revision history…
      </div>
    `;

    try {
      const response =
        await fetch(
          "https://api.github.com/repos/DurgaJung/durgajung-website/commits?sha=main&per_page=30",
          {
            headers: {
              Accept:
                "application/vnd.github+json"
            }
          }
        );

      if (!response.ok) {
        throw new Error(
          "GitHub returned HTTP " +
          response.status
        );
      }

      const commits =
        await response.json();

      if (!Array.isArray(commits) || !commits.length) {
        list.innerHTML = `
          <div class="table-empty">
            No revisions were returned.
          </div>
        `;
        return;
      }

      list.innerHTML =
        commits.map((item) => {
          const sha =
            String(item.sha || "");

          const shortSha =
            sha.slice(0, 7);

          const message =
            String(
              item.commit?.message ||
              "Website update"
            ).split("\n")[0];

          const author =
            item.commit?.author?.name ||
            item.author?.login ||
            "Unknown";

          const date =
            item.commit?.committer?.date ||
            item.commit?.author?.date;

          return `
            <div class="revision-row">
              <code class="revision-sha">
                ${escapeHtml(shortSha)}
              </code>

              <div class="revision-message">
                <strong title="${escapeHtml(message)}">
                  ${escapeHtml(message)}
                </strong>
                <span>
                  ${escapeHtml(author)}
                </span>
              </div>

              <div class="revision-date">
                ${escapeHtml(formatDate(date))}
              </div>

              <a
                class="revision-open"
                href="${escapeHtml(item.html_url || "#")}"
                target="_blank"
                rel="noopener"
              >
                View ↗
              </a>
            </div>
          `;
        }).join("");

    } catch (error) {
      console.error(
        "Revision history failed:",
        error
      );

      list.innerHTML = `
        <div class="error-box">
          Revision history could not be loaded. Open GitHub directly if the public API rate limit has been reached.
        </div>
      `;
    }
  }


  /* =====================================================
     ADMIN ACTIVITY
  ====================================================== */

  async function loadActivity() {
    const body =
      $("activityTableBody");

    if (!body) {
      return;
    }

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
        activity.map(
          (row) => `
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
          `
        ).join("");

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


  /* =====================================================
     WEBSITE HEALTH
  ====================================================== */

  async function checkTarget(target) {
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
            credentials: "same-origin",
            signal:
              controller.signal
          }
        );

      return {
        ...target,
        ok: response.ok,
        code: response.status,
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


  function healthBadge(result) {
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


  function setDiagnosticStatus(
    badgeId,
    textId,
    status,
    label,
    message
  ) {
    const badge = $(badgeId);
    const text = $(textId);

    if (badge) {
      badge.className =
        "status-badge " + status;
      badge.textContent =
        label;
    }

    if (text) {
      text.textContent =
        message;
    }
  }


  async function runPublishingDiagnostics() {
    let workerFound = false;
    let workerPath = null;

    for (const candidate of ["/sw.js", "/service-worker.js"]) {
      try {
        const response =
          await fetch(
            candidate + "?ts=" + Date.now(),
            {
              method: "GET",
              cache: "no-store",
              credentials: "same-origin"
            }
          );

        const type =
          response.headers.get(
            "content-type"
          ) || "";

        if (
          response.ok &&
          (
            type.includes("javascript") ||
            type.includes("ecmascript")
          )
        ) {
          workerFound = true;
          workerPath = candidate;
          break;
        }
      } catch {
        // Continue to the other conventional service-worker filename.
      }
    }

    if (workerFound) {
      setDiagnosticStatus(
        "serviceWorkerDiagnosticBadge",
        "serviceWorkerDiagnosticText",
        "active",
        "CONFIGURED",
        "A service-worker script is available at " +
          workerPath +
          "."
      );
    } else {
      setDiagnosticStatus(
        "serviceWorkerDiagnosticBadge",
        "serviceWorkerDiagnosticText",
        "disabled",
        "NOT CONFIGURED",
        "No Web Push service-worker script is currently published by this website."
      );
    }

    if (!("Notification" in window)) {
      setDiagnosticStatus(
        "notificationDiagnosticBadge",
        "notificationDiagnosticText",
        "disabled",
        "UNSUPPORTED",
        "This browser does not expose the Web Notification API."
      );
      return;
    }

    const permission =
      Notification.permission;

    if (permission === "granted") {
      setDiagnosticStatus(
        "notificationDiagnosticBadge",
        "notificationDiagnosticText",
        "active",
        "ALLOWED",
        "This browser has granted notification permission."
      );
    } else if (permission === "denied") {
      setDiagnosticStatus(
        "notificationDiagnosticBadge",
        "notificationDiagnosticText",
        "disabled",
        "BLOCKED",
        "This browser has blocked notification permission."
      );
    } else {
      setDiagnosticStatus(
        "notificationDiagnosticBadge",
        "notificationDiagnosticText",
        "pending",
        "NOT ASKED",
        "Notification permission has not been granted in this browser."
      );
    }
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
        results.map(
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
        ).join("");
    }
  }


  /* =====================================================
     REFRESH
  ====================================================== */

  async function refreshAdminData() {
    await Promise.allSettled([
      checkApi(),
      loadDashboard(),
      loadRecentOrders(),
      loadOrders(),
      loadPayments(),
      loadSoftware(),
      loadIssuedLicenses(),
      loadBooks(),
      loadSales(),
      loadInvoices(),
      loadCustomers(),
      loadEngagement(),
      loadComments()
    ]);
  }


  /* =====================================================
     EVENT HANDLERS
  ====================================================== */

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


  $("refreshIssuedLicenses")
    ?.addEventListener(
      "click",
      loadIssuedLicenses
    );


  $("refreshEngagement")
    ?.addEventListener(
      "click",
      async () => {
        await loadEngagementSection();

        toast(
          "Engagement data refreshed.",
          "success"
        );
      }
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


  $("commentSearch")
    ?.addEventListener(
      "input",
      renderComments
    );


  $("commentStatusFilter")
    ?.addEventListener(
      "change",
      renderComments
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
        event.key === "Escape" &&
        $("orderModal") &&
        !$("orderModal").hidden
      ) {
        closeOrderModal();
      }
    }
  );


  $("refreshMedia")
    ?.addEventListener(
      "click",
      loadMediaLibrary
    );

  $("mediaSearch")
    ?.addEventListener(
      "input",
      renderMediaLibrary
    );

  $("mediaCategory")
    ?.addEventListener(
      "change",
      renderMediaLibrary
    );

  $("refreshRevisions")
    ?.addEventListener(
      "click",
      loadRevisions
    );

  document.addEventListener(
    "click",
    async (event) => {
      const button =
        event.target.closest(
          "[data-copy-media]"
        );

      if (!button) {
        return;
      }

      const value =
        button.dataset.copyMedia || "";

      try {
        await navigator.clipboard.writeText(
          value
        );

        toast(
          "Media path copied.",
          "success"
        );
      } catch {
        toast(
          "Could not copy media path.",
          "error"
        );
      }
    }
  );


  /* =====================================================
     STARTUP
  ====================================================== */

  updateClock();

  setInterval(
    updateClock,
    1000
  );

  checkApi();

  loadDashboard();

  loadRecentOrders();

  loadEngagement();

  loadComments();

  runHealthChecks();

  runPublishingDiagnostics();

})();
