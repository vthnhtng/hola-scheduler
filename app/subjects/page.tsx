'use client';
import { useEffect, useState } from 'react';
import Header from '../components/Header';
import SideBar from '../components/SideBar';
import Grid from '../components/Grid';
import Footer from '../components/Footer';
import Pagination from '../components/Pagination';
import { ObjectAttribute } from '../types/ObjectAttribute';

interface Subject {
    id: number;
    name: string;
    category: string;
    prerequisite: string;
}

interface PaginationData {
    currentPage: number;
    totalPages: number;
    totalCount: number;
}

function SubjectsPage() {
    const subjectAttributes: ObjectAttribute[] = [
        { name: 'name', label: 'Tên môn học', type: 'string' },
        { name: 'category', label: 'Chuyên khoa', type: 'select', select_data: ['CT', 'QS'] },
        { name: 'prerequisiteId', label: 'Môn tiên quyết', type: 'number' }
    ];

    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<PaginationData>({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0
    });
    const [recordsPerPage, setRecordsPerPage] = useState<number>(10);

    const fetchSubjects = async (page: number = 1) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/subjects?page=${page}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            setSubjects(data.data);
            setPagination(data.pagination);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch subjects');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubjects();
    }, []);

    const handlePageChange = (page: number) => {
        fetchSubjects(page);
    };

    return (
        <>
            <Header />
            <main className="d-flex justify-content-between">
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
                            objectName="HỌC PHẦN"
                            attributes={subjectAttributes}
                            gridData={subjects}
                            formAction="/api/subjects"
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

export default SubjectsPage;
