'use client';
import { useEffect, useState } from 'react';
import Header from '../components/Header';
import SideBar from '../components/SideBar';
import Grid from '../components/Grid';
import Footer from '../components/Footer';
import { ObjectAttribute } from '../types/object-attribute';
import Pagination from '../components/Pagination';

interface Lecturer {
    id: number;
    fullName: string;
    faculty: string;
    maxSessionsPerWeek: number;
}

interface PaginationData {
    currentPage: number;
    totalPages: number;
    totalCount: number;
}

function LecturersPage() {
    const faculties = [
        {value: 'CT', label: 'Chính trị'},
        {value: 'QS', label: 'Quân sự'}
    ];
    const lecturerAttributes: ObjectAttribute[] = [
        { name: 'fullName', label: 'Họ và tên', type: 'string' },
        { name: 'faculty', label: 'Chuyên khoa', type: 'select', selections: faculties },
        { name: 'maxSessionsPerWeek', label: 'Số lớp tối đa', type: 'number' }
    ];

    const [lecturers, setLecturers] = useState<Lecturer[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<PaginationData>({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0
    });
    const [recordsPerPage, setRecordsPerPage] = useState<number>(10);

    const fetchLecturers = async (page: number = 1) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/lecturers?page=${page}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            setLecturers(data.data);
            setPagination(data.pagination);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch lecturers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLecturers();
    }, []);

    const handlePageChange = (page: number) => {
        fetchLecturers(page);
    };

    return (
        <>
            <Header />
            <main className="d-flex justify-content-between" style={{ minHeight: '100vh' }}>
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
                            objectName="GIẢNG VIÊN"
                            attributes={lecturerAttributes}
                            gridData={lecturers}
                            formAction="/api/lecturers"
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
    )
}

export default LecturersPage;