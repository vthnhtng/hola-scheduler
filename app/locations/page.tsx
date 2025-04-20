'use client';
import { useEffect, useState } from 'react';
import Header from '../components/Header';
import SideBar from '../components/SideBar';
import Grid from '../components/Grid';
import Footer from '../components/Footer';
import { ObjectAttribute } from '../types/object-attribute';

interface Location {
    id: number;
    name: string;
    capacity: number;
}

function LocationsPage() {
    const locationAttributes: ObjectAttribute[] = [
        { name: 'name', label: 'Tên', type: 'string' },
        { name: 'capacity', label: 'Sức chứa', type: 'number' },
    ];

    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchLocations() {
            try {
                const response = await fetch('/api/locations');
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data: Location[] = await response.json();
                setLocations(data);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch locations');
            } finally {
                setLoading(false);
            }
        }

        fetchLocations();
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
                        objectName='ĐỊA ĐIỂM HỌC TẬP'
                        attributes={locationAttributes}
                        gridData={locations}
                        formAction='/api/locations'
                    />
                )}
            </main>
            <Footer />
        </>
    )
}

export default LocationsPage;
