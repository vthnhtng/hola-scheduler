'use client';
import { useEffect, useState } from 'react';
import Header from '../components/Header';
import SideBar from '../components/SideBar';
import Grid from '../components/Grid';
import Footer from '../components/Footer';
import { ObjectAttribute } from '../types/ObjectAttribute';

interface User {
    id: number;
    username: string;
    fullName: string;
    email: string;
    role: string;
    password: string;
}

function UsersPage() {
    const userAttributes: ObjectAttribute[] = [
        { name: 'username', label: 'Tên đăng nhập', type: 'string' },
        { name: 'fullName', label: 'Họ tên', type: 'string' },
        { name: 'email', label: 'Email', type: 'string' },
        { name: 'role', label: 'Vai trò', type: 'string' },
        { name: 'password', label: 'Mật khẩu', type: 'string' },
    ];

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchUsers() {
            try {
                const response = await fetch('/api/users');
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data: User[] = await response.json();
                setUsers(data);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch users');
            } finally {
                setLoading(false);
            }
        }

        fetchUsers();
    }, []);

    return (
        <>
            <Header />
            <main className='d-flex justify-content-between'>
                <SideBar />
                {loading ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ flex: 1 }}>
                        <div className="spinner-border" style={{ width: '3rem', height: '3rem' }} role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : error ? (
                    <p>Error: {error}</p>
                ) : (
                    <Grid
                        objectName='NGƯỜI DÙNG'
                        attributes={userAttributes}
                        gridData={users}
                        formAction='/api/users'
                    />
                )}
            </main>
            <Footer />
        </>
    );
}

export default UsersPage;
