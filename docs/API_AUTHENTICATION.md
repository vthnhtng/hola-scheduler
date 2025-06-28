# API Authentication với Basic Auth

Hệ thống sử dụng Basic Authentication để xác thực các API calls. Token được lưu trữ ở phía client và tự động gửi kèm trong mọi request.

## Cấu trúc

### 1. AuthContext (`app/contexts/AuthContext.tsx`)
Quản lý trạng thái authentication và cung cấp các utility functions:

```typescript
const { user, authToken, login, logout, getAuthHeaders, createAuthenticatedRequest } = useAuth();
```

**Properties:**
- `user`: Thông tin user hiện tại
- `authToken`: Basic authentication token (dạng `Basic base64(username:password)`)
- `isLoading`: Trạng thái loading
- `login()`: Đăng nhập và lưu token
- `logout()`: Đăng xuất và xóa token
- `getAuthHeaders()`: Lấy headers cho API calls
- `createAuthenticatedRequest()`: Tạo request với authentication

### 2. API Utilities (`lib/api.ts`)
Cung cấp các functions để thực hiện API calls với authentication:

```typescript
import { 
  authenticatedGet, 
  authenticatedPost, 
  authenticatedPut, 
  authenticatedDelete,
  getAuthToken,
  getAuthHeaders 
} from '@/lib/api';
```

**Functions:**
- `getAuthToken()`: Lấy token từ localStorage
- `getAuthHeaders()`: Lấy headers cho API calls
- `authenticatedGet(url)`: GET request với auth
- `authenticatedPost(url, data)`: POST request với auth
- `authenticatedPut(url, data)`: PUT request với auth
- `authenticatedDelete(url)`: DELETE request với auth
- `isAuthError(response)`: Kiểm tra lỗi authentication
- `handleAuthError()`: Xử lý lỗi authentication
- `apiCall(fetchFn)`: Wrapper với error handling

### 3. Custom Hooks (`hooks/useApi.ts`)
Cung cấp React hooks để dễ dàng sử dụng API:

```typescript
import { useApi, useApiCall } from '@/hooks/useApi';
```

**useApi Hook:**
```typescript
const { data, loading, error, get, post, put, del, reset } = useApi<User[]>();

// Sử dụng
await get('/api/users');
await post('/api/users', newUser);
await put('/api/users/1', updatedUser);
await del('/api/users/1');
```

**useApiCall Hook:**
```typescript
const { data, loading, error, execute, reset } = useApiCall<User[]>('/api/users', 'GET');

// Sử dụng
await execute();
```

## Cách sử dụng

### 1. Sử dụng AuthContext trực tiếp

```typescript
import { useAuth } from '@/app/contexts/AuthContext';

function MyComponent() {
  const { user, authToken, getAuthHeaders } = useAuth();

  const fetchData = async () => {
    const response = await fetch('/api/users', {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });
    
    const data = await response.json();
  };

  return (
    <div>
      <p>User: {user?.username}</p>
      <p>Token: {authToken ? 'Available' : 'Not available'}</p>
    </div>
  );
}
```

### 2. Sử dụng API Utilities

```typescript
import { authenticatedGet, authenticatedPost } from '@/lib/api';

const fetchUsers = async () => {
  try {
    const response = await authenticatedGet('/api/users');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch users:', error);
  }
};

const createUser = async (userData) => {
  try {
    const response = await authenticatedPost('/api/users', userData);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to create user:', error);
  }
};
```

### 3. Sử dụng Custom Hooks

```typescript
import { useApi } from '@/hooks/useApi';

function UsersList() {
  const { data, loading, error, get, post } = useApi();

  useEffect(() => {
    get('/api/users');
  }, []);

  const handleCreateUser = async () => {
    await post('/api/users', {
      username: 'newuser',
      password: 'password123',
      fullName: 'New User',
      email: 'new@example.com',
      role: 'viewer'
    });
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {data?.map(user => (
        <div key={user.id}>{user.username}</div>
      ))}
      <button onClick={handleCreateUser}>Create User</button>
    </div>
  );
}
```

## Token Storage

Token được lưu trữ trong:
- **localStorage**: `auth_token` - Basic authentication header
- **AuthContext state**: `authToken` - Để truy cập nhanh

Format token: `Basic base64(username:password)`

## Error Handling

### Authentication Errors
Khi gặp lỗi 401 (Unauthorized) hoặc 403 (Forbidden):
1. Token bị xóa khỏi localStorage
2. User được redirect về trang login
3. Hiển thị thông báo lỗi

### API Error Handling
```typescript
import { apiCall, isAuthError, handleAuthError } from '@/lib/api';

const fetchData = async () => {
  try {
    const data = await apiCall(() => authenticatedGet('/api/users'));
    return data;
  } catch (error) {
    if (isAuthError(error)) {
      handleAuthError();
    } else {
      console.error('API Error:', error);
    }
  }
};
```

## Security Considerations

### 1. Token Storage
- Token được lưu trong localStorage (có thể bị XSS attack)
- Trong production, nên cân nhắc sử dụng httpOnly cookies

### 2. Token Expiration
- Hiện tại token không có expiration
- Nên implement token refresh mechanism

### 3. HTTPS
- Luôn sử dụng HTTPS trong production
- Basic auth gửi credentials dưới dạng base64 (không mã hóa)

### 4. CORS
- Đảm bảo CORS được cấu hình đúng
- Chỉ cho phép các domain được tin cậy

## Middleware Integration

Token được xử lý bởi middleware (`middleware.ts`):
1. Kiểm tra Authorization header
2. Verify Basic authentication
3. Set user info vào request headers
4. Forward request đến API route

## Example Implementation

Xem file `examples/ApiUsageExample.tsx` để có ví dụ đầy đủ về cách sử dụng hệ thống authentication này. 