'use client';
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

interface SchedulerProps {
  onScheduleGenerated?: (schedule: any, filePath: string) => void;
  onScheduleSuccess?: (courseId: number) => void;
}

export default function Scheduler({ onScheduleGenerated, onScheduleSuccess }: SchedulerProps) {
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

  const fetchCourses = async (forceRefresh = false) => {
    if (coursesLoaded && !forceRefresh) return;
    try {
      console.log('Fetching courses...');
      const res = await fetch('/api/courses?page=1&limit=9999');
      const data = await res.json();
      if (Array.isArray(data.data)) {
        setCourses(data.data);
        console.log('Courses updated:', data.data.length, 'items');
      } else {
        setCourses([]);
      }
      setCoursesLoaded(true);
    } catch (e) {
      console.error('Error fetching courses:', e);
      setCourses([]);
    }
  };

  const handleSelectFocus = () => {
    fetchCourses();
  };

  // Listen for refresh events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'refreshCourses' && e.newValue === 'true') {
        console.log('Refreshing courses due to storage event');
        fetchCourses(true);
        localStorage.removeItem('refreshCourses');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

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
    console.log('handleCreate called');
    console.log('selectedCourse:', selectedCourse);
    console.log('hasDateChanges():', hasDateChanges());
    
    if (!selectedCourse) {
      setMessage('Vui lòng chọn khóa học trước');
      return;
    }
    
    if (hasDateChanges()) {
      setShowConfirmOverlay(true);
    } else {
      await generateSchedule();
    }
  };

  const generateSchedule = async () => {
    console.log('generateSchedule called');
    setLoading(true);
    setMessage('');

    try {
      const requestBody: any = { courseId: selectedCourse };
      
      // Chỉ gửi dates nếu có thay đổi
      if (hasDateChanges()) {
        requestBody.startDate = startDate;
        requestBody.endDate = endDate;
      }

      console.log('Calling API with requestBody:', requestBody);
      const res = await fetch('/api/generate-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      console.log('API response status:', res.status);

      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        setMessage('Lỗi khi parse JSON: ' + jsonErr);
        return;
      }
      
      // Log toàn bộ response để debug
      console.log('Full API response:', data);
      console.log('Response has success:', data.success);
      console.log('Response data:', data.data);
      
      // Kiểm tra cả data trực tiếp và data.data
      let scheduleData = data.scheduleData || (data.data && data.data.scheduleData);
      let fileContents = data.fileContents || (data.data && data.data.fileContents);
      
      console.log('scheduleData found:', scheduleData);
      console.log('fileContents found:', fileContents);
      
      // Nếu không có scheduleData, thử lấy từ fileContents
      if (!scheduleData && fileContents) {
        const fileKeys = Object.keys(fileContents);
        console.log('fileContents keys:', fileKeys);
        if (fileKeys.length > 0) {
          const fileName = fileKeys[0];
          scheduleData = fileContents[fileName];
          console.log('Using fileContents for scheduleData:', fileName, scheduleData);
        }
      }
      
      console.log('Final scheduleData to save:', scheduleData);
      
      if (!scheduleData || !Array.isArray(scheduleData) || scheduleData.length === 0) {
        setMessage('Không có dữ liệu lịch được tạo. API response structure: ' + JSON.stringify(Object.keys(data)));
        console.error('No schedule data found. Full response:', data);
        return;
      }
      
      // Thêm courseId vào từng item trong scheduleData
      const scheduleDataWithCourseId = scheduleData.map((item: any) => ({
        ...item,
        courseId: selectedCourse
      }));
      
      // Hiển thị thông báo thành công
      setMessage('✅ Lịch đã được sắp xếp thành công! Lịch mới đã được thêm vào "Thời khóa biểu đã sắp môn học".');
      
      // Gọi callback để thông báo thành công
      if (onScheduleSuccess && selectedCourse) {
        onScheduleSuccess(selectedCourse);
      }
      
      return;
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
