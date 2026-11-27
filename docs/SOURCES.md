# Nguồn & trạng thái xác minh

Ngày kiểm tra: **2026-11-27**. Mọi dữ liệu có trong website đều có `source` + `verifiedDate` tương ứng trong file JSON. Trang này là bản tổng hợp để kiểm toán nhanh.

Quy ước:

- **Đã xác minh** = nguồn chính thức hoặc bản ghi OSM/Nominatim được truy xuất trực tiếp trong ngày kiểm tra.
- **Chưa xác minh** = có thông tin nhưng không có nguồn đủ mạnh; website hiển thị nhãn “Cần xác minh” và/hoặc để trống giá trị.
- **Mâu thuẫn** = hai nguồn chính thức/tham khảo khác nhau; website ưu tiên nguồn mới hơn và ghi chú mâu thuẫn.

## 1. Địa điểm neo

| Dữ liệu | Giá trị dùng | Trạng thái | Nguồn |
|---|---|---|---|
| WCC campus | Aurora Blvd, Quirino 3-A, Project 3, QC; OSM `14.6272114, 121.0633582` | Đã xác minh (campus) | [Nominatim OSM way 120115733](https://nominatim.openstreetmap.org/search?q=World%20Citi%20Colleges%20Quezon%20City&format=json) |
| WCC ký túc xá | “Vài bước chân từ campus”; **không có địa chỉ/cổng riêng** | **Chưa xác minh** | [WCC – Student Dormitory](https://www.worldciti.edu.ph/facilities/student-dormitory) (trang trả 503/404 khi kiểm tra từ môi trường này; nội dung có trong chỉ mục tìm kiếm) |
| WCC liên hệ | (02) 3-438-4580 · 0917-596-8545 | Đã xác minh (trang chính thức) | [WCC – Student Dormitory](https://www.worldciti.edu.ph/facilities/student-dormitory) |
| Ga gần WCC | Anonas LRT-2 — WCC nói campus “walking distance”; LRTA xác nhận Anonas là ga LRT-2 | Đã xác minh cho campus; **chưa xác minh cho cổng ký túc** | [WCC Facebook](https://www.facebook.com/WorldCitiCollegesQuezonCity/videos/1424596989065559/) · [LRTA](https://www.lrta.gov.ph/lrta-partners-with-pcw-to-promote-safe-spaces-in-lrt-line-2-stations/) |
| FPT Software Manila Office | Suite A, Level 14, Robinsons Summit Center, 6783 Ayala Avenue, Makati City 1226 | Đã xác minh | [FPT Software – Global Presence](https://fptsoftware.com/about-us/global-presence) (trang có bản dịch hiển thị qua JS) |
| Tọa độ FPT | `14.5575334, 121.0206534` (link Google Maps trên trang FPT) | Đã xác minh | [FPT Software – Global Presence](https://fptsoftware.com/about-us/global-presence) |
| FPT office phone/email | +63 32 410 6857 (58) · vudta@fpt.com | Đã xác minh | [FPT Software – Global Presence](https://fptsoftware.com/about-us/global-presence) |
| Chương trình OJT | ~8 tuần, Oct–Dec 2026, FPT Software Philippines Manila, ~20 sinh viên IT; liên hệ 0901 377 317 / thuvh3@fe.edu.vn | Đã xác minh | [FPTU announcement, 18/08/2026](https://daihoc.fpt.edu.vn/en/hm/officially-install-it-in-the-philippines-in-fall-2026/) |

**Mâu thuẫn đã ghi nhận:** LinkedIn ghi “14th Floor … 1200”, trong khi trang FPT chính thức ghi “Suite A, Level 14 … 1226”. Website dùng giá trị của FPT. Một số văn bản cũ của WCC ghi số điện thoại dạng `8-913-8380 loc 485`; website dùng số trên trang chính thức hiện hành.

## 2. Giao thông & giá vé

| Dữ liệu | Giá trị dùng | Trạng thái | Nguồn |
|---|---|---|---|
| LRT-2 Anonas → Cubao | ₱7,50 (thẻ Beep xanh) / ₱10 (SJT) | Đã xác minh (OCR ma trận chính thức) | [LRTA – Tickets & Fares](https://www.lrta.gov.ph/tickets-and-fares/) · [ma trận SVC 2026](https://www.lrta.gov.ph/wp-content/uploads/2026/04/Discount_Matrix_OriginSVC_SJT_1.png) |
| MRT-3 Cubao → Ayala | ₱10 (giá đã giảm); giá thường ₱20 | Đã xác minh (OCR ma trận) | [DOTr-MRT3 discounted matrix](https://www.dotrmrt3.gov.ph/discounted-fare-matrix.pdf) |
| Giảm 50% toàn hệ thống | Có hiệu lực 23/03/2026, áp dụng mọi hành khách LRT-2/MRT-3 | Đã xác minh | [LRTA](https://www.lrta.gov.ph/tickets-and-fares/) · [PCO 22/03/2026](https://pco.gov.ph/news_releases/president-marcos-urges-bayanihan-as-govt-suspends-fare-hike-expands-aid-to-alleviate-burdens-on-citizenry/) |
| Thẻ Beep | ₱30 + nạp tối thiểu ₱14 | Đã xác minh | [LRTA](https://www.lrta.gov.ph/tickets-and-fares/) |
| Sinh viên nước ngoài | **Không tự động** đủ điều kiện thẻ concessionary (chỉ công dân Philippines); vẫn được giá ₱7,50/₱10 như mọi hành khách | Đã xác minh | [Beep concessionary FAQ, 01/10/2025](https://beep.com.ph/faqs-for-concessionary-card) |
| Chuyển tuyến Cubao | Không tìm thấy quy định through-fare chính thức; nguồn độc lập cho biết phải trả 2 lần vé | Trung bình | [TrainsPh](https://trains.ph/) |
| Giờ LRT-2 | Mở 04:50; Anonas chiều westbound đóng ~21:05 | Đã xác minh | [LRTA – Operating Schedule](https://www.lrta.gov.ph/train-operating-schedule/) |
| Giờ MRT-3 | Ngày thường Araneta-Cubao southbound 04:27–22:38; cuối tuần chuyến cuối 21:38 | Đã xác minh | [DOTr-MRT3 – About Us](https://www.dotrmrt3.gov.ph/about-us) |
| Cửa ra ga Ayala | **Không có số cửa chính thức**; hướng đi Ayala Avenue/One Ayala theo OSM; khoảng cách đi bộ ước tính 1,0–1,6 km (nguồn bên thứ ba, mâu thuẫn) | **Chưa xác minh** | [Rome2Rio](https://www.rome2rio.com/s/MRT-3-Ayala-Station-Makati-City-Manila/Robinsons-Summit-Center) |

Tổng tiền đã xác minh: ₱17,50 chiều × 2 = ₱35/ngày × 40 ngày = **₱1.400**. Con số “7.000 VNĐ/lượt” được nhắc trước đó **không khớp** với bảng giá hiện hành. VNĐ do người dùng tự nhập tỷ giá.

## 3. Khẩn cấp & pháp lý

| Chủ đề | Kết luận | Nguồn |
|---|---|---|
| 911 | Số khẩn cấp quốc gia thống nhất (cảnh sát, cứu hỏa, cấp cứu) | [DILG NCR, 22/07/2026](https://ncr.dilg.gov.ph/dilg-leads-nationwide-campaign-for-unified-911-emergency-hotline) · [US Embassy Services](https://ph.usembassy.gov/services) |
| PNP | 117; (02) 8722-0650; SMS 2920 (SMS 2920 chỉ từ nguồn PNP dạng snippet → mức trung bình) | [US Embassy Contact](https://ph.usembassy.gov/contact) · [PNP ACG](https://acg.pnp.gov.ph/main/press-releases/233-acg-operatives-rescue-minors-trafficked-by-their-own-sister) |
| Cứu hỏa | Dùng 911. Các số BFP không khẩn cấp mâu thuẫn giữa (02) 8426-0219 / 0246 / 3812 | [BFP Contact](https://bfp.gov.ph/contact-us/) · [US Embassy Contact](https://ph.usembassy.gov/contact) |
| Xe cấp cứu | **Không có số xe cấp cứu quốc gia riêng được xác minh**; dùng 911. 1555 là hotline COVID-19, không dùng làm số cấp cứu chung | [DOH](https://doh.gov.ph/press-release/doh-launches-covid-19-hotlines-1555-02-894-covid) |
| Red Cross | 143 | [US Embassy Contact](https://ph.usembassy.gov/contact) |
| Đại sứ quán Việt Nam | 670 Pablo Ocampo, Malate, Manila · +63-28-5216843 · vnembph@mofa.gov.vn. Số nóng riêng sau giờ làm việc **chưa xác minh** | [ ĐSQ Việt Nam tại Philippines](https://vnembassy-manila.mofa.gov.vn/lien-he) |
| Bảo hộ công dân MFA | (+84) 981.84.84.84 — tổng đài chung, **không phải số riêng của ĐSQ Philippines** | [Trang chủ ĐSQ](https://vnembassy-manila.mofa.gov.vn/) |
| Quyền khi bị giữ/thẩm vấn | Hiến pháp 1987 Điều III §§12(2), 13, 14, 16, 17; Công ước Vienna về quan hệ lãnh sự Điều 36 | [Supreme Court E-Library](https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/3/353) · [UN Treaty Collection](https://treaties.un.org/pages/viewdetails.aspx?src=treaty&mtdsg_no=iii-6&chapter=3) |
| Giấy phép lao động | DOLE: người nước ngoài làm việc cần AEP theo Điều 40 Bộ luật Lao động; **không tìm thấy văn bản xác nhận miễn cho OJT** | [DOLE NCR](https://ncr.dole.gov.ph/alien-employment-permit/) |
| Visa | Không giả định visa-waiver áp dụng cho công dân Việt Nam; kiểm tra trực tiếp với BI | [Bureau of Immigration](https://immigration.gov.ph/visas/visa-waiver/) |
| Tội phạm đường phố/taxi, cảnh báo tham gia biểu tình | Cảnh báo chung toàn quốc, cập nhật 15/07/2026; **không gán khu phố Metro Manila nào là HIGH** | [UK FCDO](https://www.gov.uk/foreign-travel-advice/philippines/safety-and-security) |

## 4. Địa điểm (OSM / nguồn chính thức)

- Tọa độ 70 địa điểm trong `locations.json` và 14 địa điểm trong `tourist.json` lấy trực tiếp từ [Nominatim / OpenStreetMap](https://nominatim.openstreetmap.org/) ngày 27/11/2026. Mỗi mục có link Nominatim tương ứng dùng để tra lại.
- Giờ mở cửa chỉ ghi khi có thẻ `opening_hours` trong OSM hoặc được công bố trên trang chính thức: [Araneta City](https://www.aranetacity.com/happening/mall-hours), [Greenhills](https://www.ortigasmalls.com/greenhills/), [Ayala Museum](https://ayalamuseum.org/), [National Museum](https://www.nationalmuseum.gov.ph/), [Rizal Park / NPDC](https://npdc.gov.ph/rizal-park/), [Intramuros](https://intramuros.gov.ph/fort-santiago/), [Greenfield](https://greenfield.com.ph/).
- Không có số điện thoại, giá sản phẩm hay điểm đánh giá nào được tạo ra. Các trường này để trống khi thiếu nguồn.
- Mâu thuẫn giờ mở cửa được giữ nguyên dạng ghi chú (ví dụ SM Araneta: OSM 10:00–24:00 so với giờ chung Araneta 10:00–21:00/22:00; Ayala Triangle: OSM 24/7 so với 06:00–22:00).

## 5. Thông tin còn cần FPTU / đối tác xác nhận

1. **Cổng vào chính xác của ký túc xá WCC** và địa chỉ riêng (nếu khác campus), kèm tọa độ thực tế.
2. Ga LRT-2 gần nhất tính từ **cổng ký túc** (hiện mới chỉ xác minh cho campus).
3. Số cửa ra tại ga MRT-3 Ayala phù hợp nhất để đi tới Robinsons Summit Center.
4. Tên và số điện thoại/email của **supervisor FPT Software** (website chỉ có số văn phòng chung).
5. Số hotline bảo hiểm du lịch/y tế của từng sinh viên (thông tin cá nhân, không nên đưa lên website công khai).
6. Giấy tờ OJT được chấp nhận: visa loại nào, có cần AEP/SWP/PWP hay không, xác nhận bằng văn bản từ DOLE/BI hoặc FPTU.
7. Lịch làm việc thực tế và ngày bắt đầu/kết thúc của 8 tuần (website dùng mô hình 40 ngày làm việc như giả định tính ngân sách).
8. Giờ mở cửa hiện hành của một số cửa hàng nhỏ gần WCC (OSM không gắn giờ hoặc thẻ đã cũ).

## 6. Giới hạn của dữ liệu

- Website không đưa ra chẩn đoán y khoa, tư vấn pháp lý cá nhân hay khuyến nghị né tránh cơ quan chức năng.
- Thông tin an toàn chỉ mô tả rủi ro theo tình huống, không gán nhãn cho người dân, nhóm dân cư hay khu phố.
- Dữ liệu có thể thay đổi. Trước khi đi: mở tab tương ứng, nhìn ngày cập nhật và nhấn link nguồn.
