# Hệ thống Authentication và Authorization

## Tổng quan

Hệ thống sử dụng **Basic Authentication** với **NextJS Middleware** để bảo vệ các route và API endpoints. Hệ thống hỗ trợ 2 loại quyền:

- **Scheduler**: Có quyền truy cập đầy đủ, bao gồm cả việc tạo lịch học
- **Viewer**: Chỉ có quyền xem dữ liệu

## Cấu trúc hệ thống

### 1. Middleware (`middleware.ts`)
- Xử lý authentication cho tất cả requests
- Kiểm tra Basic Auth header
- Phân quyền truy cập các route
- Redirect đến trang login nếu chưa đăng nhập

### 2. Authentication Library (`lib/auth.ts`)
- Hash password sử dụng SHA-256
- Verify Basic Authentication
- Kiểm tra quyền truy cập
- Tạo Basic Auth header

### 3. API Endpoints
- `/api/auth/login`: Đăng nhập
- `/api/auth/logout`: Đăng xuất
- `/api/users`: Quản lý users (chỉ scheduler)

### 4. React Context (`contexts/AuthContext.tsx`)
- Quản lý trạng thái đăng nhập
- Lưu trữ thông tin user
- Xử lý login/logout

### 5. Components
- `ProtectedRoute`: Bảo vệ các trang cần authentication
- `Header`: Hiển thị thông tin user và nút logout
- `SideBar`: Menu động dựa trên quyền user

## Cài đặt và sử dụng

### 1. Tạo users mặc định

```bash
npm run create-users
```

Sẽ tạo 3 users mặc định:
- **scheduler** / scheduler123 (Scheduler role)
- **viewer** / viewer123 (Viewer role)  
- **admin** / admin123 (Scheduler role)

### 2. Chạy ứng dụng

```bash
npm run dev
```

### 3. Đăng nhập

Truy cập `/login` và sử dụng credentials đã tạo.

## Phân quyền

### Routes được bảo vệ

#### Tất cả users (scheduler + viewer):
- `/timetable` - Xem lịch giảng dạy
- `/subjects` - Quản lý học phần
- `/lecturers` - Quản lý giảng viên
- `/locations` - Quản lý địa điểm
- `/curriculums` - Quản lý chương trình học
- `/teams` - Quản lý đại đội
- `/holidays` - Quản lý ngày nghỉ lễ
- `/calendar` - Xem lịch

#### Chỉ Scheduler:
- `/scheduler` - Trang tạo lịch học
- `/api/generate-schedules` - API tạo lịch
- `/api/export-schedule` - API xuất lịch
- `/users` - Quản lý users

### Routes công khai:
- `/` - Trang chủ
- `/login` - Trang đăng nhập
- `/api/auth/*` - API authentication

## Sử dụng trong code

### 1. Bảo vệ trang

```tsx
import ProtectedRoute from '../components/ProtectedRoute';

export default function MyPage() {
  return (
    <ProtectedRoute requiredRole="scheduler">
      <div>Nội dung chỉ dành cho scheduler</div>
    </ProtectedRoute>
  );
}
```

### 2. Kiểm tra quyền trong component

```tsx
import { usePermissions } from '../hooks/usePermissions';

function MyComponent() {
  const { isScheduler, canViewData } = usePermissions();

  return (
    <div>
      {isScheduler && <button>Tạo lịch học</button>}
      {canViewData && <div>Xem dữ liệu</div>}
    </div>
  );
}
```

### 3. Sử dụng AuthContext

```tsx
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, login, logout } = useAuth();

  const handleLogin = async () => {
    const success = await login('username', 'password');
    if (success) {
      // Redirect hoặc xử lý khác
    }
  };

  return (
    <div>
      {user ? (
        <div>Xin chào {user.fullName}</div>
      ) : (
        <button onClick={handleLogin}>Đăng nhập</button>
      )}
    </div>
  );
}
```

### 4. API với authentication

```tsx
// Tự động gửi Basic Auth header
const response = await fetch('/api/protected-endpoint', {
  headers: {
    'Authorization': localStorage.getItem('auth_token')
  }
});
```

## Bảo mật

### 1. Password Hashing
- Sử dụng SHA-256 để hash password
- Không lưu trữ password dạng plain text

### 2. Session Management
- Sử dụng localStorage để lưu Basic Auth token
- Token được tự động gửi trong mọi request
- Tự động logout khi token hết hạn

### 3. Route Protection
- Middleware kiểm tra authentication cho mọi request
- Redirect tự động đến trang login
- Phân quyền chi tiết cho từng route

### 4. API Security
- Tất cả API endpoints được bảo vệ
- Kiểm tra quyền truy cập dựa trên role
- Trả về lỗi 401/403 khi không có quyền

## Troubleshooting

### 1. Lỗi "Unauthorized"
- Kiểm tra username/password
- Đảm bảo user tồn tại trong database
- Kiểm tra role của user

### 2. Lỗi "Forbidden"
- User không có đủ quyền truy cập
- Cần quyền Scheduler cho một số tính năng

### 3. Không thể đăng nhập
- Chạy script tạo users: `npm run create-users`
- Kiểm tra database connection
- Xem logs trong console

### 4. Menu không hiển thị đúng
- Kiểm tra role của user trong database
- Refresh trang để cập nhật context
- Kiểm tra localStorage có token không

## Mở rộng

### 1. Thêm role mới
1. Cập nhật enum `Role` trong `schema.prisma`
2. Chạy migration: `npx prisma migrate dev`
3. Cập nhật logic phân quyền trong middleware
4. Cập nhật `usePermissions` hook

### 2. Thêm route bảo vệ
1. Thêm route vào `protectedRoutes` trong middleware
2. Tạo component với `ProtectedRoute`
3. Cập nhật SideBar nếu cần

### 3. Thay đổi authentication method
- Có thể thay thế Basic Auth bằng JWT
- Cập nhật `lib/auth.ts` và middleware
- Thay đổi cách lưu trữ token 