'use client';
import { useEffect, useState } from 'react';
import Header from '../components/Header';
import SideBar from '../components/SideBar';
import Footer from '../components/Footer';
import { ObjectAttribute } from '../types/object-attribute';
import Pagination from '../components/Pagination';
import FormModal from '../components/FormModal';
import DeleteModal from '../components/DeleteModal';
import GridRow from '../components/GridRow';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import DynamicRows from '../components/DynamicRows';

interface Location {
    id: number;
    name: string;
    capacity: number;
}

interface PaginationData {
    currentPage: number;
    totalPages: number;
    totalCount: number;
}

function LocationsPage() {
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);
    const [selectedRow, setSelectedRow] = useState<number | null>(null);

    const faculties = [
        { value: 'CT', label: 'Chính trị' },
        { value: 'QS', label: 'Quân sự' }
    ];

    const locationAttributes: ObjectAttribute[] = [
        { name: 'name', label: 'Tên địa điểm', type: 'string' },
        { name: 'capacity', label: 'Sức chứa', type: 'number' }
    ];

    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<PaginationData>({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0
    });

    const fetchLocations = async (page: number, limit: number) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/locations?page=${page}&limit=${limit}`);
            if (!response.ok) {
                throw new Error(response.statusText);
            }
            const data = await response.json();
            setLocations(data.data);
            setPagination(data.pagination);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch locations');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLocations(page, limit);
    }, []);

    const changePage = (page: number) => {
        fetchLocations(page, limit);
    };

    const handleClickAction = (index: number) => {
        setSelectedRow((prev) => (prev === index ? null : index));
    };

    return (
        <>
            <Header />
            <main className="d-flex justify-content-start align-items-start" style={{ minHeight: '100vh' }}>
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
                        <div className="d-flex flex-column" style={{ width: 'calc(100% - 20px)', marginLeft: "20px" }}>
                            <div className="d-flex justify-content-between align-items-center mb-3 mt-3">
                                <h2 className="fw-bold text-uppercase">DANH SÁCH ĐỊA ĐIỂM</h2>
                                <div className="d-flex gap-2" style={{ marginRight: "20px" }}>
                                    <FormModal
                                        title={'THÊM ĐỊA ĐIỂM'}
                                        button={
                                        <button className="btn btn-success text-uppercase d-flex align-items-center justify-content-center">
                                            THÊM ĐỊA ĐIỂM
                                        </button>}
                                        attributes={locationAttributes}
                                        record={null}
                                        formAction={'/api/locations'}
                                        formMethod='POST'
                                    />
                                </div>
                            </div>
                            <div
                                className="d-flex flex-column"
                                style={{
                                    width: 'calc(100% - 20px)',
                                    marginLeft: "20px"
                                }}
                            >
                                <table className="table table-hover">
                                    <thead className="table-light">
                                        <tr>
                                            <th>STT</th>
                                            {locationAttributes.map((attribute, index) => (
                                                <th key={index}>{attribute.label}</th>
                                            ))}
                                            <th>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {locations.length > 0 ? (
                                            locations.map((location, index) =>
                                                location && (
                                                    <GridRow
                                                        key={index + (pagination.currentPage - 1) * 10}
                                                        attributes={locationAttributes}
                                                        record={location}
                                                        index={index + (pagination.currentPage - 1) * 10}
                                                        actions={[
                                                        <div>
                                                            <FormModal
                                                                title={'CHỈNH SỬA ĐỊA ĐIỂM'}
                                                                button={<button className="btn btn-outline-success me-2" onClick={() => handleClickAction(index)}><FaEdit /></button>}
                                                                attributes={locationAttributes}
                                                                record={location}
                                                                formAction={'/api/locations'}
                                                                formMethod='PUT'
                                                            />
                                                        </div>,
                                                        <div>
                                                            <DeleteModal
                                                                title={'ĐỊA ĐIỂM'}
                                                                button={<button className="btn btn-outline-danger" onClick={() => handleClickAction(index)}><FaTrashAlt /></button>}
                                                                record={location}
                                                                onClose={() => {}}
                                                                formAction={'/api/locations'}
                                                            />
                                                        </div>
                                                        ]}
                                                    />
                                                )
                                            )
                                        ) : (
                                            <tr>
                                                <td colSpan={locationAttributes.length + 2} className="text-left">Chưa có dữ liệu</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="d-flex justify-content-center align-items-center">
                            <Pagination
                                currentPage={pagination.currentPage}
                                totalPages={pagination.totalPages}
                                onPageChange={changePage}
                            />
                        </div>
                    </div>
                )}
            </main>
            <Footer />
        </>
    )
}

export default LocationsPage;