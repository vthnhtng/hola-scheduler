'use client';
import { useEffect, useState } from 'react';
import Header from '../components/Header';
import SideBar from '../components/SideBar';
import Grid from '../components/Grid';
import { ObjectAttribute } from '../types/ObjectAttribute';
import avatar from '../assets/avatar/avatar.jpg';

interface Lecturer {
    lecturer_id: number;
    full_name: string;
    faculty: string;
    max_sessions_per_week: number;
}

function LecturersPage() {
    const lecturerAttributes: ObjectAttribute[] = [
        { name: 'full_name', label: 'Họ và tên', type: 'string' },
        { name: 'faculty', label: 'Chuyên khoa', type: 'string' },
        { name: 'max_sessions_per_week', label: 'Số lớp tối đa', type: 'number' }
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

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <>
            <Header />
            <main className='d-flex justify-content-between'>
                <SideBar />
                <Grid
                    objectName='GIẢNG VIÊN'
                    attributes={lecturerAttributes}
                    gridData={lecturers}
                    formAction='/api/lecturers'
                />
            </main>
        </>
    )
}

export default LecturersPage;
