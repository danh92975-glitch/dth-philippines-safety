# Deployment & maintenance (GitHub Pages)

Production được phục vụ **duy nhất bằng GitHub Pages** thông qua GitHub Actions. Không dùng Vercel hay nhà cung cấp khác.

- Repository: `dth-philippines-safety`
- Branch production: `main`
- Source: **GitHub Actions** (Settings → Pages → Build and deployment → Source: GitHub Actions)
- Workflow: `.github/workflows/deploy.yml`
- URL: `https://USERNAME.github.io/dth-philippines-safety/`

> `dth.vercel.app` thuộc namespace của Vercel và **không thể** gán cho GitHub Pages. Không dùng tên miền này. Nếu sau này có tên miền riêng, có thể thêm qua Settings → Pages → Custom domain và cấu hình DNS CNAME/A record tại nhà đăng ký domain (không thực hiện tự động ở đây).

## Cơ chế tự động cập nhật

1. Sửa nội dung trong repo (kể cả qua GitHub web editor).
2. Commit và push lên `main`.
3. Workflow `Deploy DTH to GitHub Pages` chạy tự động (có thể bấm `Run workflow` để chạy thủ công).
4. Artifact được upload và deploy; URL công khai cập nhật sau khi job `deploy` xanh.

Các action dùng phiên bản chính thức mới nhất đã kiểm tra: `actions/checkout@v7`, `actions/configure-pages@v6`, `actions/upload-pages-artifact@v5`, `actions/deploy-pages@v5`.

Quyền của workflow: `contents: read`, `pages: write`, `id-token: write`. Có `concurrency` nhóm `github-pages` để tr deploy chồng chéo.

## Kiểm tra deployment

```powershell
gh run list --workflow "Deploy DTH to GitHub Pages" --limit 5
gh run view --log
```

Hoặc xem tab **Actions** trên GitHub. URL deployment thực tế nằm ở output `page_url` của bước `Deploy to GitHub Pages`.

Sau mỗi deploy, kiểm tra bằng HTTP:

```powershell
curl.exe -I https://USERNAME.github.io/dth-philippines-safety/
curl.exe -I https://USERNAME.github.io/dth-philippines-safety/assets/data/locations.json
curl.exe -I https://USERNAME.github.io/dth-philippines-safety/sw.js
```

Tất cả phải trả về `200`. Không tuyên bố deploy thành công nếu chưa kiểm tra các URL này.

## Checklist sau deploy

1. Trang chủ mở được, đồng hồ PHT chạy, thời tiết Open-Meteo tải được.
2. Interactive Map: tile OSM tải, marker hiển thị, lọc bán kính/danh mục/gần WCC hoặc FPT hoạt động (500m từ WCC phải ít hơn 30km).
3. Safety Guide: 12 tình huống mở được.
4. Emergency: các nút `tel:` có số đúng; không gọi thật khi đang kiểm tra.
5. English Survival: copy và nút nghe (Web Speech API nếu trình duyệt hỗ trợ).
6. Checklist & Budget: tick một mục, reload, trạng thái vẫn giữ nguyên; đổi tỷ giá → tổng VNĐ cập nhật.
7. PWA: manifest cài được; service worker scope nằm trong `/dth-philippines-safety/`.
8. Offline: bật airplane mode, reload — dữ liệu JSON đã cache vẫn mở (có thể cần tải trang một lần khi có mạng).
9. `docs/SOURCES.md` mở được từ footer.

## Đường dẫn trên GitHub Pages

Repo được host tại subpath `/dth-philippines-safety/`. Vì vậy:

- `index.html` dùng `assets/...`, `manifest.json` (tương đối).
- `app.js` fetch `assets/data/*.json` (tương đối theo document).
- `app.js` đăng ký `sw.js` (tương đối theo document → scope đúng subpath).
- `manifest.json`: `start_url: "./"`, `scope: "./"`.
- `sw.js` tạo cache key bằng `new URL(p, new URL('./', self.location.href))` nên không bao giờ trỏ về root domain.

Không đổi các path này thành `/assets/...`.

## Cập nhật dữ liệu

1. Sửa JSON tương ứng trong `assets/data/`.
2. Cập nhật `verifiedDate` / `dataDate`; thêm hoặc sửa link nguồn trong `docs/SOURCES.md`.
3. Tăng `CACHE` trong `sw.js` (vd `dth-survival-v4` → `dth-survival-v5`).
4. Chạy kiểm tra: `node --check assets/js/app.js`, validate JSON, mở local server.
5. Commit/push lên `main`; đợi workflow xanh và kiểm tra lại URL công khai.

## Rollback

Nếu bản mới có lỗi:

1. Tab **Actions** → mở run gần nhất thành công → copy commit SHA trước đó (`git rev-parse HEAD~1` nếu có local git, hoặc dùng danh sách commit trên GitHub).
2. Tạo commit revert hoặc force-update branch `main` về SHA cũ (GitHub UI → branch → revert / hoặc `git revert <sha>` rồi push).
3. Workflow sẽ chạy lại và deploy phiên bản cũ. Xác nhận bằng HTTP GET như phần trước.

## Bảo mật

- Không đưa secret/token vào repository hay vào code chạy phía client.
- Repository công khai: mọi nội dung trong repo đều có thể bị đọc. Chỉ đăng số điện thoại/email công khai (khẩn cấp, văn phòng, đầu mối chương trình đã công bố).
- Không thu thập GPS tự động, không lưu giấy tờ, không gửi dữ liệu cá nhân đến bên thứ ba.
- Nếu cần khu vực riêng: dùng xác thực phía server thật, không dùng JavaScript ẩn nội dung.
