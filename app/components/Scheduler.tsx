'use client';
import React, { useState, useEffect } from 'react';

export default function Scheduler() {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState('');
  const [coursesLoaded, setCoursesLoaded] = useState(false);

  const fetchCourses = async () => {
    if (coursesLoaded) return;
    try {
      const res = await fetch('/api/courses?page=1&limit=9999');
      const data = await res.json();
      if (Array.isArray(data.data)) {
        setCourses(data.data);
      } else {
        setCourses([]);
      }
      setCoursesLoaded(true);
    } catch (e) {
      setCourses([]);
    }
  };

  const handleSelectFocus = () => {
    fetchCourses();
  };

  const handleSelectCourse = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedCourse(value);
    if (!value) {
      setStartDate('');
      setEndDate('');
      return;
    }
    const course = courses.find((c: any) => String(c.id) === value);
    if (course) {
      setStartDate(course.startDate ? course.startDate.slice(0, 10) : '');
      setEndDate(course.endDate ? course.endDate.slice(0, 10) : '');
    }
  };

  const handleCreate = () => {
    if (!selectedCourse || !startDate || !endDate) {
      setMessage('Vui lòng nhập đủ thông tin!');
      return;
    }
    setMessage(`Đã tạo lịch cho khóa ${selectedCourse}`);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white rounded shadow">
      <h2 className="text-xl font-bold text-center mb-4">Chọn khóa học sắp xếp</h2>
      {message && <div className="mb-4 text-green-600">{message}</div>}
      <div className="mb-4">
        <label>Chọn khóa học:</label>
        <select
          className="block w-full border p-2 rounded"
          value={selectedCourse || ''}
          onChange={handleSelectCourse}
          onFocus={handleSelectFocus}
        >
          <option value="">-- Chọn khóa --</option>
          {courses.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name} {c.status ? `(${c.status})` : ''}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-4 mb-4">
        <div className="w-1/2">
          <label>Từ ngày:</label>
          <input type="date" className="block border p-2 rounded w-full" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div className="w-1/2">
          <label>Đến ngày:</label>
          <input type="date" className="block border p-2 rounded w-full" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
      </div>
      <div className="flex justify-center mt-4">
        <button
          className="bg-blue-600 text-white px-8 py-2 rounded"
          onClick={handleCreate}
        >
          Xem lịch
        </button>
      </div>
    </div>
  );
}
