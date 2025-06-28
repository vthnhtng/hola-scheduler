'use client';
import Header from './components/Header';
import SideBar from './components/SideBar';
import Footer from './components/Footer';
import AuthErrorHandler from './components/AuthErrorHandler';
import { useRouter } from 'next/navigation';

export default function HomePage() {
	const router = useRouter();

	return (
		<>
			<Header />
			<main className="d-flex justify-content-between align-items-start bg-light" style={{ minHeight: '70vh' }}>
				<SideBar />
				<section className="flex-grow-1 p-4">
					<div className="container">
						<AuthErrorHandler />
						<h2 className="fw-bold text-uppercase">HỆ THỐNG SẮP XẾP LỊCH GIẢNG DẠY TỰ ĐỘNG</h2>
						<p className="lead">
							Nền tảng hỗ trợ sắp xếp lịch học thông minh cho các trường học, trung tâm đào tạo và tổ chức giáo dục.
						</p>

						<div className="row mt-5">
							<div className="col-md-4 d-flex align-items-stretch">
								<div className="card shadow-sm mb-4 h-100">
									<div className="card-body">
										<h5 className="card-title text-success">Tự động tối ưu lịch học</h5>
										<p className="card-text">
											Hệ thống sử dụng thuật toán để sắp xếp lịch học tối ưu theo yêu cầu và giới hạn thời gian.
										</p>
									</div>
								</div>
							</div>

							<div className="col-md-4 d-flex align-items-stretch">
								<div className="card shadow-sm mb-4 h-100">
									<div className="card-body">
										<h5 className="card-title text-info">Giao diện trực quan</h5>
										<p className="card-text">
											Thiết kế thân thiện giúp người dùng, các mô-đun tách biệt dễ dàng thao tác và theo dõi.
										</p>
									</div>
								</div>
							</div>

							<div className="col-md-4 d-flex align-items-stretch">
								<div className="card shadow-sm mb-4 h-100">
									<div className="card-body">
										<h5 className="card-title text-warning">Khả năng tùy chỉnh</h5>
										<p className="card-text">
											Hệ thống cho phép tùy chỉnh kiểm ngày nghỉ lễ, dữ liệu học viên, giảng viên và lớp học từ hệ thống bên ngoài.
										</p>
									</div>
								</div>
							</div>
						</div>

						<div className="text-center mt-5">
							<button
								className="btn btn-primary btn-lg"
								onClick={() => router.push('/timetable')}
							>
								Bắt đầu sử dụng
							</button>
						</div>
					</div>
				</section>
			</main>
			<Footer />
		</>
	);
}
