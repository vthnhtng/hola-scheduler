'use client';
import { useEffect, useState } from 'react';
import Header from '../components/Header';
import SideBar from '../components/SideBar';
import Grid from '../components/Grid';
import Footer from '../components/Footer';
import { ObjectAttribute } from '../types/object-attribute';
import { DataProviderFactory } from '@/model/factory/DataProviderFactory';

interface Subject {
    id: number;
    name: string;
    category: string;
    prerequisiteId: number;
}

function SubjectsPage() {
    const subjectDataProvider = DataProviderFactory.getInstance().getSubjectDataProvider();
    const categories = subjectDataProvider.getCategories();
    const [prerequisites, setPrerequisites] = useState<{ value: string; label: string }[]>([]);
    const subjectAttributes: ObjectAttribute[] = [
        { name: 'name', label: 'Tên môn học', type: 'string' },
        { name: 'category', label: 'Chuyên khoa', type: 'select', selections: categories },
        { name: 'prerequisiteId', label: 'Môn tiên quyết', type: 'select', selections: prerequisites }
    ];

    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchPrerequisites() {
            const prerequisites = await subjectDataProvider.getPrerequisites();
            setPrerequisites(prerequisites);
        }

        async function fetchSubjects() {
            try {
                const response = await fetch('/api/subjects');
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data: Subject[] = await response.json();
                setSubjects(data);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch subjects');
            } finally {
                setLoading(false);
            }
        }

        fetchSubjects();
        fetchPrerequisites();
    }, [subjectDataProvider]);

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
                        objectName='MÔN HỌC'
                        attributes={subjectAttributes}
                        gridData={subjects}
                        formAction='/api/subjects'
                    />
                )}
            </main>
            <Footer />
        </>
    )
}

export default SubjectsPage;
