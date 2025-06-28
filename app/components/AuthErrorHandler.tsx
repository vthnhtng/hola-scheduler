'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function AuthErrorHandler() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      switch (errorParam) {
        case 'invalid_credentials':
          setError('Tên đăng nhập hoặc mật khẩu không đúng');
          break;
        case 'insufficient_permissions':
          setError('Bạn không có quyền truy cập vào trang này');
          break;
        case 'server_error':
          setError('Lỗi server, vui lòng thử lại sau');
          break;
        case 'unauthorized':
          setError('Bạn cần đăng nhập để truy cập trang này');
          break;
        default:
          setError('Có lỗi xảy ra, vui lòng thử lại');
      }
    }
  }, [searchParams]);

  if (!error) return null;

  return (
    <div className="alert alert-danger alert-dismissible fade show" role="alert">
      <strong>Lỗi xác thực:</strong> {error}
      <button
        type="button"
        className="btn-close"
        onClick={() => setError(null)}
        aria-label="Close"
      ></button>
    </div>
  );
} 