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

export default function TeamsPage() {
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
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
      <main className="d-flex" style={{ minHeight: '100vh' }}>
        <SideBar />
        <div className="d-flex flex-column flex-grow-1 justify-content-between px-3" style={{ flex: 1 }}>
          <LoadingOverlay show={loading} text="Đang tải dữ liệu..." />
          {(!loading && error) ? (
            <p className="text-danger">Lỗi: {error}</p>
          ) : (
            <div className="flex-grow-1 d-flex flex-column justify-content-start">
              <div className="d-flex justify-content-between align-items-center mt-4 mb-3">
                <h2 className="fw-bold text-uppercase" style={{ fontSize: '2rem' }}>Danh sách đại đội</h2>
                <FormModal
                  title="THÊM ĐẠI ĐỘI"
                  button={<button className="btn btn-success text-uppercase">THÊM ĐẠI ĐỘI</button>}
                  attributes={teamAttributes}
                  record={null}
                  formAction="/api/teams"
                  formMethod="POST"
                />
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr style={{ height: '70px', verticalAlign: 'middle' }}>
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
                          <tr key={team.id} style={{ height: '70px', verticalAlign: 'middle' }}>
                            <td>{index + 1 + (pagination.currentPage - 1) * limit}</td>
                            <td>{team.name}</td>
                            <td>{team.program === 'DH' ? 'Đại học' : 'Cao đẳng'}</td>
                            <td>{team.displayTeamLeader}</td>
                            <td>{team.displayCourse}</td>
                            <td>
                              <div className="d-flex gap-2">
                                <FormModal
                                  key="edit"
                                  title="SỬA ĐẠI ĐỘI"
                                  button={
                                    <button className="btn btn-outline-success action-btn" onClick={() => handleClickAction(index)} title="Sửa">
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
                                    <button className="btn btn-outline-danger action-btn" onClick={() => handleClickAction(index)} title="Xóa">
                                      <FaTrashAlt />
                                    </button>
                                  }
                                  record={team}
                                  onClose={() => fetchTeams(page, limit)}
                                  formAction="/api/teams"
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                        {Array.from({ length: limit - teams.length }).map((_, padIdx) => (
                          <tr key={`pad-${padIdx}`} style={{ height: '70px', verticalAlign: 'middle' }}>
                            <td>{teams.length + padIdx + 1}</td>
                            <td colSpan={5}></td>
                          </tr>
                        ))}
                      </>
                    ) : (
                      <tr style={{ height: '70px', verticalAlign: 'middle' }}>
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


// 'use client';
// import { useEffect, useState } from 'react';
// import Header from '../components/Header';
// import SideBar from '../components/SideBar';
// import Footer from '../components/Footer';
// import { ObjectAttribute } from '../types/object-attribute';
// import Pagination from '../components/Pagination';
// import FormModal from '../components/FormModal';
// import DeleteModal from '../components/DeleteModal';
// import GridRow from '../components/GridRow';
// import { FaEdit, FaTrashAlt } from 'react-icons/fa';
// import LoadingOverlay from '../components/LoadingOverlay';

// interface Team {
//     id: number;
//     name: string;
//     program: string;
//     teamLeaderReference?: {
//         id: number;
//         fullName: string;
//     };
//     courseReference?: {
//         id: number;
//         name: string;
//     };
// }

// interface PaginationData {
//     currentPage: number;
//     totalPages: number;
//     totalCount: number;
// }

// function TeamsPage() {
//     const [page, setPage] = useState<number>(1);
//     const [limit, setLimit] = useState<number>(10);
//     const [selectedRow, setSelectedRow] = useState<number | null>(null);
//     const [isLoading, setIsLoading] = useState(false);

//     const programs = [
//         { value: 'CD', label: 'Cao đẳng' },
//         { value: 'DH', label: 'Đại học' }
//     ];

//     const [teams, setTeams] = useState<Team[]>([]);
//     const [loading, setLoading] = useState<boolean>(true);
//     const [error, setError] = useState<string | null>(null);
//     const [lecturers, setLecturers] = useState<any[]>([]);
//     const [courses, setCourses] = useState<any[]>([]);
//     const [pagination, setPagination] = useState<PaginationData>({
//         currentPage: 1,
//         totalPages: 1,
//         totalCount: 0
//     });

//     const fetchTeams = async (page: number, limit: number) => {
//         try {
//             setLoading(true);
//             const response = await fetch(`/api/teams?page=${page}&limit=${limit}`);
//             if (!response.ok) {
//                 throw new Error(response.statusText);
//             }
//             const data = await response.json();
//             // Map dữ liệu để hiển thị đúng các trường lồng nhau
//             const mappedTeams = data.data.map((team: any) => ({
//                 ...team,
//                 teamLeaderName: team.teamLeaderReference?.fullName || 'Chưa có',
//                 courseName: team.courseReference?.name || 'Chưa có',
//                 // Thêm các trường hiển thị cho bảng
//                 displayTeamLeader: team.teamLeaderReference?.fullName || 'Chưa có',
//                 displayCourse: team.courseReference?.name || 'Chưa có'
//             }));
//             setTeams(mappedTeams);
//             setPagination(data.pagination);
//         } catch (err: any) {
//             setError(err.message || 'Failed to fetch teams');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const fetchLecturers = async () => {
//         try {
//             const response = await fetch('/api/lecturers');
//             if (response.ok) {
//                 const data = await response.json();
//                 setLecturers(data.data || []);
//             }
//         } catch (error) {
//             console.error('Failed to fetch lecturers:', error);
//         }
//     };

//     const fetchCourses = async () => {
//         try {
//             const response = await fetch('/api/courses');
//             if (response.ok) {
//                 const data = await response.json();
//                 setCourses(data.data || []);
//             }
//         } catch (error) {
//             console.error('Failed to fetch courses:', error);
//         }
//     };

//     const teamAttributes: ObjectAttribute[] = [
//         { name: 'name', label: 'Tên đại đội', type: 'string' },
//         { name: 'program', label: 'Chương trình', type: 'select', selections: programs },
//         { name: 'teamLeaderId', label: 'Giảng viên phụ trách', type: 'select', selections: lecturers.map(l => ({ value: l.id.toString(), label: l.fullName })) },
//         { name: 'courseId', label: 'Thuộc khóa', type: 'select', selections: courses.map(c => ({ value: c.id.toString(), label: c.name })) },
//     ];

//     useEffect(() => {
//         fetchTeams(page, limit);
//         fetchLecturers();
//         fetchCourses();
//     }, []);

//     useEffect(() => {
//         document.body.setAttribute('data-page', 'teams');
//         return () => document.body.removeAttribute('data-page');
//     }, []);

//     const changePage = (page: number) => {
//         fetchTeams(page, limit);
//     };

//     const handleClickAction = (index: number) => {
//         setSelectedRow((prev) => (prev === index ? null : index));
//     };

//     return (
//         <>
//             <Header />
//             <div data-page="teams">
//                 <main className="d-flex justify-content-start align-items-start" style={{ minHeight: '100vh', display: 'flex' }}>
//                     <SideBar className="sidebar-team" />
//                     <LoadingOverlay show={loading} text="Đang tải dữ liệu..." />
//                     {(!loading && error) ? (
//                         <p className="text-danger">Error: {error}</p>
//                     ) : (!loading && (
//                         <div className="d-flex flex-column justify-content-start align-items-center" style={{ flex: 1, minHeight: '100vh' }}>
//                             <div className="d-flex flex-column" style={{ width: 'calc(100% - 20px)', marginLeft: "20px", flex: 1 }}>
//                                 <div className="d-flex justify-content-between align-items-center mb-3 mt-3">
//                                     <h2 className="fw-bold text-uppercase" style={{ fontSize: '2.2rem' }}>DANH SÁCH ĐẠI ĐỘI</h2>
//                                     <div className="d-flex gap-2" style={{ marginRight: "20px" }}>
//                                         <FormModal
//                                             title={'THÊM ĐẠI ĐỘI'}
//                                             button={
//                                             <button className="btn btn-success text-uppercase d-flex align-items-center justify-content-center">
//                                                 THÊM ĐẠI ĐỘI
//                                             </button>}
//                                             attributes={teamAttributes}
//                                             record={null}
//                                             formAction={'/api/teams'}
//                                             formMethod='POST'
//                                         />
//                                     </div>
//                                 </div>
//                                 <div
//                                     className="d-flex flex-column"
//                                     style={{
//                                         width: 'calc(100% - 20px)',
//                                         marginLeft: "20px",
//                                         flex: 1
//                                     }}
//                                 >
//                                     <table className="table table-hover table-team align-middle">
//                                         <thead className="table-light">
//                                             <tr>
//                                                 <th>STT</th>
//                                                 {teamAttributes.map((attribute, index) => (
//                                                     <th key={index}>{attribute.label}</th>
//                                                 ))}
//                                                 <th>Thao tác</th>
//                                             </tr>
//                                         </thead>
//                                         <tbody>
//                                             {teams.length > 0 ? (
//                                                 <>
//                                                     {teams.map((team, index) =>
//                                                         team && (
//                                                             <tr key={index + (pagination.currentPage - 1) * 10}>
//                                                                 <td>{index + (pagination.currentPage - 1) * 10 + 1}</td>
//                                                                 <td>{team.name}</td>
//                                                                 <td>{team.program === 'DH' ? 'Đại học' : 'Cao đẳng'}</td>
//                                                                 <td>{team.displayTeamLeader}</td>
//                                                                 <td>{team.displayCourse}</td>
//                                                                 <td>
//                                                                     <div className="d-flex gap-2">
//                                                                         <FormModal
//                                                                             key="edit"
//                                                                             title={'SỬA ĐỘI'}
//                                                                             button={<button className="btn btn-outline-success me-2 action-btn" onClick={() => handleClickAction(index)} title="Sửa"><FaEdit /></button>}
//                                                                             attributes={teamAttributes}
//                                                                             record={team}
//                                                                             formAction={'/api/teams'}
//                                                                             formMethod='PUT'
//                                                                         />
//                                                                         <DeleteModal
//                                                                             key="delete"
//                                                                             title={'ĐỘI'}
//                                                                             button={<button className="btn btn-outline-danger action-btn" onClick={() => handleClickAction(index)} title="Xóa"><FaTrashAlt /></button>}
//                                                                             record={team}
//                                                                             onClose={() => fetchTeams(page, limit)}
//                                                                             formAction={'/api/teams'}
//                                                                         />
//                                                                     </div>
//                                                                 </td>
//                                                             </tr>
//                                                         )
//                                                     )}
//                                                     {/* Padding rows nếu chưa đủ 10 dòng */}
//                                                     {Array.from({ length: 10 - teams.length }).map((_, padIdx) => (
//                                                         <tr key={`pad-${padIdx}`}>
//                                                             <td>{teams.length + padIdx + 1}</td>
//                                                             <td></td>
//                                                             <td></td>
//                                                             <td></td>
//                                                             <td></td>
//                                                             <td></td>
//                                                         </tr>
//                                                     ))}
//                                                 </>
//                                             ) : (
//                                                 <tr>
//                                                     <td colSpan={6} className="text-left">Chưa có dữ liệu</td>
//                                                 </tr>
//                                             )}
//                                         </tbody>
//                                     </table>
//                                 </div>
//                             </div>
//                             <div className="d-flex justify-content-center align-items-center mb-5 mt-3">
//                                 <Pagination
//                                     currentPage={pagination.currentPage}
//                                     totalPages={pagination.totalPages}
//                                     onPageChange={changePage}
//                                 />
//                             </div>
//                         </div>
//                     ))}
//                 </main>
//             </div>
//             <Footer />
//         </>
//     );
// }

// export default TeamsPage;
