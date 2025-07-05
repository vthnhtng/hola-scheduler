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
import LoadingOverlay from '../components/LoadingOverlay';

interface Team {
    id: number;
    name: string;
    program: string;
}

interface PaginationData {
    currentPage: number;
    totalPages: number;
    totalCount: number;
}

function TeamsPage() {
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);
    const [selectedRow, setSelectedRow] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const programs = [
        { value: 'CD', label: 'Cao đẳng' },
        { value: 'DH', label: 'Đại học' }
    ];

    const teamAttributes: ObjectAttribute[] = [
        { name: 'name', label: 'Tên đại đội', type: 'string' },
        { name: 'program', label: 'Chương trình', type: 'select', selections: programs },
    ];

    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<PaginationData>({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0
    });

    const fetchTeams = async (page: number, limit: number) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/teams?page=${page}&limit=${limit}`);
            if (!response.ok) {
                throw new Error(response.statusText);
            }
            const data = await response.json();
            setTeams(data.data);
            setPagination(data.pagination);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch teams');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeams(page, limit);
    }, []);

    const changePage = (page: number) => {
        fetchTeams(page, limit);
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
                                <h2 className="fw-bold text-uppercase" style={{ fontSize: '2.2rem' }}>DANH SÁCH ĐẠI ĐỘI</h2>
                                <div className="d-flex gap-2" style={{ marginRight: "20px" }}>
                                    <FormModal
                                        title={'THÊM ĐẠI ĐỘI'}
                                        button={
                                        <button className="btn btn-success text-uppercase d-flex align-items-center justify-content-center">
                                            THÊM ĐẠI ĐỘI
                                        </button>}
                                        attributes={teamAttributes}
                                        record={null}
                                        formAction={'/api/teams'}
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
                                            {teamAttributes.map((attribute, index) => (
                                                <th key={index}>{attribute.label}</th>
                                            ))}
                                            <th>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {teams.length > 0 ? (
                                            <>
                                                {teams.map((team, index) =>
                                                    team && (
                                                        <GridRow
                                                            key={index + (pagination.currentPage - 1) * 10}
                                                            attributes={teamAttributes}
                                                            record={team}
                                                            index={index + (pagination.currentPage - 1) * 10}
                                                            actions={[
                                                                <FormModal
                                                                    key="edit"
                                                                    title={'SỬA ĐỘI'}
                                                                    button={<button className="btn btn-outline-success me-2 action-btn" onClick={() => handleClickAction(index)} title="Sửa"><FaEdit /></button>}
                                                                    attributes={teamAttributes}
                                                                    record={team}
                                                                    formAction={'/api/teams'}
                                                                    formMethod='PUT'
                                                                />,
                                                                <DeleteModal
                                                                    key="delete"
                                                                    title={'ĐỘI'}
                                                                    button={<button className="btn btn-outline-danger action-btn" onClick={() => handleClickAction(index)} title="Xóa"><FaTrashAlt /></button>}
                                                                    record={team}
                                                                    onClose={() => fetchTeams(page, limit)}
                                                                    formAction={'/api/teams'}
                                                                />
                                                            ]}
                                                        />
                                                    )
                                                )}
                                                {/* Padding rows nếu chưa đủ 10 dòng */}
                                                {Array.from({ length: 10 - teams.length }).map((_, padIdx) => (
                                                    <GridRow
                                                        key={`pad-${padIdx}`}
                                                        attributes={teamAttributes}
                                                        record={{}}
                                                        index={teams.length + padIdx}
                                                        actions={[]}
                                                    />
                                                ))}
                                            </>
                                        ) : (
                                            <tr>
                                                <td colSpan={teamAttributes.length + 2} className="text-left">Chưa có dữ liệu</td>
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
    );
}

export default TeamsPage;
