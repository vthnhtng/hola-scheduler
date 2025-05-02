'use client';
import { useEffect, useState } from 'react';
import Header from '../components/Header';
import SideBar from '../components/SideBar';
import Grid from '../components/Grid';
import Footer from '../components/Footer';
import Pagination from '../components/Pagination';
import { ObjectAttribute } from '../types/ObjectAttribute';
import avatar from '../assets/avatar/avatar.jpg';

interface Curriculum {
    id: number;
    program: string;
}

interface PaginationData {
    currentPage: number;
    totalPages: number;
    totalCount: number;
}

function CurriculumsPage() {
    const curriculumAttributes: ObjectAttribute[] = [
        { name: 'program', label: 'Chương trình', type: 'string' },
    ];

    const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<PaginationData>({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0
    });
    const [recordsPerPage, setRecordsPerPage] = useState<number>(10);

    const fetchCurriculums = async (page: number = 1) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/curriculums?page=${page}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            setCurriculums(data.data);
            setPagination(data.pagination);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch curriculums');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCurriculums();
    }, []);

    const handlePageChange = (page: number) => {
        fetchCurriculums(page);
    };

    return (
        <>
            <Header />
            <main className="d-flex justify-content-between">
                <SideBar />
                {loading ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ flex: 1 }}>
                        <div className="spinner-border" role="status" style={{ width: '3rem', height: '3rem' }}>
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : error ? (
                    <p className="text-danger">{error}</p>
                ) : (
                    <div className="d-flex flex-column justify-content-center align-items-center" style={{ flex: 1 }}>
                        <Grid
                            objectName="CHƯƠNG TRÌNH"
                            attributes={curriculumAttributes}
                            gridData={curriculums}
                            formAction="/api/curriculums"
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

export default CurriculumsPage;
