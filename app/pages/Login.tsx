'use client';

import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

function Login() {
  return (
    <>
      <Header />
      <main className="container-fluid bg-light content">
        {/* Header Section */}
        <div className="row justify-content-center mt-5">
          <div className="col-md-4">
            <div className="card p-4 card-container shadow-sm">
              <h4 className="text-center">Đăng nhập</h4>
              <form>
                <div className="mb-3">
                  <label htmlFor="username" className="form-label">Tên truy cập</label>
                  <input type="text" className="form-control" id="username" placeholder="Nhập tên truy cập" />
                </div>
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Mật khẩu</label>
                  <input type="password" className="form-control" id="password" placeholder="Nhập mật khẩu" />
                  <small className="text-muted">
                    Mật khẩu phải bao gồm tối thiểu 8 ký tự bao gồm chữ cái, số và ký hiệu.
                  </small>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="form-check">
                    <input type="checkbox" className="form-check-input" id="rememberMe" />
                    <label className="form-check-label" htmlFor="rememberMe">Ghi nhớ tôi</label>
                  </div>
                  <a href="#" className="text-success">Quên mật khẩu?</a>
                </div>
                <button type="submit" className="btn btn-dark w-100 mb-2">Đăng nhập</button>
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
