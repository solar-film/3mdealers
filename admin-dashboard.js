// Dashboard calculations and rendering for the admin CRM overview.
(function () {
  const DASHBOARD_TEMPLATE = `
    <section class="dashboard-hero">
      <div class="dashboard-heading">
        <span class="dashboard-eyebrow">Dealer CRM Dashboard</span>
        <h1>ภาพรวม Smart Partner Program</h1>
        <p>ติดตามลีดใหม่ การมอบหมายทีม สถานะติดตาม และโอกาสที่พร้อมพัฒนาเป็นพาร์ทเนอร์</p>
      </div>
      <div class="dashboard-snapshot" aria-label="ภาพรวมข้อมูล">
        <div class="snapshot-item">
          <strong id="dash-updated">-</strong>
          <span>อัปเดตล่าสุด</span>
        </div>
        <div class="snapshot-item">
          <strong id="dash-province-total">0</strong>
          <span>จังหวัดที่พบในข้อมูล</span>
        </div>
        <div class="snapshot-item">
          <strong id="dash-business-total">0</strong>
          <span>ประเภทธุรกิจ</span>
        </div>
      </div>
    </section>

    <section class="dashboard-kpi-grid" aria-label="ตัวชี้วัดหลัก">
      <article class="dashboard-kpi-card" style="--kpi-color:#005eb8">
        <div>
          <div class="kpi-title">ลีดทั้งหมดในระบบ</div>
          <div class="kpi-value" id="kpi-total-leads">0</div>
        </div>
        <div class="kpi-desc" id="kpi-total-desc">รายการจาก Google Sheet</div>
      </article>
      <article class="dashboard-kpi-card" style="--kpi-color:#ef3340">
        <div>
          <div class="kpi-title">ต้องติดตามต่อ</div>
          <div class="kpi-value" id="kpi-need-action">0</div>
        </div>
        <div class="kpi-desc" id="kpi-need-action-desc">ยังรอดำเนินการหรือยังไม่มีแอดมินรับผิดชอบ</div>
      </article>
      <article class="dashboard-kpi-card" style="--kpi-color:#10a76a">
        <div>
          <div class="kpi-title">มอบหมายแอดมินแล้ว</div>
          <div class="kpi-value" id="kpi-assigned-rate">0%</div>
        </div>
        <div class="kpi-desc" id="kpi-assigned-desc">0 จาก 0 รายการ</div>
      </article>
      <article class="dashboard-kpi-card" style="--kpi-color:#7357e8">
        <div>
          <div class="kpi-title">Partner ใน pipeline</div>
          <div class="kpi-value" id="kpi-partner-count">0</div>
        </div>
        <div class="kpi-desc" id="kpi-partner-desc">แยกตามระดับพาร์ทเนอร์ด้านล่าง</div>
      </article>
    </section>

    <section>
      <h2 class="dashboard-section-title">Pipeline ตามสถานะที่ใช้งานจริง</h2>
      <div class="dashboard-stage-grid" id="dashboard-stage-grid"></div>
    </section>

    <section class="dashboard-grid">
      <article class="dashboard-card">
        <div class="dashboard-card-header">
          <h2 class="dashboard-section-title">สถานะการติดตาม</h2>
          <small id="tracking-status-total">0 สถานะ</small>
        </div>
        <div class="metric-list" id="chart-tracking-status"></div>
      </article>

      <aside class="dashboard-action-panel">
        <div class="dashboard-card-header">
          <h2 class="dashboard-section-title">รายการที่ควรตามต่อ</h2>
          <small id="action-total">0 รายการ</small>
        </div>
        <div class="dashboard-action-list" id="dashboard-action-list"></div>
      </aside>

      <div class="dashboard-two-col">
        <article class="dashboard-card">
          <div class="dashboard-card-header">
            <h2 class="dashboard-section-title">กลุ่มลูกค้า</h2>
            <small id="customer-group-total">0 กลุ่ม</small>
          </div>
          <div class="metric-list" id="chart-customer-group"></div>
        </article>

        <article class="dashboard-card">
          <div class="dashboard-card-header">
            <h2 class="dashboard-section-title">ระดับพาร์ทเนอร์</h2>
            <small id="partner-tier-total">0 ราย</small>
          </div>
          <div class="metric-list" id="chart-partner-tier"></div>
        </article>
      </div>

      <div class="dashboard-two-col">
        <article class="dashboard-card">
          <div class="dashboard-card-header">
            <h2 class="dashboard-section-title">ประเภทธุรกิจยอดนิยม</h2>
            <small id="lbl-total-biz">0 หมวดหมู่</small>
          </div>
          <div class="metric-list" id="chart-business-type"></div>
        </article>

        <article class="dashboard-card">
          <div class="dashboard-card-header">
            <h2 class="dashboard-section-title">พื้นที่ให้บริการหลัก</h2>
            <small id="lbl-total-province">0 จังหวัด</small>
          </div>
          <div class="metric-list" id="chart-province"></div>
        </article>
      </div>
    </section>
  `;

  const STAGES = [
    { key: 'new', label: 'สมัครใหม่', color: '#005eb8' },
    { key: 'pending', label: 'กำลังติดตาม', color: '#f59e0b' },
    { key: 'target', label: 'Target', color: '#0ea5a3' },
    { key: 'member', label: 'Member', color: '#10a76a' },
    { key: 'partner', label: 'Partner', color: '#7357e8' },
    { key: 'cancelled', label: 'ยกเลิก', color: '#ef3340' }
  ];

  const TIER_LABELS = {
    pending: 'Pending',
    registered: 'Registered',
    authorized: 'Authorized',
    premium: 'Premium'
  };

  function getLeadsData() {
    try {
      if (Array.isArray(leadsData)) return leadsData;
    } catch (error) {
      return [];
    }
    return [];
  }

  function ensureDashboardShell() {
    const container = document.querySelector('.dashboard-container');
    if (!container) return null;
    if (container.dataset.dashboardDesign !== 'crm-v2') {
      container.innerHTML = DASHBOARD_TEMPLATE;
      container.dataset.dashboardDesign = 'crm-v2';
    }
    return container;
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function normalizeText(value, fallback = 'ไม่ระบุ') {
    const text = String(value === undefined || value === null ? '' : value).trim();
    return text && text !== '-' ? text : fallback;
  }

  function percent(count, total) {
    return total ? Math.round((count / total) * 100) : 0;
  }

  function countBy(items, getKey) {
    return items.reduce((acc, item) => {
      const key = normalizeText(getKey(item));
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  function sortCounts(counts) {
    return Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'th'));
  }

  function splitBusinessTypes(value) {
    return normalizeText(value, '')
      .split(/[,،]/)
      .map(item => item.trim())
      .filter(Boolean);
  }

  function detectProvince(lead) {
    let province = normalizeText(lead.province, '');
    if (province) return province;

    const address = String(lead.address || '');
    const commonProvinces = ['กรุงเทพมหานคร', 'เชียงใหม่', 'ชลบุรี', 'ภูเก็ต', 'นนทบุรี', 'ขอนแก่น', 'ระยอง', 'ปทุมธานี', 'สมุทรปราการ', 'นครราชสีมา'];
    const matched = commonProvinces.find(item => address.includes(item));
    if (matched) return matched;
    if (address.includes('กรุงเทพ') || address.includes('กทม')) return 'กรุงเทพมหานคร';
    return 'ไม่ระบุจังหวัด';
  }

  function getStageKey(lead) {
    if (typeof getPipelineStage === 'function') return getPipelineStage(lead);
    if (lead.trackingStatus === 'ยกเลิก') return 'cancelled';
    if (lead.customerGroup === 'Partner') return 'partner';
    if (lead.customerGroup === 'Member') return 'member';
    if (lead.customerGroup === 'Target') return 'target';
    return lead.adminName ? 'pending' : 'new';
  }

  function isNeedAction(lead) {
    const status = normalizeText(lead.trackingStatus, '');
    const stage = getStageKey(lead);
    if (stage === 'cancelled' || stage === 'partner' || status === 'สำเร็จ') return false;
    return !lead.adminName || status === 'รอดำเนินการ';
  }

  function getDateValue(lead) {
    const raw = (lead.rawData && (lead.rawData['ประทับเวลา'] || lead.rawData.Timestamp)) || lead.date || '';
    const match = String(raw).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\D+(\d{1,2}):(\d{1,2}))?/);
    if (match) {
      const [, day, month, year, hour = '0', minute = '0'] = match;
      return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)).getTime();
    }
    return new Date(raw).getTime() || 0;
  }

  function renderMetricBars(containerId, entries, total, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    const visibleEntries = entries.slice(0, options.limit || 8);
    if (!visibleEntries.length) {
      const empty = document.createElement('div');
      empty.className = 'dashboard-empty';
      empty.textContent = options.emptyText || 'ยังไม่มีข้อมูลสำหรับส่วนนี้';
      container.appendChild(empty);
      return;
    }

    visibleEntries.forEach(([label, value], index) => {
      const row = document.createElement('div');
      row.className = 'metric-row';

      const labelEl = document.createElement('div');
      labelEl.className = 'metric-label';
      labelEl.textContent = label;
      labelEl.title = label;

      const bar = document.createElement('div');
      bar.className = 'metric-bar';

      const fill = document.createElement('div');
      fill.className = 'metric-fill';
      fill.style.width = `${percent(value, total)}%`;
      fill.style.setProperty('--bar-color', options.colors ? options.colors[index % options.colors.length] : '#005eb8');
      bar.appendChild(fill);

      const valueEl = document.createElement('div');
      valueEl.className = 'metric-value';
      valueEl.textContent = value;

      row.append(labelEl, bar, valueEl);
      container.appendChild(row);
    });
  }

  function renderStageCards(leads) {
    const container = document.getElementById('dashboard-stage-grid');
    if (!container) return;
    const total = leads.length;
    const counts = STAGES.reduce((acc, stage) => ({ ...acc, [stage.key]: 0 }), {});
    leads.forEach(lead => {
      const key = getStageKey(lead);
      counts[key] = (counts[key] || 0) + 1;
    });

    container.innerHTML = '';
    STAGES.forEach(stage => {
      const card = document.createElement('article');
      card.className = 'dashboard-stage-card';
      card.style.setProperty('--stage-color', stage.color);
      card.innerHTML = `
        <div class="stage-label"></div>
        <div class="stage-value"></div>
        <div class="stage-share"></div>
      `;
      card.querySelector('.stage-label').textContent = stage.label;
      card.querySelector('.stage-value').textContent = counts[stage.key] || 0;
      card.querySelector('.stage-share').textContent = `${percent(counts[stage.key] || 0, total)}% ของทั้งหมด`;
      container.appendChild(card);
    });
  }

  function renderActionList(leads) {
    const actionLeads = leads
      .filter(isNeedAction)
      .sort((a, b) => getDateValue(b) - getDateValue(a))
      .slice(0, 6);

    const container = document.getElementById('dashboard-action-list');
    if (!container) return;
    container.innerHTML = '';
    setText('action-total', `${leads.filter(isNeedAction).length} รายการ`);

    if (!actionLeads.length) {
      const empty = document.createElement('div');
      empty.className = 'dashboard-empty';
      empty.textContent = 'ไม่มีรายการค้างติดตามในตอนนี้';
      container.appendChild(empty);
      return;
    }

    actionLeads.forEach(lead => {
      const item = document.createElement('div');
      item.className = 'action-item';

      const title = document.createElement('div');
      title.className = 'action-title';
      title.textContent = normalizeText(lead.company || lead.contact, 'ไม่ระบุชื่อร้าน');

      const meta = document.createElement('div');
      meta.className = 'action-meta';
      const owner = lead.adminName ? `แอดมิน: ${lead.adminName}` : 'ยังไม่มอบหมายแอดมิน';
      meta.textContent = `${normalizeText(lead.trackingStatus)} · ${owner}`;

      item.append(title, meta);
      container.appendChild(item);
    });
  }

  function renderDashboard() {
    const container = ensureDashboardShell();
    if (!container) return;

    const leads = getLeadsData();
    const total = leads.length;
    const assignedAdmin = leads.filter(lead => normalizeText(lead.adminName, '')).length;
    const assignedSales = leads.filter(lead => normalizeText(lead.salesName, '')).length;
    const partnerCount = leads.filter(lead => lead.customerGroup === 'Partner').length;
    const needsAction = leads.filter(isNeedAction).length;

    const businessCounts = {};
    leads.forEach(lead => {
      splitBusinessTypes(lead.business).forEach(type => {
        businessCounts[type] = (businessCounts[type] || 0) + 1;
      });
    });

    const provinceCounts = countBy(leads, detectProvince);
    const trackingCounts = countBy(leads, lead => lead.trackingStatus);
    const groupCounts = countBy(leads, lead => lead.customerGroup);
    const tierCounts = {};
    leads
      .filter(lead => lead.customerGroup === 'Partner')
      .forEach(lead => {
        const label = TIER_LABELS[lead.tier] || 'Pending';
        tierCounts[label] = (tierCounts[label] || 0) + 1;
      });

    setText('dash-updated', new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }));
    setText('dash-province-total', Object.keys(provinceCounts).length);
    setText('dash-business-total', Object.keys(businessCounts).length);

    setText('kpi-total-leads', total);
    setText('kpi-total-desc', `${Object.keys(groupCounts).length} กลุ่มลูกค้า · ${Object.keys(trackingCounts).length} สถานะติดตาม`);
    setText('kpi-need-action', needsAction);
    setText('kpi-need-action-desc', `${percent(needsAction, total)}% ของลีดทั้งหมดต้องมี action ต่อ`);
    setText('kpi-assigned-rate', `${percent(assignedAdmin, total)}%`);
    setText('kpi-assigned-desc', `แอดมิน ${assignedAdmin}/${total} · ฝ่ายขาย ${assignedSales}/${total}`);
    setText('kpi-partner-count', partnerCount);
    setText('kpi-partner-desc', `${percent(partnerCount, total)}% ของลีดทั้งหมดถูกจัดเป็น Partner`);

    renderStageCards(leads);
    renderMetricBars('chart-tracking-status', sortCounts(trackingCounts), total, {
      colors: ['#005eb8', '#f59e0b', '#10a76a', '#ef3340'],
      emptyText: 'ยังไม่มีสถานะติดตาม'
    });
    renderMetricBars('chart-customer-group', sortCounts(groupCounts), total, {
      colors: ['#0ea5a3', '#10a76a', '#7357e8', '#005eb8'],
      emptyText: 'ยังไม่มีการจัดกลุ่มลูกค้า'
    });
    renderMetricBars('chart-partner-tier', sortCounts(tierCounts), partnerCount, {
      colors: ['#94a3b8', '#475569', '#c0841a', '#7c3aed'],
      emptyText: 'ยังไม่มีลูกค้ากลุ่ม Partner'
    });
    renderMetricBars('chart-business-type', sortCounts(businessCounts), total, {
      limit: 8,
      colors: ['#005eb8', '#0b7ff3', '#0ea5a3'],
      emptyText: 'ยังไม่มีข้อมูลประเภทธุรกิจ'
    });
    renderMetricBars('chart-province', sortCounts(provinceCounts), total, {
      limit: 8,
      colors: ['#1b437c', '#005eb8', '#0ea5a3'],
      emptyText: 'ยังไม่มีข้อมูลจังหวัด'
    });

    setText('tracking-status-total', `${Object.keys(trackingCounts).length} สถานะ`);
    setText('customer-group-total', `${Object.keys(groupCounts).length} กลุ่ม`);
    setText('partner-tier-total', `${partnerCount} ราย`);
    setText('lbl-total-biz', `${Object.keys(businessCounts).length} หมวดหมู่`);
    setText('lbl-total-province', `${Object.keys(provinceCounts).length} จังหวัด`);

    renderActionList(leads);
  }

  window.renderDashboard = renderDashboard;
})();
