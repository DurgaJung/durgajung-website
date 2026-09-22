import {
  PDFDocument,
  StandardFonts,
  rgb
} from "pdf-lib";

const ADMIN_EMAIL = "durgajung.nits@gmail.com";
const COMBO_PRODUCT_CODE =
  "SOFTWARE-COMBO-7500";

const COMBO_OFFER_ENDS_AT =
  Date.parse(
    "2026-10-10T18:14:59.000Z"
  );

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

const NBQ_LICENSE_API_URL =
  "https://nepali-bible-quiz-license-api.durgajung-nits.workers.dev";

const NBQ_EMAIL_FROM =
  "Nepali Bible Quiz <sales@durgajung.com.np>";

const NBQ_OPERATING_GUIDE_URL =
  "https://durgajung.com.np/assets/nepali-bible-quiz/documents/Nepali_Bible_Quiz_Operating_Guide_v1.0.2.pdf";

const NBQ_ADMIN_GUIDE_URL =
  "https://durgajung.com.np/assets/nepali-bible-quiz/documents/Nepali_Bible_Quiz_Admin_Guide_v1.0.2.pdf";

const SOFTWARE_VERSION = "1.0.2";

const SIGNATURE_ASSET_PATH =
  "/assets/images/Durga_Jung_Kunwar_Signature_Transparent.png";


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


function isNepaliBibleQuiz(row) {
  return (
    clean(
      row?.product_code
    ) === "NEPALI-BIBLE-QUIZ"
  );
}


function isComboPack(row) {
  return (
    clean(
      row?.product_code
    ) === COMBO_PRODUCT_CODE
  );
}


function comboOfferActive() {
  return (
    Date.now() <=
    COMBO_OFFER_ENDS_AT
  );
}


function comboNbqKeyFromNotes(notes) {
  const match =
    String(
      notes || ""
    ).match(
      /COMBO_NBQ_KEY=(\S+)/
    );

  return match
    ? match[1]
    : null;
}


function nbqAdminConfirmMessage(emailSent) {
  if (emailSent) {
    return "Payment confirmed. Nepali Bible Quiz licence, invoice, download link, and guides were emailed to the customer.";
  }

  return "Payment confirmed. Nepali Bible Quiz licence was issued. Customer email could not be sent — open the sale and confirm payment again, or send the pack from sales@durgajung.com.np.";
}


function documentBrand(sale) {
  if (
    isComboPack(
      sale
    )
  ) {
    return {
      productCaps:
        "COMBO PACK",
      productName:
        "Mero Mandali & Nepali Bible Combo Pack",
      invoiceSubject:
        "Official Mero Mandali & Nepali Bible Combo Pack Invoice",
      invoiceNote:
        "This invoice confirms payment for the Mero Mandali & Nepali Bible Combo Pack. The amount shown above is the final purchase price. No VAT breakdown is applied.",
      ownerLine:
        "Developer / Owner - Durga Jung Kunwar",
      certTitle:
        "SOFTWARE COMBO PACK",
      certMeta:
        "Official Mero Mandali & Nepali Bible Combo Pack Invoice",
      terms3:
        "3. Each included programme uses its own customer licence on one Windows PC.",
      terms4:
        "4. If an authorized computer is permanently replaced, contact support for a licence reset for that programme.",
      includes0:
        "Mero Mandali 1.0.2 and Nepali Bible Quiz 1.0.2",
      includesGuide:
        "Mero Mandali guide and Nepali Bible Quiz Operating + Admin Guides"
    };
  }

  if (
    isNepaliBibleQuiz(
      sale
    )
  ) {
    return {
      productCaps:
        "NEPALI BIBLE QUIZ",
      productName:
        "Nepali Bible Quiz",
      invoiceSubject:
        "Official Nepali Bible Quiz Software Invoice",
      invoiceNote:
        "This invoice confirms payment for Nepali Bible Quiz. The amount shown above is the final purchase price. No VAT breakdown is applied.",
      ownerLine:
        "Developer / Owner - Nepali Bible Quiz",
      certTitle:
        "NEPALI BIBLE QUIZ",
      certMeta:
        "Official Nepali Bible Quiz Customer Software Licence Certificate",
      terms3:
        "3. If the authorized computer is permanently replaced, contact Nepali Bible Quiz support for a licence reset.",
      terms4:
        "4. The licence remains subject to Nepali Bible Quiz licence conditions and valid activation status.",
      includes0:
        "Nepali Bible Quiz version 1.0.2",
      includesGuide:
        "English + Nepali Installation, Setup & Quiz Operating Guide"
    };
  }

  return {
    productCaps:
      "MERO MANDALI",
    productName:
      "Mero Mandali",
    invoiceSubject:
      "Official Mero Mandali Software Invoice",
    invoiceNote:
      "This invoice confirms payment for Mero Mandali Software. The amount shown above is the final purchase price. No VAT breakdown is applied.",
    ownerLine:
      "Developer / Owner - Mero Mandali Software",
    certTitle:
      "MERO MANDALI SOFTWARE",
    certMeta:
      "Official Mero Mandali Customer Software Licence Certificate",
    terms3:
      "3. If the authorized computer is permanently replaced, contact Mero Mandali support for a licence reset.",
    terms4:
      "4. The licence remains subject to Mero Mandali Software licence conditions and valid activation status.",
    includes0:
      "Mero Mandali Software version 1.0.2",
    includesGuide:
      "English + Nepali Installation, Setup & Programme Operating Guide"
  };
}


function nbqDownloadFromNotes(notes) {
  const match =
    String(
      notes || ""
    ).match(
      /NBQ_DOWNLOAD_URL=(\S+)/
    );

  return match
    ? match[1]
    : null;
}


function withNbqDownloadNote(
  notes,
  url
) {
  const stripped =
    String(
      notes || ""
    )
      .replace(
        /\s*NBQ_DOWNLOAD_URL=\S+/g,
        ""
      )
      .trim();

  if (!url) {
    return stripped || null;
  }

  return [
    stripped,
    `NBQ_DOWNLOAD_URL=${url}`
  ]
    .filter(
      Boolean
    )
    .join(
      "\n"
    );
}


function parseNbqWorkerOrderId(order) {
  const text = [
    order?.tracking_reference,
    order?.customer_notes,
    order?.notes
  ]
    .filter(
      Boolean
    )
    .join(
      " "
    );

  const named =
    String(
      text
    ).match(
      /NBQ-ORD-\d{4}-(\d{5})/i
    );

  if (named) {
    return Number(
      named[1]
    );
  }

  const workerNote =
    String(
      text
    ).match(
      /NBQ Worker order\s+(\d+)/i
    );

  if (workerNote) {
    return Number(
      workerNote[1]
    );
  }

  return null;
}


function installerHref(sale) {
  if (
    isNepaliBibleQuiz(
      sale
    )
  ) {
    return (
      nbqDownloadFromNotes(
        sale.notes
      ) ||
      "https://durgajung.com.np/software"
    );
  }

  return INSTALLER_URL;
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
  const saleNumber =
    String(
      sale.sale_number || ""
    );

  const mmMatch =
    saleNumber.match(
      /^MM-SALE-(\d{4})-(\d{5})$/
    );

  if (mmMatch) {
    return (
      `MM-LIC-${mmMatch[1]}-${mmMatch[2]}`
    );
  }

  const nbqMatch =
    saleNumber.match(
      /^NBQ-SALE-(\d{4})-(\d{5})$/
    );

  if (
    nbqMatch ||
    isNepaliBibleQuiz(
      sale
    )
  ) {
    const year =
      nbqMatch
        ? nbqMatch[1]
        : currentYear();

    const serial =
      nbqMatch
        ? nbqMatch[2]
        : String(
            sale.id
          ).padStart(
            5,
            "0"
          );

    return (
      `NBQ-LIC-${year}-${serial}`
    );
  }

  return (
    `MM-LIC-${String(
      sale.id
    ).padStart(5, "0")}`
  );
}


async function loadSignatureBytes(
  request,
  env
) {
  const assetUrl =
    new URL(
      SIGNATURE_ASSET_PATH,
      request.url
    );

  const response =
    await env.ASSETS.fetch(
      new Request(
        assetUrl.toString(),
        {
          method: "GET"
        }
      )
    );

  if (!response.ok) {
    throw new Error(
      `Signature asset could not be loaded. HTTP ${response.status}`
    );
  }

  return new Uint8Array(
    await response.arrayBuffer()
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


function drawCenteredText(
  page,
  text,
  centerX,
  y,
  options = {}
) {
  const value =
    pdfText(text);

  const font =
    options.font;

  const size =
    options.size || 10;

  const width =
    font.widthOfTextAtSize(
      value,
      size
    );

  drawText(
    page,
    value,
    centerX - width / 2,
    y,
    {
      font,
      size,
      color:
        options.color
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
  order,
  signatureBytes
) {
  const brand =
    documentBrand(
      sale
    );

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

  const signatureImage =
    await pdfDoc.embedPng(
      signatureBytes
    );

  addPdfMetadata(
    pdfDoc,
    `Invoice ${sale.invoice_number}`,
    brand.invoiceSubject,
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
    brand.productCaps,
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
    brand.invoiceNote,
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
    170,
    {
      font: bold,
      size: 9
    }
  );

  const invoiceSignatureWidth =
    165;

  const invoiceSignatureHeight =
    invoiceSignatureWidth *
    signatureImage.height /
    signatureImage.width;

  page.drawImage(
    signatureImage,
    {
      x: 48,
      y: 92,
      width:
        invoiceSignatureWidth,
      height:
        invoiceSignatureHeight
    }
  );

  drawText(
    page,
    "Durga Jung Kunwar",
    48,
    82,
    {
      font: bold,
      size: 13
    }
  );

  drawText(
    page,
    brand.ownerLine,
    48,
    66,
    {
      font,
      size: 8.5
    }
  );

  drawText(
    page,
    "developer@durgajung.com.np | durgajung.com.np",
    48,
    51,
    {
      font,
      size: 8
    }
  );

  drawText(
    page,
    "Official electronically generated and authorized invoice.",
    320,
    51,
    {
      font,
      size: 8
    }
  );

  return await pdfDoc.save();
}


async function createLicenceCertificatePdf(
  sale,
  order,
  signatureBytes
) {
  const brand =
    documentBrand(
      sale
    );

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

  const signatureImage =
    await pdfDoc.embedPng(
      signatureBytes
    );

  const certificateNumber =
    licenceCertificateNumber(
      sale
    );

  addPdfMetadata(
    pdfDoc,
    `${brand.productName} Licence Certificate ${certificateNumber}`,
    brand.certMeta,
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
    brand.certTitle,
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
      brand.productName
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
    brand.terms3,
    brand.terms4
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
          size: 8.5,
          lineHeight: 11.5
        }
      ) - 5;
  }

  const bottomTop =
    y - 5;

  drawText(
    page,
    "PURCHASE INCLUDES",
    55,
    bottomTop,
    {
      font: bold,
      size: 10
    }
  );

  let purchaseY =
    bottomTop - 20;

  const includes = [
    brand.includes0,
    "Unique customer licence key",
    "Official purchase invoice",
    "Customer licence certificate",
    brand.includesGuide,
    "Windows installer download access"
  ];

  for (
    const item of includes
  ) {
    purchaseY =
      drawWrappedText(
        page,
        `- ${item}`,
        62,
        purchaseY,
        260,
        {
          font,
          size: 7.8,
          lineHeight: 10
        }
      ) - 3;
  }

  const authCenterX =
    440;

  drawCenteredText(
    page,
    "AUTHORIZED BY",
    authCenterX,
    bottomTop,
    {
      font: bold,
      size: 9
    }
  );

  const certificateSignatureWidth =
    145;

  const certificateSignatureHeight =
    certificateSignatureWidth *
    signatureImage.height /
    signatureImage.width;

  page.drawImage(
    signatureImage,
    {
      x:
        authCenterX -
        certificateSignatureWidth / 2,
      y:
        bottomTop -
        78,
      width:
        certificateSignatureWidth,
      height:
        certificateSignatureHeight
    }
  );

  drawCenteredText(
    page,
    "Durga Jung Kunwar",
    authCenterX,
    bottomTop - 94,
    {
      font: bold,
      size: 11
    }
  );

  drawCenteredText(
    page,
    "Developer / Owner",
    authCenterX,
    bottomTop - 109,
    {
      font,
      size: 7.8
    }
  );

  drawCenteredText(
    page,
    "Mero Mandali Software",
    authCenterX,
    bottomTop - 121,
    {
      font,
      size: 7.8
    }
  );

  drawCenteredText(
    page,
    "developer@durgajung.com.np",
    authCenterX,
    bottomTop - 137,
    {
      font,
      size: 7.1
    }
  );

  drawCenteredText(
    page,
    "durgajung.com.np",
    authCenterX,
    bottomTop - 149,
    {
      font,
      size: 7.1
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


async function ensureSoftwareCatalogue(
  env
) {
  const catalogue = [
    {
      product_code:
        "MERO-MANDALI",
      product_name:
        "Mero Mandali",
      description:
        "Church projection and presentation software",
      price_npr:
        5000,
      version:
        "1.0.2",
      cover_image_url:
        "/assets/images/software/mero-mandali-logo.png",
      installation_guide_url:
        GUIDE_URL,
      user_manual_url:
        GUIDE_URL
    },
    {
      product_code:
        "NEPALI-BIBLE-QUIZ",
      product_name:
        "Nepali Bible Quiz",
      description:
        "Professional bilingual Bible quiz and projection software",
      price_npr:
        3500,
      version:
        "1.0.2",
      cover_image_url:
        "/assets/images/software/nepali-bible-quiz-app-icon.png",
      installation_guide_url:
        "https://durgajung.com.np/software#purchase-nepali-bible-quiz",
      user_manual_url:
        "https://durgajung.com.np/software#nbq-features"
    },
    {
      product_code:
        COMBO_PRODUCT_CODE,
      product_name:
        "Mero Mandali & Nepali Bible Combo Pack",
      description:
        "Special offer until 10 October 2026: Mero Mandali and Nepali Bible Quiz together for NPR 7,500",
      price_npr:
        7500,
      version:
        "1.0.2",
      cover_image_url:
        "/assets/images/software/nepali-bible-quiz-app-icon.png",
      installation_guide_url:
        GUIDE_URL,
      user_manual_url:
        NBQ_OPERATING_GUIDE_URL
    }
  ];

  for (const item of catalogue) {
    let product =
      await getProductByCode(
        env,
        item.product_code
      );

    if (!product) {
      await env.ADMIN_DB
        .prepare(`
          INSERT INTO products (
            product_code,
            product_type,
            product_name,
            description,
            price_npr,
            status,
            cover_image_url
          )
          VALUES (
            ?,
            'software',
            ?,
            ?,
            ?,
            'active',
            ?
          )
        `)
        .bind(
          item.product_code,
          item.product_name,
          item.description,
          item.price_npr,
          item.cover_image_url
        )
        .run();

      product =
        await getProductByCode(
          env,
          item.product_code
        );
    } else if (
      item.product_code ===
        COMBO_PRODUCT_CODE
    ) {
      const desiredStatus =
        comboOfferActive()
          ? "active"
          : "inactive";

      if (
        product.status !==
          desiredStatus ||
        Number(
          product.price_npr
        ) !== 7500
      ) {
        await env.ADMIN_DB
          .prepare(`
            UPDATE products
            SET
              status = ?,
              product_name = ?,
              description = ?,
              price_npr = ?,
              cover_image_url = ?,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `)
          .bind(
            desiredStatus,
            item.product_name,
            item.description,
            item.price_npr,
            item.cover_image_url,
            product.id
          )
          .run();
      }
    } else if (
      item.product_code ===
        "NEPALI-BIBLE-QUIZ" &&
      product.status !==
        "active"
    ) {
      await env.ADMIN_DB
        .prepare(`
          UPDATE products
          SET
            status = 'active',
            product_name = ?,
            description = ?,
            price_npr = ?,
            cover_image_url = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `)
        .bind(
          item.product_name,
          item.description,
          item.price_npr,
          item.cover_image_url,
          product.id
        )
        .run();
    }

    if (!product) {
      continue;
    }

    const softwareRow =
      await env.ADMIN_DB
        .prepare(`
          SELECT id
          FROM software_products
          WHERE product_id = ?
          LIMIT 1
        `)
        .bind(
          product.id
        )
        .first();

    if (!softwareRow) {
      await env.ADMIN_DB
        .prepare(`
          INSERT INTO software_products (
            product_id,
            version,
            installer_file_url,
            installation_guide_url,
            user_manual_url,
            licence_required,
            licence_type_default
          )
          VALUES (
            ?,
            ?,
            '',
            ?,
            ?,
            1,
            'customer'
          )
        `)
        .bind(
          product.id,
          item.version,
          item.installation_guide_url,
          item.user_manual_url
        )
        .run();
    }
  }
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


async function ensureNbqCustomerLicence(
  env,
  sale
) {
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

  const adminKey =
    clean(
      env.NBQ_LICENSE_ADMIN_KEY
    );

  if (!adminKey) {
    return {
      success: false,
      status: 500,
      error:
        "NBQ_LICENSE_ADMIN_KEY is not configured on the website Worker."
    };
  }

  const order =
    await getOrderById(
      env,
      sale.order_id
    );

  let workerOrderId =
    parseNbqWorkerOrderId(
      order
    );

  if (!workerOrderId) {
    try {
      const listResponse =
        await fetch(
          `${NBQ_LICENSE_API_URL}/v1/admin/orders`,
          {
            headers: {
              "X-Admin-Key":
                adminKey
            }
          }
        );

      const listPayload =
        await listResponse.json();

      const workerOrders =
        Array.isArray(
          listPayload?.orders
        )
          ? listPayload.orders
          : [];

      const email =
        String(
          sale.customer_email ||
          ""
        )
          .trim()
          .toLowerCase();

      const txn =
        clean(
          sale.transaction_reference
        ) ||
        clean(
          order?.transaction_reference
        );

      const match =
        workerOrders.find(
          (item) =>
            String(
              item.customerEmail ||
              ""
            )
              .trim()
              .toLowerCase() ===
              email &&
            (
              !txn ||
              clean(
                item.transactionReference
              ) === txn
            ) &&
            item.status !==
              "rejected"
        );

      if (match) {
        workerOrderId =
          Number(
            match.id
          );
      }
    } catch (error) {
      return {
        success: false,
        status: 502,
        error:
          `Quiz licence lookup failed: ${error.message}`
      };
    }
  }

  if (!workerOrderId) {
    return {
      success: false,
      status: 400,
      error:
        "No matching Nepali Bible Quiz Worker order was found for this payment."
    };
  }

  let response;
  let payload = {};

  try {
    response =
      await fetch(
        `${NBQ_LICENSE_API_URL}/v1/admin/orders/${workerOrderId}/approve`,
        {
          method: "POST",
          headers: {
            "content-type":
              "application/json; charset=utf-8",
            "X-Admin-Key":
              adminKey
          },
          body:
            JSON.stringify({
              skipEmail: true
            })
        }
      );

    payload =
      await response.json();
  } catch (error) {
    return {
      success: false,
      status: 502,
      error:
        `Quiz licence API request failed: ${error.message}`
    };
  }

  const licenceKey =
    clean(
      payload?.licenseKey
    );

  const downloadUrl =
    clean(
      payload?.download?.url
    );

  if (
    payload?.alreadyPaid &&
    !licenceKey
  ) {
    return {
      success: false,
      status: 409,
      error:
        "This Quiz order was already approved on the licence Worker, but the plaintext key is not stored in Admin. Use python tools/license_admin.py order-redownload for a new download link, then email the customer from sales@durgajung.com.np."
    };
  }

  if (
    !response.ok ||
    payload?.success !== true ||
    !licenceKey
  ) {
    return {
      success: false,
      status:
        response.status ||
        502,
      error:
        payload?.error ||
        "Quiz licence API did not create the customer licence."
    };
  }

  await env.ADMIN_DB
    .prepare(`
      UPDATE sales
      SET
        licence_key = ?,
        licence_status = 'issued',
        notes = ?,
        updated_at =
          CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    .bind(
      licenceKey,
      withNbqDownloadNote(
        sale.notes,
        downloadUrl
      ),
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


async function issueNbqDirectLicence(
  env,
  sale
) {
  const adminKey =
    clean(
      env.NBQ_LICENSE_ADMIN_KEY
    );

  if (!adminKey) {
    return {
      success: false,
      status: 500,
      error:
        "NBQ_LICENSE_ADMIN_KEY is not configured on the website Worker."
    };
  }

  const headers = {
    "content-type":
      "application/json; charset=utf-8",
    "X-Admin-Key":
      adminKey
  };

  let created;
  try {
    const createResponse =
      await fetch(
        `${NBQ_LICENSE_API_URL}/v1/admin/licenses`,
        {
          method: "POST",
          headers,
          body:
            JSON.stringify({
              customer_name:
                sale.customer_name,
              customer_email:
                sale.customer_email,
              license_type:
                "customer"
            })
        }
      );

    created =
      await createResponse.json();

    if (
      !createResponse.ok ||
      created.success !== true ||
      !clean(
        created.licenseKey
      )
    ) {
      return {
        success: false,
        status:
          createResponse.status ||
          502,
        error:
          created.error ||
          "Quiz licence API did not create the combo customer licence."
      };
    }
  } catch (error) {
    return {
      success: false,
      status: 502,
      error:
        `Quiz licence API request failed: ${error.message}`
    };
  }

  const licenseId =
    Number(
      created.licence?.id ||
      created.licenseId ||
      0
    );

  let downloadUrl = null;

  if (licenseId) {
    try {
      const downloadResponse =
        await fetch(
          `${NBQ_LICENSE_API_URL}/v1/admin/downloads`,
          {
            method: "POST",
            headers,
            body:
              JSON.stringify({
                licenseId
              })
          }
        );

      const download =
        await downloadResponse.json();

      downloadUrl =
        clean(
          download.url
        );
    } catch {
      downloadUrl = null;
    }
  }

  return {
    success: true,
    licenseKey:
      created.licenseKey,
    downloadUrl
  };
}


async function ensureComboLicences(
  env,
  sale
) {
  const existingNbqKey =
    comboNbqKeyFromNotes(
      sale.notes
    );

  if (
    clean(
      sale.licence_key
    ) &&
    existingNbqKey &&
    sale.licence_status ===
      "issued"
  ) {
    return {
      success: true,
      sale
    };
  }

  if (
    !clean(
      sale.licence_key
    )
  ) {
    const mmSale = {
      ...sale,
      product_code:
        "MERO-MANDALI",
      product_name:
        "Mero Mandali"
    };

    const mmResult =
      await ensureCustomerLicence(
        env,
        mmSale
      );

    if (!mmResult.success) {
      return mmResult;
    }

    sale =
      mmResult.sale;
  }

  if (
    !comboNbqKeyFromNotes(
      sale.notes
    )
  ) {
    const nbqResult =
      await issueNbqDirectLicence(
        env,
        sale
      );

    if (!nbqResult.success) {
      return nbqResult;
    }

    await env.ADMIN_DB
      .prepare(`
        UPDATE sales
        SET
          licence_status = 'issued',
          notes = ?,
          updated_at =
            CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      .bind(
        withNbqDownloadNote(
          [
            sale.notes,
            `COMBO_NBQ_KEY=${nbqResult.licenseKey}`
          ]
            .filter(
              Boolean
            )
            .join(
              "\n"
            ),
          nbqResult.downloadUrl
        ),
        sale.id
      )
      .run();
  }

  return {
    success: true,
    sale:
      await getSaleById(
        env,
        sale.id
      )
  };
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
    isComboPack(
      sale
    )
  ) {
    return ensureComboLicences(
      env,
      sale
    );
  }

  if (
    isNepaliBibleQuiz(
      sale
    )
  ) {
    return ensureNbqCustomerLicence(
      env,
      sale
    );
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
  const brand =
    documentBrand(
      sale
    );

  const quiz =
    isNepaliBibleQuiz(
      sale
    );

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
        ${escapeHtml(brand.productName)}
      </div>

      <div style="
        margin-top:6px;
        font-size:14px;
        opacity:.9;
      ">
        ${quiz ? "Bible Quiz Software" : "Church Presentation Software"}
      </div>

    </div>

    <div style="
      background:#ffffff;
      padding:30px;
      border-radius:0 0 12px 12px;
    ">

      <p>
        Dear <strong>${name}</strong>,
      </p>

      <p>
        Thank you for purchasing
        <strong>${escapeHtml(brand.productName)}</strong>.
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
          YOUR ${escapeHtml(brand.productCaps)} LICENCE KEY
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
          <td style="
            padding:6px 0;
            font-weight:700;
          ">
            Invoice
          </td>

          <td style="
            padding:6px 0;
          ">
            ${invoiceNumber}
          </td>
        </tr>

        <tr>
          <td style="
            padding:6px 0;
            font-weight:700;
          ">
            Licence Certificate
          </td>

          <td style="
            padding:6px 0;
          ">
            ${escapeHtml(
              certificateNumber
            )}
          </td>
        </tr>

        <tr>
          <td style="
            padding:6px 0;
            font-weight:700;
          ">
            Sale
          </td>

          <td style="
            padding:6px 0;
          ">
            ${saleNumber}
          </td>
        </tr>

        <tr>
          <td style="
            padding:6px 0;
            font-weight:700;
          ">
            Order
          </td>

          <td style="
            padding:6px 0;
          ">
            ${orderNumber}
          </td>
        </tr>

        <tr>
          <td style="
            padding:6px 0;
            font-weight:700;
          ">
            Total Paid
          </td>

          <td style="
            padding:6px 0;
          ">
            ${amount}
          </td>
        </tr>

      </table>

      <div style="
        margin:25px 0;
        text-align:center;
      ">

        <a
          href="${escapeHtml(installerHref(sale))}"
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
          Download ${escapeHtml(brand.productName)} ${SOFTWARE_VERSION}
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
        <li>
          Official Invoice PDF
        </li>

        <li>
          Customer Licence Certificate PDF
        </li>

        <li>
          ${escapeHtml(brand.includesGuide)}
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

      <p style="
        margin-bottom:4px;
      ">
        <strong>
          Durga Jung Kunwar
        </strong>
      </p>

      <p style="
        margin-top:0;
        color:#52606d;
        font-size:13px;
        line-height:1.6;
      ">
        ${escapeHtml(brand.ownerLine)}<br>
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
  const brand =
    documentBrand(
      sale
    );

  return `
${brand.productCaps}

Dear ${sale.customer_name || "Customer"},

Thank you for purchasing ${brand.productName}.

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

Download ${brand.productName} ${SOFTWARE_VERSION}:
${installerHref(sale)}

IMPORTANT:
One Customer Licence is authorized for one Windows PC.

If you permanently replace your computer, please contact us so the existing device binding can be reviewed and reset.

Attachments:
- Official Invoice PDF
- Customer Licence Certificate PDF
- ${brand.includesGuide}

Durga Jung Kunwar
${brand.ownerLine}
developer@durgajung.com.np
durgajung.com.np
  `.trim();
}


function makeComboEmailHtml(
  sale,
  order,
  mmCertificateNumber,
  nbqCertificateNumber
) {
  const name =
    escapeHtml(
      sale.customer_name ||
      "Customer"
    );

  const mmKey =
    escapeHtml(
      sale.licence_key
    );

  const nbqKey =
    escapeHtml(
      comboNbqKeyFromNotes(
        sale.notes
      )
    );

  const invoiceNumber =
    escapeHtml(
      sale.invoice_number
    );

  const mmDownload =
    escapeHtml(
      INSTALLER_URL
    );

  const nbqDownload =
    escapeHtml(
      nbqDownloadFromNotes(
        sale.notes
      ) ||
      "https://durgajung.com.np/software"
    );

  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
  <div style="max-width:680px;margin:0 auto;padding:28px 16px;">
    <div style="background:#102a47;color:#ffffff;padding:28px;border-radius:12px 12px 0 0;">
      <div style="font-size:22px;font-weight:700;">
        Special Offer 2 Software Combo Pack
      </div>
      <div style="margin-top:6px;font-size:14px;opacity:.9;">
        Mero Mandali &amp; Nepali Bible Quiz · NPR 7,500
      </div>
    </div>
    <div style="background:#ffffff;padding:30px;border-radius:0 0 12px 12px;">
      <p>Dear <strong>${name}</strong>,</p>
      <p>
        Thank you for purchasing the
        <strong>Mero Mandali &amp; Nepali Bible Combo Pack</strong>.
        Your payment of NPR 7,500 has been verified.
        This one email is the delivery package for both programmes.
      </p>
      <p><strong>Invoice:</strong> ${invoiceNumber}</p>
      <p>
        Each programme has its own customer licence.
        One licence = one Windows PC for that programme.
      </p>
      <div style="margin:22px 0;padding:18px;background:#f2f6fa;border:1px solid #d9e2ec;border-radius:8px;">
        <div style="font-size:12px;font-weight:700;color:#52606d;">MERO MANDALI LICENCE KEY</div>
        <div style="margin-top:8px;font-size:18px;font-weight:700;word-break:break-all;">${mmKey}</div>
        <p style="margin:14px 0 0;">
          <a href="${mmDownload}" style="color:#102a47;font-weight:700;">Download Mero Mandali</a>
        </p>
        <p style="margin:8px 0 0;font-size:13px;">Certificate: ${escapeHtml(mmCertificateNumber)}</p>
      </div>
      <div style="margin:22px 0;padding:18px;background:#f2f6fa;border:1px solid #d9e2ec;border-radius:8px;">
        <div style="font-size:12px;font-weight:700;color:#52606d;">NEPALI BIBLE QUIZ LICENCE KEY</div>
        <div style="margin-top:8px;font-size:18px;font-weight:700;word-break:break-all;">${nbqKey}</div>
        <p style="margin:14px 0 0;">
          <a href="${nbqDownload}" style="color:#102a47;font-weight:700;">Download Nepali Bible Quiz</a>
        </p>
        <p style="margin:8px 0 0;font-size:13px;">Certificate: ${escapeHtml(nbqCertificateNumber)}</p>
        <p style="margin:8px 0 0;font-size:13px;">The Quiz installer link expires. There is no .exe attached.</p>
      </div>
      <p>Attachments: combo invoice, both licence certificates, and the programme guides.</p>
      <p>
        <strong>Durga Jung Kunwar</strong><br>
        developer@durgajung.com.np<br>
        durgajung.com.np
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}


function makeComboEmailText(
  sale,
  order,
  mmCertificateNumber,
  nbqCertificateNumber
) {
  return `
SPECIAL OFFER 2 SOFTWARE COMBO PACK
Mero Mandali & Nepali Bible Combo Pack
Amount paid: ${npr(sale.total_paid_npr)}
Invoice: ${sale.invoice_number}

Dear ${sale.customer_name || "Customer"},

Your payment has been verified. This one email delivers both programmes.

MERO MANDALI LICENCE KEY
${sale.licence_key}
Download: ${INSTALLER_URL}
Certificate: ${mmCertificateNumber}

NEPALI BIBLE QUIZ LICENCE KEY
${comboNbqKeyFromNotes(sale.notes)}
Download: ${nbqDownloadFromNotes(sale.notes) || "https://durgajung.com.np/software"}
Certificate: ${nbqCertificateNumber}
The Quiz installer link expires. There is no .exe attached.

Each programme: 1 customer licence = 1 Windows PC.

Durga Jung Kunwar
sales@durgajung.com.np
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

  if (
    isComboPack(
      sale
    ) &&
    !comboNbqKeyFromNotes(
      sale.notes
    )
  ) {
    return {
      success: false,
      status: 400,
      error:
        "Combo Quiz licence must be issued before email delivery."
    };
  }

  const order =
    await getOrderById(
      env,
      sale.order_id
    );

  let invoiceBytes;
  let licenceDocument;
  let nbqLicenceDocument;

  try {
    const signatureBytes =
      await loadSignatureBytes(
        request,
        env
      );

    invoiceBytes =
      await createInvoicePdf(
        sale,
        order,
        signatureBytes
      );

    const mmSale = isComboPack(
      sale
    )
      ? {
          ...sale,
          product_code:
            "MERO-MANDALI",
          product_name:
            "Mero Mandali"
        }
      : sale;

    licenceDocument =
      await createLicenceCertificatePdf(
        mmSale,
        order,
        signatureBytes
      );

    if (
      isComboPack(
        sale
      )
    ) {
      nbqLicenceDocument =
        await createLicenceCertificatePdf(
          {
            ...sale,
            product_code:
              "NEPALI-BIBLE-QUIZ",
            product_name:
              "Nepali Bible Quiz",
            licence_key:
              comboNbqKeyFromNotes(
                sale.notes
              )
          },
          order,
          signatureBytes
        );
    }
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

  const quiz =
    isNepaliBibleQuiz(
      sale
    );

  const combo =
    isComboPack(
      sale
    );

  const brand =
    documentBrand(
      sale
    );

  const emailPayload = {
    from:
      combo
        ? "Software Combo Pack <sales@durgajung.com.np>"
        : quiz
          ? NBQ_EMAIL_FROM
          : EMAIL_FROM,

    to: [
      sale.customer_email
    ],

    bcc: [
      ADMIN_EMAIL
    ],

    reply_to:
      "sales@durgajung.com.np",

    subject:
      combo
        ? `Mero Mandali & Nepali Bible Combo Pack - ${sale.invoice_number}`
        : `${brand.productName} Purchase Complete - ${sale.invoice_number}`,

    html:
      combo
        ? makeComboEmailHtml(
            sale,
            order,
            licenceDocument.certificateNumber,
            nbqLicenceDocument.certificateNumber
          )
        : makeCustomerEmailHtml(
            sale,
            order,
            licenceDocument
              .certificateNumber
          ),

    text:
      combo
        ? makeComboEmailText(
            sale,
            order,
            licenceDocument.certificateNumber,
            nbqLicenceDocument.certificateNumber
          )
        : makeCustomerEmailText(
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
          combo
            ? `Mero_Mandali_${licenceDocument.certificateNumber}.pdf`
            : `${licenceDocument.certificateNumber}.pdf`
      },

      ...(
        combo
          ? [
              {
                content:
                  bytesToBase64(
                    nbqLicenceDocument.bytes
                  ),
                filename:
                  `Nepali_Bible_Quiz_${nbqLicenceDocument.certificateNumber}.pdf`
              },
              {
                path:
                  GUIDE_URL,
                filename:
                  "Mero_Mandali_Programme_Operating_Guide_EN_NP.pdf"
              },
              {
                path:
                  NBQ_OPERATING_GUIDE_URL,
                filename:
                  "Nepali_Bible_Quiz_Operating_Guide_v1.0.2.pdf"
              },
              {
                path:
                  NBQ_ADMIN_GUIDE_URL,
                filename:
                  "Nepali_Bible_Quiz_Admin_Guide_v1.0.2.pdf"
              }
            ]
          : quiz
            ? [
                {
                  path:
                    NBQ_OPERATING_GUIDE_URL,
                  filename:
                    "Nepali_Bible_Quiz_Operating_Guide_v1.0.2.pdf"
                },
                {
                  path:
                    NBQ_ADMIN_GUIDE_URL,
                  filename:
                    "Nepali_Bible_Quiz_Admin_Guide_v1.0.2.pdf"
                }
              ]
            : [
                {
                  path:
                    GUIDE_URL,
                  filename:
                    "Mero_Mandali_Programme_Operating_Guide_EN_NP.pdf"
                }
              ]
      )
    ]
  };

  const idempotencyKey =
    combo
      ? `combo-delivery-${sale.id}-${sale.invoice_number}`
      : quiz
        ? `nbq-delivery-${sale.id}-${sale.invoice_number}`
        : `mero-mandali-delivery-${sale.id}-${sale.invoice_number}`;

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

  await env.ADMIN_DB
    .prepare(`
      UPDATE invoices
      SET
        email_sent = 1,
        email_sent_at =
          CURRENT_TIMESTAMP,
        pdf_file_name = ?,
        updated_at =
          CURRENT_TIMESTAMP
      WHERE sale_id = ?
    `)
    .bind(
      `${sale.invoice_number}.pdf`,
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


function validContentKey(value) {
  const key = clean(value);
  if (!key || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(key)) {
    return null;
  }
  return key.toLowerCase();
}
function validVisitorKey(value) {
  const visitorKey = clean(value);
  if (!visitorKey || visitorKey.length > 120) {
    return null;
  }
  return visitorKey;
}
async function ensureWebsiteContent(env, body) {
  const contentKey = validContentKey(body.content_key);
  const pagePath = clean(body.page_path);
  const title = clean(body.title) || contentKey;
  const contentType = clean(body.content_type) || "page";
  if (!contentKey) {
    throw new Error("Invalid content key.");
  }
  if (!pagePath || !pagePath.startsWith("/") || pagePath.length > 300) {
    throw new Error("Invalid page path.");
  }
  if (!title || title.length > 200) {
    throw new Error("Invalid title.");
  }
  if (contentType.length > 50) {
    throw new Error("Invalid content type.");
  }
  // Insert only when the content is first seen. This avoids a D1 write on every page view.
  await env.ADMIN_DB.prepare(`
      INSERT OR IGNORE INTO website_content (
        content_key,
        page_path,
        title,
        content_type
      )
      VALUES (?, ?, ?, ?)
    `).bind(
    contentKey,
    pagePath,
    title,
    contentType
  ).run();
  return contentKey;
}
async function publicEngagementStats(request, env) {
  const url = new URL(request.url);
  const contentKey = validContentKey(url.searchParams.get("content_key"));
  const visitorKey = validVisitorKey(url.searchParams.get("visitor_key"));
  if (!contentKey) {
    return json(
      {
        success: false,
        error: "content_key is required."
      },
      400
    );
  }
  const totals = await env.ADMIN_DB.prepare(`
      SELECT
        (SELECT COUNT(*) FROM website_views WHERE content_key = ?) AS views,
        (SELECT COUNT(*) FROM website_likes WHERE content_key = ?) AS likes,
        (
          SELECT COUNT(*)
          FROM website_comments
          WHERE content_key = ? AND status = 'approved'
        ) AS comments,
        (SELECT COUNT(*) FROM website_shares WHERE content_key = ?) AS shares
    `).bind(
    contentKey,
    contentKey,
    contentKey,
    contentKey
  ).first();
  let liked = false;
  if (visitorKey) {
    const existingLike = await env.ADMIN_DB.prepare(`
        SELECT id
        FROM website_likes
        WHERE content_key = ? AND visitor_key = ?
        LIMIT 1
      `).bind(
      contentKey,
      visitorKey
    ).first();
    liked = Boolean(existingLike);
  }
  const comments = await env.ADMIN_DB.prepare(`
      SELECT
        id,
        commenter_name,
        comment_text,
        created_at
      FROM website_comments
      WHERE content_key = ? AND status = 'approved'
      ORDER BY id DESC
      LIMIT 100
    `).bind(contentKey).all();
  return json({
    success: true,
    engagement: {
      content_key: contentKey,
      views: Number(totals?.views || 0),
      likes: Number(totals?.likes || 0),
      comments: Number(totals?.comments || 0),
      shares: Number(totals?.shares || 0),
      liked
    },
    comments: comments.results || []
  });
}
async function publicRecordView(request, env) {
  const body = await readJson(request);
  const visitorKey = validVisitorKey(body.visitor_key);
  if (!visitorKey) {
    return json(
      {
        success: false,
        error: "Valid visitor_key is required."
      },
      400
    );
  }
  let contentKey;
  try {
    contentKey = await ensureWebsiteContent(env, body);
  } catch (error) {
    return json(
      {
        success: false,
        error: error.message
      },
      400
    );
  }
  // One counted view per visitor/content in a rolling 24-hour window.
  const existing = await env.ADMIN_DB.prepare(`
      SELECT id
      FROM website_views
      WHERE
        content_key = ?
        AND visitor_key = ?
        AND viewed_at >= datetime('now', '-24 hours')
      LIMIT 1
    `).bind(
    contentKey,
    visitorKey
  ).first();
  let counted = false;
  if (!existing) {
    await env.ADMIN_DB.prepare(`
        INSERT INTO website_views (
          content_key,
          visitor_key,
          page_path
        )
        VALUES (?, ?, ?)
      `).bind(
      contentKey,
      visitorKey,
      clean(body.page_path)
    ).run();
    counted = true;
  }
  const total = await env.ADMIN_DB.prepare(`
      SELECT COUNT(*) AS count
      FROM website_views
      WHERE content_key = ?
    `).bind(contentKey).first();
  return json({
    success: true,
    counted,
    views: Number(total?.count || 0)
  });
}
async function publicAddLike(request, env) {
  const body = await readJson(request);
  const visitorKey = validVisitorKey(body.visitor_key);
  if (!visitorKey) {
    return json(
      {
        success: false,
        error: "Valid visitor_key is required."
      },
      400
    );
  }
  let contentKey;
  try {
    contentKey = await ensureWebsiteContent(env, body);
  } catch (error) {
    return json(
      {
        success: false,
        error: error.message
      },
      400
    );
  }
  await env.ADMIN_DB.prepare(`
      INSERT OR IGNORE INTO website_likes (
        content_key,
        visitor_key
      )
      VALUES (?, ?)
    `).bind(
    contentKey,
    visitorKey
  ).run();
  const total = await env.ADMIN_DB.prepare(`
      SELECT COUNT(*) AS count
      FROM website_likes
      WHERE content_key = ?
    `).bind(contentKey).first();
  return json({
    success: true,
    liked: true,
    likes: Number(total?.count || 0)
  });
}
async function publicRemoveLike(request, env) {
  const body = await readJson(request);
  const contentKey = validContentKey(body.content_key);
  const visitorKey = validVisitorKey(body.visitor_key);
  if (!contentKey || !visitorKey) {
    return json(
      {
        success: false,
        error: "Valid content_key and visitor_key are required."
      },
      400
    );
  }
  await env.ADMIN_DB.prepare(`
      DELETE FROM website_likes
      WHERE content_key = ? AND visitor_key = ?
    `).bind(
    contentKey,
    visitorKey
  ).run();
  const total = await env.ADMIN_DB.prepare(`
      SELECT COUNT(*) AS count
      FROM website_likes
      WHERE content_key = ?
    `).bind(contentKey).first();
  return json({
    success: true,
    liked: false,
    likes: Number(total?.count || 0)
  });
}
async function publicAddComment(request, env) {
  const body = await readJson(request);
  const commenterName = clean(body.commenter_name);
  const commenterEmail = clean(body.commenter_email);
  const commentText = clean(body.comment_text);
  const visitorKey = validVisitorKey(body.visitor_key);
  if (!visitorKey) {
    return json(
      {
        success: false,
        error: "Valid visitor_key is required."
      },
      400
    );
  }
  if (!commenterName || commenterName.length > 80) {
    return json(
      {
        success: false,
        error: "Commenter name is required and must be 80 characters or fewer."
      },
      400
    );
  }
  if (commenterEmail && commenterEmail.length > 254) {
    return json(
      {
        success: false,
        error: "Email is too long."
      },
      400
    );
  }
  if (!commentText || commentText.length > 2e3) {
    return json(
      {
        success: false,
        error: "Comment must be between 1 and 2000 characters."
      },
      400
    );
  }
  let contentKey;
  try {
    contentKey = await ensureWebsiteContent(env, body);
  } catch (error) {
    return json(
      {
        success: false,
        error: error.message
      },
      400
    );
  }
  // Basic spam guard: one comment per visitor/content every 15 seconds.
  const tooSoon = await env.ADMIN_DB.prepare(`
      SELECT id
      FROM website_comments
      WHERE
        content_key = ?
        AND visitor_key = ?
        AND created_at >= datetime('now', '-15 seconds')
      LIMIT 1
    `).bind(
    contentKey,
    visitorKey
  ).first();
  if (tooSoon) {
    return json(
      {
        success: false,
        error: "Please wait a few seconds before posting another comment."
      },
      429
    );
  }
  const result = await env.ADMIN_DB.prepare(`
      INSERT INTO website_comments (
        content_key,
        visitor_key,
        commenter_name,
        commenter_email,
        comment_text,
        status
      )
      VALUES (?, ?, ?, ?, ?, 'approved')
    `).bind(
    contentKey,
    visitorKey,
    commenterName,
    commenterEmail,
    commentText
  ).run();
  return json(
    {
      success: true,
      message: "Comment added.",
      comment_id: Number(result.meta.last_row_id)
    },
    201
  );
}
async function publicRecordShare(request, env) {
  const body = await readJson(request);
  const allowedShareTypes = [
    "facebook",
    "whatsapp",
    "messenger",
    "telegram",
    "email",
    "copy_link",
    "native_share"
  ];
  const shareType = clean(body.share_type);
  const visitorKey = validVisitorKey(body.visitor_key);
  if (!visitorKey) {
    return json(
      {
        success: false,
        error: "Valid visitor_key is required."
      },
      400
    );
  }
  if (!shareType || !allowedShareTypes.includes(shareType)) {
    return json(
      {
        success: false,
        error: "Invalid share_type."
      },
      400
    );
  }
  let contentKey;
  try {
    contentKey = await ensureWebsiteContent(env, body);
  } catch (error) {
    return json(
      {
        success: false,
        error: error.message
      },
      400
    );
  }
  // Prevent rapid repeated share-button clicks from inflating the counter.
  const recent = await env.ADMIN_DB.prepare(`
      SELECT id
      FROM website_shares
      WHERE
        content_key = ?
        AND visitor_key = ?
        AND share_type = ?
        AND shared_at >= datetime('now', '-10 minutes')
      LIMIT 1
    `).bind(
    contentKey,
    visitorKey,
    shareType
  ).first();
  let counted = false;
  if (!recent) {
    await env.ADMIN_DB.prepare(`
        INSERT INTO website_shares (
          content_key,
          visitor_key,
          share_type
        )
        VALUES (?, ?, ?)
      `).bind(
      contentKey,
      visitorKey,
      shareType
    ).run();
    counted = true;
  }
  const total = await env.ADMIN_DB.prepare(`
      SELECT COUNT(*) AS count
      FROM website_shares
      WHERE content_key = ?
    `).bind(contentKey).first();
  return json({
    success: true,
    counted,
    shares: Number(total?.count || 0)
  });
}

async function createOrder(
  request,
  env
) {
  await ensureSoftwareCatalogue(
    env
  );

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

  if (
    product.product_code ===
      COMBO_PRODUCT_CODE &&
    !comboOfferActive()
  ) {
    return json(
      {
        success: false,
        error:
          "The NPR 7,500 combo offer ended on 10 October 2026."
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
  await ensureSoftwareCatalogue(
    env
  );

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

  const engagement =
    await env.ADMIN_DB
      .prepare(`
        SELECT
          (SELECT COUNT(*) FROM website_views) AS views,
          (SELECT COUNT(*) FROM website_likes) AS likes,
          (
            SELECT COUNT(*)
            FROM website_comments
            WHERE status = 'approved'
          ) AS comments,
          (SELECT COUNT(*) FROM website_shares) AS shares,
          (
            SELECT COUNT(*)
            FROM website_comments
            WHERE status = 'hidden'
          ) AS hidden_comments
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
        ),

      total_views:
        Number(
          engagement?.views || 0
        ),

      total_likes:
        Number(
          engagement?.likes || 0
        ),

      total_comments:
        Number(
          engagement?.comments || 0
        ),

      total_shares:
        Number(
          engagement?.shares || 0
        ),

      hidden_comments:
        Number(
          engagement?.hidden_comments || 0
        )
    }
  });
}


async function adminProducts(
  env
) {
  await ensureSoftwareCatalogue(
    env
  );

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
  await ensureSoftwareCatalogue(
    env
  );

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
  const softwareSales =
    await env.ADMIN_DB
      .prepare(`
        SELECT *
        FROM sales
        WHERE product_type = 'software'
      `)
      .all();

  await attachDeviceBindings(
    env,
    softwareSales.results || []
  );

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
            AS payment_admin_notes,

          s.licence_email_sent
            AS licence_email_sent,

          s.device_id
            AS licence_device_id

        FROM orders o

        LEFT JOIN sales s
          ON s.id = (
            SELECT s2.id
            FROM sales s2
            WHERE
              s2.order_id = o.id
            ORDER BY
              s2.id DESC
            LIMIT 1
          )

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


async function markOrderCompleted(
  env,
  orderId,
  adminEmail,
  adminNotes
) {
  const payment =
    await env.ADMIN_DB
      .prepare(`
        SELECT id
        FROM payments
        WHERE order_id = ?
        ORDER BY id DESC
        LIMIT 1
      `)
      .bind(
        orderId
      )
      .first();

  if (payment) {
    await env.ADMIN_DB
      .prepare(`
        UPDATE payments
        SET
          status = 'confirmed',
          confirmed_by = ?,
          confirmed_at =
            COALESCE(
              confirmed_at,
              CURRENT_TIMESTAMP
            ),
          admin_notes = ?,
          updated_at =
            CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      .bind(
        adminEmail,
        adminNotes,
        payment.id
      )
      .run();
  }

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
          COALESCE(
            completed_at,
            CURRENT_TIMESTAMP
          ),

        updated_at =
          CURRENT_TIMESTAMP

      WHERE id = ?
    `)
    .bind(
      adminNotes,
      orderId
    )
    .run();
}


async function reopenOrderForEmail(
  env,
  orderId
) {
  await env.ADMIN_DB
    .prepare(`
      UPDATE orders
      SET
        status = 'under_review',
        updated_at =
          CURRENT_TIMESTAMP
      WHERE id = ?
        AND status = 'completed'
    `)
    .bind(
      orderId
    )
    .run();
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
        await reopenOrderForEmail(
          env,
          orderId
        );

        return json(
          {
            success: false,
            payment_confirmed:
              false,
            sale_created:
              true,
            licence_issued:
              existingSale
                .licence_status ===
              "issued",
            email_sent:
              false,
            error:
              `Customer email was not sent. ${deliveryResult.error} Press Approve & Send Email again.`,
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

      await markOrderCompleted(
        env,
        orderId,
        getAdminEmail(
          request
        ) || ADMIN_EMAIL,
        clean(
          body.admin_notes
        )
      );

      const sentSale =
        await getSaleById(
          env,
          existingSale.id
        );

      return json({
        success: true,

        message:
          deliveryResult.already_sent
            ? `Already approved. The licence email was already sent to ${sentSale.customer_email}.`
            : `Approved. The licence email was sent to ${sentSale.customer_email}.`,

        email_sent:
          true,

        sale:
          sentSale
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
      isComboPack(
        order
      )
        ? "COMBO-SALE"
        : isNepaliBibleQuiz(
            order
          )
          ? "NBQ-SALE"
          : "MM-SALE",
      saleId
    );

  const invoiceNumber =
    makeNumber(
      isComboPack(
        order
      )
        ? "COMBO-INV"
        : isNepaliBibleQuiz(
            order
          )
          ? "NBQ-INV"
          : "MM-INV",
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
            false,
          sale_created:
            true,
          invoice_created:
            true,
          licence_issued:
            false,
          email_sent:
            false,
          error:
            `Licence was not issued, so no email was sent. ${licenceResult.error}`,

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
            false,
          sale_created:
            true,
          invoice_created:
            true,
          licence_issued:
            true,
          email_sent:
            false,
          error:
            `Customer email was not sent. ${deliveryResult.error} Press Approve & Send Email again.`,

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

  await markOrderCompleted(
    env,
    orderId,
    adminEmail ||
      ADMIN_EMAIL,
    clean(
      body.admin_notes
    )
  );

  sale =
    await getSaleById(
      env,
      sale.id
    );

  await recordAdminActivity(
    env,
    request,
    "PAYMENT_CONFIRMED",
    "sale",
    sale.id,
    isSoftware
      ? `${order.order_number} approved and licence email sent to ${sale.customer_email}.`
      : `${order.order_number} confirmed as ${sale.sale_number}.`
  );

  return json({
    success: true,

    message:
      isSoftware
        ? `Approved. The licence email was sent to ${sale.customer_email}.`
        : "Payment confirmed and permanent Sales record created.",

    email_sent:
      isSoftware
        ? true
        : null,

    sale
  });
}


function licenceKeyOf(item) {
  if (
    !item ||
    typeof item !== "object"
  ) {
    return null;
  }

  return clean(
    item.license_key ||
    item.licenseKey ||
    item.licence_key ||
    item.key ||
    item.license?.license_key ||
    item.license?.licenseKey
  );
}


function deviceIdOf(item) {
  if (
    !item ||
    typeof item !== "object"
  ) {
    return null;
  }

  const direct =
    clean(
      item.device_id ||
      item.deviceId ||
      item.machine_id ||
      item.machineId ||
      item.hardware_id ||
      item.hwid ||
      item.bound_device_id ||
      item.current_device_id
    );

  if (direct) {
    return direct;
  }

  if (
    typeof item.device ===
      "string"
  ) {
    return clean(
      item.device
    );
  }

  if (
    item.device &&
    typeof item.device ===
      "object"
  ) {
    return deviceIdOf(
      item.device
    );
  }

  const nested =
    item.devices ||
    item.activations ||
    item.machines;

  if (
    Array.isArray(nested)
  ) {
    for (
      const child of nested
    ) {
      if (
        typeof child ===
          "string" &&
        clean(child)
      ) {
        return clean(
          child
        );
      }

      const childId =
        deviceIdOf(
          child
        );

      if (childId) {
        return childId;
      }
    }
  }

  return null;
}


function deviceLabelOf(item) {
  if (
    !item ||
    typeof item !== "object"
  ) {
    return null;
  }

  return clean(
    item.device_name ||
    item.deviceName ||
    item.computer_name ||
    item.computerName ||
    item.hostname ||
    item.machine_name ||
    item.device?.name ||
    item.device?.device_name
  );
}


function recordIdOf(item) {
  if (
    !item ||
    typeof item !== "object"
  ) {
    return null;
  }

  const id =
    item.id ??
    item.license_id ??
    item.licenseId ??
    item.licence_id;

  if (
    id === undefined ||
    id === null ||
    id === ""
  ) {
    return null;
  }

  return String(id);
}


function collectLicenceRecords(
  payload
) {
  if (
    Array.isArray(payload)
  ) {
    return payload;
  }

  if (
    !payload ||
    typeof payload !== "object"
  ) {
    return [];
  }

  const records = [];

  for (
    const key of [
      "licenses",
      "licences",
      "devices",
      "activations",
      "results",
      "orders",
      "data"
    ]
  ) {
    if (
      Array.isArray(
        payload[key]
      )
    ) {
      records.push(
        ...payload[key]
      );
    }
  }

  return records;
}


function mergeBinding(
  map,
  id,
  next
) {
  if (!id) {
    return;
  }

  const prev =
    map.get(id) || {};

  map.set(id, {
    license_key:
      next.license_key ||
      prev.license_key ||
      null,
    device_id:
      next.device_id ||
      prev.device_id ||
      null,
    device_label:
      next.device_label ||
      prev.device_label ||
      null,
    install_status:
      next.install_status ||
      prev.install_status ||
      null
  });
}


async function loadDeviceMap(
  env
) {
  const jobs = [];

  if (
    clean(
      env.LICENSE_API_ADMIN_KEY
    )
  ) {
    const root =
      "https://mero-mandali-license-api.durgajung-nits.workers.dev";

    jobs.push({
      key:
        env.LICENSE_API_ADMIN_KEY,
      urls: [
        `${root}/v1/admin/licenses`,
        `${root}/v1/admin/devices`,
        `${root}/v1/admin/activations`
      ]
    });
  }

  if (
    clean(
      env.NBQ_LICENSE_ADMIN_KEY
    )
  ) {
    jobs.push({
      key:
        env.NBQ_LICENSE_ADMIN_KEY,
      urls: [
        `${NBQ_LICENSE_API_URL}/v1/admin/licenses`,
        `${NBQ_LICENSE_API_URL}/v1/admin/devices`,
        `${NBQ_LICENSE_API_URL}/v1/admin/activations`
      ]
    });
  }

  const payloads = [];

  await Promise.all(
    jobs.flatMap(
      (job) =>
        job.urls.map(
          async (url) => {
            try {
              const response =
                await fetch(
                  url,
                  {
                    headers: {
                      "X-Admin-Key":
                        job.key
                    }
                  }
                );

              if (
                !response.ok
              ) {
                return;
              }

              payloads.push(
                await response.json()
              );
            } catch {
              /* One licence server being offline should not hide the other. */
            }
          }
        )
    )
  );

  const records =
    payloads.flatMap(
      collectLicenceRecords
    );

  const byKey =
    new Map();

  const byId =
    new Map();

  for (
    const item of records
  ) {
    if (
      !item ||
      typeof item !== "object"
    ) {
      continue;
    }

    const deviceId =
      deviceIdOf(
        item
      );

    const binding = {
      license_key:
        licenceKeyOf(
          item
        ),
      device_id:
        deviceId,
      device_label:
        deviceLabelOf(
          item
        ),
      install_status:
        deviceId ||
        item.activated_at ||
        item.activatedAt ||
        item.installed_at ||
        item.installedAt ||
        item.bound === true
          ? "installed"
          : null
    };

    mergeBinding(
      byKey,
      binding.license_key
        ? binding.license_key.toUpperCase()
        : null,
      binding
    );

    mergeBinding(
      byId,
      recordIdOf(item),
      binding
    );

    const linkedId =
      item.license_id ??
      item.licenseId ??
      item.licence_id;

    if (
      linkedId !== undefined &&
      linkedId !== null &&
      binding.device_id
    ) {
      mergeBinding(
        byId,
        String(linkedId),
        {
          device_id:
            binding.device_id,
          device_label:
            binding.device_label
        }
      );
    }
  }

  for (
    const entry of byId.values()
  ) {
    if (
      entry.license_key
    ) {
      mergeBinding(
        byKey,
        entry.license_key.toUpperCase(),
        entry
      );
    }
  }

  return byKey;
}


function bindingForKey(
  deviceMap,
  licenceKey
) {
  if (
    !clean(licenceKey)
  ) {
    return null;
  }

  return (
    deviceMap.get(
      String(
        licenceKey
      ).toUpperCase()
    ) || null
  );
}


function bindingsForSale(
  sale,
  deviceMap
) {
  if (
    !sale ||
    sale.product_type !==
      "software"
  ) {
    return [];
  }

  if (
    isComboPack(sale)
  ) {
    const nbqKey =
      comboNbqKeyFromNotes(
        sale.notes
      );

    const mm =
      bindingForKey(
        deviceMap,
        sale.licence_key
      );

    const nbq =
      bindingForKey(
        deviceMap,
        nbqKey
      );

    return [
      {
        product:
          "Mero Mandali",
        license_key:
          sale.licence_key ||
          null,
        device_id:
          mm?.device_id ||
          null,
        device_label:
          mm?.device_label ||
          null,
        install_status:
          mm?.device_id ||
          mm?.install_status ===
            "installed"
            ? "installed"
            : "not_installed"
      },
      {
        product:
          "Nepali Bible Quiz",
        license_key:
          nbqKey,
        device_id:
          nbq?.device_id ||
          null,
        device_label:
          nbq?.device_label ||
          null,
        install_status:
          nbq?.device_id ||
          nbq?.install_status ===
            "installed"
            ? "installed"
            : "not_installed"
      }
    ];
  }

  const found =
    bindingForKey(
      deviceMap,
      sale.licence_key
    );

  return [
    {
      product:
        sale.product_name ||
        "Licence",
      license_key:
        sale.licence_key ||
        null,
      device_id:
        found?.device_id ||
        null,
      device_label:
        found?.device_label ||
        null,
      install_status:
        found?.device_id ||
        found?.install_status ===
          "installed" ||
        clean(
          sale.device_id
        )
          ? "installed"
          : "not_installed"
    }
  ];
}


function deviceSummary(
  bindings
) {
  const known =
    bindings.filter(
      (binding) =>
        clean(
          binding.device_id
        )
    );

  if (!known.length) {
    return null;
  }

  if (
    bindings.length === 1
  ) {
    const binding =
      known[0];

    return binding.device_label
      ? `${binding.device_label} (${binding.device_id})`
      : binding.device_id;
  }

  return bindings
    .map((binding) => {
      const name =
        binding.product ===
          "Nepali Bible Quiz"
          ? "NBQ"
          : binding.product ===
              "Mero Mandali"
            ? "MM"
            : "Licence";

      const where =
        binding.device_label
          ? `${binding.device_label} (${binding.device_id || "not installed"})`
          : (
              binding.device_id ||
              "not installed"
            );

      return `${name}: ${where}`;
    })
    .join(" | ");
}


async function attachDeviceBindings(
  env,
  sales
) {
  const rows =
    Array.isArray(sales)
      ? sales
      : [];

  let deviceMap =
    new Map();

  try {
    deviceMap =
      await loadDeviceMap(
        env
      );
  } catch {
    deviceMap =
      new Map();
  }

  for (
    const sale of rows
  ) {
    const bindings =
      bindingsForSale(
        sale,
        deviceMap
      );

    sale.device_bindings =
      bindings;

    const summary =
      deviceSummary(
        bindings
      );

    if (
      summary &&
      summary !==
        sale.device_id
    ) {
      sale.device_id =
        summary;

      try {
        await env.ADMIN_DB
          .prepare(`
            UPDATE sales
            SET
              device_id = ?,
              updated_at =
                CURRENT_TIMESTAMP
            WHERE id = ?
          `)
          .bind(
            summary,
            sale.id
          )
          .run();
      } catch {
        /* Showing the device in this response still works if the save fails. */
      }
    }
  }

  return rows;
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

  const sales =
    await attachDeviceBindings(
      env,
      result.results || []
    );

  return json({
    success: true,
    sales
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


async function adminEngagement(env) {
  const totals = await env.ADMIN_DB.prepare(`
      SELECT
        (SELECT COUNT(*) FROM website_views) AS views,
        (SELECT COUNT(*) FROM website_likes) AS likes,
        (
          SELECT COUNT(*)
          FROM website_comments
          WHERE status = 'approved'
        ) AS comments,
        (SELECT COUNT(*) FROM website_shares) AS shares,
        (
          SELECT COUNT(*)
          FROM website_comments
          WHERE status = 'hidden'
        ) AS hidden_comments
    `).first();
  const pages = await env.ADMIN_DB.prepare(`
      SELECT
        c.content_key,
        c.page_path,
        c.title,
        c.content_type,
        (SELECT COUNT(*) FROM website_views v WHERE v.content_key = c.content_key) AS views,
        (SELECT COUNT(*) FROM website_likes l WHERE l.content_key = c.content_key) AS likes,
        (
          SELECT COUNT(*)
          FROM website_comments m
          WHERE m.content_key = c.content_key AND m.status = 'approved'
        ) AS comments,
        (SELECT COUNT(*) FROM website_shares s WHERE s.content_key = c.content_key) AS shares
      FROM website_content c
      ORDER BY views DESC, c.title ASC
    `).all();
  return json({
    success: true,
    totals: {
      views: Number(totals?.views || 0),
      likes: Number(totals?.likes || 0),
      comments: Number(totals?.comments || 0),
      shares: Number(totals?.shares || 0),
      hidden_comments: Number(totals?.hidden_comments || 0)
    },
    pages: (pages.results || []).map((row) => ({
      ...row,
      views: Number(row.views || 0),
      likes: Number(row.likes || 0),
      comments: Number(row.comments || 0),
      shares: Number(row.shares || 0)
    }))
  });
}
async function adminComments(env) {
  const result = await env.ADMIN_DB.prepare(`
      SELECT
        m.id,
        m.content_key,
        c.title AS content_title,
        c.page_path,
        m.commenter_name,
        m.commenter_email,
        m.comment_text,
        m.status,
        m.created_at,
        m.updated_at
      FROM website_comments m
      LEFT JOIN website_content c
        ON c.content_key = m.content_key
      ORDER BY m.id DESC
      LIMIT 500
    `).all();
  return json({
    success: true,
    comments: result.results || []
  });
}
async function adminSetCommentStatus(request, env, commentId) {
  const body = await readJson(request);
  const status = clean(body.status);
  if (!status || !["approved", "hidden"].includes(status)) {
    return json(
      {
        success: false,
        error: "Comment status must be approved or hidden."
      },
      400
    );
  }
  const existing = await env.ADMIN_DB.prepare(`
      SELECT id, content_key, commenter_name
      FROM website_comments
      WHERE id = ?
      LIMIT 1
    `).bind(commentId).first();
  if (!existing) {
    return json(
      {
        success: false,
        error: "Comment not found."
      },
      404
    );
  }
  await env.ADMIN_DB.prepare(`
      UPDATE website_comments
      SET
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
    status,
    commentId
  ).run();
  await recordAdminActivity(
    env,
    request,
    "WEBSITE_COMMENT_STATUS_CHANGED",
    "website_comment",
    commentId,
    `${existing.content_key}: comment by ${existing.commenter_name} changed to ${status}.`
  );
  return json({
    success: true,
    message: `Comment marked ${status}.`
  });
}
async function adminDeleteComment(request, env, commentId) {
  const existing = await env.ADMIN_DB.prepare(`
      SELECT id, content_key, commenter_name
      FROM website_comments
      WHERE id = ?
      LIMIT 1
    `).bind(commentId).first();
  if (!existing) {
    return json(
      {
        success: false,
        error: "Comment not found."
      },
      404
    );
  }
  await env.ADMIN_DB.prepare(`
      DELETE FROM website_comments
      WHERE id = ?
    `).bind(commentId).run();
  await recordAdminActivity(
    env,
    request,
    "WEBSITE_COMMENT_DELETED",
    "website_comment",
    commentId,
    `${existing.content_key}: comment by ${existing.commenter_name} permanently deleted.`
  );
  return json({
    success: true,
    message: "Comment permanently deleted."
  });
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
    await attachDeviceBindings(
      env,
      result.results || []
    );

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

      const originalPath =
        url.pathname;

      const method =
        request.method
          .toUpperCase();

      /*
       * Permanent admin API routing:
       *
       * The Admin Control Center is protected by Cloudflare Access under
       * /admin/*, while older frontend code calls /api/admin/*.
       *
       * If an old /api/admin/* request arrives without the Access identity
       * header, redirect it with HTTP 307 to the equivalent /admin/api/*
       * path. 307 preserves POST/PATCH/DELETE methods and request bodies.
       *
       * Requests under /admin/api/* are then normalized back to the
       * existing internal /api/admin/* route names, so all current admin
       * handlers stay unchanged.
       */
      if (
        originalPath.startsWith(
          "/api/admin/"
        ) &&
        !getAdminEmail(
          request
        )
      ) {
        const protectedUrl =
          new URL(
            request.url
          );

        protectedUrl.pathname =
          "/admin/api/" +
          originalPath.slice(
            "/api/admin/".length
          );

        return new Response(
          null,
          {
            status: 307,
            headers: {
              Location:
                protectedUrl.toString(),
              "cache-control":
                "no-store"
            }
          }
        );
      }

      let path =
        originalPath;

      if (
        originalPath ===
          "/admin/api" ||
        originalPath.startsWith(
          "/admin/api/"
        )
      ) {
        path =
          "/api/admin" +
          originalPath.slice(
            "/admin/api".length
          );
      }

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
          "/api/engagement" &&
        method === "GET"
      ) {
        return publicEngagementStats(
          request,
          env
        );
      }

      if (
        path ===
          "/api/engagement/view" &&
        method === "POST"
      ) {
        return publicRecordView(
          request,
          env
        );
      }

      if (
        path ===
          "/api/engagement/like" &&
        method === "POST"
      ) {
        return publicAddLike(
          request,
          env
        );
      }

      if (
        path ===
          "/api/engagement/like" &&
        method === "DELETE"
      ) {
        return publicRemoveLike(
          request,
          env
        );
      }

      if (
        path ===
          "/api/engagement/comment" &&
        method === "POST"
      ) {
        return publicAddComment(
          request,
          env
        );
      }

      if (
        path ===
          "/api/engagement/share" &&
        method === "POST"
      ) {
        return publicRecordShare(
          request,
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
          "/api/admin/engagement" &&
        method === "GET"
      ) {
        return adminEngagement(
          env
        );
      }

      if (
        path ===
          "/api/admin/comments" &&
        method === "GET"
      ) {
        return adminComments(
          env
        );
      }

      const commentStatusMatch =
        path.match(
          /^\/api\/admin\/comments\/(\d+)\/status$/
        );

      if (
        commentStatusMatch &&
        method === "PATCH"
      ) {
        return adminSetCommentStatus(
          request,
          env,
          Number(
            commentStatusMatch[1]
          )
        );
      }

      const commentDeleteMatch =
        path.match(
          /^\/api\/admin\/comments\/(\d+)$/
        );

      if (
        commentDeleteMatch &&
        method === "DELETE"
      ) {
        return adminDeleteComment(
          request,
          env,
          Number(
            commentDeleteMatch[1]
          )
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
