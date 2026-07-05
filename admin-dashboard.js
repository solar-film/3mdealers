    // Dashboard Calculations
    function renderDashboard() {
      if (leadsData.length === 0) return;

      // 1. KPI cards calculations
      const totalCount = leadsData.length;
      const approvedCount = leadsData.filter(l => l.status === 'approved').length;
      
      // Active Rate: approved / total
      const activePct = totalCount ? Math.round((approvedCount / totalCount) * 100) : 0;

      // Onboarding Completion rate
      let totalStepsCompleted = 0;
      leadsData.forEach(l => {
        const chk = l.checklist || [true, false, false, false, false, false, false];
        totalStepsCompleted += chk.filter(Boolean).length;
      });
      const avgOnboardingPct = totalCount ? Math.round((totalStepsCompleted / (totalCount * 7)) * 100) : 0;

      document.getElementById('kpi-total-leads').textContent = totalCount;
      document.getElementById('kpi-approved-leads').textContent = approvedCount;
      document.getElementById('kpi-active-rate').textContent = activePct + '%';
      document.getElementById('kpi-avg-onboarding').textContent = avgOnboardingPct + '%';

      // 2. Funnel Step Count Calculations
      const stepCounts = [0, 0, 0, 0, 0, 0, 0];
      leadsData.forEach(l => {
        const chk = l.checklist || [true, false, false, false, false, false, false];
        chk.forEach((checked, idx) => {
          if (checked) stepCounts[idx]++;
        });
      });

      for (let i = 1; i <= 7; i++) {
        const stepEl = document.getElementById('funnel-s' + i);
        const countEl = document.getElementById('fun-count-' + i);
        if (countEl) countEl.textContent = stepCounts[i-1];
        
        // Visual indicator
        if (stepCounts[i-1] > 0) {
          stepEl.classList.add('completed');
        } else {
          stepEl.classList.remove('completed');
        }
      }

      // 3. Business Type Distribution Chart
      const businessCounts = {};
      leadsData.forEach(l => {
        const bizList = l.business.split(', ');
        bizList.forEach(biz => {
          if (biz && biz !== '-') {
            businessCounts[biz] = (businessCounts[biz] || 0) + 1;
          }
        });
      });

      // Render Business Chart
      const bizChartEl = document.getElementById('chart-business-type');
      bizChartEl.innerHTML = '';
      const sortedBiz = Object.entries(businessCounts).sort((a,b) => b[1] - a[1]);
      
      document.getElementById('lbl-total-biz').textContent = sortedBiz.length + ' หมวดหมู่';

      sortedBiz.forEach(([bizName, count]) => {
        const row = document.createElement('div');
        row.className = 'bar-chart-row';
        const percent = Math.round((count / totalCount) * 100);
        
        row.innerHTML = `
          <div class="bar-label" title="${bizName}">${bizName}</div>
          <div class="bar-wrapper">
            <div class="bar-fill" style="width: ${percent}%;"></div>
          </div>
          <div class="bar-value">${count}</div>
        `;
        bizChartEl.appendChild(row);
      });

      // 4. Province Distribution Chart
      const provinceCounts = {};
      leadsData.forEach(l => {
        let detectedProv = String(l.province || '').trim();
        if (!detectedProv || detectedProv === '-') {
          // fallback to address parsing if province is missing
          const addr = String(l.address || '');
          const typicalProvinces = ['เชียงใหม่', 'ชลบุรี', 'ภูเก็ต', 'นนทบุรี', 'ขอนแก่น', 'ระยอง', 'ปทุมธานี', 'สมุทรปราการ', 'นครราชสีมา'];
          const matched = typicalProvinces.find(p => addr.includes(p));
          if (matched) {
            detectedProv = matched;
          } else if (addr.includes('กรุงเทพ') || addr.includes('กทม')) {
            detectedProv = 'กรุงเทพมหานคร';
          } else {
            detectedProv = 'กรุงเทพมหานคร'; // default fallback
          }
        }
        
        if (detectedProv.length > 20) detectedProv = detectedProv.slice(0, 15) + '...';
        provinceCounts[detectedProv] = (provinceCounts[detectedProv] || 0) + 1;
      });

      // Render Province Chart
      const provChartEl = document.getElementById('chart-province');
      provChartEl.innerHTML = '';
      const sortedProvs = Object.entries(provinceCounts).sort((a,b) => b[1] - a[1]).slice(0, 5); // top 5
      
      document.getElementById('lbl-total-province').textContent = Object.keys(provinceCounts).length + ' จังหวัด';

      sortedProvs.forEach(([provName, count]) => {
        const row = document.createElement('div');
        row.className = 'bar-chart-row';
        const percent = Math.round((count / totalCount) * 100);
        
        row.innerHTML = `
          <div class="bar-label">${provName}</div>
          <div class="bar-wrapper">
            <div class="bar-fill" style="width: ${percent}%; background: linear-gradient(90deg, var(--gfs-navy), var(--gfs-blue));"></div>
          </div>
          <div class="bar-value">${count}</div>
        `;
        provChartEl.appendChild(row);
      });
    }
