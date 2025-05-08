'use client';
import { useEffect, useState } from 'react';
import Header from '../components/Header';
import SideBar from '../components/SideBar';
import Grid from '../components/Grid';
import Footer from '../components/Footer';
import { ObjectAttribute } from '../types/object-attribute';

interface Team {
    id: number;
    name: string;
    program: string;
}

interface PaginationData {
    currentPage: number;
    totalPages: number;
    totalCount: number;
}

function TeamsPage() {
    const teamAttributes: ObjectAttribute[] = [
        { name: 'name', label: 'Tên', type: 'string' },
        { name: 'program', label: 'Chương trình', type: 'string' },
    ];

    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<PaginationData>({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0
    });

    const fetchTeams = async (page: number = 1) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/teams?page=${page}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            setTeams(data.data);
            setPagination(data.pagination);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch teams');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeams();
    }, []);

    const handlePageChange = (page: number) => {
        fetchTeams(page);
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
                            objectName="ĐẠI ĐỘI"
                            attributes={teamAttributes}
                            gridData={teams}
                            formAction="/api/teams"
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

export default TeamsPage;