# Demo Driver: nhận booking và lịch hẹn

## Chuẩn bị

- Chạy Express ở cổng 3001; website dùng C# ở cổng 5000 để tạo và duyệt booking như hiện tại.
- Sau khi đổi source, khởi động lại backend Express nếu không dùng nodemon, rồi reload app `npm run web`.
- Database đã có migration `20261017_014`: liên kết tài khoản với tài xế và thông báo booking.
- `tiendriver` đã liên kết đúng hồ sơ Nguyễn Đình Tiến, GPLX `012345678900`, công ty Bien Dong Logistics - Nexus Logistics. Hồ sơ trùng GPLX `012345678901` đã được xóa theo yêu cầu; tài khoản và booking được giữ nguyên.

## Cấp tài khoản đúng quy trình

1. Công ty vận tải thêm hồ sơ tài xế trong đội xe.
2. Admin mở Quản lý tài khoản → Tạo tài khoản → chọn Driver.
3. Chọn công ty vận tải, sau đó chọn hồ sơ thuộc công ty đó. Kiểm tra GPLX để phân biệt người trùng tên.
4. Lưu một lần. Backend kiểm tra công ty/hồ sơ, chặn hồ sơ đã có tài khoản và lưu tài khoản cùng liên kết trong một transaction.
5. Chỉnh sửa tài khoản hoặc Gán vai trò Driver cũng dùng cùng lựa chọn và kiểm tra này.

## Trình diễn

1. Đăng nhập app bằng `tiendriver`; giữ app mở.
2. Bên công ty vận tải tạo booking, chọn đúng hồ sơ Nguyễn Đình Tiến GPLX `012345678900` và xe phù hợp.
3. Sau khoảng 8 giây, app có thông báo booking mới; vào **Booking được giao** để xem mã booking, xe, container, hàng hóa và giờ đề xuất. Trạng thái là **Chờ duyệt**.
4. Dispatcher duyệt booking trên website.
5. App nhận thông báo **Booking đã được duyệt**, booking đổi trạng thái và xuất hiện trong **Lịch hẹn**. Chạm lịch hoặc thông báo để mở cùng trang chi tiết.
6. Nếu chưa thấy thay đổi, kéo xuống để tải lại. Kiểm tra backend đã chạy source mới và tài xế được chọn đúng hồ sơ.

Booking hiện có của `tiendriver`: `BK-E50809A35061430A`, xe `47K1-137.87`, đã duyệt, một container. Có thể dùng để demo xem chi tiết/lịch; tạo booking mới để demo từ bước chờ duyệt.

## Bước tiếp theo đề xuất

Booking duyệt → kiểm tra thanh toán/điều kiện sẵn sàng → tài xế xác nhận nhận việc → hiển thị e-Pass đúng booking → Gate In → đi đến bãi → xác nhận giao/nhận container → Gate Out → lịch sử/EIR.

Luồng chuyến xe Express và booking C# hiện là hai nguồn riêng. Bước tiếp theo cần dùng booking ID làm liên kết xuyên suốt, tạo/cập nhật chuyến từ booking đã đủ điều kiện; không coi một booking đã duyệt tự động là một chuyến xe đã được tạo.
