/* ============================================================
   TVU HọcLiệu — JS riêng Trang Quản trị (admin.html)
   ============================================================ */

/* ---------- ADMIN LOGIN GATE ---------- */
var ADMIN_KEY = 'hl_admin_loggedin';

function checkAdminAuth() {
  try {
    if (localStorage.getItem(ADMIN_KEY) === '1') {
      document.getElementById('adminGate').classList.add('hidden');
      return;
    }
  } catch (e) {}
  document.getElementById('adminGate').classList.remove('hidden');
}

function adminLogin() {
  var err = document.getElementById('agError');
  err.style.display = 'none';
  try { localStorage.setItem(ADMIN_KEY, '1'); } catch (e) {}
  document.getElementById('adminGate').classList.add('hidden');
}

function adminLogout() {
  try { localStorage.removeItem(ADMIN_KEY); } catch (e) {}
  document.getElementById('adminGate').classList.remove('hidden');
  document.getElementById('agUser').value = '';
  document.getElementById('agPass').value = '';
  document.getElementById('agError').style.display = 'none';
}

// Gắn events
document.getElementById('agLogin').addEventListener('click', adminLogin);
document.getElementById('agPass').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') adminLogin();
});
document.getElementById('agUser').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') document.getElementById('agPass').focus();
});

// Check on load
checkAdminAuth();

/* ---------- CHUYỂN TAB ---------- */
var allTabs = ['pending', 'report', 'docs', 'users', 'stats', 'team'];

function adminTab(name, btn) {
  allTabs.forEach(function (t) {
    var el = document.getElementById('tab-' + t);
    if (el) el.style.display = t === name ? '' : 'none';
  });
  document.querySelectorAll('.admin-tabs .at-btn').forEach(function (b) {
    b.classList.remove('active');
  });
  btn.classList.add('active');

  // Render chart khi mở tab thống kê lần đầu
  if (name === 'stats' && !window._chartRendered) {
    renderBarChart();
    window._chartRendered = true;
  }
}

/* ---------- DUYỆT / TỪ CHỐI / XỬ LÝ ---------- */
function adminAct(el, group, msg) {
  var row = el.closest('.admin-row') || el.closest('.ad-doc-row');
  if (!row) return;
  row.style.transition = '.25s';
  row.style.opacity = '0';
  row.style.transform = 'translateX(12px)';
  setTimeout(function () {
    row.remove();
    // Cập nhật counter nếu là tab pending/report
    var id = group === 'pending' ? 'Pending' : group === 'report' ? 'Report' : null;
    if (id) {
      var cnt = document.getElementById('cnt' + id);
      var kpi = document.getElementById('kpi' + id);
      if (cnt) {
        var n = Math.max(0, parseInt(cnt.textContent) - 1);
        cnt.textContent = n;
        if (kpi) kpi.textContent = n;
      }
      var box = document.getElementById('tab-' + group);
      if (box && !box.querySelector('.admin-row')) {
        var empty = box.querySelector('.admin-empty');
        if (empty) empty.style.display = 'block';
      }
    }
  }, 250);
  if (typeof hlToast === 'function') {
    hlToast((msg || '').replace(/&amp;/g, '&'));
  }
}

/* ---------- CHART: BAR CHART ĐƠN GIẢN ---------- */
function renderBarChart() {
  var data = [
    { label: 'T1', value: 820, color: 'var(--coral)' },
    { label: 'T2', value: 650, color: 'var(--coral)' },
    { label: 'T3', value: 1100, color: 'var(--coral)' },
    { label: 'T4', value: 940, color: 'var(--teal)' },
    { label: 'T5', value: 1350, color: 'var(--teal)' },
    { label: 'T6', value: 1800, color: 'var(--amber)' },
    { label: 'T7', value: 1200, color: 'var(--grape)' }
  ];
  var max = Math.max.apply(null, data.map(function (d) { return d.value; }));
  var chart = document.getElementById('barChart');
  if (!chart) return;
  chart.innerHTML = '';
  data.forEach(function (d) {
    var pct = (d.value / max * 100);
    var bar = document.createElement('div');
    bar.className = 'ad-bar';
    bar.style.height = pct + '%';
    bar.style.background = d.color;
    bar.innerHTML = '<small>' + d.value + '</small><span>' + d.label + '</span>';
    chart.appendChild(bar);
  });
}
/* ---------- MODAL TÀI KHOẢN ADMIN ---------- */
function openAdminAccount(tab) {
  var m = document.getElementById('adminAccModal');
  if (!m) { m = buildAdminAccModal(); document.body.appendChild(m); }
  var t = tab || 'info';
  m.querySelectorAll('.acc-tab').forEach(function (b) { b.classList.toggle('active', b.dataset.tab === t); });
  m.querySelectorAll('.acc-panel').forEach(function (p) { p.classList.toggle('active', p.dataset.tab === t); });
  // Thoát edit mode khi mở lại
  var ip = m.querySelector('#adAccInfo');
  if (ip) {
    ip.classList.remove('editing');
    m.querySelector('#adEditBtn').style.display = '';
    m.querySelector('#adSaveBtn').style.display = 'none';
    m.querySelector('#adCancelBtn').style.display = 'none';
  }
  new bootstrap.Modal(m).show();
}

function buildAdminAccModal() {
  var d = document.createElement('div');
  d.className = 'modal fade acc-modal'; d.id = 'adminAccModal'; d.tabIndex = -1;
  d.innerHTML =
    '<div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">' +
      '<div class="modal-content hl-modal">' +
        '<div class="modal-header" style="background:linear-gradient(135deg,#0a1e40,#0046AD)">' +
          '<div class="acc-profile">' +
            '<span class="acc-ava" style="background:rgba(255,255,255,.15);border-color:rgba(255,255,255,.25)">AD</span>' +
            '<div>' +
              '<div class="acc-name">Quản trị viên</div>' +
              '<small>admin@hoclieu.tvu.edu.vn</small>' +
            '</div>' +
          '</div>' +
          '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Đóng"></button>' +
        '</div>' +
        '<div class="acc-tabs">' +
          '<button class="acc-tab active" data-tab="info"><i class="bi bi-person"></i> Tài khoản</button>' +
          '<button class="acc-tab" data-tab="settings"><i class="bi bi-gear"></i> Cài đặt</button>' +
        '</div>' +
        '<div class="modal-body" style="padding:0">' +

          '<div class="acc-panel active" data-tab="info" id="adAccInfo">' +
            '<div class="acc-edit-bar">' +
              '<button class="btn btn-ghost" id="adEditBtn" type="button"><i class="bi bi-pencil-square me-1"></i>Chỉnh sửa</button>' +
              '<button class="btn btn-coral" id="adSaveBtn" type="button" style="display:none"><i class="bi bi-check-lg me-1"></i>Lưu thay đổi</button>' +
              '<button class="btn btn-ghost" id="adCancelBtn" type="button" style="display:none">Hủy</button>' +
            '</div>' +
            '<div class="acc-info-row">' +
              '<span class="ai-ic" style="background:rgba(0,70,173,.1);color:var(--coral)"><i class="bi bi-person-fill"></i></span>' +
              '<div style="flex:1"><div class="ai-label">Họ tên</div><div class="ai-value" data-field="name">Quản trị viên</div><div class="ai-edit"><input type="text" value="Quản trị viên" data-field="name"></div></div>' +
            '</div>' +
            '<div class="acc-info-row ai-readonly">' +
              '<span class="ai-ic" style="background:rgba(58,169,41,.1);color:var(--teal-dark)"><i class="bi bi-envelope-fill"></i></span>' +
              '<div><div class="ai-label">Email</div><div class="ai-value">admin@hoclieu.tvu.edu.vn</div></div>' +
            '</div>' +
            '<div class="acc-info-row ai-readonly">' +
              '<span class="ai-ic" style="background:rgba(247,168,35,.12);color:var(--amber)"><i class="bi bi-shield-lock-fill"></i></span>' +
              '<div><div class="ai-label">Vai trò</div><div class="ai-value">Admin (Toàn quyền)</div></div>' +
            '</div>' +
            '<div class="acc-info-row">' +
              '<span class="ai-ic" style="background:rgba(0,152,218,.1);color:var(--sky)"><i class="bi bi-phone-fill"></i></span>' +
              '<div style="flex:1"><div class="ai-label">Số điện thoại</div><div class="ai-value" data-field="phone">0901 234 567</div><div class="ai-edit"><input type="tel" value="0901 234 567" data-field="phone"></div></div>' +
            '</div>' +
            '<div class="acc-info-row">' +
              '<span class="ai-ic" style="background:rgba(123,97,255,.1);color:var(--grape)"><i class="bi bi-key-fill"></i></span>' +
              '<div style="flex:1"><div class="ai-label">Mật khẩu</div><div class="ai-value" data-field="pass">••••••••</div><div class="ai-edit"><input type="password" value="" placeholder="Nhập mật khẩu mới" data-field="pass"></div></div>' +
            '</div>' +
            '<div class="acc-info-row ai-readonly">' +
              '<span class="ai-ic" style="background:rgba(0,152,218,.1);color:var(--sky)"><i class="bi bi-calendar-check"></i></span>' +
              '<div><div class="ai-label">Ngày tạo tài khoản</div><div class="ai-value">01/09/2024</div></div>' +
            '</div>' +
          '</div>' +

          '<div class="acc-panel" data-tab="settings">' +
            '<div class="acc-setting"><div><div class="as-label">Nhận thông báo tài liệu mới chờ duyệt</div><div class="as-desc">Gửi email khi có tài liệu mới cần kiểm duyệt</div></div><button class="acc-toggle on" onclick="this.classList.toggle(\'on\')" type="button"></button></div>' +
            '<div class="acc-setting"><div><div class="as-label">Nhận thông báo báo cáo vi phạm</div><div class="as-desc">Gửi email khi có tài liệu bị người dùng báo cáo</div></div><button class="acc-toggle on" onclick="this.classList.toggle(\'on\')" type="button"></button></div>' +
            '<div class="acc-setting"><div><div class="as-label">Thống kê hàng tuần</div><div class="as-desc">Gửi báo cáo tổng hợp hoạt động mỗi thứ Hai</div></div><button class="acc-toggle" onclick="this.classList.toggle(\'on\')" type="button"></button></div>' +
            '<div class="acc-setting"><div><div class="as-label">Tự động duyệt người đóng góp uy tín</div><div class="as-desc">Bỏ qua kiểm duyệt cho người dùng có trên 50 tài liệu đã duyệt</div></div><button class="acc-toggle" onclick="this.classList.toggle(\'on\')" type="button"></button></div>' +
          '</div>' +

        '</div>' +
      '</div>' +
    '</div>';

  // Tab switching
  d.querySelectorAll('.acc-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      d.querySelectorAll('.acc-tab').forEach(function (t) { t.classList.toggle('active', t === tab); });
      d.querySelectorAll('.acc-panel').forEach(function (p) { p.classList.toggle('active', p.dataset.tab === tab.dataset.tab); });
    });
  });

  // Edit / Save / Cancel
  var panel = d.querySelector('#adAccInfo');
  var editBtn = d.querySelector('#adEditBtn');
  var saveBtn = d.querySelector('#adSaveBtn');
  var cancelBtn = d.querySelector('#adCancelBtn');

  editBtn.addEventListener('click', function () {
    panel.classList.add('editing');
    editBtn.style.display = 'none'; saveBtn.style.display = ''; cancelBtn.style.display = '';
  });

  cancelBtn.addEventListener('click', function () {
    panel.classList.remove('editing');
    editBtn.style.display = ''; saveBtn.style.display = 'none'; cancelBtn.style.display = 'none';
    panel.querySelectorAll('[data-field]').forEach(function (el) {
      if (el.tagName === 'DIV') {
        var inp = panel.querySelector('input[data-field="' + el.dataset.field + '"]');
        if (inp) inp.value = el.dataset.field === 'pass' ? '' : el.textContent;
      }
    });
  });

  saveBtn.addEventListener('click', function () {
    panel.querySelectorAll('input[data-field]').forEach(function (inp) {
      if (inp.dataset.field === 'pass') {
        if (inp.value.trim()) { inp.value = ''; }
      } else {
        var disp = panel.querySelector('div.ai-value[data-field="' + inp.dataset.field + '"]');
        if (disp) disp.textContent = inp.value;
      }
    });
    panel.classList.remove('editing');
    editBtn.style.display = ''; saveBtn.style.display = 'none'; cancelBtn.style.display = 'none';
    if (typeof hlToast === 'function') hlToast('Đã cập nhật thông tin tài khoản', 'bi-check-circle-fill');
  });

  return d;
}