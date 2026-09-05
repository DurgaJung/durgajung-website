import {
  PDFDocument,
  StandardFonts,
  rgb
} from "pdf-lib";

const ADMIN_EMAIL = "durgajung.nits@gmail.com";
const DEFAULT_PRODUCT_CODE = "MERO-MANDALI";

const LICENCE_API_URL =
  "https://mero-mandali-license-api.durgajung-nits.workers.dev/v1/admin/licenses";

const RESEND_API_URL =
  "https://api.resend.com/emails";

const EMAIL_FROM =
  "Mero Mandali <sales@durgajung.com.np>";

const INSTALLER_URL =
  "https://drive.google.com/file/d/15jbX7BILyFLin1GgkijR1UcxRM1AwRLF/view?usp=drive_link";

const GUIDE_URL =
  "https://durgajung.com.np/assets/mero-mandali/documents/Mero_Mandali_Programme_Operating_Guide_EN_NP.pdf";

const SOFTWARE_VERSION = "1.0.2";


function json(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "content-type":
          "application/json; charset=utf-8",
        "cache-control":
          "no-store"
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
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  const text =
    String(value).trim();

  return text === ""
    ? null
    : text;
}


function safeInt(
  value,
  fallback = 1
) {
  const number =
    Number.parseInt(
      value,
      10
    );

  return (
    Number.isFinite(number) &&
    number >= 1
  )
    ? number
    : fallback;
}


function currentYear() {
  return new Date()
    .getUTCFullYear();
}


function makeNumber(
  prefix,
  id
) {
  return (
    `${prefix}-${currentYear()}-` +
    String(id).padStart(
      5,
      "0"
    )
  );
}


function makeTemporaryNumber(
  prefix
) {
  return (
    `${prefix}-TMP-` +
    crypto.randomUUID()
  );
}


function getAdminEmail(
  request
) {
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


function requireAdmin(
  request
) {
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
    request.headers.get(
      "CF-Connecting-IP"
    ) ||
    request.headers.get(
      "X-Forwarded-For"
    ) ||
    ""
  );
}


function escapeHtml(
  value
) {
  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}


function pdfText(
  value
) {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    return "-";
  }

  return String(value)
    .normalize("NFKD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /[^\x20-\x7E]/g,
      "?"
    );
}


function npr(
  value
) {
  const number =
    Number(value || 0);

  return (
    "NPR " +
    number.toLocaleString(
      "en-US",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }
    )
  );
}


function normalDate(
  value
) {
  if (!clean(value)) {
    return "-";
  }

  const source =
    String(value);

  const date =
    new Date(
      source.includes("T")
        ? source
        : source.replace(
            " ",
            "T"
          ) + "Z"
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return source;
  }

  return date
    .toISOString()
    .slice(
      0,
      10
    );
}


function stablePdfDate(
  value
) {
  if (!clean(value)) {
    return new Date(
      "2026-01-01T00:00:00Z"
    );
  }

  const source =
    String(value);

  const date =
    new Date(
      source.includes("T")
        ? source
        : source.replace(
            " ",
            "T"
          ) + "Z"
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return new Date(
      "2026-01-01T00:00:00Z"
    );
  }

  return date;
}


function bytesToBase64(
  bytes
) {
  let binary = "";

  const chunkSize =
    0x8000;

  for (
    let i = 0;
    i < bytes.length;
    i += chunkSize
  ) {
    const chunk =
      bytes.subarray(
        i,
        Math.min(
          i + chunkSize,
          bytes.length
        )
      );

    binary +=
      String.fromCharCode(
        ...chunk
      );
  }

  return btoa(binary);
}


function licenceCertificateNumber(
  sale
) {
  const match =
    String(
      sale.sale_number || ""
    ).match(
      /^MM-SALE-(\d{4})-(\d{5})$/
    );

  if (match) {
    return (
      `MM-LIC-${match[1]}-${match[2]}`
    );
  }

  return (
    `MM-LIC-${String(
      sale.id
    ).padStart(5, "0")}`
  );
}


function drawText(
  page,
  text,
  x,
  y,
  options = {}
) {
  page.drawText(
    pdfText(text),
    {
      x,
      y,
      size:
        options.size || 10,
      font:
        options.font,
      color:
        options.color ||
        rgb(
          0.12,
          0.12,
          0.12
        )
    }
  );
}


function wrapPdfText(
  text,
  font,
  fontSize,
  maxWidth
) {
  const source =
    pdfText(text);

  const words =
    source.split(/\s+/);

  const lines = [];

  let line = "";

  for (
    const word of words
  ) {
    const candidate =
      line
        ? `${line} ${word}`
        : word;

    const width =
      font.widthOfTextAtSize(
        candidate,
        fontSize
      );

    if (
      width <= maxWidth
    ) {
      line =
        candidate;
    } else {
      if (line) {
        lines.push(line);
      }

      line = word;
    }
  }

  if (line) {
    lines.push(line);
  }

  return lines;
}


function drawWrappedText(
  page,
  text,
  x,
  y,
  maxWidth,
  options = {}
) {
  const font =
    options.font;

  const size =
    options.size || 10;

  const lineHeight =
    options.lineHeight ||
    size + 4;

  const lines =
    wrapPdfText(
      text,
      font,
      size,
      maxWidth
    );

  let currentY = y;

  for (
    const line of lines
  ) {
    drawText(
      page,
      line,
      x,
      currentY,
      {
        font,
        size,
        color:
          options.color
      }
    );

    currentY -=
      lineHeight;
  }

  return currentY;
}


function addPdfMetadata(
  pdfDoc,
  title,
  subject,
  date
) {
  pdfDoc.setTitle(
    title
  );

  pdfDoc.setAuthor(
    "Durga Jung Kunwar"
  );

  pdfDoc.setSubject(
    subject
  );

  pdfDoc.setCreator(
    "Mero Mandali Software"
  );

  pdfDoc.setProducer(
    "Mero Mandali Software"
  );

  pdfDoc.setCreationDate(
    date
  );

  pdfDoc.setModificationDate(
    date
  );
}


async function createInvoicePdf(
  sale,
  order
) {
  const pdfDoc =
    await PDFDocument.create();

  const font =
    await pdfDoc.embedFont(
      StandardFonts.Helvetica
    );

  const bold =
    await pdfDoc.embedFont(
      StandardFonts.HelveticaBold
    );

  addPdfMetadata(
    pdfDoc,
    `Invoice ${sale.invoice_number}`,
    "Official Mero Mandali Software Invoice",
    stablePdfDate(
      sale.approved_at ||
      sale.created_at
    )
  );

  const page =
    pdfDoc.addPage([
      595.28,
      841.89
    ]);

  const width =
    page.getWidth();

  const height =
    page.getHeight();

  page.drawRectangle({
    x: 0,
    y: height - 110,
    width,
    height: 110,
    color:
      rgb(
        0.06,
        0.16,
        0.29
      )
  });

  drawText(
    page,
    "MERO MANDALI",
    48,
    height - 55,
    {
      font: bold,
      size: 24,
      color:
        rgb(
          1,
          1,
          1
        )
    }
  );

  drawText(
    page,
    "OFFICIAL SOFTWARE INVOICE",
    48,
    height - 82,
    {
      font,
      size: 11,
      color:
        rgb(
          1,
          1,
          1
        )
    }
  );

  drawText(
    page,
    sale.invoice_number,
    390,
    height - 58,
    {
      font: bold,
      size: 12,
      color:
        rgb(
          1,
          1,
          1
        )
    }
  );

  let y =
    height - 150;

  drawText(
    page,
    "CUSTOMER",
    48,
    y,
    {
      font: bold,
      size: 11
    }
  );

  y -= 24;

  drawText(
    page,
    "Name:",
    48,
    y,
    {
      font: bold
    }
  );

  drawText(
    page,
    sale.customer_name,
    150,
    y,
    {
      font
    }
  );

  y -= 20;

  drawText(
    page,
    "Email:",
    48,
    y,
    {
      font: bold
    }
  );

  drawText(
    page,
    sale.customer_email,
    150,
    y,
    {
      font
    }
  );

  y -= 20;

  drawText(
    page,
    "Phone:",
    48,
    y,
    {
      font: bold
    }
  );

  drawText(
    page,
    sale.customer_phone,
    150,
    y,
    {
      font
    }
  );

  y -= 20;

  drawText(
    page,
    "Church / Organization:",
    48,
    y,
    {
      font: bold
    }
  );

  drawText(
    page,
    sale.church_organization,
    190,
    y,
    {
      font
    }
  );

  y -= 45;

  drawText(
    page,
    "TRANSACTION DETAILS",
    48,
    y,
    {
      font: bold,
      size: 11
    }
  );

  y -= 24;

  const transactionRows = [
    [
      "Sale Number",
      sale.sale_number
    ],
    [
      "Order Number",
      order?.order_number ||
      sale.order_id
    ],
    [
      "Payment Method",
      sale.payment_method
    ],
    [
      "Transaction Reference",
      sale.transaction_reference
    ],
    [
      "Payment Date",
      normalDate(
        sale.payment_date
      )
    ]
  ];

  for (
    const row of transactionRows
  ) {
    drawText(
      page,
      `${row[0]}:`,
      48,
      y,
      {
        font: bold
      }
    );

    drawText(
      page,
      row[1],
      190,
      y,
      {
        font
      }
    );

    y -= 20;
  }

  y -= 25;

  page.drawRectangle({
    x: 48,
    y: y - 66,
    width:
      width - 96,
    height: 78,
    borderWidth: 1,
    borderColor:
      rgb(
        0.75,
        0.75,
        0.75
      )
  });

  drawText(
    page,
    "PRODUCT",
    60,
    y,
    {
      font: bold
    }
  );

  drawText(
    page,
    "QTY",
    360,
    y,
    {
      font: bold
    }
  );

  drawText(
    page,
    "TOTAL",
    435,
    y,
    {
      font: bold
    }
  );

  y -= 28;

  drawText(
    page,
    `${sale.product_name} ${SOFTWARE_VERSION}`,
    60,
    y,
    {
      font
    }
  );

  drawText(
    page,
    sale.quantity || 1,
    365,
    y,
    {
      font
    }
  );

  drawText(
    page,
    npr(
      sale.total_paid_npr
    ),
    435,
    y,
    {
      font: bold
    }
  );

  y -= 80;

  drawText(
    page,
    "FINAL TOTAL PAID",
    325,
    y,
    {
      font: bold,
      size: 12
    }
  );

  drawText(
    page,
    npr(
      sale.total_paid_npr
    ),
    445,
    y,
    {
      font: bold,
      size: 12
    }
  );

  y -= 45;

  drawWrappedText(
    page,
    "This invoice confirms payment for Mero Mandali Software. The amount shown above is the final purchase price. No VAT breakdown is applied.",
    48,
    y,
    width - 96,
    {
      font,
      size: 9,
      lineHeight: 13
    }
  );

  drawText(
    page,
    "AUTHORIZED BY",
    48,
    150,
    {
      font: bold,
      size: 10
    }
  );

  drawText(
    page,
    "Durga Jung Kunwar",
    48,
    125,
    {
      font: bold,
      size: 14
    }
  );

  drawText(
    page,
    "Developer / Owner - Mero Mandali Software",
    48,
    107,
    {
      font,
      size: 9
    }
  );

  drawText(
    page,
    "developer@durgajung.com.np",
    48,
    91,
    {
      font,
      size: 9
    }
  );

  drawText(
    page,
    "durgajung.com.np",
    48,
    75,
    {
      font,
      size: 9
    }
  );

  drawText(
    page,
    "Official electronically generated and authorized invoice.",
    325,
    75,
    {
      font,
      size: 8
    }
  );

  return await pdfDoc.save();
}


async function createLicenceCertificatePdf(
  sale,
  order
) {
  const pdfDoc =
    await PDFDocument.create();

  const font =
    await pdfDoc.embedFont(
      StandardFonts.Helvetica
    );

  const bold =
    await pdfDoc.embedFont(
      StandardFonts.HelveticaBold
    );

  const certificateNumber =
    licenceCertificateNumber(
      sale
    );

  addPdfMetadata(
    pdfDoc,
    `Mero Mandali Licence Certificate ${certificateNumber}`,
    "Official Mero Mandali Customer Software Licence Certificate",
    stablePdfDate(
      sale.approved_at ||
      sale.created_at
    )
  );

  const page =
    pdfDoc.addPage([
      595.28,
      841.89
    ]);

  const width =
    page.getWidth();

  const height =
    page.getHeight();

  page.drawRectangle({
    x: 28,
    y: 28,
    width:
      width - 56,
    height:
      height - 56,
    borderWidth: 2,
    borderColor:
      rgb(
        0.12,
        0.27,
        0.43
      )
  });

  drawText(
    page,
    "MERO MANDALI SOFTWARE",
    48,
    height - 75,
    {
      font: bold,
      size: 24,
      color:
        rgb(
          0.08,
          0.20,
          0.36
        )
    }
  );

  drawText(
    page,
    "CUSTOMER LICENCE CERTIFICATE",
    48,
    height - 108,
    {
      font: bold,
      size: 15
    }
  );

  drawText(
    page,
    certificateNumber,
    390,
    height - 108,
    {
      font,
      size: 9
    }
  );

  let y =
    height - 155;

  const rows = [
    [
      "Customer Name",
      sale.customer_name
    ],
    [
      "Customer Email",
      sale.customer_email
    ],
    [
      "Customer Phone",
      sale.customer_phone
    ],
    [
      "Church / Organization",
      sale.church_organization
    ],
    [
      "Software",
      "Mero Mandali"
    ],
    [
      "Version",
      SOFTWARE_VERSION
    ],
    [
      "Licence Type",
      "Customer Licence"
    ],
    [
      "Authorized Computers",
      "One Windows PC"
    ],
    [
      "Sale Number",
      sale.sale_number
    ],
    [
      "Order Number",
      order?.order_number ||
      sale.order_id
    ],
    [
      "Invoice Number",
      sale.invoice_number
    ]
  ];

  for (
    const row of rows
  ) {
    drawText(
      page,
      `${row[0]}:`,
      55,
      y,
      {
        font: bold,
        size: 9
      }
    );

    drawText(
      page,
      row[1],
      205,
      y,
      {
        font,
        size: 9
      }
    );

    y -= 21;
  }

  y -= 12;

  drawText(
    page,
    "LICENCE KEY",
    55,
    y,
    {
      font: bold,
      size: 11
    }
  );

  y -= 34;

  page.drawRectangle({
    x: 55,
    y: y - 12,
    width:
      width - 110,
    height: 44,
    color:
      rgb(
        0.94,
        0.96,
        0.98
      ),
    borderWidth: 1,
    borderColor:
      rgb(
        0.25,
        0.40,
        0.55
      )
  });

  drawText(
    page,
    sale.licence_key,
    75,
    y + 4,
    {
      font: bold,
      size: 16,
      color:
        rgb(
          0.06,
          0.16,
          0.29
        )
    }
  );

  y -= 70;

  drawText(
    page,
    "LICENCE TERMS",
    55,
    y,
    {
      font: bold,
      size: 11
    }
  );

  y -= 22;

  const terms = [
    "1. This Customer Licence authorizes activation on one Windows PC only.",
    "2. The licence key must not be shared, sold, copied, or used on another computer.",
    "3. If the authorized computer is permanently replaced, contact Mero Mandali support for a licence reset.",
    "4. The licence remains subject to Mero Mandali Software licence conditions and valid activation status."
  ];

  for (
    const term of terms
  ) {
    y =
      drawWrappedText(
        page,
        term,
        55,
        y,
        width - 110,
        {
          font,
          size: 9,
          lineHeight: 13
        }
      ) - 8;
  }

  y -= 5;

  drawText(
    page,
    "PURCHASE INCLUDES",
    55,
    y,
    {
      font: bold,
      size: 11
    }
  );

  y -= 22;

  const includes = [
    "Mero Mandali Software version 1.0.2",
    "Unique customer licence key",
    "Official purchase invoice",
    "Customer licence certificate",
    "English + Nepali Installation, Setup & Programme Operating Guide",
    "Windows installer download access"
  ];

  for (
    const item of includes
  ) {
    drawText(
      page,
      `- ${item}`,
      65,
      y,
      {
        font,
        size: 9
      }
    );

    y -= 17;
  }

  drawText(
    page,
    "AUTHORIZED BY",
    55,
    135,
    {
      font: bold,
      size: 9
    }
  );

  drawText(
    page,
    "Durga Jung Kunwar",
    55,
    110,
    {
      font: bold,
      size: 14
    }
  );

  drawText(
    page,
    "Developer / Owner - Mero Mandali Software",
    55,
    92,
    {
      font,
      size: 9
    }
  );

  drawText(
    page,
    "developer@durgajung.com.np | durgajung.com.np",
    55,
    75,
    {
      font,
      size: 9
    }
  );

  return {
    bytes:
      await pdfDoc.save(),

    certificateNumber
  };
}


async function recordAdminActivity(
  env,
  request,
  action,
  entityType = null,
  entityId = null,
  description = null
) {
  try {
    await env.ADMIN_DB
      .prepare(`
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
      `)
      .bind(
        getAdminEmail(request) ||
          ADMIN_EMAIL,
        action,
        entityType,
        entityId,
        description,
        clientIp(request),
        request.headers.get(
          "User-Agent"
        ) || ""
      )
      .run();
  } catch (error) {
    console.error(
      "Admin activity logging failed:",
      error
    );
  }
}


async function getProductByCode(
  env,
  productCode
) {
  return await env.ADMIN_DB
    .prepare(`
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
    `)
    .bind(
      productCode
    )
    .first();
}


async function getSaleById(
  env,
  saleId
) {
  return await env.ADMIN_DB
    .prepare(`
      SELECT *
      FROM sales
      WHERE id = ?
      LIMIT 1
    `)
    .bind(
      saleId
    )
    .first();
}


async function getOrderById(
  env,
  orderId
) {
  return await env.ADMIN_DB
    .prepare(`
      SELECT *
      FROM orders
      WHERE id = ?
      LIMIT 1
    `)
    .bind(
      orderId
    )
    .first();
}


async function ensureCustomerLicence(
  env,
  sale
) {
  if (
    !sale ||
    sale.product_type !==
      "software"
  ) {
    return {
      success: true,
      sale
    };
  }

  if (
    !clean(
      env.LICENSE_API_ADMIN_KEY
    )
  ) {
    return {
      success: false,
      status: 500,
      error:
        "LICENSE_API_ADMIN_KEY is not configured."
    };
  }

  if (
    clean(
      sale.licence_key
    ) &&
    sale.licence_status ===
      "issued"
  ) {
    return {
      success: true,
      sale
    };
  }

  const marker =
    `Website sale ${sale.sale_number}`;

  const headers = {
    "content-type":
      "application/json; charset=utf-8",
    "X-Admin-Key":
      env.LICENSE_API_ADMIN_KEY
  };

  /*
   * Retry protection:
   * check whether this Sale already
   * has a licence in the licence API.
   */
  try {
    const lookupResponse =
      await fetch(
        LICENCE_API_URL,
        {
          method: "GET",
          headers
        }
      );

    if (
      lookupResponse.ok
    ) {
      const payload =
        await lookupResponse.json();

      const licences =
        Array.isArray(
          payload?.licenses
        )
          ? payload.licenses
          : Array.isArray(
              payload?.results
            )
            ? payload.results
            : [];

      const existing =
        licences.find(
          (item) => {
            const notes =
              clean(
                item?.notes
              ) || "";

            return notes.includes(
              marker
            );
          }
        );

      const existingKey =
        clean(
          existing?.license_key
        );

      if (existingKey) {
        await env.ADMIN_DB
          .prepare(`
            UPDATE sales
            SET
              licence_key = ?,
              licence_status = 'issued',
              reset_count =
                COALESCE(
                  reset_count,
                  0
                ),
              updated_at =
                CURRENT_TIMESTAMP
            WHERE id = ?
          `)
          .bind(
            existingKey,
            sale.id
          )
          .run();

        return {
          success: true,
          sale:
            await getSaleById(
              env,
              sale.id
            )
        };
      }
    }
  } catch (error) {
    console.error(
      "Licence lookup failed before issue:",
      error
    );
  }

  await env.ADMIN_DB
    .prepare(`
      UPDATE sales
      SET
        licence_status =
          'issuing',
        updated_at =
          CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    .bind(
      sale.id
    )
    .run();

  let response;
  let payload = {};

  try {
    response =
      await fetch(
        LICENCE_API_URL,
        {
          method: "POST",
          headers,
          body:
            JSON.stringify({
              customer_name:
                sale.customer_name,
              customer_email:
                sale.customer_email,
              status:
                "active",
              notes:
                `${marker}; invoice ${sale.invoice_number || ""}; order ${sale.order_id}.`
            })
        }
      );

    try {
      payload =
        await response.json();
    } catch {
      payload = {};
    }
  } catch (error) {
    await env.ADMIN_DB
      .prepare(`
        UPDATE sales
        SET
          licence_status =
            'issue_failed',
          updated_at =
            CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      .bind(
        sale.id
      )
      .run();

    return {
      success: false,
      status: 502,
      error:
        `Licence API request failed: ${error.message}`
    };
  }

  const licenceKey =
    clean(
      payload?.license
        ?.license_key
    );

  if (
    !response.ok ||
    payload?.success !== true ||
    !licenceKey
  ) {
    await env.ADMIN_DB
      .prepare(`
        UPDATE sales
        SET
          licence_status =
            'issue_failed',
          updated_at =
            CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      .bind(
        sale.id
      )
      .run();

    return {
      success: false,
      status:
        response.status || 502,
      error:
        payload?.error ||
        "Licence API did not create the customer licence."
    };
  }

  await env.ADMIN_DB
    .prepare(`
      UPDATE sales
      SET
        licence_key = ?,
        licence_status =
          'issued',
        reset_count =
          COALESCE(
            reset_count,
            0
          ),
        updated_at =
          CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    .bind(
      licenceKey,
      sale.id
    )
    .run();

  return {
    success: true,
    sale:
      await getSaleById(
        env,
        sale.id
      )
  };
}


function deliveryAlreadySent(
  sale
) {
  return (
    Number(
      sale.invoice_sent || 0
    ) === 1 &&
    Number(
      sale.licence_email_sent || 0
    ) === 1 &&
    Number(
      sale.installer_sent || 0
    ) === 1 &&
    Number(
      sale.installation_guide_sent ||
      0
    ) === 1 &&
    Number(
      sale.user_manual_sent || 0
    ) === 1
  );
}


function makeCustomerEmailHtml(
  sale,
  order,
  certificateNumber
) {
  const name =
    escapeHtml(
      sale.customer_name ||
      "Customer"
    );

  const licenceKey =
    escapeHtml(
      sale.licence_key
    );

  const invoiceNumber =
    escapeHtml(
      sale.invoice_number
    );

  const saleNumber =
    escapeHtml(
      sale.sale_number
    );

  const orderNumber =
    escapeHtml(
      order?.order_number ||
      sale.order_id
    );

  const amount =
    escapeHtml(
      npr(
        sale.total_paid_npr
      )
    );

  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
</head>

<body style="
  margin:0;
  padding:0;
  background:#f4f6f8;
  font-family:Arial,Helvetica,sans-serif;
  color:#1f2937;
">
  <div style="
    max-width:680px;
    margin:0 auto;
    padding:28px 16px;
  ">

    <div style="
      background:#102a47;
      color:#ffffff;
      padding:28px;
      border-radius:12px 12px 0 0;
    ">
      <div style="
        font-size:25px;
        font-weight:700;
      ">
        Mero Mandali
      </div>

      <div style="
        margin-top:6px;
        font-size:14px;
        opacity:.9;
      ">
        Church Presentation Software
      </div>
    </div>

    <div style="
      background:#ffffff;
      padding:30px;
      border-radius:0 0 12px 12px;
    ">

      <p>Dear <strong>${name}</strong>,</p>

      <p>
        Thank you for purchasing
        <strong>Mero Mandali Software</strong>.
        Your payment has been verified and
        your customer licence has been issued.
      </p>

      <div style="
        margin:25px 0;
        padding:20px;
        background:#f2f6fa;
        border:1px solid #d9e2ec;
        border-radius:8px;
      ">
        <div style="
          font-size:12px;
          font-weight:700;
          color:#52606d;
        ">
          YOUR MERO MANDALI LICENCE KEY
        </div>

        <div style="
          margin-top:10px;
          font-size:22px;
          font-weight:700;
          letter-spacing:1px;
          color:#102a47;
          word-break:break-all;
        ">
          ${licenceKey}
        </div>
      </div>

      <table style="
        width:100%;
        border-collapse:collapse;
        font-size:14px;
        margin:20px 0;
      ">
        <tr>
          <td style="padding:6px 0;font-weight:700;">
            Invoice
          </td>
          <td style="padding:6px 0;">
            ${invoiceNumber}
          </td>
        </tr>

        <tr>
          <td style="padding:6px 0;font-weight:700;">
            Licence Certificate
          </td>
          <td style="padding:6px 0;">
            ${escapeHtml(
              certificateNumber
            )}
          </td>
        </tr>

        <tr>
          <td style="padding:6px 0;font-weight:700;">
            Sale
          </td>
          <td style="padding:6px 0;">
            ${saleNumber}
          </td>
        </tr>

        <tr>
          <td style="padding:6px 0;font-weight:700;">
            Order
          </td>
          <td style="padding:6px 0;">
            ${orderNumber}
          </td>
        </tr>

        <tr>
          <td style="padding:6px 0;font-weight:700;">
            Total Paid
          </td>
          <td style="padding:6px 0;">
            ${amount}
          </td>
        </tr>
      </table>

      <div style="
        margin:25px 0;
        text-align:center;
      ">
        <a
          href="${INSTALLER_URL}"
          style="
            display:inline-block;
            background:#102a47;
            color:#ffffff;
            text-decoration:none;
            padding:14px 24px;
            border-radius:7px;
            font-weight:700;
          "
        >
          Download Mero Mandali ${SOFTWARE_VERSION}
        </a>
      </div>

      <p>
        <strong>Important:</strong>
        one Customer Licence is authorized
        for one Windows PC.
        If you permanently replace your computer,
        please contact us so the existing device
        binding can be reviewed and reset.
      </p>

      <p>
        The following documents are included
        with this email:
      </p>

      <ul>
        <li>Official Invoice PDF</li>
        <li>Customer Licence Certificate PDF</li>
        <li>
          English + Nepali Installation,
          Setup & Programme Operating Guide
        </li>
      </ul>

      <p>
        Keep your licence key and certificate
        in a safe place.
      </p>

      <hr style="
        border:0;
        border-top:1px solid #e5e7eb;
        margin:28px 0;
      ">

      <p style="margin-bottom:4px;">
        <strong>Durga Jung Kunwar</strong>
      </p>

      <p style="
        margin-top:0;
        color:#52606d;
        font-size:13px;
        line-height:1.6;
      ">
        Developer / Owner - Mero Mandali Software<br>
        developer@durgajung.com.np<br>
        durgajung.com.np
      </p>
    </div>
  </div>
</body>
</html>
  `;
}


function makeCustomerEmailText(
  sale,
  order,
  certificateNumber
) {
  return `
MERO MANDALI SOFTWARE

Dear ${sale.customer_name || "Customer"},

Thank you for purchasing Mero Mandali Software.

Your payment has been verified and your customer licence has been issued.

LICENCE KEY:
${sale.licence_key}

Invoice:
${sale.invoice_number}

Licence Certificate:
${certificateNumber}

Sale:
${sale.sale_number}

Order:
${order?.order_number || sale.order_id}

Total Paid:
${npr(sale.total_paid_npr)}

Download Mero Mandali ${SOFTWARE_VERSION}:
${INSTALLER_URL}

IMPORTANT:
One Customer Licence is authorized for one Windows PC.

If you permanently replace your computer, please contact us so the existing device binding can be reviewed and reset.

Attachments:
- Official Invoice PDF
- Customer Licence Certificate PDF
- English + Nepali Installation, Setup & Programme Operating Guide

Durga Jung Kunwar
Developer / Owner - Mero Mandali Software
developer@durgajung.com.np
durgajung.com.np
  `.trim();
}


async function sendCustomerDelivery(
  request,
  env,
  sale
) {
  if (
    !sale ||
    sale.product_type !==
      "software"
  ) {
    return {
      success: true,
      sale
    };
  }

  if (
    sale.licence_status !==
      "issued" ||
    !clean(
      sale.licence_key
    )
  ) {
    return {
      success: false,
      status: 400,
      error:
        "Customer licence must be issued before email delivery."
    };
  }

  if (
    deliveryAlreadySent(
      sale
    )
  ) {
    return {
      success: true,
      already_sent: true,
      sale
    };
  }

  if (
    !clean(
      env.RESEND_API_KEY
    )
  ) {
    return {
      success: false,
      status: 500,
      error:
        "RESEND_API_KEY is not configured."
    };
  }

  if (
    !clean(
      sale.customer_email
    )
  ) {
    return {
      success: false,
      status: 400,
      error:
        "Customer email is missing."
    };
  }

  const order =
    await getOrderById(
      env,
      sale.order_id
    );

  let invoiceBytes;
  let licenceDocument;

  try {
    invoiceBytes =
      await createInvoicePdf(
        sale,
        order
      );

    licenceDocument =
      await createLicenceCertificatePdf(
        sale,
        order
      );
  } catch (error) {
    await recordAdminActivity(
      env,
      request,
      "CUSTOMER_DOCUMENT_GENERATION_FAILED",
      "sale",
      sale.id,
      `${sale.sale_number}: ${error.message}`
    );

    return {
      success: false,
      status: 500,
      error:
        `Customer PDF generation failed: ${error.message}`
    };
  }

  const emailPayload = {
    from:
      EMAIL_FROM,

    to: [
      sale.customer_email
    ],

    subject:
      `Mero Mandali Purchase Complete - ${sale.invoice_number}`,

    html:
      makeCustomerEmailHtml(
        sale,
        order,
        licenceDocument
          .certificateNumber
      ),

    text:
      makeCustomerEmailText(
        sale,
        order,
        licenceDocument
          .certificateNumber
      ),

    attachments: [
      {
        content:
          bytesToBase64(
            invoiceBytes
          ),

        filename:
          `${sale.invoice_number}.pdf`
      },

      {
        content:
          bytesToBase64(
            licenceDocument.bytes
          ),

        filename:
          `${licenceDocument.certificateNumber}.pdf`
      },

      {
        path:
          GUIDE_URL,

        filename:
          "Mero_Mandali_Programme_Operating_Guide_EN_NP.pdf"
      }
    ]
  };

  const idempotencyKey =
    `mero-mandali-delivery-${sale.id}-${sale.invoice_number}`;

  let response;
  let payload = {};

  try {
    response =
      await fetch(
        RESEND_API_URL,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${env.RESEND_API_KEY}`,

            "Content-Type":
              "application/json",

            "Idempotency-Key":
              idempotencyKey
          },

          body:
            JSON.stringify(
              emailPayload
            )
        }
      );

    try {
      payload =
        await response.json();
    } catch {
      payload = {};
    }
  } catch (error) {
    await recordAdminActivity(
      env,
      request,
      "CUSTOMER_EMAIL_FAILED",
      "sale",
      sale.id,
      `${sale.sale_number}: Resend request failed - ${error.message}`
    );

    return {
      success: false,
      status: 502,
      error:
        `Resend request failed: ${error.message}`
    };
  }

  if (
    !response.ok ||
    !clean(
      payload?.id
    )
  ) {
    const errorMessage =
      payload?.message ||
      payload?.error ||
      `Resend returned HTTP ${response.status}.`;

    await recordAdminActivity(
      env,
      request,
      "CUSTOMER_EMAIL_FAILED",
      "sale",
      sale.id,
      `${sale.sale_number}: ${errorMessage}`
    );

    return {
      success: false,
      status:
        response.status || 502,
      error:
        `Customer email was not sent: ${errorMessage}`
    };
  }

  /*
   * Mark delivery only AFTER
   * Resend has accepted the email.
   */
  await env.ADMIN_DB
    .prepare(`
      UPDATE sales
      SET
        invoice_sent = 1,
        licence_email_sent = 1,
        installer_sent = 1,
        installation_guide_sent = 1,
        user_manual_sent = 1,
        delivery_status = 'delivered',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    .bind(
      sale.id
    )
    .run();

  const updatedSale =
    await getSaleById(
      env,
      sale.id
    );

  await recordAdminActivity(
    env,
    request,
    "CUSTOMER_EMAIL_SENT",
    "sale",
    sale.id,
    `${sale.sale_number}: purchase email sent to ${sale.customer_email}; Resend email ${payload.id}.`
  );

  return {
    success: true,
    email_id:
      payload.id,
    sale:
      updatedSale
  };
}


async function health(
  env
) {
  try {
    await env.ADMIN_DB
      .prepare(
        "SELECT 1 AS ok"
      )
      .first();

    return json({
      success: true,
      service:
        "Durga Jung Admin API",
      database:
        "online",
      platform:
        "Software and Books"
    });
  } catch (error) {
    return json(
      {
        success: false,
        service:
          "Durga Jung Admin API",
        database:
          "offline",
        error:
          error.message
      },
      500
    );
  }
}


async function publicProducts(
  env
) {
  const result =
    await env.ADMIN_DB
      .prepare(`
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
        ORDER BY
          product_type,
          product_name
      `)
      .all();

  return json({
    success: true,
    products:
      result.results || []
  });
}


async function createOrder(
  request,
  env
) {
  const body =
    await readJson(
      request
    );

  const customerName =
    clean(
      body.customer_name
    );

  const customerEmail =
    clean(
      body.customer_email
    );

  const paymentMethod =
    clean(
      body.payment_method
    );

  if (!customerName) {
    return json(
      {
        success: false,
        error:
          "Customer name is required."
      },
      400
    );
  }

  if (!customerEmail) {
    return json(
      {
        success: false,
        error:
          "Customer email is required."
      },
      400
    );
  }

  if (!paymentMethod) {
    return json(
      {
        success: false,
        error:
          "Payment method is required."
      },
      400
    );
  }

  const productCode =
    clean(
      body.product_code
    ) ||
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
        error:
          "Product not found."
      },
      404
    );
  }

  if (
    product.status !==
      "active"
  ) {
    return json(
      {
        success: false,
        error:
          "This product is not currently available."
      },
      400
    );
  }

  const quantity =
    safeInt(
      body.quantity,
      1
    );

  const unitPrice =
    Number(
      product.price_npr || 0
    );

  const totalAmount =
    unitPrice * quantity;

  const temporaryOrderNumber =
    makeTemporaryNumber(
      "ORDER"
    );

  const orderInsert =
    await env.ADMIN_DB
      .prepare(`
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
          ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          'pending',
          ?, ?,
          'pending'
        )
      `)
      .bind(
        temporaryOrderNumber,
        product.product_code,
        product.product_name,
        product.product_type,
        customerName,
        customerEmail,
        clean(
          body.customer_phone
        ),
        clean(
          body.customer_address
        ),
        clean(
          body.church_organization
        ),
        totalAmount,
        quantity,
        unitPrice,
        clean(
          body.delivery_format
        ),
        clean(
          body.delivery_method
        ),
        clean(
          body.tracking_reference
        ),
        clean(
          body.customer_notes
        )
      )
      .run();

  const orderId =
    Number(
      orderInsert.meta
        .last_row_id
    );

  const orderNumber =
    makeNumber(
      "MM-ORD",
      orderId
    );

  await env.ADMIN_DB
    .prepare(`
      UPDATE orders
      SET
        order_number = ?,
        updated_at =
          CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    .bind(
      orderNumber,
      orderId
    )
    .run();

  const paymentInsert =
    await env.ADMIN_DB
      .prepare(`
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
        VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          'submitted'
        )
      `)
      .bind(
        orderId,
        paymentMethod,
        clean(
          body.transaction_reference
        ),
        totalAmount,
        clean(
          body.payment_date
        ),
        clean(
          body.receipt_file_url
        ),
        clean(
          body.receipt_file_name
        )
      )
      .run();

  return json(
    {
      success: true,
      message:
        "Payment submission received for verification.",

      order: {
        id:
          orderId,
        order_number:
          orderNumber,
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
          paymentInsert.meta
            .last_row_id
        )
    },
    201
  );
}


async function adminDashboard(
  env
) {
  const pendingOrders =
    await env.ADMIN_DB
      .prepare(`
        SELECT COUNT(*) AS count
        FROM orders
        WHERE status IN (
          'pending',
          'under_review'
        )
      `)
      .first();

  const confirmedPayments =
    await env.ADMIN_DB
      .prepare(`
        SELECT COUNT(*) AS count
        FROM payments
        WHERE status = 'confirmed'
      `)
      .first();

  const sales =
    await env.ADMIN_DB
      .prepare(`
        SELECT
          COUNT(*) AS count,
          COALESCE(
            SUM(total_paid_npr),
            0
          ) AS total
        FROM sales
      `)
      .first();

  const pendingLicences =
    await env.ADMIN_DB
      .prepare(`
        SELECT COUNT(*) AS count
        FROM sales
        WHERE
          product_type = 'software'
          AND (
            licence_status IS NULL
            OR licence_status IN (
              'pending',
              'not_issued',
              'issuing',
              'issue_failed'
            )
          )
      `)
      .first();

  const softwareProducts =
    await env.ADMIN_DB
      .prepare(`
        SELECT COUNT(*) AS count
        FROM products
        WHERE
          product_type = 'software'
          AND status = 'active'
      `)
      .first();

  const bookProducts =
    await env.ADMIN_DB
      .prepare(`
        SELECT COUNT(*) AS count
        FROM products
        WHERE
          product_type = 'book'
          AND status = 'active'
      `)
      .first();

  return json({
    success: true,

    dashboard: {
      pending_orders:
        Number(
          pendingOrders?.count ||
          0
        ),

      confirmed_payments:
        Number(
          confirmedPayments
            ?.count || 0
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
          pendingLicences
            ?.count || 0
        ),

      active_software:
        Number(
          softwareProducts
            ?.count || 0
        ),

      active_books:
        Number(
          bookProducts?.count ||
          0
        )
    }
  });
}


async function adminProducts(
  env
) {
  const result =
    await env.ADMIN_DB
      .prepare(`
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
        ORDER BY
          product_type,
          product_name
      `)
      .all();

  return json({
    success: true,
    products:
      result.results || []
  });
}


async function adminSoftware(
  env
) {
  const result =
    await env.ADMIN_DB
      .prepare(`
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

        WHERE
          p.product_type =
            'software'

        ORDER BY
          p.product_name
      `)
      .all();

  return json({
    success: true,
    software:
      result.results || []
  });
}


async function adminBooks(
  env
) {
  const result =
    await env.ADMIN_DB
      .prepare(`
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

        WHERE
          p.product_type =
            'book'

        ORDER BY
          p.product_name
      `)
      .all();

  return json({
    success: true,
    books:
      result.results || []
  });
}


async function adminOrders(
  env
) {
  const result =
    await env.ADMIN_DB
      .prepare(`
        SELECT
          o.*,

          p.id AS payment_id,
          p.payment_method,
          p.transaction_reference,
          p.payment_date,
          p.receipt_file_url,
          p.receipt_file_name,
          p.status AS payment_status,
          p.admin_notes
            AS payment_admin_notes

        FROM orders o

        LEFT JOIN payments p
          ON p.id = (
            SELECT p2.id
            FROM payments p2
            WHERE
              p2.order_id = o.id
            ORDER BY
              p2.id DESC
            LIMIT 1
          )

        ORDER BY
          o.id DESC
      `)
      .all();

  return json({
    success: true,
    orders:
      result.results || []
  });
}


async function adminGetOrder(
  env,
  orderId
) {
  const order =
    await env.ADMIN_DB
      .prepare(`
        SELECT
          o.*,

          p.id AS payment_id,
          p.payment_method,
          p.transaction_reference,
          p.payment_date,
          p.receipt_file_url,
          p.receipt_file_name,
          p.status AS payment_status,
          p.admin_notes
            AS payment_admin_notes,
          p.confirmed_at
            AS payment_confirmed_at

        FROM orders o

        LEFT JOIN payments p
          ON p.id = (
            SELECT p2.id
            FROM payments p2
            WHERE
              p2.order_id = o.id
            ORDER BY
              p2.id DESC
            LIMIT 1
          )

        WHERE
          o.id = ?

        LIMIT 1
      `)
      .bind(
        orderId
      )
      .first();

  if (!order) {
    return json(
      {
        success: false,
        error:
          "Order not found."
      },
      404
    );
  }

  return json({
    success: true,
    order
  });
}


async function adminSetOrderStatus(
  request,
  env,
  orderId
) {
  const body =
    await readJson(
      request
    );

  const status =
    clean(
      body.status
    );

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
    !allowedStatuses.includes(
      status
    )
  ) {
    return json(
      {
        success: false,
        error:
          "Invalid order status."
      },
      400
    );
  }

  const existing =
    await env.ADMIN_DB
      .prepare(`
        SELECT
          id,
          order_number
        FROM orders
        WHERE id = ?
      `)
      .bind(
        orderId
      )
      .first();

  if (!existing) {
    return json(
      {
        success: false,
        error:
          "Order not found."
      },
      404
    );
  }

  await env.ADMIN_DB
    .prepare(`
      UPDATE orders
      SET
        status = ?,
        admin_notes = ?,

        reviewed_at =
          CASE
            WHEN ? =
              'under_review'
            THEN
              CURRENT_TIMESTAMP
            ELSE
              reviewed_at
          END,

        approved_at =
          CASE
            WHEN ? =
              'approved'
            THEN
              CURRENT_TIMESTAMP
            ELSE
              approved_at
          END,

        rejected_at =
          CASE
            WHEN ? =
              'rejected'
            THEN
              CURRENT_TIMESTAMP
            ELSE
              rejected_at
          END,

        completed_at =
          CASE
            WHEN ? =
              'completed'
            THEN
              CURRENT_TIMESTAMP
            ELSE
              completed_at
          END,

        updated_at =
          CURRENT_TIMESTAMP

      WHERE id = ?
    `)
    .bind(
      status,
      clean(
        body.admin_notes
      ),
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


async function adminConfirmPayment(
  request,
  env,
  orderId
) {
  const body =
    await readJson(
      request
    );

  const order =
    await env.ADMIN_DB
      .prepare(`
        SELECT *
        FROM orders
        WHERE id = ?
        LIMIT 1
      `)
      .bind(
        orderId
      )
      .first();

  if (!order) {
    return json(
      {
        success: false,
        error:
          "Order not found."
      },
      404
    );
  }

  /*
   * Existing Sale:
   * never create a duplicate.
   */
  let existingSale =
    await env.ADMIN_DB
      .prepare(`
        SELECT *
        FROM sales
        WHERE order_id = ?
        LIMIT 1
      `)
      .bind(
        orderId
      )
      .first();

  if (existingSale) {
    /*
     * Retry licence issuance if needed.
     */
    if (
      existingSale.product_type ===
        "software" &&
      existingSale.licence_status !==
        "issued"
    ) {
      const licenceResult =
        await ensureCustomerLicence(
          env,
          existingSale
        );

      if (
        !licenceResult.success
      ) {
        await recordAdminActivity(
          env,
          request,
          "LICENCE_ISSUE_FAILED",
          "sale",
          existingSale.id,
          `${existingSale.sale_number}: ${licenceResult.error}`
        );

        return json(
          {
            success: false,
            payment_confirmed:
              true,
            sale_created:
              true,
            error:
              licenceResult.error,
            sale:
              await getSaleById(
                env,
                existingSale.id
              )
          },
          licenceResult.status ||
          502
        );
      }

      existingSale =
        licenceResult.sale;

      await recordAdminActivity(
        env,
        request,
        "LICENCE_ISSUED",
        "sale",
        existingSale.id,
        `${existingSale.sale_number}: customer licence issued.`
      );
    }

    /*
     * If licence exists but delivery
     * was not completed, retry email.
     */
    if (
      existingSale.product_type ===
        "software"
    ) {
      const deliveryResult =
        await sendCustomerDelivery(
          request,
          env,
          existingSale
        );

      if (
        !deliveryResult.success
      ) {
        return json(
          {
            success: false,
            payment_confirmed:
              true,
            sale_created:
              true,
            licence_issued:
              existingSale
                .licence_status ===
              "issued",
            email_sent:
              false,
            error:
              deliveryResult.error,
            sale:
              await getSaleById(
                env,
                existingSale.id
              )
          },
          deliveryResult.status ||
          502
        );
      }

      return json({
        success: true,

        message:
          deliveryResult.already_sent
            ? "Payment was already confirmed. Licence and customer delivery were already completed."
            : "Payment was already confirmed. Licence and customer email delivery are now completed.",

        email_sent:
          true,

        sale:
          deliveryResult.sale
      });
    }

    return json({
      success: true,
      message:
        "Payment was already confirmed.",
      sale:
        existingSale
    });
  }

  const payment =
    await env.ADMIN_DB
      .prepare(`
        SELECT *
        FROM payments
        WHERE order_id = ?
        ORDER BY id DESC
        LIMIT 1
      `)
      .bind(
        orderId
      )
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
    getAdminEmail(
      request
    );

  await env.ADMIN_DB
    .prepare(`
      UPDATE payments
      SET
        status = 'confirmed',
        confirmed_by = ?,
        confirmed_at =
          CURRENT_TIMESTAMP,
        admin_notes = ?,
        updated_at =
          CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    .bind(
      adminEmail,
      clean(
        body.admin_notes
      ),
      payment.id
    )
    .run();

  await env.ADMIN_DB
    .prepare(`
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
    `)
    .bind(
      clean(
        body.admin_notes
      ),
      orderId
    )
    .run();

  const temporarySaleNumber =
    makeTemporaryNumber(
      "SALE"
    );

  const isSoftware =
    order.product_type ===
      "software";

  const saleInsert =
    await env.ADMIN_DB
      .prepare(`
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
      `)
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
        clean(
          body.admin_notes
        )
      )
      .run();

  const saleId =
    Number(
      saleInsert.meta
        .last_row_id
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

  await env.ADMIN_DB
    .prepare(`
      UPDATE sales
      SET
        sale_number = ?,
        invoice_number = ?,
        updated_at =
          CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    .bind(
      saleNumber,
      invoiceNumber,
      saleId
    )
    .run();

  await env.ADMIN_DB
    .prepare(`
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
      VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?
      )
    `)
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

  let sale =
    await getSaleById(
      env,
      saleId
    );

  if (isSoftware) {
    const licenceResult =
      await ensureCustomerLicence(
        env,
        sale
      );

    if (
      !licenceResult.success
    ) {
      await recordAdminActivity(
        env,
        request,
        "LICENCE_ISSUE_FAILED",
        "sale",
        saleId,
        `${saleNumber}: ${licenceResult.error}`
      );

      return json(
        {
          success: false,
          payment_confirmed:
            true,
          sale_created:
            true,
          invoice_created:
            true,
          licence_issued:
            false,
          email_sent:
            false,
          error:
            licenceResult.error,

          sale:
            await getSaleById(
              env,
              saleId
            )
        },
        licenceResult.status ||
        502
      );
    }

    sale =
      licenceResult.sale;

    await recordAdminActivity(
      env,
      request,
      "LICENCE_ISSUED",
      "sale",
      saleId,
      `${saleNumber}: customer licence issued.`
    );

    /*
     * Automatic customer email.
     */
    const deliveryResult =
      await sendCustomerDelivery(
        request,
        env,
        sale
      );

    if (
      !deliveryResult.success
    ) {
      return json(
        {
          success: false,
          payment_confirmed:
            true,
          sale_created:
            true,
          invoice_created:
            true,
          licence_issued:
            true,
          email_sent:
            false,
          error:
            deliveryResult.error,

          sale:
            await getSaleById(
              env,
              saleId
            )
        },
        deliveryResult.status ||
        502
      );
    }

    sale =
      deliveryResult.sale;
  }

  return json({
    success: true,

    message:
      isSoftware
        ? "Payment confirmed, Sales record and invoice created, customer licence issued, and customer email sent."
        : "Payment confirmed and permanent Sales record created.",

    email_sent:
      isSoftware
        ? true
        : null,

    sale
  });
}


async function adminSales(
  env
) {
  const result =
    await env.ADMIN_DB
      .prepare(`
        SELECT *
        FROM sales
        ORDER BY id DESC
      `)
      .all();

  return json({
    success: true,
    sales:
      result.results || []
  });
}


async function adminGetSale(
  env,
  saleId
) {
  const sale =
    await env.ADMIN_DB
      .prepare(`
        SELECT *
        FROM sales
        WHERE id = ?
        LIMIT 1
      `)
      .bind(
        saleId
      )
      .first();

  if (!sale) {
    return json(
      {
        success: false,
        error:
          "Sale not found."
      },
      404
    );
  }

  return json({
    success: true,
    sale
  });
}


async function adminInvoices(
  env
) {
  const result =
    await env.ADMIN_DB
      .prepare(`
        SELECT
          i.*,
          s.sale_number,
          s.product_code,
          s.product_type

        FROM invoices i

        LEFT JOIN sales s
          ON s.id =
            i.sale_id

        ORDER BY
          i.id DESC
      `)
      .all();

  return json({
    success: true,
    invoices:
      result.results || []
  });
}


async function adminCustomers(
  env
) {
  const result =
    await env.ADMIN_DB
      .prepare(`
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

        GROUP BY
          customer_email

        ORDER BY
          latest_purchase DESC
      `)
      .all();

  return json({
    success: true,
    customers:
      result.results || []
  });
}


async function adminActivity(
  env
) {
  const result =
    await env.ADMIN_DB
      .prepare(`
        SELECT *
        FROM admin_activity
        ORDER BY id DESC
        LIMIT 200
      `)
      .all();

  return json({
    success: true,
    activity:
      result.results || []
  });
}


function csvValue(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return (
    `"${String(value)
      .replaceAll(
        '"',
        '""'
      )}"`
  );
}


async function exportSales(
  env
) {
  const result =
    await env.ADMIN_DB
      .prepare(`
        SELECT *
        FROM sales
        ORDER BY id ASC
      `)
      .all();

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
    "Installer Sent",
    "Installation Guide Sent",
    "User Manual Sent",
    "Approved By",
    "Approved At",
    "Notes"
  ];

  const rows =
    sales.map(
      (
        sale,
        index
      ) => [
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
        sale.installer_sent,
        sale.installation_guide_sent,
        sale.user_manual_sent,
        sale.approved_by,
        sale.approved_at,
        sale.notes
      ]
        .map(
          csvValue
        )
        .join(",")
    );

  const csv = [
    headers
      .map(
        csvValue
      )
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


export default {
  async fetch(
    request,
    env
  ) {
    try {
      const url =
        new URL(
          request.url
        );

      const path =
        url.pathname;

      const method =
        request.method
          .toUpperCase();

      /*
       * Public routes
       */
      if (
        path ===
          "/api/health" &&
        method === "GET"
      ) {
        return health(
          env
        );
      }

      if (
        path ===
          "/api/products" &&
        method === "GET"
      ) {
        return publicProducts(
          env
        );
      }

      if (
        path ===
          "/api/orders" &&
        method === "POST"
      ) {
        return createOrder(
          request,
          env
        );
      }

      /*
       * Protect admin API routes.
       */
      if (
        path.startsWith(
          "/api/admin/"
        )
      ) {
        const denied =
          requireAdmin(
            request
          );

        if (denied) {
          return denied;
        }
      }

      if (
        path ===
          "/api/admin/dashboard" &&
        method === "GET"
      ) {
        return adminDashboard(
          env
        );
      }

      if (
        path ===
          "/api/admin/products" &&
        method === "GET"
      ) {
        return adminProducts(
          env
        );
      }

      if (
        path ===
          "/api/admin/software" &&
        method === "GET"
      ) {
        return adminSoftware(
          env
        );
      }

      if (
        path ===
          "/api/admin/books" &&
        method === "GET"
      ) {
        return adminBooks(
          env
        );
      }

      if (
        path ===
          "/api/admin/orders" &&
        method === "GET"
      ) {
        return adminOrders(
          env
        );
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

      if (
        path ===
          "/api/admin/sales" &&
        method === "GET"
      ) {
        return adminSales(
          env
        );
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
        return exportSales(
          env
        );
      }

      if (
        path ===
          "/api/admin/invoices" &&
        method === "GET"
      ) {
        return adminInvoices(
          env
        );
      }

      if (
        path ===
          "/api/admin/customers" &&
        method === "GET"
      ) {
        return adminCustomers(
          env
        );
      }

      if (
        path ===
          "/api/admin/activity" &&
        method === "GET"
      ) {
        return adminActivity(
          env
        );
      }

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

      /*
       * Normal website files.
       */
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
