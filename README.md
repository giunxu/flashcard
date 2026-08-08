# English For Kids

App học tiếng Anh cho bé chạy local bằng FastAPI và Tailwind.

## Tính năng

- Hơn 1000 từ và cụm từ thông dụng.
- Giao diện flashcard mobile-first, dùng tốt trên điện thoại portrait và iPad.
- Bấm vào thẻ để nghe phát âm tiếng Anh.
- Quẹt trái/phải hoặc bấm nút để đổi từ.
- Phụ huynh có thể dán link ảnh hoặc upload ảnh riêng cho từng từ.
- Nút "Tìm Google" mở nhanh Google Images cho từ hiện tại.
- Đã import link ảnh cho toàn bộ từ trong `data/image_overrides.json`.

## Import ảnh tự động

```powershell
.\.venv\Scripts\python.exe .\scripts\import_wikimedia_images.py
```

Script ưu tiên Wikipedia/Wikimedia. Từ nào chưa có ảnh rõ sẽ dùng link LoremFlickr theo keyword để vẫn có hình cho flashcard.

## Chạy server

```powershell
.\scripts\start_server.ps1
```

Mở trên máy tính:

```text
http://localhost:8000
```

Mở trên iPad hoặc điện thoại cùng Wi-Fi:

```text
http://IP-CUA-MAY-TINH:8000
```

Xem IP của máy tính bằng:

```powershell
ipconfig
```

## Tự động bật server khi bật máy

Chạy một lần:

```powershell
.\scripts\install_autostart.ps1
```

Windows sẽ tạo tác vụ "English For Kids Local Server". Nếu Windows chặn quyền tạo tác vụ, script sẽ tạo file trong Startup folder để vẫn tự chạy server khi bạn đăng nhập.

## Chạy kiểu Cloudflare Pages + Supabase

App đã có thể chạy như static site. Dữ liệu chung cho mọi thiết bị nằm trong Supabase.

### 1. Tạo Supabase

1. Tạo project trên Supabase.
2. Vào SQL Editor, chạy file `supabase/schema.sql`.
3. Chạy tiếp file `supabase/seed_words.sql` để nhập 1135 từ.
4. Vào Project Settings > API, lấy `Project URL` và `anon public key`.
5. Sửa `static/supabase-config.js`:

```js
window.ENGLISH_FOR_KIDS_SUPABASE = {
  url: "https://YOUR-PROJECT.supabase.co",
  anonKey: "YOUR-ANON-KEY",
  table: "words",
  bucket: "word-images",
};
```

### 2. Deploy Cloudflare Pages

Nếu dùng GitHub integration:

- Build command: `exit 0`
- Build output directory: `static`

Nếu dùng drag-and-drop:

- Upload nguyên thư mục `static`.

Sau khi deploy, mọi thiết bị truy cập cùng link Cloudflare Pages sẽ thấy cùng dữ liệu Supabase.

### Lưu ý bảo mật

App hiện dùng Supabase Auth và RLS:

- Chưa đăng nhập: xem thử 15 từ đầu.
- Free user: học 100 từ đầu.
- Paid user: học toàn bộ từ.
- Admin: học toàn bộ, sửa/thêm/xóa từ, upload ảnh.

Admin mặc định: `trungvietnguyen0@gmail.com`.

Nếu Supabase project đã được tạo từ bản cũ, chạy thêm:

```text
supabase/auth_roles_migration.sql
```

Nếu tạo project mới từ đầu, chỉ cần chạy:

```text
supabase/schema.sql
supabase/seed_words.sql
```

### Gán paid user thủ công

1. Vào Supabase > Table Editor > `profiles`.
2. Tìm email user.
3. Đổi cột `role` thành `paid`.

Role hợp lệ: `free`, `paid`, `admin`.

### Bật Google Login

1. Vào Supabase > Authentication > Providers.
2. Bật Google provider.
3. Tạo OAuth Client trong Google Cloud Console.
4. Dán Client ID và Client Secret vào Supabase.
5. Trong Google OAuth Authorized redirect URI, thêm callback URL mà Supabase hiển thị trong trang Google provider.

Email/password login dùng được ngay sau khi bật Auth mặc định của Supabase.

### Upload ảnh

Chỉ admin thấy panel sửa nội dung. Ảnh upload sẽ được crop giữa và ép về vuông `700x700px` bằng browser canvas, sau đó upload lên Supabase Storage bucket `word-images`.

### Cấu hình giọng đọc

Admin có thể chỉnh tốc độ và âm lượng trong panel quản trị. Cấu hình được lưu vào bảng `app_settings` trên Supabase, nên mọi thiết bị sẽ dùng cùng tốc độ/âm lượng đọc.
