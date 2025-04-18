'use client';
import { useEffect, useState } from 'react';
import Header from '../components/Header';
import SideBar from '../components/SideBar';
import Grid from '../components/Grid';
import Footer from '../components/Footer';
import { ObjectAttribute } from '../types/ObjectAttribute';

interface Team {
    id: number;
    name: string;
    program: string;
}

function TeamsPage() {
    const teamAttributes: ObjectAttribute[] = [
        { name: 'name', label: 'Tên', type: 'string' },
        { name: 'program', label: 'Chương trình', type: 'string' },
    ];

    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchTeams() {
            try {
                const response = await fetch('/api/teams');
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data: Team[] = await response.json();
                setTeams(data);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch teams');
            } finally {
                setLoading(false);
            }
        }

        fetchTeams();
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
                        objectName='ĐỘI'
                        attributes={teamAttributes}
                        gridData={teams}
                        formAction='/api/teams'
                    />
                )}
            </main>
            <Footer />
        </>
    )
}

export default TeamsPage;
