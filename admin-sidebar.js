document.write(`
  <aside class="admin-sidebar collapsed">
    <button class="sidebar-expand-toggle" type="button" onclick="toggleSidebar()" aria-label="ย่อหรือขยายเมนู">
      <svg class="sidebar-expand-icon sidebar-icon-collapse" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"></path></svg>
      <svg class="sidebar-expand-icon sidebar-icon-expand" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"></path></svg>
    </button>

    <div class="admin-brand">
      <img src="images/LOGO-GFS2024.png" alt="GOODFILM" />
    </div>

    <nav class="admin-nav">
      <div class="admin-nav-section">
        <a class="admin-nav-item" onclick="switchTab('dashboard')" id="nav-dashboard">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
          <span>หน้าแรก</span>
        </a>
      </div>

      <div class="admin-nav-section">
        <div class="admin-nav-heading">CRM</div>
        <a class="admin-nav-item active" onclick="switchTab('leads')" id="nav-leads">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="22" y1="11" x2="16" y2="11"></line></svg>
          <span>ลีด & สมาชิก</span>
        </a>
        <a class="admin-nav-subitem active" onclick="switchTab('leads')">Pipeline Board</a>
        <a class="admin-nav-subitem" onclick="switchTab('leads')">รายชื่อสมาชิก</a>
        <a class="admin-nav-subitem" onclick="switchTab('leads')">กิจกรรมติดตาม</a>
      </div>

      <div class="admin-nav-section">
        <div class="admin-nav-heading">การขาย</div>
        <a class="admin-nav-item" href="https://app.smemove.com/auth/logout" target="_blank">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>
          <span>ออกใบเสนอราคา</span>

          <a class="admin-nav-item" href="index.html" target="_blank">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>
          <span>แบบฟอร์มลงทะเบียน</span>
        </a>
        </a>
      </div>

      <div class="admin-nav-section">
        <div class="admin-nav-heading">ตั้งค่า</div>
        <a class="admin-nav-item" onclick="switchTab('settings')" id="nav-settings">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1 2.83 0l.06-.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          <span>ตั้งค่าระบบ</span>
        </a>
      </div>
    </nav>

    <div class="admin-user-card">
      <div class="admin-avatar">^_^</div>
      <div>
        <strong>OILLY</strong>
        <span>Admin</span>
      </div>
    </div>
  </aside>
`);
