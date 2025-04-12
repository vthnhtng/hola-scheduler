'use client';
import { useEffect, useState } from 'react';
import Header from '../components/Header';
import SideBar from '../components/SideBar';
import Grid from '../components/Grid';
import Footer from '../components/Footer';
import { ObjectAttribute } from '../types/ObjectAttribute';
import avatar from '../assets/avatar/avatar.jpg';

// khoiphamhuy25 - Change attribute name to match the API response - 13/04/2025
interface Lecturer {
    id: number;
    fullName: string;
    faculty: string;
    maxSessionsPerWeek: number;
}

function LecturersPage() {
    const lecturerAttributes: ObjectAttribute[] = [
        { name: 'fullName', label: 'Họ và tên', type: 'string' },
        { name: 'faculty', label: 'Chuyên khoa', type: 'select', select_data: ['CT', 'QS'] },
        { name: 'maxSessionsPerWeek', label: 'Số lớp tối đa', type: 'number' }
    ];

    const [lecturers, setLecturers] = useState<Lecturer[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchLecturers() {
            try {
                const response = await fetch('/api/lecturers');
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data: Lecturer[] = await response.json();
                setLecturers(data);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch lecturers');
            } finally {
                setLoading(false);
            }
        }

        fetchLecturers();
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
                        objectName='GIẢNG VIÊN'
                        attributes={lecturerAttributes}
                        gridData={lecturers}
                        formAction='/api/lecturers'
                    />
                )}
            </main>
            <Footer />
        </>
    )
}

export default LecturersPage;
