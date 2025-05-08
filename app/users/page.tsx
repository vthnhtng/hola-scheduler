'use client';
import { useEffect, useState } from 'react';
import Header from '../components/Header';
import SideBar from '../components/SideBar';
import Grid from '../components/Grid';
import Footer from '../components/Footer';
import Pagination from '../components/Pagination';
import { ObjectAttribute } from '../types/ObjectAttribute';

interface User {
    id: number;
    username: string;
    fullName: string;
    email: string;
    role: string;
    password: string;
}

interface PaginationData {
    currentPage: number;
    totalPages: number;
    totalCount: number;
}

function UsersPage() {
    const userAttributes: ObjectAttribute[] = [
        { name: 'username', label: 'Tên đăng nhập', type: 'string' },
        { name: 'fullName', label: 'Họ tên', type: 'string' },
        { name: 'email', label: 'Email', type: 'string' },
        { name: 'role', label: 'Vai trò', type: 'string' },
        { name: 'password', label: 'Mật khẩu', type: 'password' }
    ];

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [pagination, setPagination] = useState<PaginationData>({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0
    });

    const fetchUsers = async (page: number = 1) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/users?page=${page}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            setUsers(data.data);
            setPagination(data.pagination);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handlePageChange = (page: number) => {
        fetchUsers(page);
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <>
            <Header />
            <main className="d-flex justify-content-between align-items-start" style={{ minHeight: '70vh' }}>
                <SideBar />
                {loading ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ flex: 1 }}>
                        <div className="spinner-border" style={{ width: '3rem', height: '3rem' }} role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : error ? (
                    <p className="text-danger">Error: {error}</p>
                ) : (
                    <div className="d-flex flex-column justify-content-center align-items-center" style={{ flex: 1 }}>
                        <Grid
                            objectName="NGƯỜI DÙNG"
                            attributes={userAttributes}
                            gridData={users}
                            formAction="/api/users"
                            showPassword={showPassword}
                            togglePasswordVisibility={togglePasswordVisibility}
                            page={pagination.currentPage}
                        />
                        <Pagination
                            currentPage={pagination.currentPage}
                            totalPages={pagination.totalPages}
                            onPageChange={handlePageChange}
                        />
                    </div>
                )}
            </main>
            <Footer />
        </>
    );
}

export default UsersPage;