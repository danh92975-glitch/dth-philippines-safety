# DTH – Philippines Personal Survival Dashboard

Website cá nhân cho sinh viên FPTU (AI) thực tập 8 tuần tại FPT Software Philippines, Metro Manila. Static web app, ưu tiên điện thoại, dark mode mặc định, không API key trả phí, không gửi dữ liệu cá nhân đi đâu.

**Production hosting: GitHub Pages (duy nhất).** URL công khai: https://htkno1.github.io/dth-philippines-safety/ — repository: https://github.com/htkno1/dth-philippines-safety.

## Cấu trúc

```
dth-philippines-safety/
├── index.html                  # Toàn bộ giao diện (11 màn hình)
├── manifest.json, sw.js        # PWA + offline shell (đường dẫn tương đối)
├── .nojekyll                   # Không để Jekyll xử lý file tĩnh
├── .github/workflows/deploy.yml # GitHub Actions → GitHub Pages
├── assets/
│   ├── css/styles.css          # Design system dark, responsive
│   ├── js/app.js               # Logic: map, lọc, checklist, budget, speech
│   ├── icons/                  # SVG + PNG 192/512 cho PWA
│   └── data/*.json             # Dữ liệu có nguồn + ngày xác minh
└── docs/
    ├── SOURCES.md              # Danh sách nguồn & mức xác minh
    └── DEPLOYMENT.md           # GitHub Pages, cập nhật dữ liệu, rollback
```

## Chạy locally

Không mở `index.html` bằng `file://` (trình duyệt chặn `fetch` dữ liệu JSON). Dùng một static server từ thư mục gốc dự án:

```powershell
npx http-server . -p 3000
# hoặc
python -m http.server 3000
```

Mở `http://localhost:3000`.

Để kiểm tra đúng đường dẫn GitHub Pages (subpath), chạy server từ thư mục **cha** và truy cập `http://localhost:3000/dth-philippines-safety/`. Mọi tài nguyên dùng đường dẫn tương đối nên vẫn hoạt động.

## Cập nhật nội dung

| Việc cần làm | File | Lưu ý |
|---|---|---|
| Đổi giao diện/màn hình | `index.html` | Giữ cấu trúc `id` và `[data-view]` hiện có; JS phụ thuộc vào các id này. |
| Đổi màu, spacing, responsive | `assets/css/styles.css` | Mobile-first; kiểm tra ở 390px, 375px, 430px và 1440px. |
| Đổi logic bản đồ, lọc, speech, localStorage | `assets/js/app.js` | Chạy `node --check assets/js/app.js` trước khi commit. |
| Thêm/sửa địa điểm | `assets/data/locations.json` | Giữ `verified`, `source`, `verifiedDate`. Tọa độ phải có nguồn OSM/chính thức. |
| Đổi số khẩn cấp/liên hệ | `assets/data/emergency.json` | **Không thêm số khi chưa có nguồn chính thức**; để `verified: false` nếu chưa xác minh. |
| Đổi tình huống an toàn | `assets/data/safety.json` | Mỗi scenario có 5 phần: signs, scenario, prevent, during, contacts + source. |
| Đổi câu tiếng Anh | `assets/data/english.json` | Giữ cấu trúc phrase/translation/category để copy & speech vẫn chạy. |
| Đổi lộ trình/giá vé | `assets/data/transport.json` | Cập nhật `dataDate` và ghi nguồn mới trong `docs/SOURCES.md`. |
| Đổi checklist/mua sắm | `assets/data/checklist.json` | Các key localStorage `dth_*` phải giữ nguyên nếu muốn giữ dữ liệu người dùng. |

Nguyên tắc: nếu không có nguồn công khai để kiểm chứng một giá trị, ghi rõ `verified: false` và để trống giá trị đó — **không suy diễn**. Sau mỗi lần sửa JSON, cập nhật `dataDate`/`verifiedDate` và cập nhật `docs/SOURCES.md`.

Sau khi sửa `sw.js`, `index.html`, CSS/JS hoặc JSON: **tăng `CACHE`** trong `sw.js` (vd `dth-survival-v4` → `v5`) để người dùng nhận phiên bản mới.

## Quyền riêng tư

- Checklist, budget và cài đặt được lưu bằng `localStorage` trên chính thiết bị (`dth_*` keys).
- Không lưu số hộ chiếu, mật khẩu, OTP hay thông tin ngân hàng.
- Vị trí chỉ được xin sau khi bấm nút “Vị trí của tôi”, chỉ vẽ marker trên máy, không gửi lên server.
- Service worker cache các file tĩnh và JSON công khai; **không cache dữ liệu cá nhân**.
- Trang được công khai trên GitHub Pages: không coi việc ẩn giao diện bằng JavaScript là bảo vệ.

## Deploy & cập nhật

Mọi commit đẩy lên `main` sẽ tự động được GitHub Actions đóng gói và deploy lên GitHub Pages. Chi tiết, kiểm tra trạng thái và rollback: xem [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).
