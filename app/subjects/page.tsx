'use client';
import { useEffect, useState } from 'react';
import Header from '../components/Header';
import SideBar from '../components/SideBar';
import Grid from '../components/Grid';
import Footer from '../components/Footer';
import { ObjectAttribute } from '../types/object-attribute';
import { SubjectSelectionsProvider } from '@/model/service/subject-selections-provider';
interface Subject {
    id: number;
    name: string;
    category: string;
    prerequisiteId: number;
}

function SubjectsPage() {
    const subjectSelectionsProvider = SubjectSelectionsProvider.getInstance();

    const [prerequisiteMappings, setPrerequisiteMappings] = useState<{ value: string; label: string }[]>([]);
    const subjectAttributes: ObjectAttribute[] = [
        { name: 'name', label: 'Tên môn học', type: 'string' },
        { name: 'category', label: 'Chuyên khoa', type: 'select', selections: subjectSelectionsProvider.getCategoryMappings() },
        { name: 'prerequisiteId', label: 'Môn tiên quyết', type: 'select', selections: prerequisiteMappings }
    ];

    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchPrerequisiteMappings() {
            const prerequisites = await subjectSelectionsProvider.getPrerequisiteMappings();
            setPrerequisiteMappings(prerequisites);
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
        fetchPrerequisiteMappings();
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
