# NexusPort App

## Chạy ứng dụng

1. Chạy backend Express và database của `NexusPort-Backend-Website`.
2. `npm install`, sau đó `npm run web` trong repo này.
3. Mặc định API ở `http://localhost:3001`. Để đổi, copy `.env.example` thành `.env.local`, sửa `EXPO_PUBLIC_API_URL` rồi khởi động lại Expo. Khi chạy trên điện thoại thật, dùng IP LAN của máy chạy backend.
4. Nếu trước đây đã đặt AsyncStorage key `api_base_url`, giá trị đó được ưu tiên hơn biến môi trường. Xóa key này khi muốn dùng cấu hình `.env.local`.

Các lệnh khởi động dùng `scripts/expo.cjs` để bỏ HTTP metadata cache của Expo SDK 54, tránh lỗi `Body is unusable: Body has already been read` khi cache không ghi/đọc được. Metro vẫn giữ cache và app vẫn gọi backend bình thường. Không cần sửa `node_modules` hoặc cài lại thư viện. Nếu không kết nối được dịch vụ Expo, dùng `npm run web:offline`; chế độ này chỉ bỏ các request của công cụ Expo, không tắt request backend trong app.

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

## Smart Route (NXP-114)

Chạy Node Core tại `http://localhost:4000` cùng database PostgreSQL và các migration Smart Route; cấu hình `EXPO_PUBLIC_NODE_CORE_URL` trong `.env.local` (điện thoại thật dùng IP LAN). AsyncStorage `node_core_base_url` được ưu tiên nếu có. Các request dùng JWT phiên đăng nhập hiện tại; Node Core xác định hồ sơ Driver qua `drivers.user_id`.

Mở **Smart Route** từ trang chủ hoặc **Booking → container → Smart Route**. Tuyến luôn được giới hạn theo booking và container; sau khi Gate xác nhận xe qua cổng, app lấy Operation Order và Yard Location qua `/api/v1/drivers/me/routes`. Sơ đồ hiển thị đường nội bộ, các Block/Slot, sức chứa ô, tuyến khả dụng và khu vực hạn chế/ùn tắc. Đây là bản đồ bãi theo mốc xác nhận, không phải định vị GPS.

Driver xác nhận **đã đến điểm giao nhận** qua endpoint `progress`, chờ Yard hoàn tất Operation Order, rồi xác nhận tình trạng container qua `confirm-container` (`OK`, `DAMAGED`, `ISSUE`, ghi chú tối đa 1.000 ký tự). App chuyển sang tuyến đến cổng ra khi backend xác nhận toàn bộ booking đủ điều kiện. Gate In / Gate Out do nhân viên cổng xác nhận; Driver không tự thay đổi hai trạng thái này. Điều độ theo dõi cùng trạng thái từ backend.

Màn hình tải lại mỗi 15 giây, khi app hoạt động trở lại và khi nhận sự kiện Yard/Dispatcher từ Node Core. Khi điểm đến, điều kiện đường hoặc phiên bản bản đồ thay đổi, app hiển thị tuyến mới; nếu không có tuyến khả dụng sẽ hiện thông báo từ backend. Lỗi kết nối tắt thao tác xác nhận và ẩn tuyến cũ cho đến khi tải lại thành công. Dữ liệu bản đồ thiếu hoặc hết hạn không được thay bằng tuyến GPS giả định.

## Kiểm tra

```sh
npm run test:auth
npm run test:bookings
npm run test:smart-route
npx tsc --noEmit
npx expo export --platform web
```

Các test auth dùng HTTP/storage giả lập để kiểm tra hợp đồng và các tình huống lỗi, không tạo hoặc sửa tài khoản trong database.
