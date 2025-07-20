'use client';
import React, { useState, useEffect } from 'react';

interface SchedulerProps {
  onScheduleGenerated?: (schedule: any, filePath: string) => void;
}

export default function Scheduler({ onScheduleGenerated }: SchedulerProps) {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [originalStartDate, setOriginalStartDate] = useState('');
  const [originalEndDate, setOriginalEndDate] = useState('');
  const [message, setMessage] = useState('');
  const [coursesLoaded, setCoursesLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirmOverlay, setShowConfirmOverlay] = useState(false);

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
    const courseId = parseInt(e.target.value);
    
    if (courseId) {
      const course = courses.find(c => c.id === courseId);
      setSelectedCourse(courseId);
      setOriginalStartDate(course?.startDate || '');
      setOriginalEndDate(course?.endDate || '');
      setStartDate(course?.startDate || '');
      setEndDate(course?.endDate || '');
    } else {
      setSelectedCourse(null);
      setOriginalStartDate('');
      setOriginalEndDate('');
      setStartDate('');
      setEndDate('');
    }
  };

  const hasDateChanges = () => {
    const hasChanges = (startDate !== originalStartDate) || (endDate !== originalEndDate);
    return hasChanges;
  };

  const handleCreate = async () => {
    
    if (hasDateChanges()) {
      setShowConfirmOverlay(true);
    } else {
      await generateSchedule();
    }
  };

  const generateSchedule = async () => {
    setLoading(true);
    setMessage('');

    try {
      const requestBody: any = { courseId: selectedCourse };
      
      // Chỉ gửi dates nếu có thay đổi
      if (hasDateChanges()) {
        requestBody.startDate = startDate;
        requestBody.endDate = endDate;
      }

      const res = await fetch('/api/generate-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        setMessage('Lỗi khi parse JSON: ' + jsonErr);
        return;
      }
      
      const apiData = data.data || {};
      let scheduleData = apiData.scheduleData;
      let fileName = 'schedule_data';
      if (!scheduleData && apiData.fileContents) {
        const fileKeys = Object.keys(apiData.fileContents);
        fileName = fileKeys[0] || 'schedule_data';
        scheduleData = apiData.fileContents[fileName];
      }
      if (!scheduleData || !Array.isArray(scheduleData) || scheduleData.length === 0) {
        setMessage('Không có dữ liệu lịch được tạo');
        return;
      }
      // Mở popup debug hiển thị JSON dữ liệu lịch học
      const debugPopup = window.open('', '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes');
      if (debugPopup) {
        debugPopup.document.body.innerHTML = '<pre>' + JSON.stringify(scheduleData, null, 2) + '</pre>';
        debugPopup.document.title = 'Debug Schedule Data';
        debugPopup.document.close();
      } else {
        setMessage('Popup debug bị chặn!');
        return;
      }
      let popupWindow;
      try {
        popupWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
        if (!popupWindow) {
          setMessage('Popup bị chặn! Hãy cho phép popup cho trang web này.');
          return;
        }
        alert('Popup opened thành công! Đang ghi nội dung...');
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Lịch giảng dạy - ${data.course?.name || 'Khóa học'}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { background: #f0f0f0; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
              .schedule-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              .schedule-table th, .schedule-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              .schedule-table th { background-color: #f2f2f2; }
              .subject-input { width: 100px; padding: 4px; }
              .save-btn { background: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; margin-top: 20px; }
              .save-btn:hover { background: #45a049; }
              .close-btn { background: #f44336; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; margin-top: 20px; margin-left: 10px; }
              .close-btn:hover { background: #da190b; }
              .team-header { background: #e8f4fd; padding: 8px; margin: 10px 0; border-left: 4px solid #2196F3; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>Lịch giảng dạy - ${data.course?.name || 'Khóa học'}</h2>
              <p><strong>Tổng số môn học:</strong> ${Array.isArray(scheduleData) ? scheduleData.length : 0}</p>
              <p><strong>Số đội:</strong> ${data.teamsCount || 0}</p>
            </div>
            <table class="schedule-table">
              <thead>
                <tr>
                  <th>Đội</th>
                  <th>Tuần</th>
                  <th>Ngày</th>
                  <th>Buổi</th>
                  <th>Môn học (ID)</th>
                  <th>Giảng viên</th>
                  <th>Địa điểm</th>
                </tr>
              </thead>
              <tbody>
                ${Array.isArray(scheduleData) ? scheduleData.map((row, idx) => `
                  <tr>
                    <td>${row.teamName || 'N/A'}</td>
                    <td>${row.week || ''}</td>
                    <td>${row.date || ''}</td>
                    <td>${row.session || ''}</td>
                    <td><input type="text" class="subject-input" value="${row.subjectId || ''}" data-index="${idx}" onchange="updateSchedule(${idx}, 'subjectId', this.value)"></td>
                    <td><input type="text" class="subject-input" value="${row.lecturerId || ''}" data-index="${idx}" onchange="updateSchedule(${idx}, 'lecturerId', this.value)"></td>
                    <td><input type="text" class="subject-input" value="${row.locationId || ''}" data-index="${idx}" onchange="updateSchedule(${idx}, 'locationId', this.value)"></td>
                  </tr>
                `).join('') : '<tr><td colspan="7">Không có dữ liệu</td></tr>'}
              </tbody>
            </table>
            <button class="save-btn" onclick="saveSchedule()">Lưu thay đổi</button>
            <button class="close-btn" onclick="window.close()">Đóng</button>
            <script>
              let scheduleData = ${JSON.stringify(scheduleData)};
              function updateSchedule(index, field, value) {
                if (scheduleData && scheduleData[index]) {
                  scheduleData[index][field] = value;
                }
              }
              function saveSchedule() {
                if (window.opener) {
                  window.opener.postMessage({
                    type: 'SAVE_SCHEDULE',
                    fileName: '${fileName}',
                    scheduleData: scheduleData
                  }, '*');
                }
                fetch('/api/schedule/save', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    filePath: '${fileName}',
                    content: scheduleData
                  })
                })
                .then(response => response.json())
                .then(data => {
                  if (data.success) {
                    alert('Lưu lịch thành công!');
                  } else {
                    alert('Có lỗi khi lưu lịch: ' + (data.error || 'Unknown error'));
                  }
                })
                .catch(error => {
                  alert('Có lỗi khi lưu lịch');
                });
              }
            </script>
          </body>
          </html>
        `;
        popupWindow.document.write(htmlContent);
        popupWindow.document.close();
        popupWindow.focus();
        alert('Đã ghi nội dung vào popup!');
      } catch (err) {
        alert('Lỗi khi mở hoặc ghi popup: ' + err);
        setMessage('Lỗi khi mở hoặc ghi popup: ' + err);
      return;
      }
      if (onScheduleGenerated) {
        onScheduleGenerated(scheduleData, fileName);
      }
      const successMessage = data.datesUpdated 
        ? `Đã cập nhật thông tin khóa học và tạo lịch thành công cho "${data.course?.name}"!`
        : `Đã tạo lịch thành công cho khóa "${data.course?.name}"!`;
      setMessage(successMessage);
      if (data.datesUpdated) {
        setOriginalStartDate(startDate);
        setOriginalEndDate(endDate);
      }
    } catch (error) {
      alert('Error generating schedule: ' + error);
      setMessage('Có lỗi xảy ra khi tạo lịch');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDateChanges = async () => {
    setShowConfirmOverlay(false);
    await generateSchedule();
  };

  const handleCancelDateChanges = () => {
    setShowConfirmOverlay(false);
    // Reset về dates gốc
    setStartDate(originalStartDate);
    setEndDate(originalEndDate);
  };

  // Thêm hàm chuyển đổi ngày cho input type='date'
  function toDateInputValue(dateString: string) {
    if (!dateString) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
    return dateString.slice(0, 10);
  }

  // Ensure the function returns JSX
  return (
    <>
    <div className="p-8 max-w-4xl mx-auto bg-white rounded shadow">
      <h2 className="text-xl font-bold text-center mb-4">Chọn khóa học sắp xếp</h2>
        {message && (
          <div className={`mb-4 ${message.includes('thành công') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </div>
        )}
      <div className="mb-4">
        <label>Chọn khóa học:</label>
        <select
          className="block w-full border p-2 rounded"
            value={selectedCourse ?? ''}
          onChange={handleSelectCourse}
          onFocus={handleSelectFocus}
            disabled={loading}
        >
          <option value="">-- Chọn khóa --</option>
          {courses.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name} {c.status ? `(${c.status})` : ''}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-4 mb-4">
        <div className="w-1/2">
            <label>Từ ngày: {hasDateChanges() && <small className="text-orange-500">(đã thay đổi)</small>}</label>
            <input 
              type="date" 
              className={`block border p-2 rounded w-full ${hasDateChanges() ? 'border-orange-300 bg-orange-50' : ''}`}
              value={toDateInputValue(startDate)} 
              onChange={e => setStartDate(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="w-1/2">
            <label>Đến ngày: {hasDateChanges() && <small className="text-orange-500">(đã thay đổi)</small>}</label>
            <input 
              type="date" 
              className={`block border p-2 rounded w-full ${hasDateChanges() ? 'border-orange-300 bg-orange-50' : ''}`}
              value={toDateInputValue(endDate)} 
              onChange={e => setEndDate(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
        <div className="flex justify-center mt-4">
          <button
            className={`px-8 py-2 rounded text-white ${loading ? 'bg-gray-400' : hasDateChanges() ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            onClick={handleCreate}
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : hasDateChanges() ? 'Cập nhật & Xem lịch' : 'Xem lịch'}
          </button>
        </div>
      </div>

      {/* Overlay xác nhận thay đổi dates */}
      {showConfirmOverlay && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.5)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: '#fff',
            padding: 32,
            borderRadius: 8,
            width: 500,
            textAlign: 'center'
          }}>
            <h3 className="text-lg font-bold mb-4">Xác nhận thay đổi</h3>
            <p className="mb-4">
              Bạn đã thay đổi ngày bắt đầu/kết thúc của khóa học.<br/>
              Điều này sẽ cập nhật thông tin khóa học trong database.<br/>
              Bạn có muốn tiếp tục?
            </p>
            <div className="mb-4 text-sm text-gray-600">
              <div>Từ ngày: <strong>{originalStartDate}</strong> → <strong className="text-orange-600">{startDate}</strong></div>
              <div>Đến ngày: <strong>{originalEndDate}</strong> → <strong className="text-orange-600">{endDate}</strong></div>
            </div>
            <div className="flex gap-3 justify-center">
              <button 
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                onClick={handleCancelDateChanges}
              >
                Hủy
              </button>
        <button
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                onClick={handleConfirmDateChanges}
        >
                Xác nhận & Tiếp tục
        </button>
      </div>
    </div>
        </div>
      )}
    </>
  );
}
