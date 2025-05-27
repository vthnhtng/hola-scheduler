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
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);
    const [selectedRow, setSelectedRow] = useState<number | null>(null);

    const faculties = [
        { value: 'CT', label: 'Chính trị' },
        { value: 'QS', label: 'Quân sự' }
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

    const fetchLecturers = async (page: number, limit: number) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/lecturers?page=${page}&limit=${limit}`);
            if (!response.ok) {
                throw new Error(response.statusText);
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
        fetchLecturers(page, limit);
    }, []);

    const changePage = (page: number) => {
        fetchLecturers(page, limit);
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
                                <h2 className="fw-bold text-uppercase">DANH SÁCH GIẢNG VIÊN</h2>
                                <div className="d-flex gap-2" style={{ marginRight: "20px" }}>
                                    <FormModal
                                        title={'THÊM GIẢNG VIÊN'}
                                        button={
                                        <button className="btn btn-success text-uppercase d-flex align-items-center justify-content-center">
                                            THÊM GIẢNG VIÊN
                                        </button>}
                                        attributes={lecturerAttributes}
                                        record={null}
                                        formAction={'/api/lecturers'}
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
                                            {lecturerAttributes.map((attribute, index) => (
                                                <th key={index}>{attribute.label}</th>
                                            ))}
                                            <th>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lecturers.length > 0 ? (
                                            lecturers.map((lecturer, index) =>
                                                lecturer && (
                                                    <GridRow
                                                        key={index + (pagination.currentPage - 1) * 10}
                                                        attributes={lecturerAttributes}
                                                        record={lecturer}
                                                        index={index + (pagination.currentPage - 1) * 10}
                                                        actions={[
                                                        <div>
                                                            <DynamicRows
                                                                title={'MÔN CHUYÊN SÂU'}
                                                                attribute={ 
                                                                    { name: 'subject', label: 'MÔN'}
                                                                }
                                                                button={<button className="btn btn-outline-success me-2" onClick={() => handleClickAction(index)}>MÔN CHUYÊN SÂU</button>}
                                                                getSelectionsUrl={'/api/getSubjectsByCategory?category=' + lecturer.faculty}
                                                                getRowsUrl={'/api/getSubjectsByLecturer?lecturerId=' + lecturer.id}
                                                                saveUrl={'/api/saveLecturerSpecializations'}
                                                                targetId={lecturer.id.toString()}
                                                            />
                                                        </div>,
                                                        <div>
                                                            <FormModal
                                                                title={'CHỈNH SỬA GIẢNG VIÊN'}
                                                                button={<button className="btn btn-outline-success me-2" onClick={() => handleClickAction(index)}><FaEdit /></button>}
                                                                attributes={lecturerAttributes}
                                                                record={lecturer}
                                                                formAction={'/api/lecturers'}
                                                                formMethod='PUT'
                                                            />
                                                        </div>,
                                                        <div>
                                                            <DeleteModal
                                                                title={'GIẢNG VIÊN'}
                                                                button={<button className="btn btn-outline-danger" onClick={() => handleClickAction(index)}><FaTrashAlt /></button>}
                                                                record={lecturer}
                                                                onClose={() => {}}
                                                                formAction={'/api/lecturers'}
                                                            />
                                                        </div>
                                                        ]}
                                                    />
                                                )
                                            )
                                        ) : (
                                            <tr>
                                                <td colSpan={lecturerAttributes.length + 2} className="text-left">Chưa có dữ liệu</td>
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

export default LecturersPage;
