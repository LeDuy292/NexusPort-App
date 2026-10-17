# NexusPort App

## Chạy ứng dụng

1. Chạy backend Express và database của `NexusPort-Backend-Website`.
2. `npm install`, sau đó `npm run web` trong repo này.
3. Mặc định API ở `http://localhost:3001`. Để đổi, copy `.env.example` thành `.env.local`, sửa `EXPO_PUBLIC_API_URL` rồi khởi động lại Expo. Khi chạy trên điện thoại thật, dùng IP LAN của máy chạy backend.
4. Nếu trước đây đã đặt AsyncStorage key `api_base_url`, giá trị đó được ưu tiên hơn biến môi trường. Xóa key này khi muốn dùng cấu hình `.env.local`.

## Cấu trúc

```text
app/                         # Expo Router: màn hình và khai báo route
src/
  config/api.ts              # Một nơi cấu hình địa chỉ backend
  lib/apiClient.ts           # HTTP, JWT, timeout, lỗi và sự kiện hết phiên
  features/
    auth/
      types.ts               # Kiểu user và session
      roles.ts               # Vai trò được hỗ trợ và route tương ứng
      sessionStorage.ts      # Lưu, đọc, xóa phiên; loại bỏ phiên demo cũ
      authService.ts         # API đăng nhập và khôi phục phiên
      AuthProvider.tsx       # Trạng thái phiên dùng chung trong React
    driver/
      services/              # API chuyến xe và Socket.IO
    bookings/
      types.ts               # Booking, container, thông báo và hồ sơ tài xế
      bookingService.ts      # API booking được giao và thông báo
      BookingProvider.tsx    # Dữ liệu chung, tự cập nhật khi app mở
      bookingPresentation.ts # Nhãn trạng thái và định dạng thời gian
      components/            # Card booking, thông báo và các khối dùng chung
tests/                       # Kiểm tra hợp đồng HTTP và vòng đời phiên
```

Thêm tính năng mới dưới `src/features/<tên>/`; đặt API trong `services/`, xử lý state/tải dữ liệu trong `hooks/`, giao diện dùng lại trong `components/`. Các request HTTP đi qua `src/lib/apiClient.ts`. Không tự cấp role, hardcode token hay lưu mật khẩu trên client.

## Đăng nhập thật

- `POST /api/auth/login`: gửi username/email và password; lưu JWT cùng thông tin user do backend trả về. Mật khẩu không được lưu.
- `GET /api/auth/me`: kiểm tra phiên khi mở/reload app. Lỗi mạng cho phép thử lại; token hết hạn hoặc tài khoản bị khóa sẽ yêu cầu đăng nhập lại.
- Quyền truy cập route được kiểm tra bằng `Stack.Protected`; backend tiếp tục kiểm tra quyền và quyền sở hữu dữ liệu.
- App hỗ trợ Driver, Gate Officer, Yard Operator và Berth Staff (dùng giao diện Yard hiện có). Các role quản trị/nhà vận chuyển sử dụng website. Chọn vai trò khác với tài khoản thật sẽ bị từ chối.
- Phiên giả lập cũ không có JWT sẽ được xóa. Cần đăng nhập lại bằng tài khoản thật do admin cấp.
- Trang chủ Driver dùng booking được giao, thông báo và lịch hẹn thật. Lịch sử chuyến mở danh sách chuyến đã hoàn thành. Các API tự giới hạn dữ liệu theo tài khoản đăng nhập.

## Luồng demo booking

Xem [hướng dẫn demo](docs/driver-booking-demo.md). Backend cần migration `20261017_014_driver_booking_feed.sql` (đã áp dụng trên database đang kết nối). Khi thay source backend, khởi động lại Express nếu không dùng nodemon.

Admin cấp Driver theo thứ tự: chọn vai trò → chọn công ty vận tải → chọn hồ sơ tài xế của công ty → lưu tài khoản. Tài khoản và liên kết được lưu trong một transaction. Công ty quản lý hồ sơ trong `drivers`, tài khoản nằm trong `users`, liên kết qua `drivers.user_id`; công ty của Driver được xác định từ hồ sơ, không suy đoán theo tên hoặc gán thêm membership nhà vận chuyển.

App gọi `/api/driver-bookings/feed` mỗi 8 giây khi đang mở. Thông báo được lưu tại backend và phát sinh từ booking được phân công, duyệt, đổi lịch hoặc hủy/từ chối. Chạm thông báo mở đúng chi tiết booking. Lịch hẹn chỉ hiển thị booking đã duyệt/sẵn sàng. Thông báo đẩy khi đóng app chưa nằm trong phạm vi này.

## Phạm vi dữ liệu

Đăng nhập, danh tính, booking được giao, chi tiết hàng/xe, thông báo, lịch hẹn, API chuyến xe và điều hướng Yard đã nối backend. Các màn hình QR check-in, tra cứu container và nghiệp vụ Gate/Yard còn dữ liệu mẫu; cần tích hợp API riêng trước khi sử dụng nghiệp vụ thật.

## Kiểm tra

```sh
npm run test:auth
npx tsc --noEmit
npx expo export --platform web
```

Các test auth dùng HTTP/storage giả lập để kiểm tra hợp đồng và các tình huống lỗi, không tạo hoặc sửa tài khoản trong database.
