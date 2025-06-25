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
import { SubjectDataProvider } from '@/model/data-provider/SubjectDataProvider';

interface Subject {
    id: number;
    name: string;
    category: string;
    prerequisite: string;
}

interface PaginationData {
    currentPage: number;
    totalPages: number;
    totalCount: number;
}

function SubjectsPage() {
    const subjectDataProvider = SubjectDataProvider.getInstance();
    const [prerequisites, setPrerequisites] = useState<{ value: string; label: string }[]>([]);

    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);
    const [selectedRow, setSelectedRow] = useState<number | null>(null);

    const categories = [
        { value: 'CT', label: 'Chính trị' },
        { value: 'QS', label: 'Quân sự' }
    ];

    const subjectAttributes: ObjectAttribute[] = [
        { name: 'name', label: 'Tên môn học', type: 'string' },
        { name: 'category', label: 'Chuyên khoa', type: 'select', selections: categories },
        { name: 'prerequisiteId', label: 'Môn tiên quyết', type: 'select', selections: prerequisites }
    ];

    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<PaginationData>({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0
    });

    const fetchSubjects = async (page: number, limit: number) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/subjects?page=${page}&limit=${limit}`);
            if (!response.ok) {
                throw new Error(response.statusText);
            }
            const data = await response.json();
            setSubjects(data.data);
            setPagination(data.pagination);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch subjects');
        } finally {
            setLoading(false);
        }
    };

    const fetchPrerequisites = async () => {
        const prerequisites = await subjectDataProvider.getPrerequisites();
        setPrerequisites(prerequisites);
    };

    useEffect(() => {
        fetchSubjects(page, limit);
        fetchPrerequisites();
    }, []);

    const changePage = (page: number) => {
        fetchSubjects(page, limit);
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
                                            THÊM MÔN HỌC
                                        </button>}
                                        attributes={subjectAttributes}
                                        record={null}
                                        formAction={'/api/subjects'}
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
                                            {subjectAttributes.map((attribute, index) => (
                                                <th key={index}>{attribute.label}</th>
                                            ))}
                                            <th>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {subjects.length > 0 ? (
                                            <>
                                                {subjects.map((subject, index) =>
                                                    subject && (
                                                        <GridRow
                                                            key={index + (pagination.currentPage - 1) * 10}
                                                            attributes={subjectAttributes}
                                                            record={subject}
                                                            index={index + (pagination.currentPage - 1) * 10}
                                                            actions={[
                                                                <div key="edit">
                                                                    <FormModal
                                                                        title={'CHỈNH SỬA MÔN HỌC'}
                                                                        button={<button className="btn btn-outline-success me-2" onClick={() => handleClickAction(index)}><FaEdit /></button>}
                                                                        attributes={subjectAttributes}
                                                                        record={subject}
                                                                        formAction={'/api/subjects'}
                                                                        formMethod='PUT'
                                                                    />
                                                                </div>,
                                                                <div key="delete">
                                                                    <DeleteModal
                                                                        title={'MÔN HỌC'}
                                                                        button={<button className="btn btn-outline-danger" onClick={() => handleClickAction(index)}><FaTrashAlt /></button>}
                                                                        record={subject}
                                                                        onClose={() => {}}
                                                                        formAction={'/api/subjects'}
                                                                    />
                                                                </div>
                                                            ]}
                                                        />
                                                    )
                                                )}
                                                {/* Padding rows nếu chưa đủ 10 dòng */}
                                                {Array.from({ length: 10 - subjects.length }).map((_, padIdx) => (
                                                    <GridRow
                                                        key={`pad-${padIdx}`}
                                                        attributes={subjectAttributes}
                                                        record={{}}
                                                        index={subjects.length + padIdx}
                                                        actions={[]}
                                                    />
                                                ))}
                                            </>
                                        ) : (
                                            <tr>
                                                <td colSpan={subjectAttributes.length + 2} className="text-left">Chưa có dữ liệu</td>
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

export default SubjectsPage;
