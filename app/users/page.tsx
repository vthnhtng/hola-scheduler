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
import { usePermissions } from '../hooks/usePermissions';
import LoadingOverlay from '../components/LoadingOverlay';

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
    const roleOptions = [
        { value: 'scheduler', label: 'Người lập lịch' },
        { value: 'viewer', label: 'Người xem' }
    ];

    const userAttributes: ObjectAttribute[] = [
        { name: 'username', label: 'Tên đăng nhập', type: 'string' },
        { name: 'fullName', label: 'Họ tên', type: 'string' },
        { name: 'email', label: 'Email', type: 'string' },
        { name: 'role', label: 'Vai trò', type: 'select', selections: roleOptions },
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
    const [editUser, setEditUser] = useState<User | null>(null);
    const [deleteUser, setDeleteUser] = useState<User | null>(null);
    const { isScheduler, userRole } = usePermissions();
    const [isLoading, setIsLoading] = useState(false);

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
        console.log('User role:', userRole, 'isScheduler:', isScheduler);
    }, [userRole, isScheduler]);

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
        <>
            <Header />
            <main className="d-flex justify-content-start align-items-start" style={{ minHeight: '100vh' }}>
                <SideBar />
                <LoadingOverlay show={loading} text="Đang tải dữ liệu..." />
                {(!loading && error) ? (
                    <p className="text-danger">Error: {error}</p>
                ) : (!loading && (
                    <div className="d-flex flex-column justify-content-center align-items-center" style={{ flex: 1 }}>
                        <div className="d-flex flex-column" style={{ width: 'calc(100% - 20px)', marginLeft: "20px" }}>
                            <div className="d-flex justify-content-between align-items-center mb-3 mt-3">
                                <h2 className="page-title" style={{ fontSize: '2rem' }}>DANH SÁCH NGƯỜI DÙNG</h2>
                                <div className="d-flex gap-2" style={{ marginRight: "20px" }}>
                                    {isScheduler ? (
                                        <FormModal
                                            title={'THÊM NGƯỜI DÙNG'}
                                            button={
                                                <button className="btn btn-success text-uppercase d-flex align-items-center justify-content-center">
                                                    THÊM NGƯỜI DÙNG
                                                </button>
                                            }
                                            attributes={userAttributes}
                                            record={null}
                                            formAction={'/api/users'}
                                            formMethod='POST'
                                            onLoadingChange={setIsLoading}
                                        />
                                    ) : (
                                        <button 
                                            className="btn btn-success text-uppercase d-flex align-items-center justify-content-center" 
                                            disabled
                                            style={{ pointerEvents: 'none', opacity: 0.6 }}
                                        >
                                            THÊM NGƯỜI DÙNG
                                        </button>
                                    )}
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
                                                            record={{ ...user, _showPlainPassword: true }}
                                                            index={index + (pagination.currentPage - 1) * 10}
                                                            actions={isScheduler ? [
                                                                <button
                                                                    key="edit"
                                                                    className="btn btn-outline-success me-2 d-flex align-items-center justify-content-center"
                                                                    style={{ minWidth: 40, height: 40, borderRadius: 8, fontSize: 18, padding: 0 }}
                                                                    onClick={() => setEditUser(user)}
                                                                >
                                                                    <FaEdit />
                                                                </button>,
                                                                <button
                                                                    key="delete"
                                                                    className="btn btn-outline-danger d-flex align-items-center justify-content-center"
                                                                    style={{ minWidth: 40, height: 40, borderRadius: 8, fontSize: 18, padding: 0 }}
                                                                    onClick={() => setDeleteUser(user)}
                                                                >
                                                                    <FaTrashAlt />
                                                                </button>
                                                            ] : [
                                                                <button
                                                                    key="edit"
                                                                    className="btn btn-outline-success me-2 d-flex align-items-center justify-content-center"
                                                                    style={{ minWidth: 40, height: 40, borderRadius: 8, fontSize: 18, padding: 0, pointerEvents: 'none', opacity: 0.4 }}
                                                                    disabled
                                                                >
                                                                    <FaEdit />
                                                                </button>,
                                                                <button
                                                                    key="delete"
                                                                    className="btn btn-outline-danger d-flex align-items-center justify-content-center"
                                                                    style={{ minWidth: 40, height: 40, borderRadius: 8, fontSize: 18, padding: 0, pointerEvents: 'none', opacity: 0.4 }}
                                                                    disabled
                                                                >
                                                                    <FaTrashAlt />
                                                                </button>
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
                        {/* Modal sửa user */}
                        {editUser && (
                            <FormModal
                                title={'SỬA NGƯỜI DÙNG'}
                                button={<></>}
                                attributes={userAttributes}
                                record={editUser}
                                formAction={'/api/users'}
                                formMethod='PUT'
                                onLoadingChange={setIsLoading}
                                show={!!editUser}
                                onClose={() => setEditUser(null)}
                            />
                        )}
                        {/* Modal xóa user */}
                        {deleteUser && (
                            <DeleteModal
                                title={'NGƯỜI DÙNG'}
                                button={<></>}
                                record={deleteUser}
                                onClose={() => setDeleteUser(null)}
                                formAction={'/api/users'}
                                show={Boolean(deleteUser)}
                            />
                        )}
                        <LoadingOverlay show={isLoading} text="Đang cập nhật dữ liệu..." />
                    </div>
                ))}
            </main>
            <Footer />
        </>
    );
}

export default UsersPage;