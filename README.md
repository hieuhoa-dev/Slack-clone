
**Quy trình làm việc với Git (theo video hướng dẫn)**

1. **Nếu chưa có dự án trên máy:**

   ```bash
   git clone <link_dự_án>
   ```

2. **Tạo nhánh mới cho phần việc của bạn (dựa theo timeline của video):**

   ```bash
   git checkout -b <tên_nhánh_theo_video>
   # Ví dụ: git checkout -b project-setup
   ```

3. **Làm xong phần việc được giao → lưu thay đổi:**

   ```bash
   git add .
   git commit -sm "tên_commit_theo_video"
   git push -u origin <tên_nhánh>
    # Ví dụ: git commit -sm "Project setup"
   ```

4. **Khi hoàn thành tính năng:**

    * Báo cho nhóm trưởng
    * **Không** làm tiếp tính năng khác khi chưa được giao

5. **Đồng bộ lại với nhánh `main` trước khi làm việc tiếp:**

   ```bash
   git checkout main
   git pull
   ```

6. **Nếu gặp lỗi:** báo ngay cho `Hòa`.

7. **Nếu gặp chưa rõ có thể vào link để xem thêm:**
- [Hướng dẫn sử dụng Git](https://youtu.be/-VmX40r5ARI)
---