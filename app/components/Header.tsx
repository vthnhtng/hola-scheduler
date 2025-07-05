'use client';
import logo from '../assets/logo/VNU_GDQPAN_Logo.png';
import { FiLogOut } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';

function Header() {
	const { user, logout, isLoading } = useAuth();
	const router = useRouter();

	const handleLogout = async () => {
		try {
			await logout();
			router.push('/login');
		} catch (error) {
			console.error('Logout error:', error);
		}
	};

	return (
		<header
			className="d-flex justify-content-between align-items-center px-4"
			style={{
				width: '100%',
				height: '150px',
				backgroundColor: '#d3d3d3',
				borderBottom: '25px solid #87BD66'
			}}
		>
			<div className="d-flex align-items-center gap-3"
				style={{
					minWidth: '80%'
				}}
			>
				<div style={{ width: '100px' }}>
					<img
						src={logo.src}
						alt="GDQPAN Logo"
						style={{ width: '100%' }}
					/>
				</div>
				<h1 className="mb-0 fw-bold fs-3">CỔNG SẮP XẾP LỊCH GIẢNG DẠY TỰ ĐỘNG</h1>
			</div>

			<div className="d-flex align-items-center">
				{isLoading ? (
					<span className="me-2">Đang kiểm tra...</span>
				) : user ? (
					<>
						<span className="me-2">{user.fullName}</span>
						<span>|</span>
						<button 
							className="btn btn-link text-dark d-flex align-items-center gap-2 text-decoration-none"
							onClick={handleLogout}
						>
							Đăng xuất <FiLogOut />
						</button>
					</>
				) : (
					<>
						<span className="me-2">Chưa đăng nhập</span>
						<span>|</span>
						<button 
							className="btn btn-link text-dark d-flex align-items-center gap-2 text-decoration-none"
							onClick={() => router.push('/login')}
						>
							Đăng nhập
						</button>
					</>
				)}
			</div>
		</header>
	);
}

export default Header;
