const ADMIN_EMAIL = "durgajung.nits@gmail.com";
const PRODUCT_NAME = "Mero Mandali";
const PRODUCT_CODE = "MERO-MANDALI";
const PRODUCT_PRICE = 5000;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=UTF-8",
      "cache-control": "no-store"
    }
  });
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getAdminEmail(request) {
  return clean(
    request.headers.get("Cf-Access-Authenticated-User-Email") ||
    request.headers.get("CF-Access-Authenticated-User-Email")
  ).toLowerCase();
}

function isAdmin(request) {
  return getAdminEmail(request) === ADMIN_EMAIL.toLowerCase();
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

function makeNumber(prefix, id) {
  const year = new Date().getUTCFullYear();
  return `${prefix}-${year}-${String(id).padStart(5, "0")}`;
}

async function recordAdminActivity(
  env,
  request,
  action,
  entityType,
  entityId,
  description
) {
  try {
    await env.ADMIN_DB.prepare(
      `
      INSERT INTO admin_activity
      (
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
        entityType || null,
        entityId || null,
        description || null,
        request.headers.get("CF-Connecting-IP") || null,
        request.headers.get("User-Agent") || null
      )
      .run();
  } catch (error) {
    console.warn("Admin activity log failed:", error);
  }
}

async function health(env) {
  const db = await env.ADMIN_DB.prepare(
    "SELECT 1 AS ok"
  ).first();

  return json({
    success: true,
    service: "Durga Jung Admin API",
    database: db?.ok === 1 ? "online" : "degraded",
    product: PRODUCT_NAME,
    price_npr: PRODUCT_PRICE
  });
}

async function createOrder(request, env) {
  const body = await readJson(request);

  const customerName = clean(body.customer_name);
  const customerEmail = clean(body.customer_email).toLowerCase();
  const customerPhone = clean(body.customer_phone);
  const customerAddress = clean(body.customer_address);
  const churchOrganization = clean(body.church_organization);

  const paymentMethod = clean(body.payment_method);
  const transactionReference = clean(body.transaction_reference);
  const paymentDate = clean(body.payment_date);

  const receiptFileUrl = clean(body.receipt_file_url);
  const receiptFileName = clean(body.receipt_file_name);

  const customerNotes = clean(body.customer_notes);

  if (!customerName) {
    return json(
      {
        success: false,
        error: "Customer name is required."
      },
      400
    );
  }

  if (!customerEmail || !customerEmail.includes("@")) {
    return json(
      {
        success: false,
        error: "A valid customer email is required."
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

  const orderInsert = await env.ADMIN_DB.prepare(
    `
    INSERT INTO orders
    (
      order_number,
      product_code,
      product_name,
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      church_organization,
      amount_npr,
      status,
      customer_notes
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `
  )
    .bind(
      "TEMP",
      PRODUCT_CODE,
      PRODUCT_NAME,
      customerName,
      customerEmail,
      customerPhone || null,
      customerAddress || null,
      churchOrganization || null,
      PRODUCT_PRICE,
      customerNotes || null
    )
    .run();

  const orderId = Number(orderInsert.meta?.last_row_id);

  if (!orderId) {
    return json(
      {
        success: false,
        error: "Could not create order."
      },
      500
    );
  }

  const orderNumber = makeNumber("MM-ORD", orderId);

  await env.ADMIN_DB.prepare(
    `
    UPDATE orders
    SET order_number = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    `
  )
    .bind(orderNumber, orderId)
    .run();

  const paymentInsert = await env.ADMIN_DB.prepare(
    `
    INSERT INTO payments
    (
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
      transactionReference || null,
      PRODUCT_PRICE,
      paymentDate || null,
      receiptFileUrl || null,
      receiptFileName || null
    )
    .run();

  return json(
    {
      success: true,
      message: "Payment submission received for verification.",
      order: {
        id: orderId,
        order_number: orderNumber,
        product_name: PRODUCT_NAME,
        total_npr: PRODUCT_PRICE,
        status: "pending"
      },
      payment_id: Number(paymentInsert.meta?.last_row_id || 0)
    },
    201
  );
}

async function getDashboard(env) {
  const pendingOrders = await env.ADMIN_DB.prepare(
    `
    SELECT COUNT(*) AS count
    FROM orders
    WHERE status IN ('pending', 'under_review')
    `
  ).first();

  const confirmedPayments = await env.ADMIN_DB.prepare(
    `
    SELECT COUNT(*) AS count
    FROM payments
    WHERE status = 'confirmed'
    `
  ).first();

  const totalSales = await env.ADMIN_DB.prepare(
    `
    SELECT COUNT(*) AS count,
           COALESCE(SUM(total_paid_npr), 0) AS amount
    FROM sales
    `
  ).first();

  const licencePending = await env.ADMIN_DB.prepare(
    `
    SELECT COUNT(*) AS count
    FROM sales
    WHERE licence_status IN ('pending', 'not_issued')
    `
  ).first();

  return json({
    success: true,
    dashboard: {
      pending_orders: Number(pendingOrders?.count || 0),
      confirmed_payments: Number(confirmedPayments?.count || 0),
      total_sales: Number(totalSales?.count || 0),
      total_sales_npr: Number(totalSales?.amount || 0),
      pending_licences: Number(licencePending?.count || 0)
    }
  });
}

async function listOrders(env, url) {
  const status = clean(url.searchParams.get("status"));

  let sql = `
    SELECT
      o.*,
      p.id AS payment_id,
      p.payment_method,
      p.transaction_reference,
      p.payment_date,
      p.receipt_file_url,
      p.receipt_file_name,
      p.status AS payment_status,
      p.confirmed_at AS payment_confirmed_at
    FROM orders o
    LEFT JOIN payments p
      ON p.order_id = o.id
  `;

  const bindings = [];

  if (status) {
    sql += " WHERE o.status = ?";
    bindings.push(status);
  }

  sql += " ORDER BY o.id DESC";

  const statement = env.ADMIN_DB.prepare(sql);

  const result = bindings.length
    ? await statement.bind(...bindings).all()
    : await statement.all();

  return json({
    success: true,
    orders: result.results || []
  });
}

async function getOrder(env, id) {
  const order = await env.ADMIN_DB.prepare(
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
      ON p.order_id = o.id
    WHERE o.id = ?
    LIMIT 1
    `
  )
    .bind(id)
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

async function setOrderReviewStatus(
  request,
  env,
  id
) {
  const body = await readJson(request);

  const status = clean(body.status);

  const allowed = [
    "pending",
    "under_review",
    "rejected",
    "cancelled"
  ];

  if (!allowed.includes(status)) {
    return json(
      {
        success: false,
        error: "Invalid order status."
      },
      400
    );
  }

  const order = await env.ADMIN_DB.prepare(
    `
    SELECT id
    FROM orders
    WHERE id = ?
    `
  )
    .bind(id)
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

  const adminNotes = clean(body.admin_notes);

  let extraSql = "";

  if (status === "rejected") {
    extraSql = ", rejected_at = CURRENT_TIMESTAMP";
  }

  await env.ADMIN_DB.prepare(
    `
    UPDATE orders
    SET status = ?,
        admin_notes = ?,
        reviewed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
        ${extraSql}
    WHERE id = ?
    `
  )
    .bind(
      status,
      adminNotes || null,
      id
    )
    .run();

  if (status === "rejected") {
    await env.ADMIN_DB.prepare(
      `
      UPDATE payments
      SET status = 'rejected',
          rejected_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE order_id = ?
      `
    )
      .bind(id)
      .run();
  }

  await recordAdminActivity(
    env,
    request,
    "order_status_changed",
    "order",
    id,
    `Order changed to ${status}.`
  );

  return json({
    success: true,
    message: `Order status changed to ${status}.`
  });
}

async function confirmPayment(
  request,
  env,
  orderId
) {
  const body = await readJson(request);

  const order = await env.ADMIN_DB.prepare(
    `
    SELECT *
    FROM orders
    WHERE id = ?
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

  const payment = await env.ADMIN_DB.prepare(
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
        error: "Payment record not found."
      },
      404
    );
  }

  const existingSale = await env.ADMIN_DB.prepare(
    `
    SELECT *
    FROM sales
    WHERE order_id = ?
    `
  )
    .bind(orderId)
    .first();

  if (existingSale) {
    return json({
      success: true,
      message: "This order is already recorded as a sale.",
      sale: existingSale
    });
  }

  await env.ADMIN_DB.prepare(
    `
    UPDATE payments
    SET status = 'confirmed',
        confirmed_by = ?,
        confirmed_at = CURRENT_TIMESTAMP,
        admin_notes = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    `
  )
    .bind(
      getAdminEmail(request) || ADMIN_EMAIL,
      clean(body.admin_notes) || null,
      payment.id
    )
    .run();

  await env.ADMIN_DB.prepare(
    `
    UPDATE orders
    SET status = 'approved',
        reviewed_at = CURRENT_TIMESTAMP,
        approved_at = CURRENT_TIMESTAMP,
        admin_notes = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    `
  )
    .bind(
      clean(body.admin_notes) || null,
      orderId
    )
    .run();

  const saleInsert = await env.ADMIN_DB.prepare(
    `
    INSERT INTO sales
    (
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
      total_paid_npr,
      payment_method,
      transaction_reference,
      payment_date,
      licence_type,
      licence_status,
      approved_by,
      approved_at,
      notes
    )
    VALUES (
      ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?,
      'customer',
      'not_issued',
      ?,
      CURRENT_TIMESTAMP,
      ?
    )
    `
  )
    .bind(
      "TEMP",
      order.id,
      payment.id,
      order.customer_name,
      order.customer_email,
      order.customer_phone || null,
      order.customer_address || null,
      order.church_organization || null,
      PRODUCT_CODE,
      PRODUCT_NAME,
      PRODUCT_PRICE,
      payment.payment_method || null,
      payment.transaction_reference || null,
      payment.payment_date || null,
      getAdminEmail(request) || ADMIN_EMAIL,
      clean(body.admin_notes) || null
    )
    .run();

  const saleId = Number(saleInsert.meta?.last_row_id);

  const saleNumber = makeNumber("MM-SALE", saleId);
  const invoiceNumber = makeNumber("MM-INV", saleId);

  await env.ADMIN_DB.prepare(
    `
    UPDATE sales
    SET sale_number = ?,
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
    INSERT INTO invoices
    (
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
      order.id,
      order.customer_name,
      order.customer_email,
      PRODUCT_NAME,
      PRODUCT_PRICE,
      "Durga Jung Kunwar"
    )
    .run();

  await recordAdminActivity(
    env,
    request,
    "payment_confirmed",
    "order",
    orderId,
    `Payment confirmed. Sale ${saleNumber} created.`
  );

  const sale = await env.ADMIN_DB.prepare(
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
      "Payment confirmed and sale created. Licence issuance is pending.",
    sale
  });
}

async function listSales(env) {
  const result = await env.ADMIN_DB.prepare(
    `
    SELECT
      s.*,
      i.pdf_file_url,
      i.email_sent AS invoice_email_sent,
      i.email_sent_at
    FROM sales s
    LEFT JOIN invoices i
      ON i.sale_id = s.id
    ORDER BY s.id DESC
    `
  ).all();

  return json({
    success: true,
    sales: result.results || []
  });
}

async function getSale(env, id) {
  const sale = await env.ADMIN_DB.prepare(
    `
    SELECT
      s.*,
      i.pdf_file_url,
      i.pdf_file_name,
      i.email_sent AS invoice_email_sent,
      i.email_sent_at
    FROM sales s
    LEFT JOIN invoices i
      ON i.sale_id = s.id
    WHERE s.id = ?
    LIMIT 1
    `
  )
    .bind(id)
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

function csvEscape(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  const text = String(value);

  if (
    text.includes(",") ||
    text.includes('"') ||
    text.includes("\n")
  ) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

async function exportSales(env) {
  const result = await env.ADMIN_DB.prepare(
    `
    SELECT
      id,
      sale_number,
      invoice_number,
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      church_organization,
      payment_date,
      payment_method,
      transaction_reference,
      total_paid_npr,
      licence_key,
      licence_type,
      licence_status,
      device_id,
      reset_count,
      invoice_sent,
      licence_email_sent,
      approved_at,
      notes
    FROM sales
    ORDER BY id ASC
    `
  ).all();

  const headers = [
    "S.N.",
    "Sale No.",
    "Invoice No.",
    "Customer Name",
    "Email",
    "Phone",
    "Address",
    "Church / Organization",
    "Payment Date",
    "Payment Method",
    "Transaction Reference",
    "Total Paid NPR",
    "Licence Key",
    "Licence Type",
    "Licence Status",
    "Device ID",
    "Reset Count",
    "Invoice Sent",
    "Licence Email Sent",
    "Approved Date",
    "Notes"
  ];

  const rows = (result.results || []).map(
    (row, index) => [
      index + 1,
      row.sale_number,
      row.invoice_number,
      row.customer_name,
      row.customer_email,
      row.customer_phone,
      row.customer_address,
      row.church_organization,
      row.payment_date,
      row.payment_method,
      row.transaction_reference,
      row.total_paid_npr,
      row.licence_key,
      row.licence_type,
      row.licence_status,
      row.device_id,
      row.reset_count,
      row.invoice_sent ? "Yes" : "No",
      row.licence_email_sent ? "Yes" : "No",
      row.approved_at,
      row.notes
    ]
  );

  const csv = [
    headers.map(csvEscape).join(","),
    ...rows.map(
      (row) =>
        row.map(csvEscape).join(",")
    )
  ].join("\r\n");

  const date = new Date()
    .toISOString()
    .slice(0, 10);

  return new Response(csv, {
    status: 200,
    headers: {
      "content-type":
        "text/csv; charset=UTF-8",
      "content-disposition":
        `attachment; filename="Mero_Mandali_Sales_${date}.csv"`,
      "cache-control": "no-store"
    }
  });
}

async function listActivity(env) {
  const result = await env.ADMIN_DB.prepare(
    `
    SELECT *
    FROM admin_activity
    ORDER BY id DESC
    LIMIT 200
    `
  ).all();

  return json({
    success: true,
    activity: result.results || []
  });
}

async function handleAdminApi(
  request,
  env,
  url
) {
  const denied = requireAdmin(request);

  if (denied) {
    return denied;
  }

  if (
    url.pathname ===
      "/api/admin/dashboard" &&
    request.method === "GET"
  ) {
    return getDashboard(env);
  }

  if (
    url.pathname ===
      "/api/admin/orders" &&
    request.method === "GET"
  ) {
    return listOrders(env, url);
  }

  const orderMatch =
    url.pathname.match(
      /^\/api\/admin\/orders\/(\d+)$/
    );

  if (
    orderMatch &&
    request.method === "GET"
  ) {
    return getOrder(
      env,
      Number(orderMatch[1])
    );
  }

  const orderStatusMatch =
    url.pathname.match(
      /^\/api\/admin\/orders\/(\d+)\/status$/
    );

  if (
    orderStatusMatch &&
    request.method === "PATCH"
  ) {
    return setOrderReviewStatus(
      request,
      env,
      Number(orderStatusMatch[1])
    );
  }

  const confirmMatch =
    url.pathname.match(
      /^\/api\/admin\/orders\/(\d+)\/confirm-payment$/
    );

  if (
    confirmMatch &&
    request.method === "POST"
  ) {
    return confirmPayment(
      request,
      env,
      Number(confirmMatch[1])
    );
  }

  if (
    url.pathname ===
      "/api/admin/sales" &&
    request.method === "GET"
  ) {
    return listSales(env);
  }

  const saleMatch =
    url.pathname.match(
      /^\/api\/admin\/sales\/(\d+)$/
    );

  if (
    saleMatch &&
    request.method === "GET"
  ) {
    return getSale(
      env,
      Number(saleMatch[1])
    );
  }

  if (
    url.pathname ===
      "/api/admin/export-sales" &&
    request.method === "GET"
  ) {
    return exportSales(env);
  }

  if (
    url.pathname ===
      "/api/admin/activity" &&
    request.method === "GET"
  ) {
    return listActivity(env);
  }

  return json(
    {
      success: false,
      error: "Admin API route not found."
    },
    404
  );
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {
      if (
        url.pathname === "/api/health" &&
        request.method === "GET"
      ) {
        return health(env);
      }

      if (
        url.pathname === "/api/orders" &&
        request.method === "POST"
      ) {
        return createOrder(
          request,
          env
        );
      }

      if (
        url.pathname.startsWith(
          "/api/admin/"
        )
      ) {
        return handleAdminApi(
          request,
          env,
          url
        );
      }

      return env.ASSETS.fetch(request);

    } catch (error) {
      console.error(error);

      return json(
        {
          success: false,
          error:
            "Internal server error."
        },
        500
      );
    }
  }
};
