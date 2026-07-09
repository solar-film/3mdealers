function setHeaders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const custSheet = getOrCreateSheet_(ss, "Cust_Data");
  const custHeaders = [
    "ประทับเวลา", "Cust_ID", "ชื่อ-นามสกุล", "เบอร์โทรศัพท์", "Line ID",
    "Email", "ตำแหน่ง/บทบาท", "ตำแหน่ง(อื่นๆ)", "ชื่อบริษัท/ร้านค้า/ทีมงาน",
    "เลขประจำตัวผู้เสียภาษี", "ประเภทธุรกิจ", "ประเภทธุรกิจ(อื่นๆ)", "อายุธุรกิจ",
    "มีหน้าร้านหรือไม่", "ช่องทางออนไลน์ที่ใช้งาน", "จังหวัดหลักที่ตั้งร้าน/ทีมงาน",
    "เขต/อำเภอ", "ระยะทางที่รับงานได้", "พื้นที่เป้าหมายหรือจังหวัดที่รับงานบ่อย",
    "ที่อยู่สำหรับจัดส่งเอกสาร", "ปัจจุบันรับงานฟิล์มอาคารหรือไม่",
    "มีทีมช่างติดตั้งของตนเองหรือไม่", "จำนวนทีมช่าง",
    "ประสบการณ์ติดตั้งฟิล์มกรองแสง", "กลุ่มลูกค้าหลักที่ให้บริการ",
    "กลุ่มลูกค้า(อื่นๆ)", "ความต้องการอบรม", "กลุ่มสินค้าที่สนใจ",
    "ต้องการเริ่มขายสินค้าแบบใด", "รุ่นสินค้าที่ต้องการข้อมูลราคาเพิ่มเติม",
    "คาดว่าจะเริ่มสั่งซื้อเมื่อไหร่", "ปริมาณการสั่งซื้อที่คาดการณ์ต่อเดือน",
    "ต้องการให้ Goodfilm สนับสนุนด้านใด", "รายละเอียดเพิ่มเติม",
    "ช่องทางที่ทราบข่าว"
  ];
  custHeaders.push(custHeaders.shift());
  setSheetHeaders_(custSheet, custHeaders, "#1a3c6e");

  const statusSheet = getOrCreateSheet_(ss, "Cust_Status");
  setSheetHeaders_(statusSheet, ["Cust_ID", "สถานะ", "กลุ่มลูกค้า", "Admin", "ฝ่ายขาย", "วันที่บันทึกข้อมูล"], "#0a58ca");

  const tierSheet = getOrCreateSheet_(ss, "Partner_Tier");
  setSheetHeaders_(tierSheet, ["Cust_ID", "Tier", "วันที่บันทึกข้อมูล"], "#0a58ca");

  const tierDetailSheet = getOrCreateSheet_(ss, "Partner_Tiers_Detail");
  setPartnerTierDetailHeaders_(tierDetailSheet);

  const chatSheet = getOrCreateSheet_(ss, "chat_logs");
  const quotationSheet = getOrCreateSheet_(ss, "Quotation");
  ensureSheetHeaders_(quotationSheet, getQuotationHeaders_(), "#0a58ca");
  setSheetHeaders_(chatSheet, ["Log_ID", "Cust_ID", "Admin", "รายละเอียด", "วันที่บันทึกข้อมูล"], "#1a3c6e");
}

function doPost(e) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    const data = parsePostData_(e);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (data.action === "savePartnerTierDetails" || data.sheet === "Partner_Tiers_Detail") {
      return json_(output, savePartnerTierDetails_(ss, data));
    }

    if (data.action === "updateSettings" || data.action === "saveSystemSettings") {
      return json_(output, updateSettings_(ss, data));
    }

    if (data.action === "appendChatLog" || data.sheet === "chat_logs") {
      return json_(output, appendChatLog_(ss, data));
    }

    if (data.action === "updateTier") {
      return json_(output, updateTier_(ss, data));
    }

    if (data.action === "updateStatus" || data.sheet === "Cust_Status") {
      return json_(output, updateStatus_(ss, data));
    }

    if (data.action === "updateLead") {
      return json_(output, updateLead_(ss, data));
    }

    if (data.action === "createQuotation") {
      return json_(output, createQuotation_(ss, data));
    }
    if (data.action === "updateQuotation") {
      return json_(output, updateQuotation_(ss, data));
    }

    return json_(output, createNewDealer_(ss, data));
  } catch (err) {
    return json_(output, {
      status: "error",
      message: err && err.message ? err.message : String(err)
    });
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doOptions() {
  return ContentService.createTextOutput("");
}

function updateLead_(ss, data) {
  const sheet = resolveLeadSheet_(ss, data);

  const values = sheet.getDataRange().getValues();
  const headers = values[0] || [];
  const headerMap = getHeaderMap_(headers);

  const custIdIndex = headerMap["Cust_ID"];
  const targetCustId = String(data.custId || data.Cust_ID || data.CUST_ID || data.customerId || "").trim();
  if (custIdIndex === undefined) throw new Error("ไม่พบคอลัมน์ Cust_ID ในชีต Cust_Data");
  if (!targetCustId) throw new Error("ไม่พบ Cust_ID สำหรับอัปเดตข้อมูลลูกค้า");

  let rowIndex = -1;
  let matchCount = 0;

  for (let i = 1; i < values.length; i++) {
    const rowCustId = custIdIndex !== undefined ? String(values[i][custIdIndex]).trim() : "";

    if (targetCustId && rowCustId === targetCustId) {
      rowIndex = i + 1;
      matchCount++;
    }
  }

  if (rowIndex < 0) {
    throw new Error("ไม่พบข้อมูลลูกค้าที่ตรงกับ Cust_ID: " + targetCustId);
  }
  if (matchCount > 1) {
    throw new Error("พบ Cust_ID ซ้ำในชีต Cust_Data: " + targetCustId + " กรุณาตรวจสอบก่อนบันทึก");
  }

  const combined = {};
  const updates = parseUpdates_(data.updates);
  Object.keys(updates).forEach(header => {
    combined[header] = updates[header];
  });

  const rowValues = (values[rowIndex - 1] || []).slice();
  let headersChanged = false;

  Object.keys(combined).forEach(header => {
    let colIdx = headers.indexOf(header);
    if (colIdx === -1) {
      headers.push(header);
      colIdx = headers.length - 1;
      headersChanged = true;
    }
    rowValues[colIdx] = combined[header];
  });

  while (rowValues.length < headers.length) rowValues.push("");

  if (headersChanged) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowValues]);

  return {
    status: "success",
    action: "updateLead",
    sheet: sheet.getName(),
    row: rowIndex,
    custId: targetCustId
  };
}

function resolveLeadSheet_(ss, data) {
  const candidates = [
    data.sheet, data.targetSheet, data.sourceSheet, data.sheetName,
    "Cust_Data", "New Dealer Report"
  ].filter(Boolean);
  for (let i = 0; i < candidates.length; i++) {
    const sheet = ss.getSheetByName(candidates[i]);
    if (sheet) return sheet;
  }
  throw new Error("ไม่พบชีตข้อมูลลูกค้า");
}

function updateStatus_(ss, data) {
  const sheet = getOrCreateSheet_(ss, "Cust_Status");
  const headers = ["Cust_ID", "สถานะ", "กลุ่มลูกค้า", "Admin", "ฝ่ายขาย", "วันที่บันทึกข้อมูล"];
  setSheetHeaders_(sheet, headers, "#0a58ca");

  const custId = String(data.custId || data.Cust_ID || data.CUST_ID || data.customerId || data.id || "").trim();
  if (!custId) throw new Error("No Cust_ID provided for updateStatus");

  const rowValues = [
    custId,
    data["สถานะ"] || data.status || data.trackingStatus || "",
    data["กลุ่มลูกค้า"] || data.customerGroup || data.group || "",
    data.Admin || data.adminName || data.admin || "",
    data["ฝ่ายขาย"] || data.salesName || data.sales || data.Sales || "",
    data["วันที่บันทึกข้อมูล"] || data.savedAt || data.updatedAt || new Date()
  ];

  const values = sheet.getDataRange().getValues();
  let foundRow = -1;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim() === custId) {
      foundRow = i + 1;
      break;
    }
  }

  if (foundRow > -1) {
    sheet.getRange(foundRow, 1, 1, headers.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }

  return {
    status: "success",
    action: "updateStatus",
    sheet: "Cust_Status",
    custId
  };
}

function parseUpdates_(updates) {
  if (!updates) return {};
  if (typeof updates === "string") {
    try { return JSON.parse(updates); } catch (err) { return {}; }
  }
  return typeof updates === "object" ? updates : {};
}

function updateTier_(ss, data) {
  const sheet = getOrCreateSheet_(ss, "Partner_Tier");
  setSheetHeaders_(sheet, ["Cust_ID", "Tier", "วันที่บันทึกข้อมูล"], "#0a58ca");
  const custId = String(data.custId || data.Cust_ID || data.customerId || data.id || "").trim();
  const tier = String(data.tier || data.Tier || data.partnerTier || "").trim();
  if (!custId) throw new Error("No Cust_ID provided for updateTier");
  if (!tier) throw new Error("No Tier provided for updateTier");
  const values = sheet.getDataRange().getValues();
  let foundRow = -1;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim() === custId) { foundRow = i + 1; break; }
  }
  const savedAt = new Date();
  if (foundRow > -1) {
    sheet.getRange(foundRow, 2).setValue(tier);
    sheet.getRange(foundRow, 3).setValue(savedAt);
  } else {
    sheet.appendRow([custId, tier, savedAt]);
  }
  return { status: "success", action: "updateTier", custId, tier };
}

function createQuotation_(ss, data, existingQid) {
  const sheet = getOrCreateSheet_(ss, "Quotation");
  const headers = ensureSheetHeaders_(sheet, getQuotationHeaders_(), "#0a58ca");

  const qId = existingQid || Utilities.getUuid();
  const timestamp = new Date();
  
  const customer = data.customer || {};
  const quot = data.quotation || {};
  const items = data.items || [];
  
  if (items.length === 0) {
    throw new Error("ไม่มีรายการสินค้า");
  }

  const colIndex = {
    qId: headers.indexOf("Q_ID"),
    custId: headers.indexOf("Cust_ID"),
    qNo: headers.indexOf("เลขที่ใบเสนอราคา"),
    qDate: headers.indexOf("วันที่เสนอราคา"),
    itemName: headers.indexOf("รายการสินค้า"),
    qty: headers.indexOf("จำนวน"),
    unit: headers.indexOf("หน่วย"),
    price: headers.indexOf("ราคาต่อสินค้า"),
    amount: headers.indexOf("ยอดรวม"),
    discount: headers.indexOf("ส่วนลด"),
    netAmount: headers.indexOf("ยอดสุทธิ"),
    validUntil: headers.indexOf("ยืนราคา"),
    creditTerm: headers.indexOf("เครดิตเทอม"),
    remark: headers.indexOf("หมายเหตุ"),
    status: headers.indexOf("สถานะ"),
    recordDate: headers.indexOf("วันที่บันทึกข้อมูล"),
    updateDate: headers.findIndex(h => String(h).toLowerCase() === "update")
  };

  const rowsToAppend = [];
  
  items.forEach(item => {
    const row = new Array(headers.length).fill("");
    if (colIndex.qId >= 0) row[colIndex.qId] = qId;
    if (colIndex.custId >= 0) row[colIndex.custId] = customer.custId || customer.name;
    if (colIndex.qNo >= 0) row[colIndex.qNo] = quot.no;
    if (colIndex.qDate >= 0) row[colIndex.qDate] = quot.date;
    if (colIndex.itemName >= 0) row[colIndex.itemName] = item.description;
    if (colIndex.qty >= 0) row[colIndex.qty] = item.qty;
    if (colIndex.unit >= 0) row[colIndex.unit] = item.unit;
    if (colIndex.price >= 0) row[colIndex.price] = item.price;
    if (colIndex.amount >= 0) row[colIndex.amount] = item.amount;
    
    if (colIndex.discount >= 0) row[colIndex.discount] = quot.discount || 0;
    if (colIndex.netAmount >= 0) row[colIndex.netAmount] = (item.amount - (quot.discount || 0)/(items.length||1)); // Rough allocation if needed, or better, calculate frontend and pass net. Let's just put total netAmount on first item or all? Wait, the sheet has 'ยอดสุทธิ' for the whole quotation? Usually it's per row.
    // If it's for the whole quotation, it's better to just put it as passed from frontend
    if (colIndex.netAmount >= 0) row[colIndex.netAmount] = quot.totalAmount || 0;
    if (colIndex.validUntil >= 0) row[colIndex.validUntil] = quot.validUntil || '';
    if (colIndex.creditTerm >= 0) row[colIndex.creditTerm] = quot.creditTerm || '';
    
    // Combine standard remark with customer info if needed
    const fullRemark = `ลูกค้า: ${customer.name} | เบอร์: ${customer.phone || '-'}\n${quot.remarks || ''}`;
    if (colIndex.remark >= 0) row[colIndex.remark] = fullRemark;
    
    if (colIndex.status >= 0) row[colIndex.status] = quot.status;
    if (colIndex.recordDate >= 0) row[colIndex.recordDate] = timestamp;
    if (colIndex.updateDate >= 0) row[colIndex.updateDate] = timestamp;
    
    rowsToAppend.push(row);
  });
  
  if (rowsToAppend.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAppend.length, headers.length).setValues(rowsToAppend);
  }
  
  return { status: "success", qId: qId, count: rowsToAppend.length };
}

function updateQuotation_(ss, data) {
  const sheet = getOrCreateSheet_(ss, "Quotation");
  const headers = ensureSheetHeaders_(sheet, getQuotationHeaders_(), "#0a58ca");

  const qId = String(data.quotation.id || data.qId).trim();
  if (!qId || qId === 'undefined') throw new Error("Missing Q_ID for update");

  const values = sheet.getDataRange().getValues();
  const idColIdx = headers.findIndex(h => String(h).trim() === "Q_ID");
  
  if (idColIdx >= 0 && values.length > 1) {
    const rowsToDelete = [];
    for (let i = values.length - 1; i > 0; i--) {
      const cellValue = String(values[i][idColIdx]).trim();
      if (cellValue === qId) {
        rowsToDelete.push(i + 1);
      }
    }
    rowsToDelete.forEach(rowIdx => {
      sheet.deleteRow(rowIdx);
    });
  }

  return createQuotation_(ss, data, qId);
}


function savePartnerTierDetails_(ss, data) {
  const sheet = getOrCreateSheet_(ss, "Partner_Tiers_Detail");
  setPartnerTierDetailHeaders_(sheet);

  const payload = data.tiers || data.settings || data.payload || [];
  const tiers = Array.isArray(payload)
    ? payload
    : Object.keys(payload).map(key => Object.assign({ tier: key }, payload[key]));

  const normalizedRows = tiers
    .map(normalizePartnerTierDetailPayload_)
    .filter(item => item.Tier);

  if (!normalizedRows.length) {
    throw new Error("No Partner_Tiers_Detail rows provided");
  }

  const existingValues = sheet.getDataRange().getValues();
  const existingHeaders = existingValues[0] || [];
  const headerMap = getHeaderMap_(existingHeaders);
  const tierIndex = headerMap["Tier"];
  const rowByTier = {};
  for (let i = 1; i < existingValues.length; i++) {
    const tierKey = normalizeTierKey_(tierIndex !== undefined ? existingValues[i][tierIndex] : existingValues[i][0]);
    if (tierKey) rowByTier[tierKey] = i + 1;
  }

  const headers = getPartnerTierDetailHeaders_();
  normalizedRows.forEach(item => {
    const row = headers.map(header => item[header] !== undefined ? item[header] : "");
    const existingRow = rowByTier[item.Tier];
    if (existingRow) {
      sheet.getRange(existingRow, 1, 1, headers.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }
  });

  return {
    status: "success",
    action: "savePartnerTierDetails",
    sheet: "Partner_Tiers_Detail",
    count: normalizedRows.length
  };
}

function normalizePartnerTierDetailPayload_(item) {
  const tier = normalizeTierKey_(getFirstDefined_(item.tier, item.Tier, item.key));
  const benefits = getFirstDefined_(item.benefits, item.Benefits, "");
  const targetRaw = getFirstDefined_(item.quarterlyTarget, item.Quarterly_Target, item.target, item.Target, "");
  return {
    Tier: tier,
    Label: getFirstDefined_(item.label, item.Label, ""),
    Description: getFirstDefined_(item.description, item.Description, ""),
    Quarterly_Target: targetRaw,
    Discount_Percent: getFirstDefined_(item.discountPercent, item.Discount_Percent, item.discount, item.Discount, ""),
    Credit_Term: getFirstDefined_(item.creditTerm, item.Credit_Term, item.credit, item.Credit, ""),
    Benefits: Array.isArray(benefits) ? benefits.join("\n") : String(benefits || ""),
    Badge: getFirstDefined_(item.badge, item.Badge, ""),
    Sort_Order: getFirstDefined_(item.sortOrder, item.Sort_Order, ""),
    Updated_At: new Date()
  };
}

function getFirstDefined_() {
  for (let i = 0; i < arguments.length; i++) {
    if (arguments[i] !== undefined && arguments[i] !== null) return arguments[i];
  }
  return "";
}

function normalizeTierKey_(value) {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return "";
  if (text.indexOf("member") > -1) return "member";
  if (text.indexOf("premium") > -1) return "premium";
  if (text.indexOf("authorized") > -1 || text.indexOf("authorised") > -1) return "authorized";
  if (text.indexOf("registered") > -1) return "registered";
  return text;
}

function appendChatLog_(ss, data) {
  const sheet = getOrCreateSheet_(ss, "chat_logs");
  setSheetHeaders_(sheet, ["Log_ID", "Cust_ID", "Admin", "รายละเอียด", "วันที่บันทึกข้อมูล"], "#1a3c6e");
  sheet.appendRow([
    data.Log_ID || data.logId || "",
    data.Cust_ID || data.custId || data.customerId || "",
    data.Admin || data.admin || data.adminName || "",
    data["รายละเอียด"] || data.detail || data.details || data.adminNotes || data.notes || "",
    data["วันที่บันทึกข้อมูล"] || data.date || data.timestamp || new Date()
  ]);
  return { status: "success", action: "appendChatLog" };
}

function createNewDealer_(ss, data) {
  // --- ป้องกันสแปม/กันกดเล่น ---

  // 1) Honeypot: ช่องซ่อน company_website ต้องว่างเสมอ ถ้ามีค่า = บอท → ตอบ success ปลอมแล้วทิ้งเงียบ
  if (String(data.company_website || data._hp || "").trim() !== "") {
    return { status: "success", action: "createNewDealer", custId: "-" };
  }

  // 2) Time-trap: กรอกเสร็จเร็วเกินไป (< 3 วินาที) = บอท → ทิ้งเงียบ
  const elapsed = Number(data._elapsed);
  if (!isNaN(elapsed) && elapsed > 0 && elapsed < 3000) {
    return { status: "success", action: "createNewDealer", custId: "-" };
  }

  // 3) ตรวจข้อมูลฝั่งเซิร์ฟเวอร์ (กันการยิงตรงข้าม validation ฝั่งหน้าเว็บ)
  const fullName = String(data.full_name || "").trim();
  const phoneDigits = normalizePhone_(data.phone || "");
  const email = String(data.email || "").trim();
  const businessName = String(data.business_name || "").trim();

  if (!fullName) throw new Error("กรุณากรอกชื่อ-นามสกุล");
  if (phoneDigits.length < 9 || phoneDigits.length > 10) throw new Error("เบอร์โทรศัพท์ไม่ถูกต้อง");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("อีเมลไม่ถูกต้อง");
  if (!businessName) throw new Error("กรุณากรอกชื่อร้านค้า/บริษัท");

  const sheet = resolveLeadSheet_(ss, { sheet: "Cust_Data" });

  // 4) กันส่งซ้ำ: เบอร์เดิมที่เพิ่งส่งมาภายใน 3 นาที = ตีเป็นซ้ำ (กันดับเบิลคลิก/กดส่งรัวๆ)
  const DEDUPE_WINDOW_MS = 3 * 60 * 1000;
  const existing = sheet.getDataRange().getValues();
  const exHeaders = existing[0] || [];
  const tsIdx = exHeaders.indexOf("ประทับเวลา");
  const phoneIdx = exHeaders.indexOf("เบอร์โทรศัพท์");
  const nowMs = Date.now();
  if (phoneIdx > -1) {
    for (let i = 1; i < existing.length; i++) {
      if (normalizePhone_(existing[i][phoneIdx]) === phoneDigits) {
        const rowTs = tsIdx > -1 ? new Date(existing[i][tsIdx]).getTime() : 0;
        if (rowTs && (nowMs - rowTs) < DEDUPE_WINDOW_MS) {
          throw new Error("คุณเพิ่งส่งข้อมูลไปแล้ว กรุณารอสักครู่ก่อนส่งใหม่");
        }
      }
    }
  }

  const d = new Date();
  const custId = "DL-" + Utilities.formatDate(d, Session.getScriptTimeZone(), "yyyyMMddHHmmss");
  sheet.appendRow([
    custId, data.full_name || "", data.phone || "", data.line_id || "", data.email || "",
    data.role || "", data.role_other || "", data.business_name || "", data.tax_id || "",
    data.business_type || "", data.business_type_other || "", data.business_age || "",
    data.has_store || "", data.online_channels || "", data.main_province || "", data.district || "",
    data.service_range || "", data.target_area || "", data.address || "", data.current_film_business || "",
    data.has_installer_team || "", data.team_count || "", data.install_experience || "",
    data.customer_group || "", data.customer_group_other || "", data.training_need || "",
    data.product_interest || "", data.selling_type || "", data.model_need || "", data.start_time || "",
    data.monthly_volume || "", data.support_need || "", data.note || "", data.source || "", d
  ]);
  return { status: "success", action: "createNewDealer", custId };
}

function updateSettings_(ss, data) {
  const sheet = getOrCreateSheet_(ss, "system_settings");
  sheet.clear();
  const rows = [["Key", "Value"]];
  const payload = data.settings || data.payload || {};
  Object.keys(payload).forEach(key => { rows.push([key, JSON.stringify(payload[key])]); });
  sheet.getRange(1, 1, rows.length, 2).setValues(rows);
  return { status: "success", action: "updateSettings" };
}

function parsePostData_(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  const raw = e.postData.contents;
  let data = {};
  try { data = JSON.parse(raw); }
  catch (err) {
    raw.split("&").forEach(pair => {
      const parts = pair.split("=");
      const key = decodeURIComponent(parts[0] || "");
      const value = decodeURIComponent((parts[1] || "").replace(/\+/g, " "));
      if (key) data[key] = value;
    });
  }
  if (data.payload && typeof data.payload === "string") {
    try { data = Object.assign({}, JSON.parse(data.payload), data); } catch (err) {}
  }
  if (data.json && typeof data.json === "string") {
    try { data = Object.assign({}, JSON.parse(data.json), data); } catch (err) {}
  }
  return data;
}

function getOrCreateSheet_(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function getQuotationHeaders_() {
  return [
    "Q_ID", "Cust_ID", "เลขที่ใบเสนอราคา", "วันที่เสนอราคา", "รายการสินค้า",
    "จำนวน", "หน่วย", "ราคาต่อสินค้า", "ยอดรวม", "ส่วนลด", "ยอดสุทธิ",
    "ยืนราคา", "เครดิตเทอม", "หมายเหตุ", "สถานะ", "วันที่บันทึกข้อมูล", "Update"
  ];
}

function ensureSheetHeaders_(sheet, requiredHeaders, color) {
  const lastColumn = Math.max(sheet.getLastColumn(), requiredHeaders.length, 1);
  let headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0]
    .map(header => String(header || "").trim());
  if (!headers.some(Boolean)) headers = requiredHeaders.slice();

  requiredHeaders.forEach(header => {
    if (!headers.includes(header)) headers.push(header);
  });

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  const range = sheet.getRange(1, 1, 1, headers.length);
  range.setFontWeight("bold");
  range.setBackground(color);
  range.setFontColor("#ffffff");
  range.setHorizontalAlignment("center");
  sheet.setFrozenRows(1);
  return headers;
}

function setSheetHeaders_(sheet, headers, color) {
  const lastColumn = sheet.getLastColumn();
  if (lastColumn > headers.length) {
    sheet.getRange(1, headers.length + 1, 1, lastColumn - headers.length).clearContent();
  }
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  const range = sheet.getRange(1, 1, 1, headers.length);
  range.setFontWeight("bold");
  range.setBackground(color);
  range.setFontColor("#ffffff");
  range.setHorizontalAlignment("center");
  sheet.setFrozenRows(1);
}

function getPartnerTierDetailHeaders_() {
  return [
    "Tier", "Label", "Description", "Quarterly_Target", "Discount_Percent",
    "Credit_Term", "Benefits", "Badge", "Sort_Order", "Updated_At"
  ];
}

function setPartnerTierDetailHeaders_(sheet) {
  setSheetHeaders_(sheet, getPartnerTierDetailHeaders_(), "#174a8b");
}

function getHeaderMap_(headers) {
  const map = {};
  headers.forEach((header, index) => { map[String(header).trim()] = index; });
  return map;
}

function setValueByHeader_(sheet, rowIndex, header, value) {
  if (value === undefined || value === null) return;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  let colIndex = headers.indexOf(header) + 1;
  if (colIndex <= 0) {
    colIndex = sheet.getLastColumn() + 1;
    sheet.getRange(1, colIndex).setValue(header);
  }
  sheet.getRange(rowIndex, colIndex).setValue(value);
}

function normalizePhone_(value) {
  return String(value || "").replace(/\D/g, "").trim();
}

function json_(output, obj) {
  return output.setContent(JSON.stringify(obj));
}
