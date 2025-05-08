'use client';
import { useEffect, useState } from 'react';
import Header from '../components/Header';
import SideBar from '../components/SideBar';
import Grid from '../components/Grid';
import Footer from '../components/Footer';
import { ObjectAttribute } from '../types/object-attribute';

interface Curriculum {
    id: number;
    program: string;
}

function CurriculumsPage() {
    const curriculumAttributes: ObjectAttribute[] = [
        { name: 'program', label: 'Chương trình', type: 'string' },
    ];

    const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchCurriculums() {
            try {
                const response = await fetch('/api/curriculums');
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data: Curriculum[] = await response.json();
                setCurriculums(data);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch curriculums');
            } finally {
                setLoading(false);
            }
        }

        fetchCurriculums();
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
                        objectName='CHƯƠNG TRÌNH'
                        attributes={curriculumAttributes}
                        gridData={curriculums}
                        formAction='/api/curriculums'
                    />
                )}
            </main>
            <Footer />
        </>
    )
}

export default CurriculumsPage;
