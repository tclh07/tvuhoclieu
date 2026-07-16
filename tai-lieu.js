/* ============================================================
   TVU HọcLiệu — JS riêng Trang Tài liệu (tai-lieu.html)
   - Nhận từ khóa + bộ lọc từ URL (?q=&nganh=&truong=&nam=&loai=)
   - Lọc thẻ theo loại (pills) + từ khóa + ngành (không phân biệt dấu)
   - Hiển thị chip lọc đang áp dụng trong dải mảnh, xóa được
   ============================================================ */
(function () {
  var grid = document.getElementById('docGrid');
  if (!grid) return;

  var cards = Array.prototype.slice.call(grid.querySelectorAll('.doc-card'));
  var cols = cards.map(function (c) { return c.closest('[class*="col-"]') || c.parentElement; });
  var pills = document.querySelectorAll('.filter-pills .nav-link');
  var empty = document.getElementById('emptyState');
  var emptyQuery = document.getElementById('emptyQuery');

  var fsCount = document.getElementById('fsCount');
  var fsChips = document.getElementById('fsChips');
  var filterStrip = document.getElementById('filterStrip');

  // Bản đồ mã ngành -> tên hiển thị (khớp data-nganh trên thẻ)
  var NGANH_LABEL = {
    cntt:"Công nghệ thông tin", kinhte:"Kinh tế", yduoc:"Y - Dược", luat:"Luật",
    cokhi:"Cơ Khí", ai:"Trí tuệ nhân tạo", hoaduoc:"Hóa dược", "nn-anh":"Ngôn ngữ Anh",
    "nn-trung":"Ngôn ngữ Trung", rhm:"Răng - Hàm - Mặt", qlnn:"Quản lý nhà nước",
    ntts:"Nuôi trồng thủy sản", tnmt:"Tài nguyên & Môi trường", tdtt:"Thể dục Thể thao",
    "ckt-dien":"Điện - Điện tử", chinhtrihoc:"Chính trị học", cnsh:"Công nghệ sinh học",
    thuy:"Thú y", logistics:"Logistics & TMĐT", qtkd:"Quản trị kinh doanh",
    tmdt:"Thương mại điện tử", duoc:"Dược học", dieuduong:"Điều dưỡng", khac:"Khác"
  };
  // Ánh xạ tên ngành (từ overlay) -> mã ngành trên thẻ
  var NGANH_SLUG = {};
  Object.keys(NGANH_LABEL).forEach(function (k) { NGANH_SLUG[norm(NGANH_LABEL[k])] = k; });

  var activeType = 'Tất cả';
  var query = '';
  var nganhSlug = '';   // lọc theo ngành (mã)
  var truong = '';      // lọc theo trường (so khớp text trong .doc-meta)
  var nam = '';         // lọc theo năm học (so khớp data-nam)
  var rawQuery = '';    // từ khóa gốc để hiển thị chip

  function norm(s) {
    return (s || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd').trim();
  }

  function apply() {
    var shown = 0;
    cards.forEach(function (card, i) {
      var typeEl = card.querySelector('.doc-type');
      var titleEl = card.querySelector('h6');
      var metaEl = card.querySelector('.doc-meta');
      var type = typeEl ? typeEl.textContent : '';
      var title = titleEl ? titleEl.textContent : '';
      var meta = metaEl ? metaEl.textContent : '';
      var cardNganh = card.getAttribute('data-nganh') || '';
      var cardNam = card.getAttribute('data-nam') || '';

      var okType = (activeType === 'Tất cả') || (norm(type) === norm(activeType));
      var okQuery = !query || norm(type + ' ' + title + ' ' + meta).indexOf(query) !== -1;
      var okNganh = !nganhSlug || cardNganh === nganhSlug;
      var okTruong = !truong || norm(meta).indexOf(norm(truong)) !== -1;
      var okNam = !nam || cardNam === nam;

      var show = okType && okQuery && okNganh && okTruong && okNam;
      if (cols[i]) cols[i].style.display = show ? '' : 'none';
      if (show) shown++;
    });

    var hasFilter = !!(query || nganhSlug || truong || nam || activeType !== 'Tất cả');

    if (fsCount) {
      fsCount.textContent = hasFilter ? (shown + ' kết quả') : 'Tất cả tài liệu';
    }
    // Dải mảnh chỉ hiện khi đang có bộ lọc/từ khóa (khi vào từ overlay)
    if (filterStrip) {
      filterStrip.style.display = hasFilter ? '' : 'none';
    }

    if (empty) {
      empty.style.display = shown ? 'none' : '';
      if (!shown && emptyQuery) {
        emptyQuery.textContent = rawQuery ? ('“' + rawQuery + '”') : ('bộ lọc hiện tại');
      }
    }
  }

  // ---- Chip lọc đang áp dụng ----
  function renderChips() {
    if (!fsChips) return;
    fsChips.innerHTML = '';
    var chips = [];
    if (rawQuery) chips.push({ k: 'q', label: 'Từ khóa: ' + rawQuery });
    if (nganhSlug) chips.push({ k: 'nganh', label: 'Ngành: ' + (NGANH_LABEL[nganhSlug] || nganhSlug) });
    if (truong) chips.push({ k: 'truong', label: 'Trường: ' + truong });
    if (nam) chips.push({ k: 'nam', label: 'Năm: ' + nam });
    if (activeType !== 'Tất cả') chips.push({ k: 'type', label: 'Loại: ' + activeType });

    if (!chips.length) {
      var span = document.createElement('span');
      span.className = 'fs-empty';
      span.textContent = 'Không có bộ lọc nào đang áp dụng.';
      fsChips.appendChild(span);
      return;
    }
    chips.forEach(function (c) {
      var el = document.createElement('span');
      el.className = 'fs-chip';
      el.innerHTML = c.label + ' <i class="bi bi-x" role="button" aria-label="Xóa"></i>';
      el.querySelector('.bi-x').addEventListener('click', function () { clearFilter(c.k); });
      fsChips.appendChild(el);
    });
  }

  function clearFilter(k) {
    if (k === 'q') { query = ''; rawQuery = ''; }
    else if (k === 'nganh') nganhSlug = '';
    else if (k === 'truong') truong = '';
    else if (k === 'nam') nam = '';
    else if (k === 'type') {
      activeType = 'Tất cả';
      pills.forEach(function (x) { x.classList.remove('active'); });
      if (pills[0]) pills[0].classList.add('active');
    }
    apply();
    renderChips();
  }

  // ---- Pills (lọc theo loại) ----
  pills.forEach(function (l) {
    l.addEventListener('click', function (ev) {
      ev.preventDefault();
      pills.forEach(function (x) { x.classList.remove('active'); });
      l.classList.add('active');
      activeType = l.textContent.trim();
      apply();
      renderChips();
    });
  });

  // ---- Nút "Xem tất cả" ở empty state ----
  var reset = document.getElementById('emptyReset');
  if (reset) {
    reset.addEventListener('click', function () {
      activeType = 'Tất cả'; query = ''; rawQuery = ''; nganhSlug = ''; truong = ''; nam = '';
      pills.forEach(function (x) { x.classList.remove('active'); });
      if (pills[0]) pills[0].classList.add('active');
      apply();
      renderChips();
    });
  }

  // ---- Đọc tham số từ URL (từ overlay chuyển sang) ----
  function readParams() {
    var p = new URLSearchParams(location.search);
    var q = p.get('q');
    if (q) { rawQuery = q.trim(); query = norm(q); }

    var ng = p.get('nganh');
    if (ng) {
      var slug = NGANH_SLUG[norm(ng)];
      if (slug) nganhSlug = slug;
      else { // không khớp mã -> coi như từ khóa phụ
        query = query ? (query + ' ' + norm(ng)) : norm(ng);
      }
    }
    var tr = p.get('truong');
    if (tr) truong = tr.trim();

    var loai = p.get('loai');
    if (loai) {
      var wanted = norm(loai);
      pills.forEach(function (x) {
        if (norm(x.textContent) === wanted) {
          pills.forEach(function (y) { y.classList.remove('active'); });
          x.classList.add('active');
          activeType = x.textContent.trim();
        }
      });
    }
    var namParam = p.get('nam');
    if (namParam) nam = namParam.trim();
  }

  readParams();
  apply();
  renderChips();
})();
