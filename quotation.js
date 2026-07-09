const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwJCGjqlcDng8H5FAxO-38WicjYIDdVfIaGFjTqAw19DhLqyWl7LNa9UxQEKZ70GGDq/exec';

let itemCounter = 0;

function formatMoney(num) {
  return parseFloat(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function addItemRow(data = {}) {
  itemCounter++;
  const tbody = document.getElementById('itemsBody');
  const tr = document.createElement('tr');
  tr.id = `itemRow_${itemCounter}`;
  tr.dataset.amount = data.amount || ((data.qty || 1) * (data.price || 0)) || 0;
  
  let mainDesc = data.description || '';
  let subDesc = '';
  if (mainDesc.includes('[DETAILS]')) {
    const parts = mainDesc.split('[DETAILS]');
    mainDesc = parts[0];
    subDesc = parts[1];
  }

  tr.innerHTML = `
    <td>${itemCounter}</td>
    <td style="vertical-align: top;">
      <div class="product-search-wrapper" style="position: relative;">
        <input type="text" class="form-control item-desc" placeholder="พิมพ์ค้นหารายการสินค้าหลัก..." value="${mainDesc}" required style="margin-bottom: 8px; font-weight: bold;" autocomplete="off">
        <div class="cust-dropdown product-dropdown" style="display: none; width: 100%; top: 100%; left: 0; z-index: 100;"></div>
      </div>
      <div class="item-sub-desc" style="height: 100px;"></div>
    </td>
    <td><input type="number" class="form-control item-qty text-center" value="${data.qty || 1}" min="1" step="0.01" oninput="calculateRow(this)" required></td>
    <td><input type="text" class="form-control item-unit text-center" placeholder="ม้วน" value="${data.unit || ''}" required></td>
    <td><input type="number" class="form-control item-price text-right" value="${data.price || 0}" min="0" step="0.01" oninput="calculateRow(this)" required></td>
    <td><input type="text" class="form-control item-amount text-right" value="${data.amount ? formatMoney(data.amount) : '0.00'}" readonly style="background: #f8fafc;"></td>
    <td>
      <button type="button" class="btn btn-danger" onclick="removeItemRow(this)" title="ลบรายการ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </td>
  `;
  tbody.appendChild(tr);
  
  // Initialize Quill for this row
  const editorContainer = tr.querySelector('.item-sub-desc');
  const quill = new Quill(editorContainer, {
    theme: 'snow',
    modules: {
      toolbar: [
        ['bold', 'italic', 'underline'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'bullet' }]
      ]
    }
  });
  
  // Set initial content if editing
  if (subDesc) {
    quill.root.innerHTML = subDesc;
  }
  
  // Store reference to quill on the row for later access
  tr.quillInstance = quill;

  // Autocomplete auto-fill logic using custom dropdown
  const descInput = tr.querySelector('.item-desc');
  const dropdown = tr.querySelector('.product-dropdown');

  function renderProductDropdown(search) {
    const lowerSearch = (search || '').toLowerCase();
    const filtered = allProducts.filter(p => p['รายการสินค้า'] && p['รายการสินค้า'].toLowerCase().includes(lowerSearch));
    
    dropdown.innerHTML = '';
    
    if (allProducts.length === 0) {
      const msg = document.createElement('div');
      msg.style.padding = '10px';
      msg.style.color = '#64748b';
      msg.textContent = 'กำลังโหลดข้อมูล... หรือไม่พบข้อมูลในชีต';
      dropdown.appendChild(msg);
    } else if (filtered.length === 0) {
      const msg = document.createElement('div');
      msg.style.padding = '10px';
      msg.style.color = '#64748b';
      msg.textContent = 'ไม่พบสินค้าที่ค้นหา';
      dropdown.appendChild(msg);
    } else {
      filtered.forEach(p => {
        const item = document.createElement('div');
        item.className = 'cust-dropdown-item';
        item.innerHTML = `<strong>${p['รายการสินค้า']}</strong>`;
        item.addEventListener('mousedown', function() {
          descInput.value = p['รายการสินค้า'];
          dropdown.style.display = 'none';
          
          const priceStr = String(p['ราคา'] || '').replace(/,/g, '');
          tr.querySelector('.item-price').value = parseFloat(priceStr) || 0;
          tr.querySelector('.item-unit').value = p['หน่วย'] || '';
          
          const width = p['หน้ากว้าง'] || '';
          const length = p['ความยาว'] || '';
          let details = p['รายละเอียดสินค้า'] || '';
          if (width || length) {
             details += `<br>ขนาด: ${width}" x ${length}'`;
          }
          
          if (quill && quill.getText().trim() === '') {
            quill.root.innerHTML = details;
          }
          
          calculateRow(tr.querySelector('.item-price'));
        });
        dropdown.appendChild(item);
      });
    }
    
    dropdown.style.display = 'block';
  }

  descInput.addEventListener('focus', () => renderProductDropdown(descInput.value));
  descInput.addEventListener('input', () => renderProductDropdown(descInput.value));
  descInput.addEventListener('blur', () => {
    setTimeout(() => { dropdown.style.display = 'none'; }, 200);
  });

  reindexRows();
  calculateTotal();
}

function removeItemRow(btn) {
  const tr = btn.closest('tr');
  tr.remove();
  reindexRows();
  calculateTotal();
}

function reindexRows() {
  const rows = document.getElementById('itemsBody').querySelectorAll('tr');
  rows.forEach((row, index) => {
    row.querySelector('td:first-child').textContent = index + 1;
  });
}

function calculateRow(input) {
  const tr = input.closest('tr');
  const qty = parseFloat(tr.querySelector('.item-qty').value) || 0;
  const price = parseFloat(tr.querySelector('.item-price').value) || 0;
  const amount = qty * price;
  tr.querySelector('.item-amount').value = formatMoney(amount);
  tr.dataset.amount = amount;
  calculateTotal();
}

function calculateTotal() {
  const rows = document.getElementById('itemsBody').querySelectorAll('tr');
  let sum = 0;
  rows.forEach(row => {
    sum += parseFloat(row.dataset.amount || 0);
  });

  const discount = parseFloat(document.getElementById('discount').value) || 0;
  const afterDiscount = sum - discount;
  const vat = afterDiscount * 0.07;
  const grandTotal = afterDiscount + vat;

  document.getElementById('sumTotal').textContent = formatMoney(sum);
  document.getElementById('afterDiscount').textContent = formatMoney(afterDiscount);
  document.getElementById('vatAmount').textContent = formatMoney(vat);
  document.getElementById('grandTotal').textContent = formatMoney(grandTotal);
}

function customAlert(msg) {
  document.getElementById('customAlertMsg').textContent = msg;
  const overlay = document.getElementById('customAlertOverlay');
  overlay.style.display = 'grid';
}

document.getElementById('quotationForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const rows = document.getElementById('itemsBody').querySelectorAll('tr');
  if (rows.length === 0) {
    customAlert("กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ");
    return;
  }

  const btnSubmit = document.getElementById('btnSubmit');
  btnSubmit.disabled = true;
  btnSubmit.innerHTML = `<div class="spinner" style="width:16px;height:16px;border-width:2px;margin:0"></div> กำลังบันทึก...`;

  const items = [];
  rows.forEach(row => {
    let mainDesc = row.querySelector('.item-desc').value;
    let descHtml = row.quillInstance.root.innerHTML;
    if (descHtml === '<p><br></p>') descHtml = '';
    
    let combinedDesc = mainDesc;
    if (descHtml) combinedDesc += '[DETAILS]' + descHtml;

    const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
    const unit = row.querySelector('.item-unit').value;
    const price = parseFloat(row.querySelector('.item-price').value) || 0;
    const amount = row.dataset.amount ? parseFloat(row.dataset.amount) : (qty * price);
    
    if (mainDesc || qty > 0) {
      items.push({
        description: combinedDesc,
        qty: qty,
        unit: unit,
        price: price,
        amount: amount
      });
    }
  });

  const payload = {
    action: document.getElementById('qId').value ? 'updateQuotation' : 'createQuotation',
    sheet: 'Quotation',
    targetSheet: 'Quotation',
    quotation: {
      id: document.getElementById('qId').value,
      no: document.getElementById('quotationNo').value,
      date: document.getElementById('quotationDate').value,
      validUntil: document.getElementById('validUntil').value.trim(),
      creditTerm: document.getElementById('creditTerm').value.trim(),
      remarks: document.getElementById('remarks').value,
      discount: parseFloat(document.getElementById('discount').value) || 0,
      status: 'Wait for Approve'
    },
    customer: {
      custId: document.getElementById('custId').value,
      name: document.getElementById('custName').value,
      taxId: document.getElementById('taxId').value,
      address: document.getElementById('address').value,
      contact: document.getElementById('contactName').value,
      phone: document.getElementById('phone').value,
    },
    items: items
  };

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload)
    });
    
    customAlert("บันทึกใบเสนอราคาสำเร็จ!");
    // setTimeout(() => { window.location.reload(); }, 2000);
  } catch (err) {
    console.error(err);
    alert('เกิดข้อผิดพลาด: ' + (err.message || 'ไม่สามารถบันทึกได้'));
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = `<span id="btnSubmitText">${document.getElementById('qId').value ? 'อัปเดตใบเสนอราคา' : 'บันทึกใบเสนอราคา'}</span>`;
  }
});

const SPREADSHEET_ID = '1JurlL9VL4v0RRt_E3IJY1n51O4aEr_Rz9JcMu8QR69Q';
let allCustomers = [];
let allQuotations = [];
let allProducts = [];

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.admin-sidebar .active').forEach(el => el.classList.remove('active'));
  const navQuotation = document.getElementById('nav-quotation');
  if (navQuotation) navQuotation.classList.add('active');

  // Number will be updated by loadQuotations sequentially
  document.getElementById('quotationNo').value = generateQuotationNo();
  document.getElementById('quotationDate').valueAsDate = new Date();
  
  addItemRow();
  
  loadCustomers();
  loadQuotations();
  loadProducts();
  
  const searchInput = document.getElementById('custIdSearch');
  searchInput.addEventListener('focus', () => renderCustomerDropdown(searchInput.value));
  searchInput.addEventListener('click', () => renderCustomerDropdown(searchInput.value));
  searchInput.addEventListener('input', () => renderCustomerDropdown(searchInput.value));
  
  const oldQuotationSearch = document.getElementById('oldQuotationSearch');
  if (oldQuotationSearch) {
    oldQuotationSearch.addEventListener('focus', () => renderSavedQuotationsDropdown(oldQuotationSearch.value));
    oldQuotationSearch.addEventListener('click', () => renderSavedQuotationsDropdown(oldQuotationSearch.value));
  }
  
  document.addEventListener('click', (e) => {
    const custSearch = document.getElementById('custIdSearch');
    const custDropdown = document.getElementById('custDropdown');
    const custWrapper = document.getElementById('custIdSearchWrapper');
    if (custDropdown && custSearch) {
      const isClickInside = custSearch.contains(e.target) || custDropdown.contains(e.target) || (custWrapper && custWrapper.contains(e.target));
      if (!isClickInside) custDropdown.style.display = 'none';
    }
  });
});

function generateQuotationNo() {
  const now = new Date();
  const yy = (now.getFullYear() + 543).toString().slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `Q-${yy}${mm}${dd}${hh}${min}${ss}`;
}

function loadCustomers() {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=Cust_Data&t=` + new Date().getTime();
  Papa.parse(url, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function(results) {
      allCustomers = results.data || [];
      selectCustomerFromQuery();
    }
  });
}

function selectCustomerFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const custId = String(params.get('custId') || params.get('customerId') || '').trim();
  if (!custId || !allCustomers.length) return;

  const row = allCustomers.find(customer => String(customer['Cust_ID'] || '').trim() === custId);
  if (row) {
    selectCustomer(row);
  } else {
    document.getElementById('custId').value = custId;
    document.getElementById('custIdSearch').value = custId;
  }
}

function renderCustomerDropdown(searchTerm = '') {
  const dropdown = document.getElementById('custDropdown');
  dropdown.innerHTML = '';
  
  if (allCustomers.length === 0) {
    dropdown.innerHTML = '<div class="cust-dropdown-item"><small>กำลังโหลดข้อมูล...</small></div>';
    dropdown.style.display = 'block';
    return;
  }

  const term = searchTerm.toLowerCase().trim();
  const filtered = allCustomers.filter(row => {
    const id = String(row['Cust_ID'] || '').toLowerCase();
    const company = String(row['ชื่อบริษัท/ร้านค้า/ทีมงาน'] || '').toLowerCase();
    const contact = String(row['ชื่อ-นามสกุล'] || '').toLowerCase();
    return id.includes(term) || company.includes(term) || contact.includes(term);
  }).slice(0, 50); // limit to 50 results

  if (filtered.length === 0) {
    dropdown.innerHTML = '<div class="cust-dropdown-item"><small>ไม่พบข้อมูลลูกค้า</small></div>';
  } else {
    filtered.forEach(row => {
      const id = row['Cust_ID'] || '';
      const companyName = String(row['ชื่อบริษัท/ร้านค้า/ทีมงาน'] || '').trim();
      const contactName = String(row['ชื่อ-นามสกุล'] || '').trim();
      let displayName = companyName || contactName || 'ไม่มีชื่อ';
      if (companyName && contactName && companyName !== contactName) {
        displayName = `${contactName} | ${companyName}`;
      }
      
      const phone = row['เบอร์โทรศัพท์'] || '-';
      
      const item = document.createElement('div');
      item.className = 'cust-dropdown-item';
      item.innerHTML = `<strong>${displayName}</strong><small>${id} | โทร: ${phone}</small>`;
      item.onclick = function() {
        selectCustomer(row, displayName);
      };
      dropdown.appendChild(item);
    });
  }
  dropdown.style.display = 'block';
}

function selectCustomer(row, displayName) {
  const id = row['Cust_ID'] || '';
  if (!displayName) {
    const companyName = String(row['ชื่อบริษัท/ร้านค้า/ทีมงาน'] || '').trim();
    const contactName = String(row['ชื่อ-นามสกุล'] || '').trim();
    displayName = (companyName && contactName && companyName !== contactName) ? `${contactName} | ${companyName}` : (companyName || contactName || '');
  }
  
  document.getElementById('custId').value = id;
  document.getElementById('custIdSearch').value = displayName ? `${displayName} (${id})` : id;
  // Fill the actual name field with the same display name
  document.getElementById('custName').value = displayName;
  document.getElementById('taxId').value = row['เลขประจำตัวผู้เสียภาษี'] || '';
  document.getElementById('address').value = row['ที่อยู่สำหรับจัดส่งเอกสาร'] || '';
  document.getElementById('contactName').value = row['ชื่อ-นามสกุล'] || '';
  document.getElementById('phone').value = row['เบอร์โทรศัพท์'] || '';
  
  document.getElementById('custDropdown').style.display = 'none';
}

// Sidebar logic
function toggleSidebar() {
  const sidebar = document.querySelector('.admin-sidebar');
  if (sidebar) sidebar.classList.toggle('collapsed');
}

function switchTab(tabName) {
  if (tabName === 'quotation') return;
  window.location.href = 'admin.html';
}

// Print logic
function prepareAndPrint() {
  // Populate print container
  document.getElementById('pCustName').textContent = document.getElementById('custName').value || '-';
  document.getElementById('pAddress').textContent = document.getElementById('address').value || '-';
  document.getElementById('pTaxId').textContent = document.getElementById('taxId').value || '-';
  document.getElementById('pContact').textContent = document.getElementById('contactName').value || '-';
  document.getElementById('pPhone').textContent = document.getElementById('phone').value || '-';
  
  document.getElementById('pDocNo').textContent = document.getElementById('quotationNo').value || '-';
  document.getElementById('pDocDate').textContent = document.getElementById('quotationDate').value || '-';
  document.getElementById('pValidUntil').textContent = document.getElementById('validUntil').value || '-';
  document.getElementById('pCreditTerm').textContent = document.getElementById('creditTerm').value || '-';
  
  const tbody = document.getElementById('pItemsBody');
  tbody.innerHTML = '';
  
  const items = [];
  document.querySelectorAll('#itemsTable tbody tr').forEach(row => {
    const mainDesc = row.querySelector('.item-desc').value;
    const descHtml = row.querySelector('.ql-editor') ? row.querySelector('.ql-editor').innerHTML : '';
    let combinedDesc = mainDesc;
    if (descHtml && descHtml !== '<p><br></p>') combinedDesc += '[DETAILS]' + descHtml;
    
    items.push({
        description: combinedDesc,
        qty: row.querySelector('.item-qty').value,
        unit: row.querySelector('.item-unit').value,
        price: row.querySelector('.item-price').value,
        amount: row.querySelector('.item-amount').value
    });
  });
  
  let index = 1;
  items.forEach(it => {
    if (it.description || it.qty > 0) {
      const tr = document.createElement('tr');
      
      let descPrint = '';
      if (it.description.includes('[DETAILS]')) {
        const parts = it.description.split('[DETAILS]');
        const mainDesc = parts[0];
        const descHtml = parts[1];
        descPrint = `<strong>${mainDesc}</strong>`;
        if (descHtml) {
          descPrint += `<div style="margin-top: 4px; font-weight: normal;">${descHtml}</div>`;
        }
      } else {
        descPrint = (it.description || '').replace(/\n/g, '<br>');
      }
      
      tr.innerHTML = `
        <td style="text-align: center; vertical-align: top;">${index++}</td>
        <td style="vertical-align: top;">${descPrint}</td>
        <td style="text-align: center; vertical-align: top;">${it.qty || ''}</td>
        <td style="text-align: center; vertical-align: top;">${it.unit || ''}</td>
        <td style="text-align: right; vertical-align: top;">${it.price ? Number(it.price).toLocaleString('en-US', {minimumFractionDigits: 2}) : ''}</td>
        <td style="text-align: right; vertical-align: top;">${it.amount || ''}</td>
      `;
      tbody.appendChild(tr);
    }
  });
  
  document.getElementById('pRemarks').textContent = document.getElementById('remarks').value.trim();
  
  document.getElementById('pSumTotal').textContent = document.getElementById('sumTotal').textContent;
  document.getElementById('pDiscount').textContent = Number(document.getElementById('discount').value || 0).toLocaleString('en-US', {minimumFractionDigits: 2});
  document.getElementById('pAfterDiscount').textContent = document.getElementById('afterDiscount').textContent;
  document.getElementById('pVat').textContent = document.getElementById('vatAmount').textContent;
  document.getElementById('pGrandTotal').textContent = document.getElementById('grandTotal').textContent;
  
  window.print();
}

function loadQuotations() {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=Quotation&t=` + new Date().getTime();
  Papa.parse(url, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function(results) {
      const grouped = {};
      (results.data || []).forEach(row => {
        const qId = row['Q_ID'];
        if (!qId) return;
        if (!grouped[qId]) {
          grouped[qId] = {
            qId: qId,
            qNo: row['เลขที่ใบเสนอราคา'],
            custId: row['Cust_ID'],
            qDate: row['วันที่เสนอราคา'],
            validUntil: row['ยืนราคา'] || '',
            creditTerm: row['เครดิตเทอม'] || '',
            remark: row['หมายเหตุ'] || '',
            status: row['สถานะ'] || '',
            discount: row['ส่วนลด'] || '0',
            items: []
          };
        }
        grouped[qId].items.push({
          description: row['รายการสินค้า'],
          qty: row['จำนวน'],
          unit: row['หน่วย'],
          price: row['ราคาต่อสินค้า'],
          amount: row['ยอดรวม']
        });
      });
      allQuotations = Object.values(grouped);
      allQuotations.reverse();
      
      // Update quotation number to be sequential from the latest
      if (allQuotations.length > 0 && !document.getElementById('qId').value) {
        const latestQNo = String(allQuotations[0].qNo || '');
        const match = latestQNo.match(/(.*?)(\d+)$/);
        if (match) {
          const prefix = match[1];
          const numStr = match[2];
          const nextNum = parseInt(numStr, 10) + 1;
          const nextNumStr = String(nextNum).padStart(numStr.length, '0');
          document.getElementById('quotationNo').value = prefix + nextNumStr;
        }
      }
    }
  });
}

function renderSavedQuotationsDropdown(searchTerm = '') {
  const dropdown = document.getElementById('oldQuotationsDropdown');
  dropdown.innerHTML = '';
  
  if (allQuotations.length === 0) {
    dropdown.innerHTML = '<div class="cust-dropdown-item"><small>ไม่มีข้อมูล</small></div>';
    dropdown.style.display = 'block';
    return;
  }

  const term = searchTerm.toLowerCase().trim();
  const filtered = allQuotations.filter(q => {
    const no = String(q.qNo || '').toLowerCase();
    const custId = String(q.custId || '').toLowerCase();
    return no.includes(term) || custId.includes(term);
  }).slice(0, 30);

  if (filtered.length === 0) {
    dropdown.innerHTML = '<div class="cust-dropdown-item"><small>ไม่พบข้อมูล</small></div>';
  } else {
    filtered.forEach(q => {
      const item = document.createElement('div');
      item.className = 'cust-dropdown-item';
      item.innerHTML = `<strong>${q.qNo}</strong><small>ลูกค้า: ${q.custId} | วันที่: ${q.qDate}</small>`;
      item.onclick = function() { selectSavedQuotation(q); };
      dropdown.appendChild(item);
    });
  }
  dropdown.style.display = 'block';
}

function selectSavedQuotation(q) {
  document.getElementById('qId').value = q.qId;
  document.getElementById('quotationNo').value = q.qNo;
  try {
    const d = new Date(q.qDate);
    if (!isNaN(d.getTime())) {
      document.getElementById('quotationDate').value = d.toISOString().split('T')[0];
    }
  } catch(e) {}
  
  document.getElementById('validUntil').value = q.validUntil;
  document.getElementById('creditTerm').value = q.creditTerm;
  document.getElementById('discount').value = q.discount;
  
  let pureRemark = q.remark;
  if (pureRemark && pureRemark.includes('เบอร์:')) {
    const parts = pureRemark.split('\n');
    parts.shift();
    pureRemark = parts.join('\n');
  }
  document.getElementById('remarks').value = pureRemark || '';
  
  const custRow = allCustomers.find(c => c['Cust_ID'] === q.custId || c['ชื่อบริษัท/ร้านค้า/ทีมงาน'] === q.custId);
  if (custRow) {
    selectCustomer(custRow);
  } else {
    document.getElementById('custId').value = q.custId;
    document.getElementById('custIdSearch').value = q.custId;
  }
  
  const tbody = document.querySelector('#itemsTable tbody');
  tbody.innerHTML = '';
  
  q.items.forEach(it => {
    addItemRow(it);
  });
  
  calculateTotal();
  
  document.getElementById('oldQuotationsDropdown').style.display = 'none';
  document.getElementById('oldQuotationSearch').value = '';
  document.getElementById('btnSubmitText').textContent = 'อัปเดตใบเสนอราคา';
}

document.addEventListener('click', function(e) {
  const oldSearch = document.getElementById('oldQuotationSearch');
  const dropdown = document.getElementById('oldQuotationsDropdown');
  const oldWrapper = document.getElementById('oldQuotationSearchWrapper');
  if (dropdown && oldSearch) {
    const isClickInside = oldSearch.contains(e.target) || dropdown.contains(e.target) || (oldWrapper && oldWrapper.contains(e.target));
    if (!isClickInside) dropdown.style.display = 'none';
  }

async function loadProducts() {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent('รายการสินค้า')}&t=` + new Date().getTime();
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Network response was not ok");
    const csvText = await response.text();
    
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: function(results) {
        allProducts = results.data || [];
        if (allProducts.length === 0) {
          alert("คำเตือน: โหลดข้อมูลสำเร็จแต่ไม่พบสินค้าในชีต 'รายการสินค้า'");
        }
        const datalist = document.getElementById('productDatalist');
        if (datalist) {
          datalist.innerHTML = '';
          allProducts.forEach(prod => {
            if (prod['รายการสินค้า']) {
              const option = document.createElement('option');
              option.value = prod['รายการสินค้า'];
              datalist.appendChild(option);
            }
          });
        }
        
        document.querySelectorAll('.item-desc').forEach(input => {
          if (document.activeElement === input || input.value) {
            input.dispatchEvent(new Event('input'));
          }
        });
      }
    });
  } catch (err) {
    console.error("loadProducts error:", err);
    alert("ไม่สามารถเชื่อมต่อเพื่อดึงข้อมูลสินค้าได้: " + err.message);
  }
}
});
