const ADMIN_EMAIL = "durgajung.nits@gmail.com";

const DEFAULT_PRODUCT_CODE = "MERO-MANDALI";


/* =========================================================
   BASIC HELPERS
========================================================= */

function json(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store"
      }
    }
  );
}


async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}


function clean(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const text = String(value).trim();

  return text === "" ? null : text;
}


function safeInt(value, fallback = 1) {
  const number = Number.parseInt(value, 10);

  if (!Number.isFinite(number) || number < 1) {
    return fallback;
  }

  return number;
}


function currentYear() {
  return new Date().getUTCFullYear();
}


function makeNumber(prefix, id) {
  return `${prefix}-${currentYear()}-${String(id).padStart(5, "0")}`;
}


function makeTemporaryNumber(prefix) {
  return `${prefix}-TMP-${crypto.randomUUID()}`;
}


function getAdminEmail(request) {
  return (
    request.headers.get(
      "Cf-Access-Authenticated-User-Email"
    ) ||
    request.headers.get(
      "CF-Access-Authenticated-User-Email"
    ) ||
    ""
  )
    .trim()
    .toLowerCase();
}


function isAdmin(request) {
  return (
    getAdminEmail(request) ===
    ADMIN_EMAIL.toLowerCase()
  );
}


function requireAdmin(request) {
  if (!isAdmin(request)) {
    return json(
      {
        success: false,
        error: "Unauthorized."
      },
      401
    );
  }

  return null;
}


function clientIp(request) {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For") ||
    ""
  );
}


/* =========================================================
   ADMIN ACTIVITY
========================================================= */

async function recordAdminActivity(
  env,
  request,
  action,
  entityType = null,
  entityId = null,
  description = null
) {
  try {
    await env.ADMIN_DB.prepare(
      `
      INSERT INTO admin_activity (
        admin_email,
        action,
        entity_type,
        entity_id,
        description,
        ip_address,
        user_agent
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `
    )
      .bind(
        getAdminEmail(request) || ADMIN_EMAIL,
        action,
        entityType,
        entityId,
        description,
        clientIp(request),
        request.headers.get("User-Agent") || ""
      )
      .run();
  } catch (error) {
    console.error(
      "Admin activity logging failed:",
      error
    );
  }
}


/* =========================================================
   PRODUCT LOOKUP
========================================================= */

async function getProductByCode(env, productCode) {
  return await env.ADMIN_DB.prepare(
    `
    SELECT
      id,
      product_code,
      product_type,
      product_name,
      description,
      price_npr,
      status,
      cover_image_url
    FROM products
    WHERE product_code = ?
    LIMIT 1
    `
  )
    .bind(productCode)
    .first();
}


/* =========================================================
   HEALTH
========================================================= */

async function health(env) {
  try {
    await env.ADMIN_DB.prepare(
      "SELECT 1 AS ok"
    ).first();

    return json({
      success: true,
      service: "Durga Jung Admin API",
      database: "online",
      platform: "Software and Books"
    });
  } catch (error) {
    return json(
      {
        success: false,
        service: "Durga Jung Admin API",
        database: "offline",
        error: error.message
      },
      500
    );
  }
}


/* =========================================================
   PUBLIC PRODUCT CATALOGUE
========================================================= */

async function publicProducts(env) {
  const result =
    await env.ADMIN_DB.prepare(
      `
      SELECT
        product_code,
        product_type,
        product_name,
        description,
        price_npr,
        status,
        cover_image_url
      FROM products
      WHERE status = 'active'
      ORDER BY product_type, product_name
      `
    ).all();

  return json({
    success: true,
    products: result.results || []
  });
}


/* =========================================================
   PUBLIC ORDER SUBMISSION
========================================================= */

async function createOrder(request, env) {
  const body = await readJson(request);

  const customerName =
    clean(body.customer_name);

  const customerEmail =
    clean(body.customer_email);

  const paymentMethod =
    clean(body.payment_method);

  if (!customerName) {
    return json(
      {
        success: false,
        error: "Customer name is required."
      },
      400
    );
  }

  if (!customerEmail) {
    return json(
      {
        success: false,
        error: "Customer email is required."
      },
      400
    );
  }

  if (!paymentMethod) {
    return json(
      {
        success: false,
        error: "Payment method is required."
      },
      400
    );
  }

  const productCode =
    clean(body.product_code) ||
    DEFAULT_PRODUCT_CODE;

  const product =
    await getProductByCode(
      env,
      productCode
    );

  if (!product) {
    return json(
      {
        success: false,
        error: "Product not found."
      },
      404
    );
  }

  if (product.status !== "active") {
    return json(
      {
        success: false,
        error: "This product is not currently available."
      },
      400
    );
  }

  const quantity =
    safeInt(body.quantity, 1);

  const unitPrice =
    Number(product.price_npr || 0);

  const totalAmount =
    unitPrice * quantity;

  const temporaryOrderNumber =
    makeTemporaryNumber("ORDER");

  const orderInsert =
    await env.ADMIN_DB.prepare(
      `
      INSERT INTO orders (
        order_number,
        product_code,
        product_name,
        product_type,
        customer_name,
        customer_email,
        customer_phone,
        customer_address,
        church_organization,
        amount_npr,
        quantity,
        unit_price_npr,
        delivery_format,
        delivery_method,
        delivery_status,
        tracking_reference,
        customer_notes,
        status
      )
      VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, 'pending'
      )
      `
    )
      .bind(
        temporaryOrderNumber,
        product.product_code,
        product.product_name,
        product.product_type,
        customerName,
        customerEmail,
        clean(body.customer_phone),
        clean(body.customer_address),
        clean(body.church_organization),
        totalAmount,
        quantity,
        unitPrice,
        clean(body.delivery_format),
        clean(body.delivery_method),
        clean(body.tracking_reference),
        clean(body.customer_notes)
      )
      .run();

  const orderId =
    Number(orderInsert.meta.last_row_id);

  const orderNumber =
    makeNumber(
      "MM-ORD",
      orderId
    );

  await env.ADMIN_DB.prepare(
    `
    UPDATE orders
    SET
      order_number = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    `
  )
    .bind(
      orderNumber,
      orderId
    )
    .run();

  const paymentInsert =
    await env.ADMIN_DB.prepare(
      `
      INSERT INTO payments (
        order_id,
        payment_method,
        transaction_reference,
        amount_npr,
        payment_date,
        receipt_file_url,
        receipt_file_name,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 'submitted')
      `
    )
      .bind(
        orderId,
        paymentMethod,
        clean(body.transaction_reference),
        totalAmount,
        clean(body.payment_date),
        clean(body.receipt_file_url),
        clean(body.receipt_file_name)
      )
      .run();

  return json(
    {
      success: true,
      message:
        "Payment submission received for verification.",
      order: {
        id: orderId,
        order_number: orderNumber,
        product_code:
          product.product_code,
        product_name:
          product.product_name,
        product_type:
          product.product_type,
        amount_npr:
          totalAmount,
        quantity
      },
      payment_id:
        Number(
          paymentInsert.meta.last_row_id
        )
    },
    201
  );
}


/* =========================================================
   ADMIN DASHBOARD
========================================================= */

async function adminDashboard(env) {
  const pendingOrders =
    await env.ADMIN_DB.prepare(
      `
      SELECT COUNT(*) AS count
      FROM orders
      WHERE status IN ('pending', 'under_review')
      `
    ).first();

  const confirmedPayments =
    await env.ADMIN_DB.prepare(
      `
      SELECT COUNT(*) AS count
      FROM payments
      WHERE status = 'confirmed'
      `
    ).first();

  const sales =
    await env.ADMIN_DB.prepare(
      `
      SELECT
        COUNT(*) AS count,
        COALESCE(
          SUM(total_paid_npr),
          0
        ) AS total
      FROM sales
      `
    ).first();

  const pendingLicences =
    await env.ADMIN_DB.prepare(
      `
      SELECT COUNT(*) AS count
      FROM sales
      WHERE
        product_type = 'software'
        AND (
          licence_status IS NULL
          OR licence_status IN (
            'pending',
            'not_issued'
          )
        )
      `
    ).first();

  const softwareProducts =
    await env.ADMIN_DB.prepare(
      `
      SELECT COUNT(*) AS count
      FROM products
      WHERE
        product_type = 'software'
        AND status = 'active'
      `
    ).first();

  const bookProducts =
    await env.ADMIN_DB.prepare(
      `
      SELECT COUNT(*) AS count
      FROM products
      WHERE
        product_type = 'book'
        AND status = 'active'
      `
    ).first();

  return json({
    success: true,

    dashboard: {
      pending_orders:
        Number(
          pendingOrders?.count || 0
        ),

      confirmed_payments:
        Number(
          confirmedPayments?.count || 0
        ),

      total_sales:
        Number(
          sales?.count || 0
        ),

      total_sales_npr:
        Number(
          sales?.total || 0
        ),

      pending_licences:
        Number(
          pendingLicences?.count || 0
        ),

      active_software:
        Number(
          softwareProducts?.count || 0
        ),

      active_books:
        Number(
          bookProducts?.count || 0
        )
    }
  });
}


/* =========================================================
   ADMIN PRODUCTS
========================================================= */

async function adminProducts(env) {
  const result =
    await env.ADMIN_DB.prepare(
      `
      SELECT
        id,
        product_code,
        product_type,
        product_name,
        description,
        price_npr,
        status,
        cover_image_url,
        created_at,
        updated_at
      FROM products
      ORDER BY product_type, product_name
      `
    ).all();

  return json({
    success: true,
    products: result.results || []
  });
}


/* =========================================================
   ADMIN SOFTWARE
========================================================= */

async function adminSoftware(env) {
  const result =
    await env.ADMIN_DB.prepare(
      `
      SELECT
        p.id,
        p.product_code,
        p.product_type,
        p.product_name,
        p.description,
        p.price_npr,
        p.status,
        p.cover_image_url,

        s.version,
        s.installer_file_url,
        s.installation_guide_url,
        s.user_manual_url,
        s.licence_required,
        s.licence_type_default

      FROM products p

      LEFT JOIN software_products s
        ON s.product_id = p.id

      WHERE p.product_type = 'software'

      ORDER BY p.product_name
      `
    ).all();

  return json({
    success: true,
    software: result.results || []
  });
}


/* =========================================================
   ADMIN BOOKS
========================================================= */

async function adminBooks(env) {
  const result =
    await env.ADMIN_DB.prepare(
      `
      SELECT
        p.id,
        p.product_code,
        p.product_type,
        p.product_name,
        p.description,
        p.price_npr,
        p.status,
        p.cover_image_url,

        b.author_name,
        b.isbn,
        b.language,
        b.print_available,
        b.pdf_available,
        b.epub_available,
        b.stock_quantity,
        b.pdf_file_url,
        b.epub_file_url

      FROM products p

      LEFT JOIN book_products b
        ON b.product_id = p.id

      WHERE p.product_type = 'book'

      ORDER BY p.product_name
      `
    ).all();

  return json({
    success: true,
    books: result.results || []
  });
}


/* =========================================================
   ADMIN ORDERS LIST
========================================================= */

async function adminOrders(env) {
  const result =
    await env.ADMIN_DB.prepare(
      `
      SELECT
        o.*,

        p.id AS payment_id,
        p.payment_method,
        p.transaction_reference,
        p.payment_date,
        p.receipt_file_url,
        p.receipt_file_name,
        p.status AS payment_status,
        p.admin_notes AS payment_admin_notes

      FROM orders o

      LEFT JOIN payments p
        ON p.id = (
          SELECT p2.id
          FROM payments p2
          WHERE p2.order_id = o.id
          ORDER BY p2.id DESC
          LIMIT 1
        )

      ORDER BY o.id DESC
      `
    ).all();

  return json({
    success: true,
    orders: result.results || []
  });
}


/* =========================================================
   ADMIN SINGLE ORDER
========================================================= */

async function adminGetOrder(
  env,
  orderId
) {
  const order =
    await env.ADMIN_DB.prepare(
      `
      SELECT
        o.*,

        p.id AS payment_id,
        p.payment_method,
        p.transaction_reference,
        p.payment_date,
        p.receipt_file_url,
        p.receipt_file_name,
        p.status AS payment_status,
        p.admin_notes AS payment_admin_notes,
        p.confirmed_at AS payment_confirmed_at

      FROM orders o

      LEFT JOIN payments p
        ON p.id = (
          SELECT p2.id
          FROM payments p2
          WHERE p2.order_id = o.id
          ORDER BY p2.id DESC
          LIMIT 1
        )

      WHERE o.id = ?

      LIMIT 1
      `
    )
      .bind(orderId)
      .first();

  if (!order) {
    return json(
      {
        success: false,
        error: "Order not found."
      },
      404
    );
  }

  return json({
    success: true,
    order
  });
}


/* =========================================================
   UPDATE ORDER STATUS
========================================================= */

async function adminSetOrderStatus(
  request,
  env,
  orderId
) {
  const body = await readJson(request);

  const status =
    clean(body.status);

  const allowedStatuses = [
    "pending",
    "under_review",
    "approved",
    "rejected",
    "completed",
    "cancelled"
  ];

  if (
    !status ||
    !allowedStatuses.includes(status)
  ) {
    return json(
      {
        success: false,
        error: "Invalid order status."
      },
      400
    );
  }

  const existing =
    await env.ADMIN_DB.prepare(
      `
      SELECT id, order_number
      FROM orders
      WHERE id = ?
      `
    )
      .bind(orderId)
      .first();

  if (!existing) {
    return json(
      {
        success: false,
        error: "Order not found."
      },
      404
    );
  }

  await env.ADMIN_DB.prepare(
    `
    UPDATE orders
    SET
      status = ?,
      admin_notes = ?,

      reviewed_at =
        CASE
          WHEN ? = 'under_review'
          THEN CURRENT_TIMESTAMP
          ELSE reviewed_at
        END,

      approved_at =
        CASE
          WHEN ? = 'approved'
          THEN CURRENT_TIMESTAMP
          ELSE approved_at
        END,

      rejected_at =
        CASE
          WHEN ? = 'rejected'
          THEN CURRENT_TIMESTAMP
          ELSE rejected_at
        END,

      completed_at =
        CASE
          WHEN ? = 'completed'
          THEN CURRENT_TIMESTAMP
          ELSE completed_at
        END,

      updated_at = CURRENT_TIMESTAMP

    WHERE id = ?
    `
  )
    .bind(
      status,
      clean(body.admin_notes),
      status,
      status,
      status,
      status,
      orderId
    )
    .run();

  await recordAdminActivity(
    env,
    request,
    "ORDER_STATUS_CHANGED",
    "order",
    orderId,
    `${existing.order_number} changed to ${status}.`
  );

  return json({
    success: true,
    message:
      `Order marked ${status}.`
  });
}


/* =========================================================
   CONFIRM PAYMENT
========================================================= */

async function adminConfirmPayment(
  request,
  env,
  orderId
) {
  const body = await readJson(request);

  const order =
    await env.ADMIN_DB.prepare(
      `
      SELECT *
      FROM orders
      WHERE id = ?
      LIMIT 1
      `
    )
      .bind(orderId)
      .first();

  if (!order) {
    return json(
      {
        success: false,
        error: "Order not found."
      },
      404
    );
  }

  const existingSale =
    await env.ADMIN_DB.prepare(
      `
      SELECT *
      FROM sales
      WHERE order_id = ?
      LIMIT 1
      `
    )
      .bind(orderId)
      .first();

  if (existingSale) {
    return json({
      success: true,
      message:
        "Payment was already confirmed.",
      sale: existingSale
    });
  }

  const payment =
    await env.ADMIN_DB.prepare(
      `
      SELECT *
      FROM payments
      WHERE order_id = ?
      ORDER BY id DESC
      LIMIT 1
      `
    )
      .bind(orderId)
      .first();

  if (!payment) {
    return json(
      {
        success: false,
        error:
          "No payment submission exists for this order."
      },
      400
    );
  }

  const adminEmail =
    getAdminEmail(request);

  await env.ADMIN_DB.prepare(
    `
    UPDATE payments
    SET
      status = 'confirmed',
      confirmed_by = ?,
      confirmed_at = CURRENT_TIMESTAMP,
      admin_notes = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    `
  )
    .bind(
      adminEmail,
      clean(body.admin_notes),
      payment.id
    )
    .run();

  await env.ADMIN_DB.prepare(
    `
    UPDATE orders
    SET
      status = 'completed',
      admin_notes = ?,
      reviewed_at =
        COALESCE(
          reviewed_at,
          CURRENT_TIMESTAMP
        ),
      approved_at =
        COALESCE(
          approved_at,
          CURRENT_TIMESTAMP
        ),
      completed_at =
        CURRENT_TIMESTAMP,
      updated_at =
        CURRENT_TIMESTAMP
    WHERE id = ?
    `
  )
    .bind(
      clean(body.admin_notes),
      orderId
    )
    .run();

  const temporarySaleNumber =
    makeTemporaryNumber("SALE");

  const isSoftware =
    order.product_type === "software";

  const saleInsert =
    await env.ADMIN_DB.prepare(
      `
      INSERT INTO sales (
        sale_number,
        order_id,
        payment_id,

        customer_name,
        customer_email,
        customer_phone,
        customer_address,
        church_organization,

        product_code,
        product_name,
        product_type,

        quantity,
        unit_price_npr,
        total_paid_npr,

        payment_method,
        transaction_reference,
        payment_date,

        delivery_format,
        delivery_method,
        delivery_status,
        tracking_reference,

        licence_type,
        licence_status,

        approved_by,
        approved_at,
        notes
      )
      VALUES (
        ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?,
        ?, CURRENT_TIMESTAMP, ?
      )
      `
    )
      .bind(
        temporarySaleNumber,
        orderId,
        payment.id,

        order.customer_name,
        order.customer_email,
        order.customer_phone,
        order.customer_address,
        order.church_organization,

        order.product_code,
        order.product_name,
        order.product_type,

        order.quantity || 1,
        order.unit_price_npr ||
          order.amount_npr,
        order.amount_npr,

        payment.payment_method,
        payment.transaction_reference,
        payment.payment_date,

        order.delivery_format,
        order.delivery_method,
        order.delivery_status ||
          "pending",
        order.tracking_reference,

        isSoftware
          ? "customer"
          : null,

        isSoftware
          ? "not_issued"
          : null,

        adminEmail,
        clean(body.admin_notes)
      )
      .run();

  const saleId =
    Number(
      saleInsert.meta.last_row_id
    );

  const saleNumber =
    makeNumber(
      "MM-SALE",
      saleId
    );

  const invoiceNumber =
    makeNumber(
      "MM-INV",
      saleId
    );

  await env.ADMIN_DB.prepare(
    `
    UPDATE sales
    SET
      sale_number = ?,
      invoice_number = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    `
  )
    .bind(
      saleNumber,
      invoiceNumber,
      saleId
    )
    .run();

  await env.ADMIN_DB.prepare(
    `
    INSERT INTO invoices (
      invoice_number,
      sale_id,
      order_id,
      customer_name,
      customer_email,
      product_name,
      amount_npr,
      signed_by
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
  )
    .bind(
      invoiceNumber,
      saleId,
      orderId,
      order.customer_name,
      order.customer_email,
      order.product_name,
      order.amount_npr,
      "Durga Jung Kunwar"
    )
    .run();

  await recordAdminActivity(
    env,
    request,
    "PAYMENT_CONFIRMED",
    "sale",
    saleId,
    `${order.order_number} confirmed as ${saleNumber}; invoice ${invoiceNumber}.`
  );

  const sale =
    await env.ADMIN_DB.prepare(
      `
      SELECT *
      FROM sales
      WHERE id = ?
      `
    )
      .bind(saleId)
      .first();

  return json({
    success: true,
    message:
      "Payment confirmed and permanent Sales record created.",
    sale
  });
}


/* =========================================================
   SALES
========================================================= */

async function adminSales(env) {
  const result =
    await env.ADMIN_DB.prepare(
      `
      SELECT *
      FROM sales
      ORDER BY id DESC
      `
    ).all();

  return json({
    success: true,
    sales: result.results || []
  });
}


/* =========================================================
   SINGLE SALE
========================================================= */

async function adminGetSale(
  env,
  saleId
) {
  const sale =
    await env.ADMIN_DB.prepare(
      `
      SELECT *
      FROM sales
      WHERE id = ?
      LIMIT 1
      `
    )
      .bind(saleId)
      .first();

  if (!sale) {
    return json(
      {
        success: false,
        error: "Sale not found."
      },
      404
    );
  }

  return json({
    success: true,
    sale
  });
}


/* =========================================================
   INVOICES
========================================================= */

async function adminInvoices(env) {
  const result =
    await env.ADMIN_DB.prepare(
      `
      SELECT
        i.*,
        s.sale_number,
        s.product_code,
        s.product_type

      FROM invoices i

      LEFT JOIN sales s
        ON s.id = i.sale_id

      ORDER BY i.id DESC
      `
    ).all();

  return json({
    success: true,
    invoices:
      result.results || []
  });
}


/* =========================================================
   CUSTOMERS
========================================================= */

async function adminCustomers(env) {
  const result =
    await env.ADMIN_DB.prepare(
      `
      SELECT
        customer_email,

        MAX(customer_name)
          AS customer_name,

        MAX(customer_phone)
          AS customer_phone,

        COUNT(*)
          AS total_sales,

        SUM(total_paid_npr)
          AS total_spent_npr,

        MIN(created_at)
          AS first_purchase,

        MAX(created_at)
          AS latest_purchase

      FROM sales

      GROUP BY customer_email

      ORDER BY latest_purchase DESC
      `
    ).all();

  return json({
    success: true,
    customers:
      result.results || []
  });
}


/* =========================================================
   ADMIN ACTIVITY LIST
========================================================= */

async function adminActivity(env) {
  const result =
    await env.ADMIN_DB.prepare(
      `
      SELECT *
      FROM admin_activity
      ORDER BY id DESC
      LIMIT 200
      `
    ).all();

  return json({
    success: true,
    activity:
      result.results || []
  });
}


/* =========================================================
   SALES EXPORT
========================================================= */

function csvValue(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return `"${String(value)
    .replaceAll('"', '""')}"`;
}


async function exportSales(env) {
  const result =
    await env.ADMIN_DB.prepare(
      `
      SELECT *
      FROM sales
      ORDER BY id ASC
      `
    ).all();

  const sales =
    result.results || [];

  const headers = [
    "S.N.",
    "Sale Number",
    "Invoice Number",
    "Product Type",
    "Product Code",
    "Product Name",
    "Customer Name",
    "Customer Email",
    "Customer Phone",
    "Quantity",
    "Unit Price NPR",
    "Total Paid NPR",
    "Payment Method",
    "Transaction Reference",
    "Payment Date",
    "Licence Key",
    "Licence Status",
    "Device ID",
    "Reset Count",
    "Delivery Format",
    "Delivery Method",
    "Delivery Status",
    "Tracking Reference",
    "Invoice Sent",
    "Licence Email Sent",
    "Approved By",
    "Approved At",
    "Notes"
  ];

  const rows =
    sales.map(
      (sale, index) => [
        index + 1,
        sale.sale_number,
        sale.invoice_number,
        sale.product_type,
        sale.product_code,
        sale.product_name,
        sale.customer_name,
        sale.customer_email,
        sale.customer_phone,
        sale.quantity,
        sale.unit_price_npr,
        sale.total_paid_npr,
        sale.payment_method,
        sale.transaction_reference,
        sale.payment_date,
        sale.licence_key,
        sale.licence_status,
        sale.device_id,
        sale.reset_count,
        sale.delivery_format,
        sale.delivery_method,
        sale.delivery_status,
        sale.tracking_reference,
        sale.invoice_sent,
        sale.licence_email_sent,
        sale.approved_by,
        sale.approved_at,
        sale.notes
      ]
        .map(csvValue)
        .join(",")
    );

  const csv =
    [
      headers
        .map(csvValue)
        .join(","),

      ...rows
    ].join("\r\n");

  return new Response(
    csv,
    {
      headers: {
        "content-type":
          "text/csv; charset=utf-8",

        "content-disposition":
          `attachment; filename="Durga-Jung-Sales-${currentYear()}.csv"`,

        "cache-control":
          "no-store"
      }
    }
  );
}


/* =========================================================
   ROUTER
========================================================= */

export default {

  async fetch(
    request,
    env
  ) {
    try {
      const url =
        new URL(request.url);

      const path =
        url.pathname;

      const method =
        request.method.toUpperCase();


      /* -----------------------------------------------
         PUBLIC API
      ------------------------------------------------ */

      if (
        path === "/api/health" &&
        method === "GET"
      ) {
        return health(env);
      }


      if (
        path === "/api/products" &&
        method === "GET"
      ) {
        return publicProducts(env);
      }


      if (
        path === "/api/orders" &&
        method === "POST"
      ) {
        return createOrder(
          request,
          env
        );
      }


      /* -----------------------------------------------
         ADMIN API SECURITY
      ------------------------------------------------ */

      if (
        path.startsWith(
          "/api/admin/"
        )
      ) {
        const denied =
          requireAdmin(request);

        if (denied) {
          return denied;
        }
      }


      /* -----------------------------------------------
         DASHBOARD
      ------------------------------------------------ */

      if (
        path ===
          "/api/admin/dashboard" &&
        method === "GET"
      ) {
        return adminDashboard(env);
      }


      /* -----------------------------------------------
         PRODUCTS
      ------------------------------------------------ */

      if (
        path ===
          "/api/admin/products" &&
        method === "GET"
      ) {
        return adminProducts(env);
      }


      if (
        path ===
          "/api/admin/software" &&
        method === "GET"
      ) {
        return adminSoftware(env);
      }


      if (
        path ===
          "/api/admin/books" &&
        method === "GET"
      ) {
        return adminBooks(env);
      }


      /* -----------------------------------------------
         ORDERS
      ------------------------------------------------ */

      if (
        path ===
          "/api/admin/orders" &&
        method === "GET"
      ) {
        return adminOrders(env);
      }


      const orderDetailMatch =
        path.match(
          /^\/api\/admin\/orders\/(\d+)$/
        );

      if (
        orderDetailMatch &&
        method === "GET"
      ) {
        return adminGetOrder(
          env,
          Number(
            orderDetailMatch[1]
          )
        );
      }


      const orderStatusMatch =
        path.match(
          /^\/api\/admin\/orders\/(\d+)\/status$/
        );

      if (
        orderStatusMatch &&
        method === "PATCH"
      ) {
        return adminSetOrderStatus(
          request,
          env,
          Number(
            orderStatusMatch[1]
          )
        );
      }


      const confirmPaymentMatch =
        path.match(
          /^\/api\/admin\/orders\/(\d+)\/confirm-payment$/
        );

      if (
        confirmPaymentMatch &&
        method === "POST"
      ) {
        return adminConfirmPayment(
          request,
          env,
          Number(
            confirmPaymentMatch[1]
          )
        );
      }


      /* -----------------------------------------------
         SALES
      ------------------------------------------------ */

      if (
        path ===
          "/api/admin/sales" &&
        method === "GET"
      ) {
        return adminSales(env);
      }


      const saleDetailMatch =
        path.match(
          /^\/api\/admin\/sales\/(\d+)$/
        );

      if (
        saleDetailMatch &&
        method === "GET"
      ) {
        return adminGetSale(
          env,
          Number(
            saleDetailMatch[1]
          )
        );
      }


      if (
        path ===
          "/api/admin/export-sales" &&
        method === "GET"
      ) {
        return exportSales(env);
      }


      /* -----------------------------------------------
         INVOICES
      ------------------------------------------------ */

      if (
        path ===
          "/api/admin/invoices" &&
        method === "GET"
      ) {
        return adminInvoices(env);
      }


      /* -----------------------------------------------
         CUSTOMERS
      ------------------------------------------------ */

      if (
        path ===
          "/api/admin/customers" &&
        method === "GET"
      ) {
        return adminCustomers(env);
      }


      /* -----------------------------------------------
         ACTIVITY
      ------------------------------------------------ */

      if (
        path ===
          "/api/admin/activity" &&
        method === "GET"
      ) {
        return adminActivity(env);
      }


      /* -----------------------------------------------
         UNKNOWN ADMIN API
      ------------------------------------------------ */

      if (
        path.startsWith(
          "/api/admin/"
        )
      ) {
        return json(
          {
            success: false,
            error:
              "Admin API endpoint not found."
          },
          404
        );
      }


      /* -----------------------------------------------
         STATIC WEBSITE
      ------------------------------------------------ */

      return env.ASSETS.fetch(
        request
      );

    } catch (error) {
      console.error(
        "Worker error:",
        error
      );

      return json(
        {
          success: false,
          error:
            "Internal server error.",
          detail:
            error.message
        },
        500
      );
    }
  }
};
