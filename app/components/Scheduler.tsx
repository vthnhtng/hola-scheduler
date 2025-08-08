'use client';
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

interface SchedulerProps {
  onScheduleGenerated?: (schedule: any, filePath: string) => void;
  onScheduleSuccess?: (courseId: number, actionType?: 'generate' | 'assign') => void;
  onDeleteSuccess?: () => void;
}

export default function Scheduler({ onScheduleGenerated, onScheduleSuccess, onDeleteSuccess }: SchedulerProps) {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [originalStartDate, setOriginalStartDate] = useState('');
  const [originalEndDate, setOriginalEndDate] = useState('');
  const [message, setMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
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

  const showToastMessage = (msg: string, type: 'success' | 'error' = 'success') => {
    setMessage(msg);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleCreate = async () => {
    console.log('handleCreate called');
    console.log('selectedCourse:', selectedCourse);
    console.log('hasDateChanges():', hasDateChanges());
    
    if (!selectedCourse) {
      showToastMessage('Vui lòng chọn khóa học trước', 'error');
      return;
    }

    // Lấy thông tin course để kiểm tra status
    const selectedCourseData = courses.find(c => c.id === selectedCourse);
    const courseStatus = selectedCourseData?.status;

    console.log('Course status:', courseStatus);
    
    if (hasDateChanges()) {
      setShowConfirmOverlay(true);
    } else {
      // Phân biệt chức năng dựa trên status
      if (courseStatus === 'Undone') {
        await generateSchedule();
      } else if (courseStatus === 'Processing') {
        await assignResources();
      } else if (courseStatus === 'Done') {
        await deleteSchedule();
             } else {
         showToastMessage('Khóa học này không thể xử lý', 'error');
       }
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
         showToastMessage('Không có dữ liệu lịch được tạo. API response structure: ' + JSON.stringify(Object.keys(data)), 'error');
         console.error('No schedule data found. Full response:', data);
         return;
       }
      
      // Thêm courseId vào từng item trong scheduleData
      const scheduleDataWithCourseId = scheduleData.map((item: any) => ({
        ...item,
        courseId: selectedCourse
      }));
      
      // Gọi callback để thông báo thành công
      if (onScheduleSuccess && selectedCourse) {
        onScheduleSuccess(selectedCourse, 'generate');
      }
      
      return;
         } catch (error) {
       alert('Error generating schedule: ' + error);
       showToastMessage('Có lỗi xảy ra khi tạo lịch', 'error');
     } finally {
      setLoading(false);
    }
  };

  const assignResources = async () => {
    console.log('assignResources called');
    setLoading(true);
    setMessage('');

    try {
      const requestBody: any = { courseId: selectedCourse };
      
      // Chỉ gửi dates nếu có thay đổi
      if (hasDateChanges()) {
        requestBody.startDate = startDate;
        requestBody.endDate = endDate;
      }

      console.log('Calling assign resources API with requestBody:', requestBody);
      const res = await fetch('/api/assign-resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      console.log('API response status:', res.status);

      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        showToastMessage('Lỗi khi parse JSON: ' + jsonErr, 'error');
        return;
      }
      
      console.log('Assign resources API response:', data);
      
      if (data.success) {
        console.log('✅ Assign resources successful, calling onScheduleSuccess with assign type');
        
        // Chuyển sang tab "Thời khóa biểu đã hoàn tất" thay vì mở trang mới
        if (selectedCourse && onScheduleSuccess) {
          console.log('🔄 Calling onScheduleSuccess with courseId:', selectedCourse, 'actionType: assign');
          onScheduleSuccess(selectedCourse, 'assign');
        } else {
          console.log('❌ Missing selectedCourse or onScheduleSuccess callback');
        }
      } else {
        console.log('❌ Assign resources failed:', data.error);
        showToastMessage('Có lỗi xảy ra khi sắp xếp giảng viên và địa điểm: ' + (data.error || 'Unknown error'), 'error');
      }
      
      return;
    } catch (error) {
      alert('Error assigning resources: ' + error);
      showToastMessage('Có lỗi xảy ra khi sắp xếp giảng viên và địa điểm', 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteSchedule = async () => {
    console.log('deleteSchedule called');
    setLoading(true);
    showToastMessage('');

    try {
      const requestBody: any = { courseId: selectedCourse };
      
      // Chỉ gửi dates nếu có thay đổi
      if (hasDateChanges()) {
        requestBody.startDate = startDate;
        requestBody.endDate = endDate;
      }

      console.log('Calling delete schedule API with requestBody:', requestBody);
      const res = await fetch('/api/delete-schedules', {
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
      
      console.log('Delete schedule API response:', data);
      
      if (data.success) {
        console.log('✅ Delete schedule successful');
        
        // Trigger notification through parent
        if (onDeleteSuccess) {
          onDeleteSuccess();
        }
        
        // Refresh courses để cập nhật status
        await fetchCourses(true);
        
        // Reset form
        setSelectedCourse(null);
        setStartDate('');
        setEndDate('');
        setOriginalStartDate('');
        setOriginalEndDate('');
      } else {
        console.log('❌ Delete schedule failed:', data.error);
        showToastMessage('Có lỗi xảy ra khi xóa lịch: ' + (data.error || 'Unknown error'), 'error');
      }
      
      return;
    } catch (error) {
      console.error('Error deleting schedule:', error);
      showToastMessage('Có lỗi xảy ra khi xóa lịch', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDateChanges = async () => {
    setShowConfirmOverlay(false);
    
    // Lấy thông tin course để kiểm tra status
    const selectedCourseData = courses.find(c => c.id === selectedCourse);
    const courseStatus = selectedCourseData?.status;

    // Phân biệt chức năng dựa trên status
    if (courseStatus === 'Undone') {
      await generateSchedule();
    } else if (courseStatus === 'Processing') {
      await assignResources();
    } else {
      showToastMessage('Khóa học này đã hoàn thành hoặc không thể xử lý', 'error');
    }
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
            {loading ? 'Đang xử lý...' : (() => {
              const selectedCourseData = courses.find(c => c.id === selectedCourse);
              const courseStatus = selectedCourseData?.status;
              
              if (hasDateChanges()) {
                return 'Cập nhật & ' + (courseStatus === 'Undone' ? 'Sắp môn' : courseStatus === 'Processing' ? 'Sắp giảng viên & địa điểm' : courseStatus === 'Done' ? 'Xóa lịch' : 'Xem lịch');
              } else {
                if (courseStatus === 'Undone') return 'Sắp môn học';
                if (courseStatus === 'Processing') return 'Sắp giảng viên & địa điểm';
                if (courseStatus === 'Done') return 'Xóa lịch';
                return 'Xem lịch';
              }
            })()}
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

       {/* Toast Notification */}
       {showToast && (
         <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
           toastType === 'success' 
             ? 'bg-green-500 text-white' 
             : 'bg-red-500 text-white'
         }`}>
           <div className="flex items-center">
             <div className="flex-1">
               <p className="text-sm font-medium">{message}</p>
             </div>
             <button 
               onClick={() => setShowToast(false)}
               className="ml-4 text-white hover:text-gray-200"
             >
               ✕
             </button>
           </div>
         </div>
       )}
     </>
   );
 }
