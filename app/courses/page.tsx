"use client";
import { useEffect, useState } from "react";
import Header from "../components/Header";
import SideBar from "../components/SideBar";
import Footer from "../components/Footer";
import FormModal from "../components/FormModal";
import DeleteModal from "../components/DeleteModal";
import GridRow from "../components/GridRow";
import Pagination from "../components/Pagination";
import LoadingOverlay from "../components/LoadingOverlay";
import { FaEdit, FaTrashAlt } from "react-icons/fa";
import { ObjectAttribute } from '../types/object-attribute';

const courseAttributes: ObjectAttribute[] = [
  { name: "name", label: "Tên khóa học", type: "string" },
  { name: "school", label: "Tên trường", type: "string" },
  { name: "startDate", label: "Thời gian bắt đầu", type: "date" },
  { name: "endDate", label: "Thời gian kết thúc", type: "date" },
];
const courseTableColumns: ObjectAttribute[] = [
  ...courseAttributes,
  { name: "status", label: "Trạng thái", type: "select", selections: [
    { value: "Done", label: "Hoàn thành" },
    { value: "Processing", label: "Đang diễn ra" },
    { value: "Undone", label: "Chưa bắt đầu" },
  ]},
];

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalCount: 0 });

  const fetchCourses = async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/courses?page=${page}`);
      const data = await res.json();
      setCourses(data.data);
      setPagination(data.pagination || { currentPage: 1, totalPages: 1, totalCount: data.data.length });
    } catch (err: any) {
      setError(err.message || "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourses(); }, []);

  return (
    <>
      <Header />
      <main className="d-flex justify-content-start align-items-start" style={{ minHeight: "100vh" }}>
        <SideBar />
        <LoadingOverlay show={loading} text="Đang tải dữ liệu..." />
        {(!loading && error) ? (
          <p className="text-danger">Error: {error}</p>
        ) : (!loading && (
          <div className="d-flex flex-column justify-content-center align-items-center" style={{ flex: 1 }}>
            <div className="d-flex flex-column" style={{ width: "calc(100% - 20px)", marginLeft: "20px" }}>
              <div className="d-flex justify-content-between align-items-center mb-3 mt-3">
                <h2 className="fw-bold text-uppercase" style={{ fontSize: "2.2rem" }}>DANH SÁCH KHÓA HỌC</h2>
                <FormModal
                  title="THÊM KHÓA HỌC"
                  button={<button className="btn btn-success">THÊM KHÓA HỌC</button>}
                  attributes={courseAttributes}
                  record={null}
                  formAction="/api/courses"
                  formMethod="POST"
                  onLoadingChange={setLoading}
                />
              </div>
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th>STT</th>
                    {courseTableColumns.map((attr, idx) => <th key={idx}>{attr.label}</th>)}
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.length > 0 ? (
                    <>
                      {courses.map((course: any, idx: number) => (
                        <GridRow
                          key={course.id}
                          attributes={courseTableColumns}
                          record={course}
                          index={idx + (pagination.currentPage - 1) * 10}
                          actions={[
                            <FormModal
                              key="edit"
                              title="SỬA KHÓA HỌC"
                              button={
                                <button className="btn btn-outline-success me-2 action-btn" title="Sửa">
                                  <FaEdit />
                                </button>
                              }
                              attributes={courseAttributes}
                              record={course}
                              formAction="/api/courses"
                              formMethod="PUT"
                              onLoadingChange={setLoading}
                            />, 
                            <DeleteModal
                              key="delete"
                              title="KHÓA HỌC"
                              button={
                                <button className="btn btn-outline-danger action-btn" title="Xóa">
                                  <FaTrashAlt />
                                </button>
                              }
                              record={course}
                              onClose={() => fetchCourses(pagination.currentPage)}
                              formAction="/api/courses"
                            />
                          ]}
                        />
                      ))}
                      {Array.from({ length: 10 - courses.length }).map((_, padIdx) => (
                        <GridRow
                          key={`pad-${padIdx}`}
                          attributes={courseTableColumns}
                          record={{}}
                          index={courses.length + padIdx}
                          actions={[]}
                        />
                      ))}
                    </>
                  ) : (
                    <tr>
                      <td colSpan={courseTableColumns.length + 2}>Chưa có dữ liệu</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={fetchCourses}
            />
          </div>
        ))}
      </main>
      <Footer />
    </>
  );
} 