'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const { login, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Kiểm tra nếu user đã đăng nhập thì redirect
  useEffect(() => {
    if (user) {
      const redirectTo = searchParams.get('redirect') || '/';
      router.push(redirectTo);
    }
  }, [user, router, searchParams]);

  // Hiển thị error từ URL params
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
        default:
          setError('Có lỗi xảy ra, vui lòng thử lại');
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(username, password);
      
      if (success) {
        const redirectTo = searchParams.get('redirect') || '/';
        router.push(redirectTo);
      } else {
        setError('Tên đăng nhập hoặc mật khẩu không đúng');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="container-fluid bg-light content">
        <div className="row justify-content-center mt-5">
          <div className="col-md-4">
            <div className="card p-4 card-container shadow-sm">
              <h4 className="text-center mb-4">Đăng nhập</h4>
              
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="username" className="form-label">Tên truy cập</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    id="username" 
                    placeholder="Nhập tên truy cập"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Mật khẩu</label>
                  <input 
                    type="password" 
                    className="form-control" 
                    id="password" 
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <small className="text-muted">
                    Mật khẩu phải bao gồm tối thiểu 8 ký tự bao gồm chữ cái, số và ký hiệu.
                  </small>
                </div>
                
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="form-check">
                    <input 
                      type="checkbox" 
                      className="form-check-input" 
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={isLoading}
                    />
                    <label className="form-check-label" htmlFor="rememberMe">
                      Ghi nhớ tôi
                    </label>
                  </div>
                  <a href="#" className="text-success">Quên mật khẩu?</a>
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-dark w-100 mb-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Đang đăng nhập...
                    </>
                  ) : (
                    'Đăng nhập'
                  )}
                </button>
                
                <div className="text-center mt-3">
                  <a href="#" className="text-success">Chưa có tài khoản? Đăng ký</a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default Login;
