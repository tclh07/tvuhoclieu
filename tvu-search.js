/* ============================================================
   TVU HọcLiệu — Overlay tìm kiếm dùng chung (mọi trang)
   - Mở/đóng overlay bằng nút icon 🔍, phím Ctrl/Cmd+K, ESC
   - Gõ từ khóa + Enter / nút Tìm  ->  chuyển sang tai-lieu.html?q=...
   - Nút "Lọc" mở panel chọn ngành/trường/năm, đếm số filter đang chọn
   - Chip "đang tìm nhiều" bấm để điền nhanh vào ô tìm
   ============================================================ */
(function () {
  var overlay = document.getElementById('searchOverlay');
  if (!overlay) return; // trang chưa có overlay thì bỏ qua

  var openBtns  = document.querySelectorAll('[data-open-search]');
  var closeBtn  = overlay.querySelector('.so-close');
  var input     = overlay.querySelector('#soInput');
  var goBtn     = overlay.querySelector('#soGo');
  var filterBtn = overlay.querySelector('#soFilterBtn');
  var filterPanel = overlay.querySelector('#soFilterPanel');
  var filterCount = filterBtn ? filterBtn.querySelector('.count') : null;

  function openOverlay() {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { if (input) input.focus(); }, 200);
  }
  function closeOverlay() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    if (filterPanel) filterPanel.classList.remove('open');
    if (filterBtn) filterBtn.classList.remove('active');
  }

  openBtns.forEach(function (b) {
    b.addEventListener('click', function (e) { e.preventDefault(); openOverlay(); });
  });
  if (closeBtn) closeBtn.addEventListener('click', closeOverlay);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) closeOverlay(); });

  // Phím tắt: ESC đóng, Ctrl/Cmd+K bật/tắt
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeOverlay();
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      overlay.classList.contains('open') ? closeOverlay() : openOverlay();
    }
  });

  // Toggle panel lọc
  if (filterBtn && filterPanel) {
    filterBtn.addEventListener('click', function () {
      filterPanel.classList.toggle('open');
      filterBtn.classList.toggle('active');
    });
    // Đếm số filter đang chọn
    filterPanel.querySelectorAll('select').forEach(function (sel) {
      sel.addEventListener('change', function () {
        var active = Array.prototype.filter.call(
          filterPanel.querySelectorAll('select'),
          function (s) { return s.selectedIndex > 0; }
        ).length;
        if (filterCount) {
          filterCount.textContent = active;
          filterCount.style.background = active > 0 ? 'var(--amber)' : 'var(--ink-soft)';
        }
      });
    });
  }

  // Thực hiện tìm: chuyển sang trang Tài liệu kèm từ khóa + bộ lọc
  function doSearch() {
    var params = new URLSearchParams();
    var q = input ? input.value.trim() : '';
    if (q) params.set('q', q);
    if (filterPanel) {
      filterPanel.querySelectorAll('select[data-param]').forEach(function (sel) {
        if (sel.selectedIndex > 0) params.set(sel.getAttribute('data-param'), sel.value);
      });
    }
    var qs = params.toString();
    location.href = 'tai-lieu.html' + (qs ? '?' + qs : '');
  }

  if (goBtn) goBtn.addEventListener('click', doSearch);
  if (input) input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); doSearch(); }
  });

  // Chip gợi ý -> điền vào ô tìm
  overlay.querySelectorAll('.suggest-item').forEach(function (item) {
    item.addEventListener('click', function (e) {
      e.preventDefault();
      if (input) { input.value = item.textContent.trim(); input.focus(); }
    });
  });
})();
