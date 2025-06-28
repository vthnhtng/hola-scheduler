# Khắc phục vấn đề đăng nhập lại khi navigate

## Vấn đề ban đầu

Khi navigate giữa các trang trong ứng dụng, người dùng phải đăng nhập lại. Nguyên nhân:

1. **Middleware không nhận được Authorization header** khi navigate giữa các trang React
2. **Browser navigation không gửi custom headers** như Authorization
3. **AuthContext chỉ verify token khi component mount**, không verify khi navigate

## Giải pháp đã implement

### 1. Tạo API endpoint verify riêng biệt

**File:** `app/api/auth/verify/route.ts`
```typescript
// Endpoint để verify authentication mà không cần middleware
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const user = await verifyBasicAuth(authHeader);
  // Trả về user info nếu valid
}
```

### 2. Cập nhật AuthContext

**File:** `app/contexts/AuthContext.tsx`
```typescript
// Sử dụng endpoint verify mới
const response = await fetch('/api/auth/verify', {
  method: 'GET',
  headers: { 'Authorization': storedToken },
});
```

### 3. Cải thiện Middleware

**File:** `middleware.ts`
```typescript
// Cho phép page navigation tiếp tục, để client-side handle
if (!authHeader) {
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  } else {
    return NextResponse.next(); // Cho phép tiếp tục
  }
}
```

### 4. Tạo ProtectedRoute component

**File:** `app/components/ProtectedRoute.tsx`
```typescript
// Kiểm tra authentication ở client-side
useEffect(() => {
  if (!user || !authToken) {
    router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
  }
}, [user, authToken, pathname]);
```

### 5. Tạo useAuthNavigation hook

**File:** `hooks/useAuthNavigation.ts`
```typescript
// Hook để handle navigation với authentication
export function useAuthNavigation() {
  // Kiểm tra route có cần auth không
  // Redirect nếu cần thiết
}
```

## Cách hoạt động mới

### 1. Khi user đăng nhập:
- Token được lưu vào localStorage
- AuthContext state được cập nhật
- User được redirect đến trang đích

### 2. Khi navigate giữa các trang:
- Middleware cho phép navigation tiếp tục
- ProtectedRoute component kiểm tra authentication
- Nếu chưa đăng nhập → redirect đến login
- Nếu đã đăng nhập → hiển thị trang

### 3. Khi gọi API:
- Middleware kiểm tra Authorization header
- Nếu không có → trả về 401
- Nếu có → verify và forward request

## Cách sử dụng

### 1. Wrap trang với ProtectedRoute:
```typescript
import ProtectedRoute from '../components/ProtectedRoute';

function MyPage() {
  return (
    <ProtectedRoute>
      <div>Nội dung trang</div>
    </ProtectedRoute>
  );
}
```

### 2. Sử dụng useAuthNavigation hook:
```typescript
import { useAuthNavigation } from '@/hooks/useAuthNavigation';

function MyComponent() {
  const { isAuthenticated, hasSchedulerRole } = useAuthNavigation();
  // Hook sẽ tự động handle navigation
}
```

### 3. Hiển thị thông báo lỗi:
```typescript
import AuthErrorHandler from './components/AuthErrorHandler';

function MyPage() {
  return (
    <div>
      <AuthErrorHandler />
      <div>Nội dung trang</div>
    </div>
  );
}
```

## Lợi ích

✅ **Không cần đăng nhập lại** khi navigate giữa các trang
✅ **Bảo mật vẫn được đảm bảo** cho API calls
✅ **UX tốt hơn** với loading states và error handling
✅ **Flexible** - có thể customize cho từng trang
✅ **Maintainable** - code rõ ràng, dễ bảo trì

## Testing

Để test giải pháp:

1. Đăng nhập vào hệ thống
2. Navigate giữa các trang khác nhau
3. Refresh trang
4. Mở tab mới và truy cập trực tiếp URL
5. Kiểm tra API calls vẫn hoạt động

Tất cả các trường hợp trên đều phải giữ được trạng thái đăng nhập. 