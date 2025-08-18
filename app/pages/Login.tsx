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

  // Check if user is already logged in, then redirect
  useEffect(() => {
    if (user) {
      const redirectTo = searchParams.get('redirect') || '/';
      router.push(redirectTo);
    }
  }, [user, router, searchParams]);

  // Display error from URL params
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
      const result = await login(username, password);
      if (result.success) {
        const redirectTo = searchParams.get('redirect') || '/';
        router.push(redirectTo);
      } else {
        setError(result.error || 'Tên đăng nhập hoặc mật khẩu không đúng');
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
      <main className="container-fluid bg-light content d-flex align-items-center justify-content-center" style={{ minHeight: 'calc(100vh - 200px)', paddingTop: 40, paddingBottom: 40 }}>
          
        <div className="row justify-content-center w-100">
          <div className="col-md-4">
            <div className="card  card-container shadow-sm" style={{ minWidth: 350, maxWidth: 400, width: '100%' }}>
              <h4 className="text-center fw-bold fs-3 text-white p-3 bg-[#49bf67] w-100"  >Đăng nhập</h4>
              
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              
              <form className='p-4' onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="username" className="form-label font-bold">Tên truy cập</label>
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
                  <label htmlFor="password" className="form-label font-bold">Mật khẩu</label>
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

                <button 
                  type="submit" 
                  className="btn bg-[#49bf67] border-t-green-400 w-100 mb-2 text-white hover:bg-[#379e51]"

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
