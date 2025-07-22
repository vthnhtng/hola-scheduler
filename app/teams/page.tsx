'use client';

import { useEffect, useState } from 'react';
import Header from '../components/Header';
import SideBar from '../components/SideBar';
import Footer from '../components/Footer';
import { ObjectAttribute } from '../types/object-attribute';
import Pagination from '../components/Pagination';
import FormModal from '../components/FormModal';
import DeleteModal from '../components/DeleteModal';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { usePermissions } from '../hooks/usePermissions';
import LoadingOverlay from '../components/LoadingOverlay';

interface Team {
  id: number;
  name: string;
  program: string;
  teamLeaderReference?: { id: number; fullName: string };
  courseReference?: { id: number; name: string };
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

function TeamsPage() {
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { isScheduler } = usePermissions();
  const [teams, setTeams] = useState<Team[]>([]);
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
  });

  const programs = [
    { value: 'CD', label: 'Cao đẳng' },
    { value: 'DH', label: 'Đại học' },
  ];

  const fetchTeams = async (page: number, limit: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/teams?page=${page}&limit=${limit}`);
      const data = await response.json();

      const mappedTeams = data.data.map((team: any) => ({
        ...team,
        displayTeamLeader: team.teamLeaderReference?.fullName || 'Chưa có',
        displayCourse: team.courseReference?.name || 'Chưa có',
      }));

      setTeams(mappedTeams);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message || 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const fetchLecturers = async () => {
    const res = await fetch('/api/lecturers');
    const data = await res.json();
    setLecturers(data.data || []);
  };

  const fetchCourses = async () => {
    const res = await fetch('/api/courses');
    const data = await res.json();
    setCourses(data.data || []);
  };

  const teamAttributes: ObjectAttribute[] = [
    { name: 'name', label: 'Tên đại đội', type: 'string' },
    { name: 'program', label: 'Chương trình', type: 'select', selections: programs },
    {
      name: 'teamLeaderId',
      label: 'Giảng viên phụ trách',
      type: 'select',
      selections: lecturers.map(l => ({ value: l.id.toString(), label: l.fullName })),
    },
    {
      name: 'courseId',
      label: 'Thuộc khóa',
      type: 'select',
      selections: courses.map(c => ({ value: c.id.toString(), label: c.name })),
    },
  ];

  useEffect(() => {
    fetchTeams(page, limit);
    fetchLecturers();
    fetchCourses();
  }, []);

  const changePage = (newPage: number) => {
    setPage(newPage);
    fetchTeams(newPage, limit);
  };

  const handleClickAction = (index: number) => {
    setSelectedRow(prev => (prev === index ? null : index));
  };

  return (
    <>
      <Header />

      <main
        className="d-flex"
        style={{
          minHeight: '100vh',
          backgroundColor: '#f5f6fa',
        }}
      >
        {/* Sidebar */}
        <div
          className="d-flex flex-column"
          style={{
            width: '250px',
            minHeight: '100vh',
            backgroundColor: '#f8f9fa',
            padding: '20px 15px',
            boxShadow: '1px 0 4px rgba(0,0,0,0.1)',
          }}
        >
          <SideBar />
        </div>

        {/* Main Content */}
        <div
          className="d-flex flex-column flex-grow-1 px-4"
          style={{
            flex: 1,
            backgroundColor: '#ffffff',
            paddingTop: '24px',
            paddingBottom: '24px',
          }}
        >
          <LoadingOverlay show={loading} text="Đang tải dữ liệu..." />

          {(!loading && error) ? (
            <p className="text-danger mt-4">Lỗi: {error}</p>
          ) : (
            <div className="d-flex flex-column flex-grow-1">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold text-uppercase" style={{ fontSize: '2rem' }}>Danh sách đại đội</h2>
                {isScheduler ? (
                  <FormModal
                    title="THÊM ĐẠI ĐỘI"
                    button={<button className="btn btn-success text-uppercase">THÊM ĐẠI ĐỘI</button>}
                    attributes={teamAttributes}
                    record={null}
                    formAction="/api/teams"
                    formMethod="POST"
                  />
                ) : (
                  <button 
                    className="btn btn-success text-uppercase" 
                    disabled
                    style={{ pointerEvents: 'none', opacity: 0.6 }}
                  >
                    THÊM ĐẠI ĐỘI
                  </button>
                )}
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle" style={{ borderCollapse: 'collapse' }}>
                  <thead className="table-light">
                    <tr style={{ height: '75px', verticalAlign: 'middle', backgroundColor: '#f1f1f1' }}>
                      <th>STT</th>
                      <th>Tên đại đội</th>
                      <th>Chương trình</th>
                      <th>Giảng viên phụ trách</th>
                      <th>Thuộc khóa</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams.length > 0 ? (
                      <>
                        {teams.map((team, index) => (
                          <tr key={team.id} style={{ height: '75px', verticalAlign: 'middle' }}>
                            <td>{index + 1 + (pagination.currentPage - 1) * limit}</td>
                            <td>{team.name}</td>
                            <td>{team.program === 'DH' ? 'Đại học' : 'Cao đẳng'}</td>
                            <td>{team.teamLeaderReference?.fullName || 'Chưa có'}</td>
                            <td>{team.courseReference?.name || 'Chưa có'}</td>
                            <td>
                              <div className="d-flex gap-2">
                                {isScheduler ? (
                                  <>
                                    <FormModal
                                      key="edit"
                                      title="SỬA ĐẠI ĐỘI"
                                      button={
                                        <button
                                          className="btn btn-outline-success action-btn"
                                          onClick={() => handleClickAction(index)}
                                          title="Sửa"
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            height: '36px',
                                            width: '36px',
                                          }}
                                        >
                                          <FaEdit />
                                        </button>
                                      }
                                      attributes={teamAttributes}
                                      record={team}
                                      formAction="/api/teams"
                                      formMethod="PUT"
                                    />
                                    <DeleteModal
                                      key="delete"
                                      title="ĐẠI ĐỘI"
                                      button={
                                        <button
                                          className="btn btn-outline-danger action-btn"
                                          onClick={() => handleClickAction(index)}
                                          title="Xóa"
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            height: '36px',
                                            width: '36px',
                                          }}
                                        >
                                          <FaTrashAlt />
                                        </button>
                                      }
                                      record={team}
                                      onClose={() => fetchTeams(page, limit)}
                                      formAction="/api/teams"
                                    />
                                  </>
                                ) : (
                                  <>
                                    <button 
                                      className="btn btn-outline-success action-btn" 
                                      disabled 
                                      style={{ 
                                        pointerEvents: 'none', 
                                        opacity: 0.4,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        height: '36px',
                                        width: '36px',
                                      }} 
                                      title="Sửa"
                                    >
                                      <FaEdit />
                                    </button>
                                    <button 
                                      className="btn btn-outline-danger action-btn" 
                                      disabled 
                                      style={{ 
                                        pointerEvents: 'none', 
                                        opacity: 0.4,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        height: '36px',
                                        width: '36px',
                                      }} 
                                      title="Xóa"
                                    >
                                      <FaTrashAlt />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {Array.from({ length: limit - teams.length }).map((_, padIdx) => (
                          <tr key={`pad-${padIdx}`} style={{ height: '75px', backgroundColor: '#fafafa' }}>
                            <td>{teams.length + padIdx + 1}</td>
                            <td colSpan={5}></td>
                          </tr>
                        ))}
                      </>
                    ) : (
                      <tr style={{ height: '75px' }}>
                        <td colSpan={6}>Chưa có dữ liệu</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="d-flex justify-content-center my-4">
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={changePage}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

export default TeamsPage;