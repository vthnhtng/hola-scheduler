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
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);
    const [selectedRow, setSelectedRow] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const programMappings = [
        { value: 'DH', label: 'Đại học' },
        { value: 'CD', label: 'Cao đẳng' },
    ];

    const curriculumAttributes: ObjectAttribute[] = [
        { name: 'program', label: 'Chương trình', type: 'select', selections: programMappings },
    ];

    const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<PaginationData>({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0
    });

    const { isScheduler } = usePermissions();

    const fetchCurriculums = async (page: number, limit: number) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/curriculums?page=${page}&limit=${limit}`);
            if (!response.ok) {
                throw new Error(response.statusText);
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
        fetchCurriculums(page, limit);
    }, [page, limit]);

    const changePage = (newPage: number) => {
        setPage(newPage);
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
                                                 <div className="d-flex justify-content-between align-items-center mb-4" style={{ width: "calc(100% - 40px)", maxWidth: "1200px", marginTop: "1rem" }}>
                            <h2 className="page-title" style={{ fontSize: '2rem' }}>DANH SÁCH CHƯƠNG TRÌNH ĐÀO TẠO</h2>
                                <div className="d-flex gap-2" style={{ marginRight: "20px" }}>
                                    {isScheduler ? (
                                        <FormModal
                                            title={'THÊM CHƯƠNG TRÌNH'}
                                            button={
                                            <button className="btn btn-success text-uppercase d-flex align-items-center justify-content-center">
                                                THÊM CHƯƠNG TRÌNH
                                            </button>}
                                            attributes={curriculumAttributes}
                                            record={null}
                                            formAction={'/api/curriculums'}
                                            formMethod='POST'
                                        />
                                    ) : (
                                        <button 
                                            className="btn btn-success text-uppercase d-flex align-items-center justify-content-center" 
                                            disabled
                                            style={{ pointerEvents: 'none', opacity: 0.6 }}
                                        >
                                            THÊM CHƯƠNG TRÌNH
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="bg-white rounded-lg shadow-sm border p-4" style={{ width: "calc(100% - 40px)", maxWidth: "1200px", marginTop: "0.25rem" }}>
                                <div className="table-responsive" style={{ marginTop: '0' }}>
                                    <table className="table table-hover" style={{ marginTop: '0' }}>
                                    <thead>
                                                                                                                          <tr style={{ height: '50px', verticalAlign: 'middle', backgroundColor: '#e9ecef' }}>
                                             <th style={{ verticalAlign: 'middle', border: 'none', padding: '6px 8px' }}>STT</th>
                                             {curriculumAttributes.map((attribute, index) => (
                                                 <th key={index} style={{ verticalAlign: 'middle', border: 'none', padding: '6px 8px' }}>{attribute.label}</th>
                                             ))}
                                             <th style={{ verticalAlign: 'middle', border: 'none', padding: '6px 8px' }}>Thao tác</th>
                                         </tr>
                                         <tr style={{ height: '2px', backgroundColor: '#6c757d', border: 'none' }}>
                                             <td colSpan={curriculumAttributes.length + 2} style={{ padding: 0, border: 'none', height: '2px', backgroundColor: '#6c757d' }}></td>
                                         </tr>
                                    </thead>
                                    <tbody>
                                        {curriculums.length > 0 ? (
                                            <>
                                                {curriculums.map((curriculum, index) =>
                                                    curriculum && (
                                                        <GridRow
                                                            key={index + (pagination.currentPage - 1) * 10}
                                                            attributes={curriculumAttributes}
                                                            record={curriculum}
                                                            index={index + (pagination.currentPage - 1) * 10}
                                                            actions={isScheduler ? [
                                                                <FormModal
                                                                    key="edit"
                                                                    title={'SỬA CHƯƠNG TRÌNH'}
                                                                    button={<button className="btn btn-outline-success me-2 action-btn" title="Sửa"><FaEdit /></button>}
                                                                    attributes={curriculumAttributes}
                                                                    record={curriculum}
                                                                    formAction={'/api/curriculums'}
                                                                    formMethod='PUT'
                                                                />,
                                                                <DynamicRows
                                                                    key="link"
                                                                    title={'LIÊN KẾT MÔN HỌC'}
                                                                    attribute={{ name: 'subject', label: 'MÔN HỌC'}}
                                                                    button={<button className="btn btn-outline-primary me-2 action-btn" title="Liên kết môn học"><FaLink /></button>}
                                                                    getSelectionsUrl={'/api/getSubjectsByCategory?category=all'}
                                                                    getRowsUrl={'/api/curriculumSubjects?curriculumId=' + curriculum.id}
                                                                    saveUrl={'/api/saveCurriculumSubjects'}
                                                                    targetId={curriculum.id.toString()}
                                                                />,
                                                                <DeleteModal
                                                                    key="delete"
                                                                    title={'CHƯƠNG TRÌNH'}
                                                                    button={<button className="btn btn-outline-danger action-btn" title="Xóa"><FaTrashAlt /></button>}
                                                                    record={curriculum}
                                                                    onClose={() => fetchCurriculums(page, limit)}
                                                                    formAction={'/api/curriculums'}
                                                                />
                                                            ] : [
                                                                <button key="edit" className="btn btn-outline-success me-2 action-btn" disabled style={{ pointerEvents: 'none', opacity: 0.4 }} title="Sửa"><FaEdit /></button>,
                                                                <button key="link" className="btn btn-outline-primary me-2 action-btn" disabled style={{ pointerEvents: 'none', opacity: 0.4 }} title="Liên kết môn học"><FaLink /></button>,
                                                                <button key="delete" className="btn btn-outline-danger action-btn" disabled style={{ pointerEvents: 'none', opacity: 0.4 }} title="Xóa"><FaTrashAlt /></button>
                                                            ]}
                                                        />
                                                    )
                                                )}
                                                {/* Padding rows nếu chưa đủ 10 dòng */}
                                                {Array.from({ length: 10 - curriculums.length }).map((_, padIdx) => (
                                                    <GridRow
                                                        key={`pad-${padIdx}`}
                                                        attributes={curriculumAttributes}
                                                        record={{}}
                                                        index={curriculums.length + padIdx}
                                                        actions={[]}
                                                    />
                                                ))}
                                            </>
                                        ) : (
                                            <tr>
                                                <td colSpan={curriculumAttributes.length + 2} className="text-center">Chưa có dữ liệu</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                                </div>
                            </div>
                            <div className="d-flex justify-content-center mt-4">
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
    );
}

export default CurriculumsPage;
