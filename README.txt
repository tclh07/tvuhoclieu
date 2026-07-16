========================================================
  TVU HỌCLIỆU — Bản cập nhật tách CSS/JS ra file riêng
========================================================

THAY ĐỔI MỚI NHẤT
--------------------------------------------------------
- Tách toàn bộ inline CSS (<style>) và inline JS (<script>)
  trong các trang HTML ra thành file .css / .js riêng biệt.
- Giao diện giữ nguyên 100%, không thay đổi bất kỳ dòng
  CSS hay JS nào — chỉ chuyển vị trí từ inline sang file ngoài.
- Dễ bảo trì, dễ cache, code sạch hơn.


CẤU TRÚC FILE (16 file)
--------------------------------------------------------
TRANG HTML (8 trang):
  • index.html              -> Trang chủ
  • danh-muc.html           -> Danh mục tài liệu
  • tai-lieu.html            -> Tài liệu mới & nổi bật
  • tai-lieu-chi-tiet.html   -> Chi tiết tài liệu
  • nganh-hoc.html           -> Theo chuyên ngành
  • goc-sinh-vien.html       -> Góc sinh viên
  • ve-chung-toi.html        -> Về chúng tôi
  • admin.html               -> Trang quản trị

CSS (6 file):
  • styles.css               -> CSS chung toàn site
  • admin-page.css           -> CSS riêng trang quản trị  (MỚI TÁCH)
  • goc-sinh-vien.css        -> CSS riêng trang góc SV   (MỚI TÁCH)
  • tai-lieu-chi-tiet.css    -> CSS riêng trang chi tiết  (MỚI TÁCH)
  • ve-chung-toi.css         -> CSS riêng trang về chúng tôi (MỚI TÁCH)

JS (6 file):
  • tvu-enhance.js           -> JS dùng chung (hiệu ứng, modal, login...)
  • tvu-search.js            -> Overlay tìm kiếm dùng chung
  • admin.js                 -> JS riêng trang quản trị
  • tai-lieu.js              -> JS riêng trang tài liệu
  • goc-sinh-vien.js         -> JS riêng trang góc SV    (MỚI TÁCH)
  • tai-lieu-chi-tiet.js     -> JS riêng trang chi tiết   (MỚI TÁCH)
  • ve-chung-toi.js          -> JS riêng trang về chúng tôi (MỚI TÁCH)


CÁCH LINK FILE TRONG MỖI TRANG HTML
--------------------------------------------------------
Mỗi trang HTML đều link theo thứ tự:
  1. Bootstrap CSS (CDN)
  2. Bootstrap Icons (CDN)
  3. Google Fonts
  4. styles.css (CSS chung)
  5. [tên-trang].css (CSS riêng trang, nếu có)
  ... nội dung HTML ...
  6. Bootstrap JS (CDN)
  7. tvu-enhance.js (JS chung)
  8. tvu-search.js (tìm kiếm chung)
  9. [tên-trang].js (JS riêng trang, nếu có)


CÁCH TRIỂN KHAI
--------------------------------------------------------
1. Chép toàn bộ 16 file .html / .css / .js vào thư mục
   website, ghi đè các file trùng tên.
2. GIỮ NGUYÊN thư mục "anh/" (chứa logo và ảnh bìa tài liệu).
3. Mở index.html bằng trình duyệt để kiểm tra.


LƯU Ý
--------------------------------------------------------
- Cần kết nối Internet để tải Bootstrap và font từ CDN.
- Giao diện 100% giữ nguyên so với bản cũ, chỉ tổ chức
  lại code cho sạch hơn.
