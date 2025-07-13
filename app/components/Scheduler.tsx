'use client';
import React, { useState } from 'react';

const mockCourses = [
  { id: 1, name: 'Khóa 2024', status: 'Đang diễn ra' },
  { id: 2, name: 'Khóa 2023', status: 'Hoàn thành' }
];
const mockTeams = [
  { id: 1, name: 'Đại đội 1', program: 'DH', courseId: 1 },
  { id: 2, name: 'Đại đội 2', program: 'DH', courseId: 1 },
  { id: 3, name: 'Đại đội 3', program: 'CD', courseId: 2 }
];

export default function Scheduler() {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState('');

  const filteredTeams = selectedCourse
    ? mockTeams.filter(t => t.courseId === Number(selectedCourse))
    : [];

  const handleTeamToggle = (id) => {
    setSelectedTeams(prev =>
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
  };

  const handleCreate = () => {
    if (!selectedCourse || selectedTeams.length === 0 || !startDate || !endDate) {
      setMessage('Vui lòng nhập đủ thông tin!');
      return;
    }
    setMessage(`Đã tạo lịch cho khóa ${selectedCourse}, các đại đội: ${selectedTeams.join(', ')}`);
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">SẮP XẾP LỊCH GIẢNG DẠY (Mock UI)</h2>
      {message && <div className="mb-4 text-green-600">{message}</div>}
      <div className="mb-4">
        <label>Chọn khóa học:</label>
        <select
          className="block w-full border p-2"
          value={selectedCourse || ''}
          onChange={e => {
            setSelectedCourse(e.target.value);
            setSelectedTeams([]); // reset khi đổi khóa
          }}
        >
          <option value="">-- Chọn khóa --</option>
          {mockCourses.map(c => (
            <option key={c.id} value={c.id}>{c.name} ({c.status})</option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label>Chọn đại đội:</label>
        <div className="border p-2 max-h-32 overflow-y-auto">
          {filteredTeams.length === 0 && <div className="text-gray-400">Chọn khóa học trước</div>}
          {filteredTeams.map(team => (
            <label key={team.id} className="block">
              <input
                type="checkbox"
                checked={selectedTeams.includes(team.id)}
                onChange={() => handleTeamToggle(team.id)}
              /> {team.name} ({team.program})
            </label>
          ))}
        </div>
      </div>
      <div className="mb-4 flex gap-2">
        <div>
          <label>Ngày bắt đầu:</label>
          <input type="date" className="block border p-2" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div>
          <label>Ngày kết thúc:</label>
          <input type="date" className="block border p-2" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
      </div>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded"
        onClick={handleCreate}
      >
        Tạo lịch (Mock)
      </button>
    </div>
  );
}
