"use client";
import logo from '../assets/logo/logo.png';
import React, { useState } from "react";
import SideBar from '../components/SideBar';
import Footer from '../components/Footer';

export default function SummaryInformations() {
  const [filters, setFilters] = useState({
    name: "",
    subject: "",
    course: "",
    semester: "",
  });

  const [lecturers] = useState([
    {
      name: "Nguyễn Văn A",
      subject: "Toán cao cấp",
      course: "K45",
      school: "ĐH Bách Khoa",
      totalHours: 120,
      totalSessions: 40,
      semester: "HK1",
    },
    {
      name: "Trần Thị B",
      subject: "Lập trình C++",
      course: "K46",
      school: "ĐH Công Nghệ",
      totalHours: 90,
      totalSessions: 30,
      semester: "HK2",
    },
    {
      name: "Lê Văn C",
      subject: "Hệ điều hành",
      course: "K47",
      school: "ĐH Sư Phạm Kỹ Thuật",
      totalHours: 100,
      totalSessions: 32,
      semester: "HK1",
    },
    {
      name: "Phạm Văn D",
      subject: "Mạng máy tính",
      course: "K48",
      school: "ĐH CNTT",
      totalHours: 85,
      totalSessions: 28,
      semester: "HK2",
    },
  ]);

  const [filteredData, setFilteredData] = useState(lecturers);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleFilter = () => {
    const result = lecturers.filter(
      (lec) =>
        lec.name.toLowerCase().includes(filters.name.toLowerCase()) &&
        lec.subject.toLowerCase().includes(filters.subject.toLowerCase()) &&
        lec.course.toLowerCase().includes(filters.course.toLowerCase()) &&
        lec.semester.toLowerCase().includes(filters.semester.toLowerCase())
    );
    setFilteredData(result);
  };

  return (
    <div className="d-flex flex-column">
      <header
        className="d-flex justify-content-between align-items-center px-4"
        style={{
          width: '100%',
          height: '150px',
          backgroundColor: 'white',
          borderBottom: '1px solid #dee2e6',
          flexShrink: 0
        }}
      >
        <div className="d-flex align-items-center gap-3"
          style={{
            minWidth: '80%'
          }}
        >
          <div style={{ width: '242px' }}>
            <img
              src={logo.src}
              alt="GDQPAN Logo"
              style={{ width: '100%' }}
            />
          </div>
          <h1 className="text-2xl font-[FontAwesome]  text-[#27703A]">CỔNG SẮP XẾP LỊCH GIẢNG DẠY TỰ ĐỘNG</h1>
        </div>
      </header>

      <div className="d-flex flex-grow-1">
        <SideBar />
        <div style={{ width: '100%', minHeight: '100vh', background: '#f8f9fa', flex: 1 }}>
          <div className="px-4 py-3 max-w-6xl mx-auto min-h-[calc(100vh-20px)]" style={{ background: '#f8f9fa' }}>
            <h2 className="page-title" style={{ fontSize: '2rem', marginBottom: '1rem' }}>
              THỐNG KÊ THÔNG TIN GIẢNG VIÊN
            </h2>
            
            <div className="space-y-6">
              {/* Filters */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Bộ lọc</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên giảng viên
                    </label>
                    <input
                      name="name"
                      placeholder="Tên giảng viên..."
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Môn học
                    </label>
                    <input
                      name="subject"
                      placeholder="Môn học..."
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Khóa
                    </label>
                    <input
                      name="course"
                      placeholder="Khóa..."
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Học kỳ
                    </label>
                    <input
                      name="semester"
                      placeholder="Học kỳ..."
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={handleFilter}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Lọc
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-2 text-left">Tên giảng viên</th>
                        <th className="border p-2 text-left">Môn học</th>
                        <th className="border p-2 text-left">Khóa</th>
                        <th className="border p-2 text-left">Trường</th>
                        <th className="border p-2 text-left">Tổng giờ dạy</th>
                        <th className="border p-2 text-left">Tổng buổi dạy</th>
                        <th className="border p-2 text-left">Học kỳ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.length > 0 ? (
                        filteredData.map((lec, idx) => (
                          <tr key={idx}>
                            <td className="border p-2 text-left">{lec.name}</td>
                            <td className="border p-2 text-left">{lec.subject}</td>
                            <td className="border p-2 text-left">{lec.course}</td>
                            <td className="border p-2 text-left">{lec.school}</td>
                            <td className="border p-2 text-left">{lec.totalHours}</td>
                            <td className="border p-2 text-left">{lec.totalSessions}</td>
                            <td className="border p-2 text-left">{lec.semester}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="text-center p-4 text-gray-500">
                            Không có dữ liệu
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
