"use client";
import logo from '../assets/logo/logo.png';
import React, { useState } from "react";

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
    <div className="min-h-screen bg-white">
      <header
        className="d-flex justify-content-between align-items-center px-4"
        style={{
          width: '100%',
          height: '150px',
          backgroundColor: 'white',
          borderBottom: '1px solid '
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

      <div className="p-6">
        <h2 className="text-[28px] font-[FontAwesome] text-[#27703A]">
          Thông tin giảng viên
        </h2>

        {/* Filter bar */}
        <div className="bg-white shadow-md rounded-2xl p-4 flex gap-2 mb-6">
          <input
            name="name"
            placeholder="Tên giảng viên..."
            className="border p-2 rounded w-full"
            onChange={handleChange}
          />
          <input
            name="subject"
            placeholder="Môn học..."
            className="border p-2 rounded w-full"
            onChange={handleChange}
          />
          <input
            name="course"
            placeholder="Khóa..."
            className="border p-2 rounded w-full"
            onChange={handleChange}
          />
          <input
            name="semester"
            placeholder="Học kỳ..."
            className="border p-2 rounded w-full"
            onChange={handleChange}
          />
          <button
            onClick={handleFilter}
            className="bg-[#49bf67] text-white px-4 rounded"
          >
            Lọc
          </button>
        </div>

        {/* Bảng data */}
        <table className="w-full border-collapse border bg-white shadow rounded-lg">
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
  );
}
