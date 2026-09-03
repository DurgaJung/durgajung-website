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
        "Confirm this customer's payment and create the permanent Sales and Invoice records?"
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
     SOFTWARE PRODUCTS
  ====================================================== */

  async function loadSoftware() {
    const body =
      $("softwareTableBody");

    if (!body) {
      return;
    }

    body.innerHTML = `
      <tr>
        <td colspan="6">
          Loading software products…
        </td>
      </tr>
    `;

    try {
      const data =
        await api(
          "/api/admin/software"
        );

      const software =
        data.software || [];

      if (!software.length) {
        body.innerHTML = `
          <tr>
            <td
              colspan="6"
              class="table-empty"
            >
              No software products registered.
            </td>
          </tr>
        `;

        return;
      }

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

    } catch (error) {
      console.error(error);

      body.innerHTML = `
        <tr>
          <td
            colspan="6"
            class="table-empty"
          >
            Failed to load software products.
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

  async function loadSales() {
    const body =
      $("salesTableBody");

    if (!body) {
      return;
    }

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
        allSales.map(
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

                <br>

                <small>
                  ${escapeHtml(
                    sale.product_name ||
                    sale.product_code ||
                    ""
                  )}
                </small>
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
                ${
                  sale.product_type ===
                  "software"
                    ? `
                      <code>
                        ${escapeHtml(
                          sale.licence_key ||
                          "Not issued"
                        )}
                      </code>
                    `
                    : "N/A"
                }
              </td>

              <td>
                ${
                  sale.product_type ===
                  "software"
                    ? statusBadge(
                        sale.licence_status ||
                        "not_issued"
                      )
                    : "N/A"
                }
              </td>

              <td>
                ${
                  sale.product_type ===
                  "software"
                    ? escapeHtml(
                        sale.device_id ||
                        "—"
                      )
                    : "N/A"
                }
              </td>

              <td>
                ${
                  sale.product_type ===
                  "software"
                    ? Number(
                        sale.reset_count ||
                        0
                      )
                    : "N/A"
                }
              </td>

              <td>
                ${yesNo(
                  sale.invoice_sent
                )}
              </td>

              <td>
                ${
                  sale.product_type ===
                  "software"
                    ? yesNo(
                        sale.licence_email_sent
                      )
                    : "N/A"
                }
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
        ).join("");

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
      loadBooks(),
      loadSales(),
      loadInvoices(),
      loadCustomers()
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
        event.key === "Escape" &&
        $("orderModal") &&
        !$("orderModal").hidden
      ) {
        closeOrderModal();
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

  runHealthChecks();

})();
