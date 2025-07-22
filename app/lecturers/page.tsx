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
import { FaEdit, FaTrashAlt, FaLink } from 'react-icons/fa';
import DynamicRows from '../components/DynamicRows';
import { usePermissions } from '../hooks/usePermissions';
import LoadingOverlay from '../components/LoadingOverlay';

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
    const [isLoading, setIsLoading] = useState(false);

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

    const { isScheduler } = usePermissions();

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
                <LoadingOverlay show={loading} text="Đang tải dữ liệu..." />
                {(!loading && error) ? (
                    <p className="text-danger">Error: {error}</p>
                ) : (!loading && (
                    <div className="d-flex flex-column justify-content-center align-items-center" style={{ flex: 1 }}>
                        <div className="d-flex flex-column" style={{ width: 'calc(100% - 20px)', marginLeft: "20px" }}>
                            <div className="d-flex justify-content-between align-items-center mb-3 mt-3">
                                <h2 className="page-title" style={{ fontSize: '2rem' }}>DANH SÁCH GIẢNG VIÊN</h2>
                                <div className="d-flex gap-2" style={{ marginRight: "20px" }}>
                                    {isScheduler ? (
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
                                            onLoadingChange={setIsLoading}
                                        />
                                    ) : (
                                        <button 
                                            className="btn btn-success text-uppercase d-flex align-items-center justify-content-center" 
                                            disabled
                                            style={{ pointerEvents: 'none', opacity: 0.6 }}
                                        >
                                            THÊM GIẢNG VIÊN
                                        </button>
                                    )}
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
                                            <>
                                                {lecturers.map((lecturer, index) =>
                                                    lecturer && (
                                                        <GridRow
                                                            key={index + (pagination.currentPage - 1) * 10}
                                                            attributes={lecturerAttributes}
                                                            record={lecturer}
                                                            index={index + (pagination.currentPage - 1) * 10}
                                                            actions={isScheduler ? [
                                                                <div key="edit">
                                                                    <FormModal
                                                                        title={'CHỈNH SỬA GIẢNG VIÊN'}
                                                                        button={<button className="btn btn-outline-success me-2 action-btn" onClick={() => handleClickAction(index)}><FaEdit /></button>}
                                                                        attributes={lecturerAttributes}
                                                                        record={lecturer}
                                                                        formAction={'/api/lecturers'}
                                                                        formMethod='PUT'
                                                                        onLoadingChange={setIsLoading}
                                                                    />
                                                                </div>,
                                                                <div key="specialize">
                                                                    <DynamicRows
                                                                        title={'MÔN CHUYÊN SÂU'}
                                                                        attribute={{ name: 'subject', label: 'MÔN'}}
                                                                        button={<button className="btn btn-outline-primary me-2 action-btn" onClick={() => handleClickAction(index)}><FaLink /></button>}
                                                                        getSelectionsUrl={'/api/getSubjectsByCategory?category=' + lecturer.faculty}
                                                                        getRowsUrl={'/api/getSubjectsByLecturer?lecturerId=' + lecturer.id}
                                                                        saveUrl={'/api/saveLecturerSpecializations'}
                                                                        targetId={lecturer.id.toString()}
                                                                        onLoadingChange={setIsLoading}
                                                                    />
                                                                </div>,
                                                                <div key="delete">
                                                                    <DeleteModal
                                                                        title={'GIẢNG VIÊN'}
                                                                        button={<button className="btn btn-outline-danger action-btn" onClick={() => handleClickAction(index)}><FaTrashAlt /></button>}
                                                                        record={lecturer}
                                                                        onClose={() => {}}
                                                                        formAction={'/api/lecturers'}
                                                                    />
                                                                </div>
                                                            ] : [
                                                                <button key="edit" className="btn btn-outline-success me-2 action-btn" disabled style={{ pointerEvents: 'none', opacity: 0.4 }}><FaEdit /></button>,
                                                                <button key="specialize" className="btn btn-outline-primary me-2 action-btn" disabled style={{ pointerEvents: 'none', opacity: 0.4 }}><FaLink /></button>,
                                                                <button key="delete" className="btn btn-outline-danger action-btn" disabled style={{ pointerEvents: 'none', opacity: 0.4 }}><FaTrashAlt /></button>
                                                            ]}
                                                        />
                                                    )
                                                )}
                                                {/* Padding rows nếu chưa đủ 10 dòng */}
                                                {Array.from({ length: 10 - lecturers.length }).map((_, padIdx) => (
                                                    <GridRow
                                                        key={`pad-${padIdx}`}
                                                        attributes={lecturerAttributes}
                                                        record={{}}
                                                        index={lecturers.length + padIdx}
                                                        actions={[]}
                                                    />
                                                ))}
                                            </>
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
                ))}
            </main>
            <Footer />
        </>
    )
}

export default LecturersPage;
