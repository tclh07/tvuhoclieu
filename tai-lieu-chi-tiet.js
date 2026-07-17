  // ============================================================
  //  ⭐ DÁN ID FILE GOOGLE DRIVE VÀO ĐÂY ⭐
  // ============================================================
  //  Ví dụ: nếu link chia sẻ của bạn là
  //    https://drive.google.com/file/d/1AbC2xYz9-def_KpQ/view?usp=sharing
  //  thì DRIVE_FILE_ID = '1AbC2xYz9-def_KpQ'
  // ============================================================
  var DRIVE_FILE_ID = '1tgNt6rij7SNTr9WGehwA7U13xy9ETP1R';   // ← dán ID vào đây (giữa 2 dấu nháy)


  // ---- Render iframe Google Drive hoặc placeholder khi chưa có ID ----
  function renderDriveViewer() {
    var wrap = document.getElementById('fvFrameWrap');
    if (!wrap) return;
    var id = (DRIVE_FILE_ID || '').trim();
    if (id) {
      wrap.innerHTML =
        '<iframe class="fv-frame" ' +
                'src="https://drive.google.com/file/d/' + id + '/preview" ' +
                'allow="autoplay" allowfullscreen ' +
                'title="Xem trước tài liệu"></iframe>';
    } else {
      wrap.innerHTML =
        '<div class="fv-placeholder">' +
          '<i class="bi bi-file-earmark-pdf-fill ph-ic"></i>' +
          '<h4>Chưa gắn tài liệu Google Drive</h4>' +
          '<p>Mở file <code>tai-lieu-chi-tiet.html</code>, tìm biến ' +
             '<code>DRIVE_FILE_ID</code> và dán ID file Drive vào (xem hướng dẫn ' +
             'trong phần comment ngay phía trên biến).</p>' +
          '<small>Nhớ chia sẻ file với quyền "Bất kỳ ai có link — Người xem".</small>' +
        '</div>';
    }
  }

  // ---- Kiểm tra đăng nhập & render ----
  (function () {
    function render() {
      var logged = window.hlIsLoggedIn && window.hlIsLoggedIn();
      document.getElementById('mainSection').style.display = logged ? '' : 'none';
      document.getElementById('loginRequiredSection').style.display = logged ? 'none' : '';
      if (logged) renderDriveViewer();
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', render);
    } else {
      render();
    }
    // Sau khi đăng nhập thành công (modal đóng) → refresh trạng thái
    document.addEventListener('click', function (e) {
      if (e.target.closest('[onclick*="hlFakeLogin"]')) {
        setTimeout(render, 300);
      }
    });
  })();
