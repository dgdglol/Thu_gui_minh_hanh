# Thư Gửi Minh Hạnh 💌

Trang web giao diện vintage giấy viết thư ấm áp (Warm Sepia / Reading Mode), hỗ trợ đọc thư, hồi âm tương tác và xuất file HTML.

## 📁 Cấu trúc thư mục

- `index.html`: Giao diện chính của bức thư.
- `styles.css`: Bộ stylesheet định dạng giao diện vintage, theme giấy viết thư.
- `script.js`: Logic tương tác (đổi nền giấy, cỡ chữ, hiệu ứng hồi âm, bot chibi...).
- `Thu_Gui_Minh_Hanh.html`: Bản xuất gộp độc lập (HTML + CSS + JS trong 1 file).
- `bot_chibi.jpg` & `bot_chibi_face.jpg`: Ảnh minh họa bot chibi đồng hành.

---

## 🚀 Cách chạy dự án trên máy

### Cách 1: Mở trực tiếp (Nhanh nhất)
- Nhấp đúp chuột vào file `index.html` (hoặc chuột phải chọn **Open with** -> **Google Chrome / Microsoft Edge / Cốc Cốc**).

### Cách 2: Chạy bằng Python Local Server
Mở terminal tại thư mục này và chạy:
```bash
python -m http.server 3000
```
Sau đó mở trình duyệt và truy cập: `http://localhost:3000`

### Cách 3: Chạy bằng Node.js / npx serve
```bash
npx serve .
```

### Cách 4: Dùng Visual Studio Code
- Cài extension **Live Server**.
- Chuột phải vào `index.html` -> chọn **Open with Live Server**.
