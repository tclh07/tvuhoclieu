/* ============================================================
   TVU HọcLiệu — Tính năng bổ sung
   1) Hiệu ứng "đồng hồ nhảy số" cho thanh thống kê
   2) Chuyển qua lại Đăng nhập / Đăng ký + nút Google
   ============================================================ */
(function () {
  /* ---------- 1. ĐẾM SỐ KIỂU MÁY ĐÁNH BẠC ---------- */
  function format(n, useSep, sep) {
    n = Math.round(n);
    if (!useSep) return String(n);
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  }

  function animateStat(el) {
    var raw = el.getAttribute('data-final') || el.textContent.trim();
    el.setAttribute('data-final', raw);

    var m = raw.match(/^(\D*?)([\d.,]+)(\D*)$/);
    if (!m) return;

    var prefix = m[1], numStr = m[2], suffix = m[3];
    var digits = numStr.replace(/[.,]/g, '');
    var target = parseInt(digits, 10);
    if (isNaN(target)) return;

    var useSep = /[.,]/.test(numStr) && digits.length > 3;
    var sep = numStr.indexOf(',') > -1 ? ',' : '.';

    var dur = 1500, startTs = null, lockVal = null;
    el.classList.add('counting');

    function step(ts) {
      if (startTs === null) startTs = ts;
      var p = Math.min(1, (ts - startTs) / dur);
      var val;

      if (p < 0.65) {
        // giai đoạn nhảy loạn xạ
        var grow = 0.4 + (p / 0.65) * 0.9;
        val = Math.floor(Math.random() * Math.max(target * grow, 9));
      } else {
        // giai đoạn hãm dần về số thật
        if (lockVal === null) lockVal = Math.floor(Math.random() * Math.max(target * 0.9, 9));
        var p2 = (p - 0.65) / 0.35;
        var e = 1 - Math.pow(1 - p2, 3); // easeOutCubic
        val = lockVal + (target - lockVal) * e;
      }

      el.textContent = prefix + format(val, useSep, sep) + suffix;

      if (p < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = prefix + format(target, useSep, sep) + suffix;
        el.classList.remove('counting');
      }
    }
    requestAnimationFrame(step);
  }

  function runCounters() {
    document.querySelectorAll('.stats .stat h3').forEach(animateStat);
  }

  /* ---------- 2. CHUYỂN ĐĂNG NHẬP / ĐĂNG KÝ ---------- */
  function authSwitch(mode, modalEl) {
    var sw = modalEl.querySelector('.auth-switch');
    if (sw) sw.classList.toggle('is-register', mode === 'register');

    modalEl.querySelectorAll('.auth-switch-btn').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-auth') === mode);
    });
    modalEl.querySelectorAll('.auth-panel').forEach(function (p) {
      p.hidden = (p.getAttribute('data-panel') !== mode);
    });

    var title = modalEl.querySelector('.auth-title');
    var sub = modalEl.querySelector('.auth-sub');
    if (mode === 'register') {
      if (title) title.innerHTML = '<i class="bi bi-person-plus"></i> Đăng ký';
      if (sub) sub.textContent = 'Tạo tài khoản để đóng góp và tải tài liệu miễn phí';
    } else {
      if (title) title.innerHTML = '<i class="bi bi-person-circle"></i> Đăng nhập';
      if (sub) sub.textContent = 'Đăng nhập để tải tài liệu và tích điểm đóng góp';
    }
  }

  function wireAuth() {
    document.querySelectorAll('.auth-switch-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var modalEl = btn.closest('.modal');
        if (modalEl) authSwitch(btn.getAttribute('data-auth'), modalEl);
      });
    });
    // luôn mở ở tab Đăng nhập khi modal được mở
    var lm = document.getElementById('loginModal');
    if (lm) {
      lm.addEventListener('show.bs.modal', function () { authSwitch('login', lm); });
    }
  }

  // hàm demo cho nút Google (chỉ là giao diện)
  window.hlGoogleAuth = function (mode) { /* demo: chưa kết nối Google thật */ };

  /* ---------- CƠ CHẾ ĐĂNG NHẬP DEMO (localStorage) ---------- */
  var LS_KEY = 'hl_loggedin';
  var PENDING_KEY = 'hl_pending_redirect';

  window.hlIsLoggedIn = function () {
    try { return localStorage.getItem(LS_KEY) === '1'; } catch (e) { return false; }
  };

  window.hlFakeLogin = function () {
    try { localStorage.setItem(LS_KEY, '1'); } catch (e) {}
    // đóng modal đăng nhập
    var lm = document.getElementById('loginModal');
    if (lm && window.bootstrap) {
      var inst = window.bootstrap.Modal.getInstance(lm);
      if (inst) inst.hide();
    }
    // cập nhật UI
    updateAuthUI();
    // nếu có trang đang chờ chuyển tới sau đăng nhập → điều hướng
    var pending;
    try { pending = localStorage.getItem(PENDING_KEY); } catch (e) {}
    if (pending) {
      try { localStorage.removeItem(PENDING_KEY); } catch (e) {}
      setTimeout(function () { window.location.href = pending; }, 200);
    }
  };

  window.hlLogout = function () {
    try { localStorage.removeItem(LS_KEY); } catch (e) {}
    updateAuthUI();
  };

  function updateAuthUI() {
    var loggedIn = window.hlIsLoggedIn();
    // Tìm mọi nút "Đăng nhập" gốc HOẶC dropdown đã render trước đó
    document.querySelectorAll('a.btn-ghost[data-bs-target="#loginModal"], .user-dropdown-wrap').forEach(function (el) {
      if (loggedIn) {
        // Nếu đã là dropdown thì bỏ qua (đã render rồi)
        if (el.classList.contains('user-dropdown-wrap')) return;
        // Thay nút "Đăng nhập" bằng dropdown tài khoản
        var wrap = document.createElement('div');
        wrap.className = 'dropdown user-dropdown-wrap';
        wrap.innerHTML =
          '<button class="btn btn-ghost user-btn" type="button" data-bs-toggle="dropdown" aria-expanded="false">' +
            '<span class="user-ava">SV</span>' +
            '<span class="user-label d-none d-md-inline">Sinh viên</span>' +
            '<i class="bi bi-chevron-down user-chev"></i>' +
          '</button>' +
          '<ul class="dropdown-menu dropdown-menu-end user-menu">' +
            '<li><div class="user-meta">' +
              '<span class="user-ava-lg">SV</span>' +
              '<div class="user-meta-txt">' +
                '<div class="user-name">Sinh viên TVU</div>' +
                '<small>mssv@st.tvu.edu.vn</small>' +
              '</div>' +
            '</div></li>' +
            '<li><hr class="dropdown-divider"></li>' +
            '<li><a class="dropdown-item user-item" href="#" data-acc-tab="info"><i class="bi bi-person-circle"></i> Tài khoản của tôi</a></li>' +
            '<li><a class="dropdown-item user-item" href="#" data-acc-tab="saved"><i class="bi bi-bookmark-star"></i> Tài liệu đã lưu</a></li>' +
            '<li><a class="dropdown-item user-item" href="#" data-acc-tab="uploaded"><i class="bi bi-cloud-arrow-up"></i> Tài liệu đã tải lên</a></li>' +
            '<li><a class="dropdown-item user-item" href="#" data-acc-tab="settings"><i class="bi bi-gear"></i> Cài đặt</a></li>' +
            '<li><hr class="dropdown-divider"></li>' +
            '<li><a class="dropdown-item user-item user-item-danger" href="#" data-hl-logout><i class="bi bi-box-arrow-right"></i> Đăng xuất</a></li>' +
          '</ul>';
        el.replaceWith(wrap);
      } else {
        // Chưa đăng nhập: nếu đang là dropdown → khôi phục lại nút "Đăng nhập"
        if (!el.classList.contains('user-dropdown-wrap')) return;
        var btn = document.createElement('a');
        btn.className = 'btn btn-ghost';
        btn.href = '#';
        btn.setAttribute('data-bs-toggle', 'modal');
        btn.setAttribute('data-bs-target', '#loginModal');
        btn.innerHTML = '<i class="bi bi-person me-1"></i>Đăng nhập';
        el.replaceWith(btn);
      }
    });

    // Gắn handler cho nút Đăng xuất (nếu có)
    document.querySelectorAll('[data-hl-logout]').forEach(function (a) {
      a.onclick = function (e) {
        e.preventDefault();
        window.hlLogout();
        hlToast('Đã đăng xuất thành công', 'bi-box-arrow-right');
      };
    });

    // Gắn handler cho các mục trong user menu → mở modal tài khoản
    document.querySelectorAll('[data-acc-tab]').forEach(function (a) {
      a.onclick = function (e) {
        e.preventDefault();
        openAccountModal(a.getAttribute('data-acc-tab'));
      };
    });
  }

  /* ---------- MODAL TÀI KHOẢN NGƯỜI DÙNG ---------- */
  function openAccountModal(tab) {
    var m = document.getElementById('accountModal');
    if (!m) { m = createAccountModal(); document.body.appendChild(m); }
    // Chuyển đúng tab
    var tabs = m.querySelectorAll('.acc-tab');
    var panels = m.querySelectorAll('.acc-panel');
    tabs.forEach(function (t) { t.classList.toggle('active', t.dataset.tab === tab); });
    panels.forEach(function (p) { p.classList.toggle('active', p.dataset.tab === tab); });
    new bootstrap.Modal(m).show();
  }

  function createAccountModal() {
    var div = document.createElement('div');
    div.className = 'modal fade acc-modal';
    div.id = 'accountModal';
    div.tabIndex = -1;
    div.innerHTML =
      '<div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">' +
        '<div class="modal-content hl-modal">' +
          '<div class="modal-header">' +
            '<div class="acc-profile">' +
              '<span class="acc-ava">SV</span>' +
              '<div>' +
                '<div class="acc-name" id="accHeaderName">Sinh viên TVU</div>' +
                '<small id="accHeaderEmail">mssv@st.tvu.edu.vn</small>' +
              '</div>' +
            '</div>' +
            '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Đóng"></button>' +
          '</div>' +
          '<div class="acc-tabs">' +
            '<button class="acc-tab active" data-tab="info"><i class="bi bi-person"></i> Tài khoản</button>' +
            '<button class="acc-tab" data-tab="saved"><i class="bi bi-bookmark-star"></i> Đã lưu</button>' +
            '<button class="acc-tab" data-tab="uploaded"><i class="bi bi-cloud-arrow-up"></i> Đã tải lên</button>' +
            '<button class="acc-tab" data-tab="settings"><i class="bi bi-gear"></i> Cài đặt</button>' +
          '</div>' +
          '<div class="modal-body" style="padding:0">' +

            /* ===== TAB: Thông tin tài khoản (có nút Chỉnh sửa) ===== */
            '<div class="acc-panel active" data-tab="info" id="accInfoPanel">' +
              '<div class="acc-edit-bar">' +
                '<button class="btn btn-ghost" id="accEditBtn" type="button"><i class="bi bi-pencil-square me-1"></i>Chỉnh sửa</button>' +
                '<button class="btn btn-coral" id="accSaveBtn" type="button" style="display:none"><i class="bi bi-check-lg me-1"></i>Lưu thay đổi</button>' +
                '<button class="btn btn-ghost" id="accCancelBtn" type="button" style="display:none">Hủy</button>' +
              '</div>' +
              '<div class="acc-info-row">' +
                '<span class="ai-ic" style="background:rgba(0,70,173,.1);color:var(--coral)"><i class="bi bi-person-fill"></i></span>' +
                '<div style="flex:1"><div class="ai-label">Họ tên</div><div class="ai-value" data-field="name">Sinh viên TVU</div><div class="ai-edit"><input type="text" value="Sinh viên TVU" data-field="name"></div></div>' +
              '</div>' +
              '<div class="acc-info-row ai-readonly">' +
                '<span class="ai-ic" style="background:rgba(58,169,41,.1);color:var(--teal-dark)"><i class="bi bi-envelope-fill"></i></span>' +
                '<div><div class="ai-label">Email sinh viên</div><div class="ai-value">mssv@st.tvu.edu.vn</div></div>' +
              '</div>' +
              '<div class="acc-info-row">' +
                '<span class="ai-ic" style="background:rgba(247,168,35,.12);color:var(--amber)"><i class="bi bi-mortarboard-fill"></i></span>' +
                '<div style="flex:1"><div class="ai-label">Ngành học</div><div class="ai-value" data-field="major">Công nghệ thông tin</div>' +
                  '<div class="ai-edit"><select data-field="major"><option>Công nghệ thông tin</option><option>Kinh tế</option><option>Kỹ thuật</option><option>Y - Dược</option><option>Luật</option><option>Sư phạm</option><option>Ngôn ngữ Anh</option><option>Cơ Khí</option><option>Quản trị văn phòng</option></select></div>' +
                '</div>' +
              '</div>' +
              '<div class="acc-info-row">' +
                '<span class="ai-ic" style="background:rgba(123,97,255,.1);color:var(--grape)"><i class="bi bi-building"></i></span>' +
                '<div style="flex:1"><div class="ai-label">Trường / Khoa</div><div class="ai-value" data-field="school">Trường Kỹ thuật & Công nghệ</div>' +
                  '<div class="ai-edit"><select data-field="school"><option>Trường Kỹ thuật &amp; Công nghệ</option><option>Trường Kinh tế, Luật</option><option>Trường Y Dược</option><option>Trường NN-VH-NT Khmer Nam Bộ &amp; Nhân văn</option><option>Khoa Khoa học Cơ bản</option><option>Khoa Nông Nghiệp - Thủy Sản</option></select></div>' +
                '</div>' +
              '</div>' +
              '<div class="acc-info-row">' +
                '<span class="ai-ic" style="background:rgba(0,152,218,.1);color:var(--sky)"><i class="bi bi-phone-fill"></i></span>' +
                '<div style="flex:1"><div class="ai-label">Số điện thoại</div><div class="ai-value" data-field="phone">0912 345 678</div><div class="ai-edit"><input type="tel" value="0912 345 678" data-field="phone"></div></div>' +
              '</div>' +
              '<div class="acc-info-row ai-readonly">' +
                '<span class="ai-ic" style="background:rgba(0,152,218,.1);color:var(--sky)"><i class="bi bi-calendar-check"></i></span>' +
                '<div><div class="ai-label">Ngày tham gia</div><div class="ai-value">15/01/2025</div></div>' +
              '</div>' +
              '<div class="acc-info-row ai-readonly">' +
                '<span class="ai-ic" style="background:rgba(0,70,173,.1);color:var(--coral)"><i class="bi bi-gem"></i></span>' +
                '<div><div class="ai-label">Điểm tích lũy</div><div class="ai-value" style="color:var(--coral);font-family:Baloo 2;font-size:1.1rem">2.450 điểm</div></div>' +
              '</div>' +
            '</div>' +

            /* ===== TAB: Tài liệu đã lưu (có nút Tải / Xóa) ===== */
            '<div class="acc-panel" data-tab="saved" id="accSavedPanel">' +
              '<div class="acc-doc" data-saved-doc>' +
                '<span class="ad-ic" style="background:#E23B3B"><i class="bi bi-file-earmark-pdf-fill"></i></span>' +
                '<div class="ad-body"><h6>Cấu trúc dữ liệu & Giải thuật</h6><small>Trường KT&CN · Giáo trình · Lưu 2 ngày trước</small></div>' +
                '<div class="acc-doc-actions">' +
                  '<button class="acc-doc-btn btn-save" title="Tải về" data-acc-dl><i class="bi bi-download"></i></button>' +
                  '<button class="acc-doc-btn btn-del" title="Bỏ lưu" data-acc-unsave><i class="bi bi-bookmark-x-fill"></i></button>' +
                '</div>' +
              '</div>' +
              '<div class="acc-doc" data-saved-doc>' +
                '<span class="ad-ic" style="background:#2B72E0"><i class="bi bi-file-earmark-word-fill"></i></span>' +
                '<div class="ad-body"><h6>500 câu trắc nghiệm Triết học Mác-Lênin</h6><small>Trường KT, Luật · Trắc nghiệm · Lưu 5 ngày trước</small></div>' +
                '<div class="acc-doc-actions">' +
                  '<button class="acc-doc-btn btn-save" title="Tải về" data-acc-dl><i class="bi bi-download"></i></button>' +
                  '<button class="acc-doc-btn btn-del" title="Bỏ lưu" data-acc-unsave><i class="bi bi-bookmark-x-fill"></i></button>' +
                '</div>' +
              '</div>' +
              '<div class="acc-doc" data-saved-doc>' +
                '<span class="ad-ic" style="background:#E8731C"><i class="bi bi-file-earmark-ppt-fill"></i></span>' +
                '<div class="ad-body"><h6>Giáo trình Kinh tế Vi mô — Slide đầy đủ</h6><small>Trường KT, Luật · Giáo trình · Lưu 1 tuần trước</small></div>' +
                '<div class="acc-doc-actions">' +
                  '<button class="acc-doc-btn btn-save" title="Tải về" data-acc-dl><i class="bi bi-download"></i></button>' +
                  '<button class="acc-doc-btn btn-del" title="Bỏ lưu" data-acc-unsave><i class="bi bi-bookmark-x-fill"></i></button>' +
                '</div>' +
              '</div>' +
              '<div class="acc-doc" data-saved-doc>' +
                '<span class="ad-ic" style="background:#E23B3B"><i class="bi bi-file-earmark-pdf-fill"></i></span>' +
                '<div class="ad-body"><h6>Pháp luật đại cương — Trắc nghiệm có đáp án</h6><small>Trường KT, Luật · Trắc nghiệm · Lưu 2 tuần trước</small></div>' +
                '<div class="acc-doc-actions">' +
                  '<button class="acc-doc-btn btn-save" title="Tải về" data-acc-dl><i class="bi bi-download"></i></button>' +
                  '<button class="acc-doc-btn btn-del" title="Bỏ lưu" data-acc-unsave><i class="bi bi-bookmark-x-fill"></i></button>' +
                '</div>' +
              '</div>' +
              '<div class="acc-doc" data-saved-doc>' +
                '<span class="ad-ic" style="background:#16A34A"><i class="bi bi-file-earmark-medical-fill"></i></span>' +
                '<div class="ad-body"><h6>Giải phẫu học — Tài liệu ngành Y khoa</h6><small>Trường Y Dược · Chuyên ngành · Lưu 3 tuần trước</small></div>' +
                '<div class="acc-doc-actions">' +
                  '<button class="acc-doc-btn btn-save" title="Tải về" data-acc-dl><i class="bi bi-download"></i></button>' +
                  '<button class="acc-doc-btn btn-del" title="Bỏ lưu" data-acc-unsave><i class="bi bi-bookmark-x-fill"></i></button>' +
                '</div>' +
              '</div>' +
              '<div class="acc-empty" id="accSavedEmpty" style="display:none"><i class="bi bi-bookmark"></i><p>Chưa lưu tài liệu nào</p></div>' +
            '</div>' +

            /* ===== TAB: Tài liệu đã tải lên (nhiều trạng thái) ===== */
            '<div class="acc-panel" data-tab="uploaded">' +
              '<div class="acc-upload-stats">' +
                '<div class="acc-ustat"><span class="us-num" style="color:var(--coral)">7</span><span class="us-label">Tổng tải lên</span></div>' +
                '<div class="acc-ustat"><span class="us-num" style="color:var(--teal-dark)">4</span><span class="us-label">Đã duyệt</span></div>' +
                '<div class="acc-ustat"><span class="us-num" style="color:var(--amber)">2</span><span class="us-label">Chờ duyệt</span></div>' +
                '<div class="acc-ustat"><span class="us-num" style="color:#a32d2d">1</span><span class="us-label">Bị từ chối</span></div>' +
              '</div>' +
              '<div class="acc-doc">' +
                '<span class="ad-ic" style="background:#E23B3B"><i class="bi bi-file-earmark-pdf-fill"></i></span>' +
                '<div class="ad-body"><h6>Đề thi cuối kỳ Giải tích 1 — HK2 2024</h6><small>Tải lên 12/05/2025 · 1.2K lượt tải</small></div>' +
                '<span class="acc-status acc-status-ok"><i class="bi bi-check-circle-fill"></i> Đã duyệt</span>' +
              '</div>' +
              '<div class="acc-doc">' +
                '<span class="ad-ic" style="background:#E23B3B"><i class="bi bi-file-earmark-pdf-fill"></i></span>' +
                '<div class="ad-body"><h6>Ngân hàng 200 câu trắc nghiệm Vật lý đại cương</h6><small>Tải lên 28/04/2025 · 856 lượt tải</small></div>' +
                '<span class="acc-status acc-status-ok"><i class="bi bi-check-circle-fill"></i> Đã duyệt</span>' +
              '</div>' +
              '<div class="acc-doc">' +
                '<span class="ad-ic" style="background:#E8731C"><i class="bi bi-file-earmark-ppt-fill"></i></span>' +
                '<div class="ad-body"><h6>Slide bài giảng Mạng máy tính — Chương 1-5</h6><small>Tải lên 15/04/2025 · 643 lượt tải</small></div>' +
                '<span class="acc-status acc-status-ok"><i class="bi bi-check-circle-fill"></i> Đã duyệt</span>' +
              '</div>' +
              '<div class="acc-doc">' +
                '<span class="ad-ic" style="background:#2B72E0"><i class="bi bi-file-earmark-word-fill"></i></span>' +
                '<div class="ad-body"><h6>Bài tập Xác suất thống kê — Có lời giải</h6><small>Tải lên 02/04/2025 · 421 lượt tải</small></div>' +
                '<span class="acc-status acc-status-ok"><i class="bi bi-check-circle-fill"></i> Đã duyệt</span>' +
              '</div>' +
              '<div class="acc-doc">' +
                '<span class="ad-ic" style="background:#2B72E0"><i class="bi bi-file-earmark-word-fill"></i></span>' +
                '<div class="ad-body"><h6>Tóm tắt Lịch sử Đảng CSVN</h6><small>Tải lên 10/06/2025 · 0 lượt tải</small></div>' +
                '<span class="acc-status acc-status-wait"><i class="bi bi-clock-fill"></i> Chờ duyệt</span>' +
              '</div>' +
              '<div class="acc-doc">' +
                '<span class="ad-ic" style="background:#E23B3B"><i class="bi bi-file-earmark-pdf-fill"></i></span>' +
                '<div class="ad-body"><h6>Đề cương ôn tập Triết học Mác-Lênin HK1</h6><small>Tải lên 05/06/2025 · 0 lượt tải</small></div>' +
                '<span class="acc-status acc-status-wait"><i class="bi bi-clock-fill"></i> Chờ duyệt</span>' +
              '</div>' +
              '<div class="acc-doc">' +
                '<span class="ad-ic" style="background:#E8731C"><i class="bi bi-file-earmark-ppt-fill"></i></span>' +
                '<div class="ad-body"><h6>Slide Kỹ năng mềm — Thuyết trình hiệu quả</h6><small>Tải lên 20/03/2025 · Lý do: Trùng nội dung</small></div>' +
                '<span class="acc-status acc-status-reject"><i class="bi bi-x-circle-fill"></i> Từ chối</span>' +
              '</div>' +
            '</div>' +

            /* ===== TAB: Cài đặt ===== */
            '<div class="acc-panel" data-tab="settings">' +
              '<div class="acc-setting"><div><div class="as-label">Nhận email tài liệu mới</div><div class="as-desc">Gửi thông báo khi có tài liệu mới theo ngành của bạn</div></div><button class="acc-toggle on" onclick="this.classList.toggle(\'on\')" type="button"></button></div>' +
              '<div class="acc-setting"><div><div class="as-label">Hiện trạng thái hoạt động</div><div class="as-desc">Cho phép người khác thấy bạn đang online</div></div><button class="acc-toggle on" onclick="this.classList.toggle(\'on\')" type="button"></button></div>' +
              '<div class="acc-setting"><div><div class="as-label">Cho phép tải tài liệu đã chia sẻ</div><div class="as-desc">Mọi người có thể tải tài liệu bạn đăng lên</div></div><button class="acc-toggle on" onclick="this.classList.toggle(\'on\')" type="button"></button></div>' +
              '<div class="acc-setting"><div><div class="as-label">Chế độ tối</div><div class="as-desc">Giao diện tối hơn, dễ nhìn về đêm</div></div><button class="acc-toggle" onclick="this.classList.toggle(\'on\');hlToast(this.classList.contains(\'on\')?\'Đã bật chế độ tối (demo)\':\'Đã tắt chế độ tối (demo)\',\'bi-moon-fill\')" type="button"></button></div>' +
            '</div>' +

          '</div>' +
        '</div>' +
      '</div>';

    // --- Wire tab switching ---
    div.querySelectorAll('.acc-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        var target = tab.dataset.tab;
        div.querySelectorAll('.acc-tab').forEach(function (t) { t.classList.toggle('active', t === tab); });
        div.querySelectorAll('.acc-panel').forEach(function (p) { p.classList.toggle('active', p.dataset.tab === target); });
      });
    });

    // --- Wire: Chỉnh sửa thông tin tài khoản ---
    var infoPanel = div.querySelector('#accInfoPanel');
    var editBtn   = div.querySelector('#accEditBtn');
    var saveBtn   = div.querySelector('#accSaveBtn');
    var cancelBtn = div.querySelector('#accCancelBtn');

    editBtn.addEventListener('click', function () {
      infoPanel.classList.add('editing');
      editBtn.style.display = 'none';
      saveBtn.style.display = '';
      cancelBtn.style.display = '';
    });

    cancelBtn.addEventListener('click', function () {
      infoPanel.classList.remove('editing');
      editBtn.style.display = '';
      saveBtn.style.display = 'none';
      cancelBtn.style.display = 'none';
      // Khôi phục giá trị cũ vào input
      infoPanel.querySelectorAll('[data-field]').forEach(function (el) {
        if (el.tagName === 'DIV') {
          var input = infoPanel.querySelector('input[data-field="' + el.dataset.field + '"],select[data-field="' + el.dataset.field + '"]');
          if (input) input.value = el.textContent;
        }
      });
    });

    saveBtn.addEventListener('click', function () {
      // Cập nhật giá trị hiển thị từ input
      infoPanel.querySelectorAll('input[data-field],select[data-field]').forEach(function (input) {
        var display = infoPanel.querySelector('div.ai-value[data-field="' + input.dataset.field + '"]');
        if (display) display.textContent = input.value;
      });
      // Cập nhật header
      var nameVal = infoPanel.querySelector('input[data-field="name"]');
      if (nameVal) {
        var headerName = div.querySelector('#accHeaderName');
        if (headerName) headerName.textContent = nameVal.value;
      }
      infoPanel.classList.remove('editing');
      editBtn.style.display = '';
      saveBtn.style.display = 'none';
      cancelBtn.style.display = 'none';
      hlToast('Đã cập nhật thông tin tài khoản', 'bi-check-circle-fill');
    });

    // --- Wire: Tải về & Bỏ lưu trong tab Đã lưu ---
    div.querySelectorAll('[data-acc-dl]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var docName = btn.closest('.acc-doc').querySelector('h6').textContent;
        hlToast('Đang tải "' + docName + '"...', 'bi-download');
      });
    });

    div.querySelectorAll('[data-acc-unsave]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var row = btn.closest('.acc-doc');
        var docName = row.querySelector('h6').textContent;
        row.classList.add('removing');
        setTimeout(function () {
          row.remove();
          hlToast('Đã bỏ lưu "' + docName + '"', 'bi-bookmark-x');
          // Hiện empty state nếu hết
          var panel = div.querySelector('#accSavedPanel');
          if (!panel.querySelector('[data-saved-doc]')) {
            div.querySelector('#accSavedEmpty').style.display = '';
          }
        }, 300);
      });
    });

    return div;
  }

  /* ---------- XỬ LÝ LINK YÊU CẦU ĐĂNG NHẬP ---------- */
  function wireRequireLogin() {
    document.querySelectorAll('[data-require-login]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        if (window.hlIsLoggedIn()) return;
        e.preventDefault();
        var target = el.getAttribute('href');
        if (target && target !== '#') {
          try { localStorage.setItem(PENDING_KEY, target); } catch (er) {}
        }
        var pm = document.getElementById('previewModal');
        if (pm && window.bootstrap) {
          if (el.hasAttribute('data-pv-title')) {
            var pvTitle  = el.getAttribute('data-pv-title')  || 'Tài liệu';
            var pvSchool = el.getAttribute('data-pv-school') || '';
            var pvType   = el.getAttribute('data-pv-type')   || '';
            var pvFmt    = el.getAttribute('data-pv-fmt')    || 'PDF';
            var pvColor  = el.getAttribute('data-pv-color')  || '#5d6b85';
            var titleEl = pm.querySelector('#pvTitle');
            var metaEl  = pm.querySelector('#pvMeta');
            var badgeEl = pm.querySelector('#pvBadge');
            if (titleEl) titleEl.innerHTML = '<i class="bi bi-eye"></i> ' + pvTitle;
            if (metaEl)  metaEl.textContent = (pvType ? pvType + ' • ' : '') + pvSchool;
            if (badgeEl) { badgeEl.textContent = pvFmt; badgeEl.style.background = pvColor; }
          }
          window.bootstrap.Modal.getOrCreateInstance(pm).show();
        } else {
          var lm = document.getElementById('loginModal');
          if (lm && window.bootstrap) window.bootstrap.Modal.getOrCreateInstance(lm).show();
        }
      });
    });
  }

  /* ---------- TOGGLE BẢNG XẾP HẠNG ↔ SPOTLIGHT ---------- */
  function wireBxhToggle() {
    var btn      = document.getElementById('bxhToggle');
    var spotDef  = document.getElementById('spotDefault');
    var bxhPanel = document.getElementById('bxhPanel');
    if (!btn || !spotDef || !bxhPanel) return;
    var isOpen = false;
    btn.addEventListener('click', function () {
      isOpen = !isOpen;
      if (isOpen) {
        spotDef.style.display  = 'none';
        bxhPanel.style.display = 'block';
        btn.innerHTML = '<i class="bi bi-arrow-left me-1"></i> Quay lại';
      } else {
        bxhPanel.style.display = 'none';
        spotDef.style.display  = 'block';
        btn.innerHTML = '<i class="bi bi-trophy me-1"></i> Xem bảng xếp hạng';
      }
    });
  }

  function init() {
    runCounters();
    wireAuth();
    updateAuthUI();
    wireRequireLogin();
    wireBxhToggle();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/* ============================================================
   3) LỌC TRONG TRANG: bấm danh mục / ngành -> ẩn lưới, hiện kết quả
   ============================================================ */
(function () {
  // Dữ liệu tài liệu dùng chung (demo)
  var DOCS = [
    {title:"300 câu trắc nghiệm Triết học Mác-Lênin có đáp án", type:"Trắc nghiệm", cat:"tracnghiem", nganh:"khac", school:"Khoa Lý luận chính trị", fmt:"bi-file-earmark-pdf-fill", grad:"linear-gradient(135deg,var(--coral),#4E97DA)", img:"anh/a7.jpg", dl:"4.2K", rate:"4.9", nam:"2024 - 2025"},
    {title:"Đề thi cuối kỳ Giải tích 1 — Tổng hợp 2020–2024", type:"Tự luận", cat:"tuluan", nganh:"khac", school:"Khoa Khoa học Cơ bản", fmt:"bi-file-earmark-word-fill", grad:"linear-gradient(135deg,var(--teal),#5FA8E0)", img:"anh/a6.jpg", dl:"3.8K", rate:"4.8", nam:"2023 - 2024"},
    {title:"Giáo trình Kinh tế Vi mô — Slide bài giảng đầy đủ", type:"Giáo trình", cat:"giaotrinh", nganh:"kinhte", school:"Trường Kinh tế, Luật", fmt:"bi-file-earmark-ppt-fill", grad:"linear-gradient(135deg,var(--grape),#5B79C2)", img:"anh/a2.jpg", dl:"5.1K", rate:"4.9", nam:"2022 - 2023"},
    {title:"Cấu trúc dữ liệu &amp; Giải thuật — Tài liệu CNTT", type:"Chuyên ngành", cat:"chuyennganh", nganh:"cntt", school:"Trường Kỹ thuật &amp; Công nghệ", fmt:"bi-file-earmark-code-fill", grad:"linear-gradient(135deg,var(--sky),#90C4F2)", img:"anh/a1.jpg", dl:"6.4K", rate:"5.0", nam:"2021 - 2022"},
    {title:"Nguyên lý Kế toán — Sách điện tử bản đầy đủ", type:"Sách", cat:"sach", nganh:"kinhte", school:"Trường Kinh tế, Luật", fmt:"bi-file-earmark-pdf-fill", grad:"linear-gradient(135deg,var(--amber),#EFC56F)", img:"anh/a5.jpg", dl:"2.9K", rate:"4.7", nam:"2020 - 2021"},
    {title:"Ngân hàng câu hỏi Tư tưởng Hồ Chí Minh", type:"Trắc nghiệm", cat:"tracnghiem", nganh:"khac", school:"Khoa Lý luận chính trị", fmt:"bi-file-earmark-word-fill", grad:"linear-gradient(135deg,var(--rose),#8FB4E2)", img:"anh/a8.jpg", dl:"3.3K", rate:"4.8", nam:"2024 - 2025"},
    {title:"Vật lý Đại cương 2 — Giáo trình + bài tập", type:"Giáo trình", cat:"giaotrinh", nganh:"khac", school:"Khoa Khoa học Cơ bản", fmt:"bi-file-earmark-pdf-fill", grad:"linear-gradient(135deg,var(--teal-dark),var(--teal))", img:"anh/a3.jpg", dl:"2.1K", rate:"4.6", nam:"2023 - 2024"},
    {title:"Giải phẫu học — Tài liệu ngành Y khoa", type:"Chuyên ngành", cat:"chuyennganh", nganh:"yduoc", school:"Trường Y Dược", fmt:"bi-file-earmark-text-fill", grad:"linear-gradient(135deg,#1565C0,var(--grape))", img:"anh/a4.jpg", dl:"4.7K", rate:"4.9", nam:"2022 - 2023"},
    {title:"450 câu hỏi trắc nghiệm Triết học Mác-Lênin (đại cương)", type:"Trắc nghiệm", cat:"tracnghiem", nganh:"khac", school:"Khoa Lý luận chính trị", fmt:"bi-file-earmark-pdf-fill", grad:"linear-gradient(135deg,var(--coral),#8FB4E2)", img:"anh/a7.jpg", dl:"5.6K", rate:"4.8", nam:"2021 - 2022"},
    {title:"Đề thi Kinh tế chính trị Mác-Lênin — Các năm gần đây", type:"Tự luận", cat:"tuluan", nganh:"khac", school:"Khoa Lý luận chính trị", fmt:"bi-file-earmark-word-fill", grad:"linear-gradient(135deg,var(--grape),#90C4F2)", img:"anh/a6.jpg", dl:"2.4K", rate:"4.6", nam:"2020 - 2021"},
    {title:"Giáo trình Chủ nghĩa xã hội khoa học (đại cương)", type:"Giáo trình", cat:"giaotrinh", nganh:"khac", school:"Khoa Lý luận chính trị", fmt:"bi-file-earmark-pdf-fill", grad:"linear-gradient(135deg,var(--rose),#5FA8E0)", img:"anh/a5.jpg", dl:"1.8K", rate:"4.5", nam:"2024 - 2025"},
    {title:"Tóm tắt Lịch sử Đảng Cộng sản Việt Nam — Ôn thi cuối kỳ", type:"Tự luận", cat:"tuluan", nganh:"khac", school:"Khoa Lý luận chính trị", fmt:"bi-file-earmark-word-fill", grad:"linear-gradient(135deg,var(--teal-dark),#5FA8E0)", img:"anh/a8.jpg", dl:"3.0K", rate:"4.7", nam:"2023 - 2024"},
    {title:"Pháp luật đại cương — Câu hỏi trắc nghiệm có đáp án", type:"Trắc nghiệm", cat:"tracnghiem", nganh:"khac", school:"Trường Kinh tế, Luật", fmt:"bi-file-earmark-pdf-fill", grad:"linear-gradient(135deg,var(--sky),#5B79C2)", img:"anh/a1.jpg", dl:"4.1K", rate:"4.7", nam:"2022 - 2023"},
    {title:"Giáo trình Giáo dục Quốc phòng - An ninh (tập 1+2)", type:"Giáo trình", cat:"giaotrinh", nganh:"khac", school:"Trung tâm GDQP-AN", fmt:"bi-file-earmark-pdf-fill", grad:"linear-gradient(135deg,var(--amber),#EFC56F)", img:"anh/a3.jpg", dl:"2.7K", rate:"4.6", nam:"2021 - 2022"},
    {title:"Nhập môn Trí tuệ nhân tạo — Câu hỏi trắc nghiệm có đáp án", type:"Trắc nghiệm", cat:"tracnghiem", nganh:"ai", school:"Trường Kỹ thuật &amp; Công nghệ", fmt:"bi-file-earmark-pdf-fill", grad:"linear-gradient(135deg,var(--coral),#4E97DA)", img:"anh/ktAI.jpg", dl:"320", rate:"4.8", nam:"2020 - 2021"},
    {title:"Nhập môn Công nghệ thông tin — Đề trắc nghiệm online", type:"Trắc nghiệm", cat:"tracnghiem", nganh:"cntt", school:"Trường Kỹ thuật &amp; Công nghệ", fmt:"bi-file-earmark-pdf-fill", grad:"linear-gradient(135deg,var(--coral),#4E97DA)", img:"anh/tnCNTT.jpg", dl:"540", rate:"4.9", nam:"2024 - 2025"},
    {title:"Luật Hiến pháp — Câu hỏi trắc nghiệm (tham khảo)", type:"Trắc nghiệm", cat:"tracnghiem", nganh:"luat", school:"Trường Kinh tế, Luật", fmt:"bi-file-earmark-pdf-fill", grad:"linear-gradient(135deg,var(--coral),#4E97DA)", img:"anh/luatHP.jpg", dl:"210", rate:"4.7", nam:"2023 - 2024"},
    {title:"Hóa học đại cương và vô cơ — Câu hỏi trắc nghiệm", type:"Trắc nghiệm", cat:"tracnghiem", nganh:"hoaduoc", school:"Khoa Hóa học Ứng dụng", fmt:"bi-file-earmark-pdf-fill", grad:"linear-gradient(135deg,var(--coral),#4E97DA)", img:"anh/tnHoaDC.jpg", dl:"180", rate:"4.6", nam:"2022 - 2023"},
    {title:"Tiếng Anh cơ sở 1 — Bài trắc nghiệm có đáp án", type:"Trắc nghiệm", cat:"tracnghiem", nganh:"nn-anh", school:"Trường NN-VH-NT Khmer Nam Bộ &amp; Nhân văn", fmt:"bi-file-earmark-pdf-fill", grad:"linear-gradient(135deg,var(--coral),#4E97DA)", img:"anh/TA.jpg", dl:"410", rate:"4.8", nam:"2021 - 2022"},
    {title:"Nhập môn ngành Cơ khí — Đề thi kết thúc học phần", type:"Đề thi KT", cat:"tuluan", nganh:"cokhi", school:"Trường Kỹ thuật &amp; Công nghệ", fmt:"bi-file-earmark-word-fill", grad:"linear-gradient(135deg,var(--teal),#5FA8E0)", img:"anh/nmCK.jpg", dl:"96", rate:"4.5", nam:"2020 - 2021"},
    {title:"Giải phẫu răng — Đề thi kết thúc học phần", type:"Đề thi KT", cat:"tuluan", nganh:"rhm", school:"Trường Y Dược", fmt:"bi-file-earmark-word-fill", grad:"linear-gradient(135deg,var(--teal),#5FA8E0)", img:"anh/GPrang.jpg", dl:"150", rate:"4.7", nam:"2024 - 2025"},
    {title:"Nhập môn Quản lý nhà nước — Đề thi cuối kỳ", type:"Đề thi KT", cat:"tuluan", nganh:"qlnn", school:"Trường Kinh tế, Luật", fmt:"bi-file-earmark-word-fill", grad:"linear-gradient(135deg,var(--teal),#5FA8E0)", img:"anh/qlnn.jpg", dl:"88", rate:"4.6", nam:"2023 - 2024"},
    {title:"Nhập môn ngành Thủy sản — Đề thi cuối kỳ", type:"Đề thi KT", cat:"tuluan", nganh:"ntts", school:"Khoa Nông nghiệp - Thủy sản", fmt:"bi-file-earmark-word-fill", grad:"linear-gradient(135deg,var(--teal),#5FA8E0)", img:"anh/thS.jpg", dl:"120", rate:"4.5", nam:"2022 - 2023"},
    {title:"Quản lý môi trường đại cương — Đề cương câu hỏi ôn tập", type:"Đề cương", cat:"tuluan", nganh:"tnmt", school:"Bộ môn Tài nguyên &amp; Môi trường", fmt:"bi-file-earmark-word-fill", grad:"linear-gradient(135deg,var(--teal),#5FA8E0)", img:"anh/ktMTDC.jpg", dl:"74", rate:"4.6", nam:"2021 - 2022"},
    {title:"Nhập môn Quản lý Thể dục thể thao — Giáo trình", type:"Giáo trình", cat:"giaotrinh", nganh:"tdtt", school:"Bộ môn Giáo dục Thể chất", fmt:"bi-file-earmark-pdf-fill", grad:"linear-gradient(135deg,var(--grape),#5B79C2)", img:"anh/tdtt.jpg", dl:"130", rate:"4.7", nam:"2020 - 2021"},
    {title:"Cơ sở lý thuyết mạch điện — Giáo trình (Phần I)", type:"Giáo trình", cat:"giaotrinh", nganh:"ckt-dien", school:"Trường Kỹ thuật &amp; Công nghệ", fmt:"bi-file-earmark-pdf-fill", grad:"linear-gradient(135deg,var(--grape),#5B79C2)", img:"anh/mach.jpg", dl:"260", rate:"4.8", nam:"2024 - 2025"},
    {title:"Cơ sở lập trình — Bài giảng", type:"Bài giảng", cat:"giaotrinh", nganh:"ai", school:"Trường Kỹ thuật &amp; Công nghệ", fmt:"bi-file-earmark-ppt-fill", grad:"linear-gradient(135deg,var(--grape),#5B79C2)", img:"anh/csLT.jpg", dl:"480", rate:"4.9", nam:"2023 - 2024"},
    {title:"Kỹ thuật lập trình — Giáo trình (C căn bản &amp; nâng cao)", type:"Giáo trình", cat:"giaotrinh", nganh:"cntt", school:"Trường Kỹ thuật &amp; Công nghệ", fmt:"bi-file-earmark-pdf-fill", grad:"linear-gradient(135deg,var(--grape),#5B79C2)", img:"anh/ktlt.jpg", dl:"510", rate:"4.9", nam:"2022 - 2023"},
    {title:"Nhập môn Chính trị học — Giáo trình", type:"Giáo trình", cat:"giaotrinh", nganh:"chinhtrihoc", school:"Khoa Lý luận chính trị", fmt:"bi-file-earmark-pdf-fill", grad:"linear-gradient(135deg,var(--grape),#5B79C2)", img:"anh/cthoc.webp", dl:"170", rate:"4.6", nam:"2021 - 2022"},
    {title:"Lịch sử học thuyết chính trị — Giáo trình", type:"Giáo trình", cat:"giaotrinh", nganh:"chinhtrihoc", school:"Khoa Lý luận chính trị", fmt:"bi-file-earmark-pdf-fill", grad:"linear-gradient(135deg,var(--grape),#5B79C2)", img:"anh/CT2.jpg", dl:"90", rate:"4.5", nam:"2020 - 2021"},
    {title:"Nhập môn Công nghệ sinh học — Giáo trình", type:"Giáo trình", cat:"giaotrinh", nganh:"cnsh", school:"Khoa Nông nghiệp - Thủy sản", fmt:"bi-file-earmark-pdf-fill", grad:"linear-gradient(135deg,var(--grape),#5B79C2)", img:"anh/cnsh.jpg", dl:"140", rate:"4.7", nam:"2024 - 2025"},
    {title:"Sinh học đại cương — Giáo trình (Tập I)", type:"Giáo trình", cat:"giaotrinh", nganh:"cnsh", school:"Khoa Nông nghiệp - Thủy sản", fmt:"bi-file-earmark-pdf-fill", grad:"linear-gradient(135deg,var(--grape),#5B79C2)", img:"anh/shDC.png", dl:"230", rate:"4.8", nam:"2023 - 2024"},
    {title:"Giải phẫu học động vật — Bài giảng Giải phẫu vật nuôi", type:"Bài giảng", cat:"giaotrinh", nganh:"thuy", school:"Khoa Nông nghiệp - Thủy sản", fmt:"bi-file-earmark-ppt-fill", grad:"linear-gradient(135deg,var(--grape),#5B79C2)", img:"anh/GPVN.jpg", dl:"110", rate:"4.6", nam:"2022 - 2023"},
    {title:"Nhập môn Logistics và Quản lý chuỗi cung ứng — Giáo trình", type:"Giáo trình", cat:"giaotrinh", nganh:"logistics", school:"Trường Kinh tế, Luật", fmt:"bi-file-earmark-pdf-fill", grad:"linear-gradient(135deg,var(--grape),#5B79C2)", img:"anh/qlccu.jpg", dl:"300", rate:"4.8", nam:"2021 - 2022"},
    {title:"Nhập môn Quản trị kinh doanh — Giáo trình", type:"Giáo trình", cat:"giaotrinh", nganh:"qtkd", school:"Trường Kinh tế, Luật", fmt:"bi-file-earmark-pdf-fill", grad:"linear-gradient(135deg,var(--grape),#5B79C2)", img:"anh/ktqtkd.jpg", dl:"280", rate:"4.7", nam:"2020 - 2021"},
    {title:"Nhập môn Thương mại điện tử — Giáo trình (Quyển I)", type:"Giáo trình", cat:"giaotrinh", nganh:"tmdt", school:"Trường Kinh tế, Luật", fmt:"bi-file-earmark-pdf-fill", grad:"linear-gradient(135deg,var(--grape),#5B79C2)", img:"anh/tmdt.jpg", dl:"360", rate:"4.8", nam:"2024 - 2025"},
    {title:"Nhập môn Khoa học môi trường — Giáo trình Môi trường đại cương", type:"Giáo trình", cat:"giaotrinh", nganh:"tnmt", school:"Bộ môn Tài nguyên &amp; Môi trường", fmt:"bi-file-earmark-pdf-fill", grad:"linear-gradient(135deg,var(--grape),#5B79C2)", img:"anh/mtDC.png", dl:"150", rate:"4.6", nam:"2023 - 2024"},
    {title:"Thực vật dược — Giáo trình (đào tạo Dược sĩ đại học)", type:"Giáo trình", cat:"giaotrinh", nganh:"duoc", school:"Trường Y Dược", fmt:"bi-file-earmark-pdf-fill", grad:"linear-gradient(135deg,var(--grape),#5B79C2)", img:"anh/thucvat.jpg", dl:"200", rate:"4.7", nam:"2022 - 2023"},
    {title:"Khoa học quản lý đại cương — Sách chuyên khảo", type:"Sách", cat:"sach", nganh:"qlnn", school:"Trường Kinh tế, Luật", fmt:"bi-file-earmark-pdf-fill", grad:"linear-gradient(135deg,var(--amber),#EFC56F)", img:"anh/khQL.jpg", dl:"160", rate:"4.7", nam:"2021 - 2022"},
    {title:"Thực hành tiếng Trung cơ sở 1 — Sách bài tập (Tập I)", type:"Bài tập", cat:"sach", nganh:"nn-trung", school:"Trường NN-VH-NT Khmer Nam Bộ &amp; Nhân văn", fmt:"bi-file-earmark-pdf-fill", grad:"linear-gradient(135deg,var(--amber),#EFC56F)", img:"anh/trung.jpg", dl:"240", rate:"4.8", nam:"2020 - 2021"},
    {title:"Sinh học đại cương — Báo cáo thực hành (Quan sát tế bào)", type:"Báo cáo", cat:"doan", nganh:"cnsh", school:"Khoa Nông nghiệp - Thủy sản", fmt:"bi-file-earmark-word-fill", grad:"linear-gradient(135deg,var(--rose),#8FB4E2)", img:"anh/bcSHDC.jpg", dl:"70", rate:"4.5", nam:"2024 - 2025"},
    {title:"Nhập môn ngành Điện - Điện tử — Báo cáo cuối kỳ", type:"Báo cáo", cat:"doan", nganh:"ckt-dien", school:"Trường Kỹ thuật &amp; Công nghệ", fmt:"bi-file-earmark-word-fill", grad:"linear-gradient(135deg,var(--rose),#8FB4E2)", img:"anh/diendt.jpg", dl:"85", rate:"4.6", nam:"2023 - 2024"},
    {title:"Nhập môn Điều dưỡng — Bài thu hoạch", type:"Bài thu hoạch", cat:"doan", nganh:"dieuduong", school:"Trường Y Dược", fmt:"bi-file-earmark-word-fill", grad:"linear-gradient(135deg,var(--rose),#8FB4E2)", img:"anh/nmDD.jpg", dl:"60", rate:"4.5", nam:"2022 - 2023"},
  ];

  var CAT_NAMES = {tracnghiem:"Đề thi trắc nghiệm", tuluan:"Đề tự luận & cuối kỳ", giaotrinh:"Giáo trình môn học", sach:"Sách tham khảo", chuyennganh:"Tài liệu chuyên ngành", doan:"Đồ án & tiểu luận"};
  var NGANH_NAMES = {cntt:"Công nghệ thông tin", kinhte:"Kinh tế", qtvp:"Quản trị văn phòng", yduoc:"Y - Dược", luat:"Luật", supham:"Sư phạm", ngonngu:"Ngoại ngữ", cokhi:"Cơ khí", nongnghiep:"Nông nghiệp - Thủy sản", khmer:"Văn hóa Khmer Nam Bộ", logistics:"Logistics & TMĐT", dulich:"Du lịch", moitruong:"Công nghệ Môi trường", tdtt:"Thể dục Thể thao", ctxh:"Công tác Xã hội", lyluan:"Lý luận Chính trị"};

  // Tạo HTML 1 card tài liệu (giống trang Tài liệu)
  function cardHTML(d) {
    return '<div class="col-sm-6 col-lg-3">' +
      '<div class="doc-card" data-nganh="' + (d.nganh || '') + '" data-nam="' + (d.nam || '') + '">' +
        '<div class="doc-cover" style="background:' + d.grad + '">' +
          '<img class="doc-thumb" src="' + d.img + '" alt="Bìa: ' + d.title + '" loading="lazy">' +
          '<div class="pat"></div>' +
          '<span class="doc-type">' + d.type + '</span>' +
        '</div>' +
        '<div class="doc-body">' +
          '<h6>' + d.title + '</h6>' +
          '<div class="doc-meta"><i class="bi bi-building"></i> ' + d.school + '</div>' +
          '<div class="doc-foot">' +
            '<div class="d-flex gap-3">' +
              '<span class="doc-stat"><i class="bi bi-download"></i> ' + d.dl + '</span>' +
              '<span class="doc-stat"><i class="bi bi-star-fill" style="color:var(--amber)"></i> ' + d.rate + '</span>' +
            '</div>' +
            '<div class="d-flex gap-1">' +
              '<button class="btn btn-report btn-preview" data-bs-toggle="modal" data-bs-target="#previewModal" title="Xem trước tài liệu"><i class="bi bi-eye"></i></button>' +
              '<button class="btn btn-report btn-rate" data-bs-toggle="modal" data-bs-target="#rateModal" title="Đánh giá tài liệu"><i class="bi bi-star"></i></button>' +
              '<button class="btn btn-report" data-bs-toggle="modal" data-bs-target="#reportModal" title="Báo cáo tài liệu"><i class="bi bi-flag"></i></button>' +
              '<button class="btn btn-mini"><i class="bi bi-download"></i></button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div></div>';
  }

  function setupFilterView() {
    var results = document.getElementById('filterResults');
    if (!results) return; // chỉ chạy ở trang danh mục / ngành

    var gridSection = document.getElementById('categories') || document.getElementById('majors');
    var hasCat = document.querySelector('[data-cat]') !== null;
    var key = hasCat ? 'cat' : 'nganh';
    var names = hasCat ? CAT_NAMES : NGANH_NAMES;

    var grid = document.getElementById('fvGrid');
    var titleEl = document.getElementById('fvTitle');
    var nameEl = document.getElementById('fvName');
    var countEl = document.getElementById('fvCount');
    var emptyEl = document.getElementById('fvEmpty');

    function showGrid() {
      results.style.display = 'none';
      if (gridSection) gridSection.style.display = '';
      window.scrollTo({top: 0, behavior: 'smooth'});
    }

    function showResults(slug) {
      var label = names[slug] || 'Tài liệu';
      var list = DOCS.filter(function (d) { return d[key] === slug; });
      grid.innerHTML = list.map(cardHTML).join('');
      titleEl.textContent = label;
      if (nameEl) nameEl.textContent = label;
      countEl.textContent = list.length + ' tài liệu';
      emptyEl.style.display = list.length ? 'none' : '';
      if (gridSection) gridSection.style.display = 'none';
      results.style.display = '';
      window.scrollTo({top: 0, behavior: 'smooth'});
    }

    // Đọc hash trên URL (vd #cat=tracnghiem) -> hỗ trợ nút Back của trình duyệt
    function route() {
      var h = location.hash.replace('#', '');
      var m = h.match(/^(cat|nganh)=(.+)$/);
      if (m && names[m[2]]) { showResults(m[2]); } else { showGrid(); }
    }

    document.querySelectorAll('[data-' + key + ']').forEach(function (t) {
      t.addEventListener('click', function (e) {
        e.preventDefault();
        location.hash = key + '=' + t.getAttribute('data-' + key);
      });
    });
    document.querySelectorAll('#fvBack, #fvEmptyBack').forEach(function (b) {
      b.addEventListener('click', function (e) { e.preventDefault(); location.hash = ''; });
    });

    window.addEventListener('hashchange', route);
    route(); // chạy lần đầu (nếu mở link có sẵn hash)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupFilterView);
  } else {
    setupFilterView();
  }
})();
/* ============================================================
   3) UI DÙNG CHUNG CHO MỌI TRANG
   (gộp từ các <script> nội tuyến trước đây — chạy an toàn kể cả
    khi trang không có phần tử tương ứng)
   ============================================================ */
(function () {
  /* ---------- Toast notification ---------- */
  window.hlToast = function (msg, icon) {
    var exist = document.querySelector('.hl-toast');
    if (exist) exist.remove();
    var t = document.createElement('div');
    t.className = 'hl-toast';
    t.innerHTML = '<i class="bi ' + (icon || 'bi-check-circle-fill') + '"></i> ' + msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { t.classList.add('show'); });
    });
    setTimeout(function () {
      t.classList.remove('show');
      setTimeout(function () { t.remove(); }, 350);
    }, 2500);
  };

  /* ---------- Hiệu ứng xuất hiện khi cuộn (.reveal) ---------- */
  function setupReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!els.length || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e, i) {
        if (e.isIntersecting) {
          setTimeout(function () { e.target.classList.add('show'); }, (i % 4) * 80);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Bộ lọc pills (chỉ bật/tắt trạng thái active) ---------- */
  function setupFilterPills() {
    var pills = document.querySelectorAll('.filter-pills .nav-link');
    pills.forEach(function (l) {
      l.addEventListener('click', function (ev) {
        ev.preventDefault();
        pills.forEach(function (x) { x.classList.remove('active'); });
        l.classList.add('active');
      });
    });
  }

  /* ---------- Modal xem trước tài liệu (#previewModal) ---------- */
  function setupPreviewModal() {
    var pm = document.getElementById('previewModal');
    if (!pm) return;
    var map = {
      'bi-file-earmark-pdf-fill':   ['PDF',  '#E23B3B'],
      'bi-file-earmark-word-fill':  ['DOCX', '#2B72E0'],
      'bi-file-earmark-ppt-fill':   ['PPTX', '#E8731C'],
      'bi-file-earmark-excel-fill': ['XLSX', '#1E9E5A'],
      'bi-file-earmark-code-fill':  ['CODE', '#7B5FF2'],
      'bi-file-earmark-text-fill':  ['DOC',  '#16A34A']
    };
    pm.addEventListener('show.bs.modal', function (ev) {
      var btn = ev.relatedTarget; if (!btn) return;
      var title, type, school, fmt = 'FILE', color = '#5d6b85';

      // NHÁNH 1: link có sẵn data-pv-* (ví dụ .mini-doc trên Index)
      if (btn.hasAttribute('data-pv-title')) {
        title  = btn.getAttribute('data-pv-title')  || 'Tài liệu';
        school = btn.getAttribute('data-pv-school') || '';
        type   = btn.getAttribute('data-pv-type')   || '';
        fmt    = btn.getAttribute('data-pv-fmt')    || 'FILE';
        color  = btn.getAttribute('data-pv-color')  || '#5d6b85';
      } else {
        // NHÁNH 2: nút xem trước trong .doc-card (behavior cũ)
        var card = btn.closest('.doc-card'); if (!card) return;
        var h = card.querySelector('h6'),
            t = card.querySelector('.doc-type'),
            m = card.querySelector('.doc-meta'),
            f = card.querySelector('.doc-fmt');
        title  = h ? h.textContent.trim() : 'Tài liệu';
        type   = t ? t.textContent.trim() : '';
        school = m ? m.textContent.trim() : '';
        if (f) { for (var k in map) { if (f.classList.contains(k)) { fmt = map[k][0]; color = map[k][1]; break; } } }
      }

      pm.querySelector('#pvTitle').innerHTML = '<i class="bi bi-eye"></i> ' + title;
      pm.querySelector('#pvMeta').textContent = (type ? type + ' • ' : '') + school;
      var b = pm.querySelector('#pvBadge'); b.textContent = fmt; b.style.background = color;
    });
  }

  /* ---------- Modal đánh giá sao (#rateModal) ---------- */
  function setupRateModal() {
    var rm = document.getElementById('rateModal');
    var stars = document.querySelectorAll('#rateStars i');
    if (!rm && !stars.length) return;
    var sel = 0, labels = ['', 'Tệ', 'Tạm được', 'Bình thường', 'Tốt', 'Tuyệt vời!'];
    function paint(n) {
      document.querySelectorAll('#rateStars i').forEach(function (st) {
        var v = +st.dataset.v, on = v <= n;
        st.classList.toggle('on', on);
        st.classList.toggle('bi-star-fill', on);
        st.classList.toggle('bi-star', !on);
      });
    }
    stars.forEach(function (st) {
      st.addEventListener('mouseenter', function () { paint(+st.dataset.v); });
      st.addEventListener('click', function () {
        sel = +st.dataset.v; paint(sel);
        var lbl = document.getElementById('rateLabel');
        if (lbl) lbl.textContent = labels[sel] + ' — ' + sel + ' sao';
      });
    });
    var sc = document.getElementById('rateStars');
    if (sc) sc.addEventListener('mouseleave', function () { paint(sel); });
    if (rm) rm.addEventListener('hidden.bs.modal', function () {
      sel = 0; paint(0);
      var lbl = document.getElementById('rateLabel');
      if (lbl) lbl.textContent = 'Chạm vào sao để chọn';
    });
    window.hlFakeRate = function () {
      if (!sel) { hlToast('Hãy chọn số sao trước nhé!'); return; }
      var el = document.getElementById('rateModal'), i = bootstrap.Modal.getInstance(el);
      if (i) i.hide();
      hlToast('Đã đánh giá ' + sel + ' sao! (demo)');
    };
  }

  /* ---------- Gửi báo cáo (#reportModal) ---------- */
  window.hlFakeReport = function () {
    var el = document.getElementById('reportModal'), i = bootstrap.Modal.getInstance(el);
    if (i) i.hide();
    hlToast('Đã gửi báo cáo (demo)');
  };

  function initCommon() {
    setupReveal();
    setupFilterPills();
    setupPreviewModal();
    setupRateModal();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCommon);
  } else {
    initCommon();
  }
})();


/**
 * ============================================
 *  WEBSITE SOURCE CODE PROTECTION
 *  Chống xem source, chống copy, chống DevTools
 * ============================================
 *  Cách dùng: thêm vào cuối <body>
 *  <script src="protect-source.js"></script>
 *
 *  Hoặc copy toàn bộ nội dung vào thẻ <script> trong HTML.
 */



//============================================================
(function () {
   // Bỏ qua bảo vệ nếu đang ở trang admin
if (window.location.pathname.includes("admin")) return;
  "use strict";

  // =============================================
  // 1. CHẶN CHUỘT PHẢI (Right-click)
  // =============================================
  document.addEventListener("contextmenu", function (e) {
    e.preventDefault();
    return false;
  });

  // =============================================
  // 2. CHẶN PHÍM TẮT XEM SOURCE & DEVTOOLS
  //    F12, Ctrl+U, Ctrl+Shift+I, Ctrl+Shift+J,
  //    Ctrl+Shift+C, Ctrl+S, Ctrl+P, Ctrl+A
  // =============================================
  document.addEventListener("keydown", function (e) {
    // F12 — Mở DevTools
    if (e.key === "F12" || e.keyCode === 123) {
      e.preventDefault();
      return false;
    }

    if (e.ctrlKey || e.metaKey) {
      // Ctrl+U — View Source
      if (e.key === "u" || e.key === "U") {
        e.preventDefault();
        return false;
      }
      // Ctrl+S — Save Page
      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        return false;
      }
      // Ctrl+P — Print (có thể xem source qua print)
      if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        return false;
      }
      // Ctrl+A — Select All
      if (e.key === "a" || e.key === "A") {
        e.preventDefault();
        return false;
      }
      // Ctrl+C — Copy
      if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        return false;
      }

      if (e.shiftKey) {
        // Ctrl+Shift+I — DevTools
        if (e.key === "I" || e.key === "i") {
          e.preventDefault();
          return false;
        }
        // Ctrl+Shift+J — Console
        if (e.key === "J" || e.key === "j") {
          e.preventDefault();
          return false;
        }
        // Ctrl+Shift+C — Inspect Element
        if (e.key === "C" || e.key === "c") {
          e.preventDefault();
          return false;
        }
      }
    }
  });

  // =============================================
  // 3. CHẶN KÉO THẢ (Drag & Drop)
  // =============================================
  document.addEventListener("dragstart", function (e) {
    e.preventDefault();
    return false;
  });

  // =============================================
  // 4. CHẶN CHỌN VĂN BẢN (Text Selection)
  // =============================================
  document.addEventListener("selectstart", function (e) {
    e.preventDefault();
    return false;
  });

  // CSS bổ trợ chống select
  var style = document.createElement("style");
  style.textContent =
    "* { " +
    "  -webkit-user-select: none !important; " +
    "  -moz-user-select: none !important; " +
    "  -ms-user-select: none !important; " +
    "  user-select: none !important; " +
    "  -webkit-touch-callout: none !important; " +
    "} " +
    "input, textarea, [contenteditable='true'] { " +
    "  -webkit-user-select: text !important; " +
    "  -moz-user-select: text !important; " +
    "  -ms-user-select: text !important; " +
    "  user-select: text !important; " +
    "}";
  document.head.appendChild(style);

  // =============================================
  // 5. CHẶN COPY / CUT / PASTE
  // =============================================
  ["copy", "cut", "paste"].forEach(function (evt) {
    document.addEventListener(evt, function (e) {
      e.preventDefault();
      return false;
    });
  });

  // =============================================
  // 6. PHÁT HIỆN DEVTOOLS ĐANG MỞ
  //    Redirect hoặc hiển thị cảnh báo
  // =============================================
  var devToolsOpen = false;

  // Phương pháp 1: Dùng debugger statement
  // (Khi DevTools mở, debugger sẽ pause execution)
  function detectDevTools() {
    var start = performance.now();
    debugger; // eslint-disable-line no-debugger
    var end = performance.now();
    // Nếu thời gian > 100ms → DevTools đang mở
    if (end - start > 100) {
      if (!devToolsOpen) {
        devToolsOpen = true;
        onDevToolsDetected();
      }
    } else {
      devToolsOpen = false;
    }
  }

  // Phương pháp 2: Kiểm tra kích thước cửa sổ
  // DevTools chiếm không gian → thay đổi kích thước
  function checkWindowSize() {
    var widthDiff = window.outerWidth - window.innerWidth;
    var heightDiff = window.outerHeight - window.innerHeight;
    // Ngưỡng 160px — khi DevTools dock bên cạnh
    if (widthDiff > 160 || heightDiff > 160) {
      if (!devToolsOpen) {
        devToolsOpen = true;
        onDevToolsDetected();
      }
    }
  }

  // Phương pháp 3: Console.log trick
  // Khi DevTools mở, getter của object sẽ được gọi
  var devToolsElement = new Image();
  Object.defineProperty(devToolsElement, "id", {
    get: function () {
      devToolsOpen = true;
      onDevToolsDetected();
    },
  });

  function consoleCheck() {
    devToolsOpen = false;
    console.log("%c", devToolsElement);
    console.clear();
  }

  // Hành động khi phát hiện DevTools
  function onDevToolsDetected() {
    // --- TÙY CHỌN 1: Hiển thị cảnh báo ---
    // alert("Developer Tools đã bị chặn trên trang này!");

    // --- TÙY CHỌN 2: Xóa nội dung trang ---
    document.body.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:center;' +
      "height:100vh;font-family:sans-serif;background:#111;color:#fff;" +
      'font-size:24px;text-align:center;">' +
      "<p>⚠️ Không được phép xem mã nguồn trang web này.</p></div>";

    // --- TÙY CHỌN 3: Chuyển hướng trang ---
    // window.location.href = "about:blank";
  }

  // Chạy kiểm tra định kỳ
  setInterval(detectDevTools, 1000);
  setInterval(checkWindowSize, 500);
  setInterval(consoleCheck, 1000);

  // =============================================
  // 7. CHẶN IFRAME NHÚNG (Clickjacking Protection)
  // =============================================
  if (window.top !== window.self) {
    window.top.location = window.self.location;
  }

  // =============================================
  // 8. VÔ HIỆU HÓA console
  // =============================================
  var noop = function () {};
  var methods = [
    "log",
    "debug",
    "info",
    "warn",
    "error",
    "table",
    "trace",
    "dir",
    "group",
    "groupCollapsed",
    "groupEnd",
    "time",
    "timeEnd",
    "profile",
    "profileEnd",
    "count",
  ];

  methods.forEach(function (method) {
    if (typeof console[method] === "function") {
      console[method] = noop;
    }
  });

  // =============================================
  // 9. CHẶN view-source:// PROTOCOL
  //    (Thêm header phía server sẽ hiệu quả hơn)
  // =============================================
  if (
    window.location.protocol === "view-source:" ||
    window.location.href.indexOf("view-source:") !== -1
  ) {
    window.location.href = "about:blank";
  }

  // Thông báo trong console (trước khi vô hiệu hóa)
  // để cảnh báo bất kỳ ai cố mở console
  setTimeout(function () {
    try {
      console.log(
        "%c⛔ DỪNG LẠI!",
        "color:red;font-size:40px;font-weight:bold;"
      );
      console.log(
        "%cĐây là tính năng dành cho nhà phát triển. " +
          "Nếu ai đó bảo bạn sao chép/dán nội dung ở đây, " +
          "đó là hành vi lừa đảo.",
        "font-size:16px;"
      );
    } catch (e) {
      /* ignore */
    }
  }, 100);
})();
