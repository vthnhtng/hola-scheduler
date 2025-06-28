'use client';
import { useEffect, useState } from 'react';
import Header from '../components/Header';
import SideBar from '../components/SideBar';
import Grid from '../components/Grid';
import Footer from '../components/Footer';
import Pagination from '../components/Pagination';
import { ObjectAttribute } from '../types/ObjectAttribute';
import FormModal from '../components/FormModal';
import DeleteModal from '../components/DeleteModal';
import GridRow from '../components/GridRow';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import ProtectedRoute from '../components/ProtectedRoute';

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
    const [selectedRow, setSelectedRow] = useState<number | null>(null);

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

    const handleClickAction = (index: number) => {
        setSelectedRow((prev) => (prev === index ? null : index));
    };

    return (
        <ProtectedRoute>
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
                        <div className="d-flex flex-column" style={{ width: 'calc(100% - 20px)', marginLeft: "20px" }}>
                            <div className="d-flex justify-content-between align-items-center mb-3 mt-3">
                                <h2 className="fw-bold text-uppercase">DANH SÁCH NGƯỜI DÙNG</h2>
                                <div className="d-flex gap-2" style={{ marginRight: "20px" }}>
                                    {/* User creation disabled - only administrators can create users */}
                                </div>
                            </div>
                            <div className="d-flex flex-column" style={{ width: 'calc(100% - 20px)', marginLeft: "20px" }}>
                                <table className="table table-hover">
                                    <thead className="table-light">
                                        <tr>
                                            <th>STT</th>
                                            {userAttributes.map((attribute, index) => (
                                                <th key={index}>{attribute.label}</th>
                                            ))}
                                            <th>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.length > 0 ? (
                                            <>
                                                {users.map((user, index) =>
                                                    user && (
                                                        <GridRow
                                                            key={index + (pagination.currentPage - 1) * 10}
                                                            attributes={userAttributes}
                                                            record={user}
                                                            index={index + (pagination.currentPage - 1) * 10}
                                                            actions={[
                                                                <div key="edit">
                                                                    <FormModal
                                                                        title={'CHỈNH SỬA NGƯỜI DÙNG'}
                                                                        button={<button className="btn btn-outline-success me-2" onClick={() => handleClickAction(index)}><FaEdit /></button>}
                                                                        attributes={userAttributes}
                                                                        record={user}
                                                                        formAction={'/api/users'}
                                                                        formMethod='PUT'
                                                                    />
                                                                </div>,
                                                                <div key="delete">
                                                                    <DeleteModal
                                                                        title={'NGƯỜI DÙNG'}
                                                                        button={<button className="btn btn-outline-danger" onClick={() => handleClickAction(index)}><FaTrashAlt /></button>}
                                                                        record={user}
                                                                        onClose={() => {}}
                                                                        formAction={'/api/users'}
                                                                    />
                                                                </div>
                                                            ]}
                                                        />
                                                    )
                                                )}
                                                {/* Padding rows nếu chưa đủ 10 dòng */}
                                                {Array.from({ length: 10 - users.length }).map((_, padIdx) => (
                                                    <GridRow
                                                        key={`pad-${padIdx}`}
                                                        attributes={userAttributes}
                                                        record={{}}
                                                        index={users.length + padIdx}
                                                        actions={[]}
                                                    />
                                                ))}
                                            </>
                                        ) : (
                                            <tr>
                                                <td colSpan={userAttributes.length + 2} className="text-left">Chưa có dữ liệu</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="d-flex justify-content-center align-items-center">
                            <Pagination
                                currentPage={pagination.currentPage}
                                totalPages={pagination.totalPages}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    </div>
                )}
            </main>
            <Footer />
        </ProtectedRoute>
    );
}

export default UsersPage;