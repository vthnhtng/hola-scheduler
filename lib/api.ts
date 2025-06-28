/**
 * API utility functions for making authenticated requests
 */

/**
 * Lấy Basic authentication token từ localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
}

/**
 * Tạo Basic authentication header
 */
export function createAuthHeader(username: string, password: string): string {
  const credentials = `${username}:${password}`;
  const base64Credentials = btoa(credentials);
  return `Basic ${base64Credentials}`;
}

/**
 * Lấy authentication headers cho API calls
 */
export function getAuthHeaders(): { Authorization: string } | {} {
  const token = getAuthToken();
  if (token) {
    return { Authorization: token };
  }
  return {};
}

/**
 * Tạo authenticated fetch request
 */
export async function authenticatedFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Tạo authenticated GET request
 */
export async function authenticatedGet(url: string): Promise<Response> {
  return authenticatedFetch(url, { method: 'GET' });
}

/**
 * Tạo authenticated POST request
 */
export async function authenticatedPost(
  url: string, 
  data?: any
): Promise<Response> {
  return authenticatedFetch(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Tạo authenticated PUT request
 */
export async function authenticatedPut(
  url: string, 
  data?: any
): Promise<Response> {
  return authenticatedFetch(url, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Tạo authenticated DELETE request
 */
export async function authenticatedDelete(url: string): Promise<Response> {
  return authenticatedFetch(url, { method: 'DELETE' });
}

/**
 * Kiểm tra xem response có lỗi authentication không
 */
export function isAuthError(response: Response): boolean {
  return response.status === 401 || response.status === 403;
}

/**
 * Xử lý authentication error
 */
export function handleAuthError(): void {
  // Xóa token và redirect về login
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    window.location.href = '/login?error=invalid_credentials';
  }
}

/**
 * Wrapper cho API calls với error handling
 */
export async function apiCall<T>(
  fetchFn: () => Promise<Response>
): Promise<T> {
  try {
    const response = await fetchFn();
    
    if (isAuthError(response)) {
      handleAuthError();
      throw new Error('Authentication failed');
    }
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
} 