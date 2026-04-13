## Tên đề tài

Xây dựng hệ thống quản lý tài chính cá nhân thông minh tích hợp AI/NLP

## Thành viên nhóm

- Trần Phan Hoàng Triều

## Mô tả chức năng hệ thống

Hệ thống web quản lý tài chính cá nhân, gồm:

- **Auth**: đăng ký / đăng nhập (và đăng xuất)
- **Thu/chi**: thêm/sửa/xoá giao dịch + **phân loại danh mục**
- **Thống kê**: tổng thu / tổng chi / số dư + **biểu đồ thu/chi**
- **AI/NLP**:
  - Nhập giao dịch bằng ngôn ngữ tự nhiên (ví dụ: “Hôm nay chi 50k ăn sáng”)
  - Chatbot hỏi đáp tài chính dựa trên dữ liệu giao dịch (OpenAI/Gemini)

Stack triển khai:

- **Frontend**: React (Vite)
- **Backend API**: Node.js (Express + TypeScript)
- **Database**: MySQL

## Hướng dẫn chạy project

### Yêu cầu môi trường

- Node.js: LTS (khuyến nghị 18+ hoặc 20+)
- MySQL: 8.x

### Chạy Backend (Node.js)

Tại thư mục `backend/`:

```bash
npm install
npm run dev
```

### Chạy Frontend (React)

Tại thư mục `frontend/`:

```bash
npm install
npm run dev
```

Mở web: `http://localhost:5173`
