# Khắc phục vấn đề Browser Authentication Prompt

## Vấn đề

Khi truy cập API endpoints trực tiếp hoặc khi có lỗi authentication, browser hiển thị popup authentication prompt thay vì sử dụng page login của ứng dụng.

## Nguyên nhân

### 1. WWW-Authenticate Header
Khi server trả về response với status 401 và header `WWW-Authenticate: Basic realm="Secure Area"`, browser sẽ tự động hiển thị popup authentication prompt.

### 2. Code gây ra vấn đề

**Trước khi sửa:**
```typescript
// middleware.ts
return NextResponse.json(
  { error: 'Unauthorized' },
  { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' } }
);

// app/api/auth/login/route.ts
return NextResponse.json(
  { error: 'Authorization header required' },
  { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' } }
);
```

**Sau khi sửa:**
```typescript
// middleware.ts
return NextResponse.json(
  { error: 'Unauthorized' },
  { status: 401 }
);

// app/api/auth/login/route.ts
return NextResponse.json(
  { error: 'Authorization header required' },
  { status: 401 }
);
```

## Giải pháp đã implement

### 1. Loại bỏ WWW-Authenticate headers
- Xóa tất cả `WWW-Authenticate` headers khỏi middleware
- Xóa tất cả `WWW-Authenticate` headers khỏi API endpoints
- Chỉ trả về JSON error response

### 2. Đảm bảo page login hoạt động đúng
- Page login vẫn sử dụng form React bình thường
- AuthContext xử lý authentication
- Middleware cho phép page navigation tiếp tục

### 3. Client-side authentication handling
- ProtectedRoute component kiểm tra authentication
- Tự động redirect đến page login khi cần
- Hiển thị error messages thông qua AuthErrorHandler

## Cách hoạt động mới

### 1. Khi truy cập trang được bảo vệ:
```
User → Protected Route → Check Auth → Redirect to /login
```

### 2. Khi gọi API không có authentication:
```
API Call → Middleware → 401 JSON Response → Client handles error
```

### 3. Khi đăng nhập:
```
Login Form → AuthContext → API Call → Success → Redirect
```

## Testing

### 1. Test page login:
- Truy cập `/login`
- Điền thông tin đăng nhập
- Xác nhận redirect thành công

### 2. Test API access:
- Truy cập trực tiếp `/api/users` (không đăng nhập)
- Xác nhận không có browser prompt
- Xác nhận nhận được JSON error

### 3. Test navigation:
- Đăng nhập thành công
- Navigate giữa các trang
- Xác nhận không bị logout

## Lợi ích

✅ **Không có browser authentication prompt**
✅ **Sử dụng page login của ứng dụng**
✅ **UX nhất quán**
✅ **Error handling tốt hơn**
✅ **Bảo mật vẫn được đảm bảo**

## Lưu ý

- **WWW-Authenticate header** chỉ nên sử dụng khi muốn browser hiển thị popup authentication
- **Trong ứng dụng web**, nên sử dụng custom login page thay vì browser prompt
- **API endpoints** nên trả về JSON error thay vì WWW-Authenticate header 