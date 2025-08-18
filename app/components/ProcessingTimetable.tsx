'use client';

import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';

interface ScheduleItem {
  week: number;
  teamId: number;
  subjectId: number;
  date: string;
  dayOfWeek: string;
  session: 'morning' | 'afternoon' | 'evening';
  lecturerId: number | null;
  locationId: number | null;
  id?: string; // Make id optional since it's added later
  _metadata?: {
    status: string;
    fileName: string;
    teamDir: string;
    teamId?: number;
    teamName?: string;
    courseId?: number;
    courseName?: string;
  };
}

// DraggableDroppableCell component giống ManualEdit
function DraggableDroppableCell({ id, children }: { id: string, children: React.ReactNode }) {
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({ id });
  const { attributes, listeners, setNodeRef: setDraggableRef, transform, isDragging } = useDraggable({ id });
  
  const setRef = (node: HTMLElement | null) => {
    setDroppableRef(node);
    setDraggableRef(node);
  };
  
  const style = {
    background: isOver ? '#e0e7ff' : undefined,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
    border: isOver ? '2px solid #3b82f6' : undefined,
    borderRadius: isOver ? '4px' : undefined,
  };
  
  return (
    <td ref={setRef} style={style} {...attributes} {...listeners} className="px-6 py-4 text-sm border-r border-gray-300">
      {children}
    </td>
  );
}

interface ProcessingTimetableProps {
  courseId?: number;
  teamId?: number;
  startDate?: string;
  endDate?: string;
  onScheduleUpdate?: (schedules: ScheduleItem[]) => void;
}

const ProcessingTimetable: React.FC<ProcessingTimetableProps> = ({
  courseId,
  teamId,
  startDate,
  endDate,
  onScheduleUpdate
}) => {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editData, setEditData] = useState<{subjectId: string, lecturerId: string, locationId: string}>({
    subjectId: '',
    lecturerId: '',
    locationId: ''
  });

  // State để quản lý các ngày mở rộng (extended dates)
  const [extendedDates, setExtendedDates] = useState<string[]>([]);

  // Load reference data
  useEffect(() => {
    Promise.all([
      fetch("/api/subjects").then(res => res.json()).then(res => res.data || []),
      fetch("/api/lecturers").then(res => res.json()).then(res => res.data || []),
      fetch("/api/locations").then(res => res.json()).then(res => res.data || []),
      fetch("/api/teams").then(res => res.json()).then(res => res.data || []),
    ]).then(([subjectsData, lecturersData, locationsData, teamsData]) => {
      setSubjects(subjectsData);
      setLecturers(lecturersData);
      setLocations(locationsData);
      setTeams(teamsData);
    }).catch(console.error);
  }, []);

  // Thêm hàm tạo id duy nhất cho mỗi schedule
  const makeScheduleId = (s: ScheduleItem) => {
    const id = `${s.date.split('T')[0]}-${s.session}-${s.teamId}`;
    console.log('Created schedule ID:', { date: s.date, session: s.session, teamId: s.teamId, id });
    return id;
  };

  // Load schedules với status = 'scheduled' (đã sắp môn nhưng chưa sắp giảng viên)
  useEffect(() => {
    if ((!startDate || !endDate) && !courseId) return;

    setLoading(true);
    setError(null);

    let url = '';
    let params = new URLSearchParams();

    if (courseId) {
      url = '/api/get-schedules-by-course';
      params.append('courseId', courseId.toString());
      params.append('status', 'scheduled');
    } else {
      url = '/api/get-schedules';
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (teamId) params.append('teamId', teamId.toString());
      params.append('status', 'scheduled');
    }

    fetch(`${url}?${params}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // Chỉ lấy các lịch đã có subjectId (đã sắp môn) nhưng chưa có lecturerId
          const processingSchedules = data.data.filter((schedule: ScheduleItem) => 
            schedule.subjectId && (!schedule.lecturerId || schedule.lecturerId === null)
          ).map((s: ScheduleItem) => ({ ...s, id: makeScheduleId(s) }));
          console.log('Loaded schedules:', processingSchedules);
          setSchedules(processingSchedules);
        } else {
          setError(data.error || 'Lỗi khi tải dữ liệu');
        }
      })
      .catch(err => {
        console.error('Error loading schedules:', err);
        setError('Lỗi kết nối khi tải dữ liệu');
      })
      .finally(() => setLoading(false));
  }, [courseId, teamId, startDate, endDate]);

  // Tự động xóa ngày mở rộng không sử dụng khi schedules thay đổi
  useEffect(() => {
    if (schedules.length > 0) {
      setTimeout(() => removeUnusedExtendedDates(), 200);
    }
  }, [schedules]);

  const getSubjectName = (subjectId: number) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.name || subject?.subjectName || `Subject ${subjectId}`;
  };

  const getLecturerName = (lecturerId: number | null) => {
    if (!lecturerId) return 'TBA';
    const lecturer = lecturers.find(l => l.id === lecturerId);
    return lecturer?.fullName || lecturer?.name || `Lecturer ${lecturerId}`;
  };

  const getLocationName = (locationId: number | null) => {
    if (!locationId) return 'TBA';
    const location = locations.find(l => l.id === locationId);
    return location?.name || location?.locationName || `Location ${locationId}`;
  };

  const getSessionLabel = (session: string) => {
    const labels = {
      morning: 'Sáng',
      afternoon: 'Chiều', 
      evening: 'Tối'
    };
    return labels[session as keyof typeof labels] || session;
  };

  const formatDateToVietnamese = (dateString: string) => {
    const date = parseISO(dateString);
    const dayOfWeek = format(date, 'EEEE');
    const day = format(date, 'dd');
    const month = format(date, 'MM');
    
    const dayNames = {
      'Monday': 'Thứ Hai',
      'Tuesday': 'Thứ Ba', 
      'Wednesday': 'Thứ Tư',
      'Thursday': 'Thứ Năm',
      'Friday': 'Thứ Sáu',
      'Saturday': 'Thứ Bảy',
      'Sunday': 'Chủ Nhật'
    };
    
    return `${dayNames[dayOfWeek as keyof typeof dayNames]}, ngày ${day} tháng ${month}`;
  };

  const getTeamName = (teamId: number) => {
    const team = teams.find(t => t.id === teamId);
    return team?.name || `Đại đội ${teamId}`;
  };

  // Edit functions
  const handleCellEdit = (cellId: string, schedule: ScheduleItem | null) => {
    setEditingCell(cellId);
    if (schedule) {
      setEditData({
        subjectId: schedule.subjectId?.toString() || '',
        lecturerId: schedule.lecturerId?.toString() || '',
        locationId: schedule.locationId?.toString() || ''
      });
    } else {
      setEditData({ subjectId: '', lecturerId: '', locationId: '' });
    }
  };

  const handleSaveEdit = (cellId: string, date: string, session: string, teamId: number) => {
    const [dragDate, dragSession, dragTeamId] = cellId.split('-');
    
    setSchedules(prev => {
      const newSchedules = [...prev];
      const existingIndex = newSchedules.findIndex(s => 
        s.date.split('T')[0] === dragDate && s.session === dragSession && s.teamId.toString() === dragTeamId
      );

      const newSchedule: ScheduleItem = {
        week: 1,
        teamId: parseInt(dragTeamId),
        subjectId: parseInt(editData.subjectId) || 0,
        date: dragDate,
        dayOfWeek: new Date(dragDate).toLocaleDateString('en-US', { weekday: 'short' }),
        session: dragSession as 'morning' | 'afternoon' | 'evening',
        lecturerId: editData.lecturerId ? parseInt(editData.lecturerId) : null,
        locationId: editData.locationId ? parseInt(editData.locationId) : null
      };

      if (existingIndex !== -1) {
        // Update existing schedule
        newSchedules[existingIndex] = { ...newSchedules[existingIndex], ...newSchedule };
      } else {
        // Add new schedule
        newSchedules.push(newSchedule);
      }

      if (onScheduleUpdate) onScheduleUpdate(newSchedules);
      return newSchedules;
    });

    setEditingCell(null);
    setEditData({ subjectId: '', lecturerId: '', locationId: '' });
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditData({ subjectId: '', lecturerId: '', locationId: '' });
  };

  // DND CONTEXT APPROACH - GIỐNG MANUAL EDIT
  const handleDragEnd = (event: any) => {
    console.log('🚀 handleDragEnd called', event);
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      console.log('❌ NO DROP TARGET OR SAME CELL');
      return;
    }

    console.log('📋 Drag from:', active.id, 'to:', over.id);

    // Parse IDs giống ManualEdit: "date-session-teamId"
    const parseId = (id: string) => {
      const parts = id.split('-');
      const date = parts.slice(0, 3).join('-'); // 2025-09-01
      const session = parts[3]; // morning
      const teamId = parts[4]; // 1
      return { date, session, teamId };
    };

    const from = parseId(String(active.id));
    const to = parseId(String(over.id));

    // Chỉ swap cùng team
    if (from.teamId !== to.teamId) {
      console.log('Không cho phép swap giữa các đại đội');
      return;
    }

    // Kiểm tra không cho phép kéo thả vào ngày Chủ nhật
    if (isSunday(to.date)) {
      console.log('❌ Không cho phép kéo thả vào ngày Chủ nhật');
      return;
    }

    // Đảm bảo có đủ ngày mở rộng cho ngày đích
    ensureExtendedDates(to.date);

    setSchedules(prev => {
      const newSchedules = prev.map(item => ({ ...item })); // Deep copy

      const fromIdx = newSchedules.findIndex(item => 
        item.date.split('T')[0] === from.date && 
        item.session === from.session && 
        item.teamId.toString() === from.teamId
      );
      
      const toIdx = newSchedules.findIndex(item => 
        item.date.split('T')[0] === to.date && 
        item.session === to.session && 
        item.teamId.toString() === to.teamId
      );

      // Tìm schedule cho vị trí đích (có thể không tồn tại nếu là cell trống)
      const toSchedule = newSchedules.find(item => 
        item.date.split('T')[0] === to.date && 
        item.session === to.session && 
        item.teamId.toString() === to.teamId
      );

      // Nếu không tìm thấy schedule ở vị trí đích (cell trống), tạo schedule mới
      if (toIdx === -1 && fromIdx !== -1) {
        console.log('📥 Di chuyển schedule từ cell có dữ liệu sang cell trống');
        console.log('📍 From:', from, 'To:', to);
        console.log('📊 FromIdx:', fromIdx, 'ToIdx:', toIdx);
        
        // Tạo schedule mới cho vị trí đích
        const newSchedule = {
          ...newSchedules[fromIdx],
          date: to.date,
          dayOfWeek: getDayOfWeek(to.date),
          session: to.session as 'morning' | 'afternoon' | 'evening'
        };
        
        console.log('🆕 New schedule:', newSchedule);
        
        // Xóa schedule cũ
        newSchedules.splice(fromIdx, 1);
        
        // Thêm schedule mới
        newSchedules.push(newSchedule);
        
                 console.log('✅ Schedule moved successfully');
         if (onScheduleUpdate) onScheduleUpdate(newSchedules);
         
         // Xóa ngày mở rộng không sử dụng sau khi di chuyển
         setTimeout(() => removeUnusedExtendedDates(), 100);
         
         return newSchedules;
      }

      // Nếu cả hai vị trí đều có schedule, swap như bình thường
      if (fromIdx !== -1 && toIdx !== -1) {
        console.log('🔄 Swap giữa hai cell có dữ liệu');
        
        // Swap date, dayOfWeek, session (giữ nguyên teamId, subjectId)
        const temp = {
          date: newSchedules[fromIdx].date,
          dayOfWeek: newSchedules[fromIdx].dayOfWeek,
          session: newSchedules[fromIdx].session
        };

        newSchedules[fromIdx].date = newSchedules[toIdx].date;
        newSchedules[fromIdx].dayOfWeek = newSchedules[toIdx].dayOfWeek;
        newSchedules[fromIdx].session = newSchedules[toIdx].session;

        newSchedules[toIdx].date = temp.date;
        newSchedules[toIdx].dayOfWeek = temp.dayOfWeek;
        newSchedules[toIdx].session = temp.session;
        
        if (onScheduleUpdate) onScheduleUpdate(newSchedules);
        
        // Xóa ngày mở rộng không sử dụng sau khi swap
        setTimeout(() => removeUnusedExtendedDates(), 100);
        
        return newSchedules;
      }

      // Nếu vị trí nguồn không có schedule (cell trống), không làm gì
      if (fromIdx === -1) {
        console.log('❌ Không có schedule để di chuyển');
        return newSchedules;
      }

      console.log('❌ Không thể xử lý drag & drop');
      return newSchedules;
    });
  };

  // Helper function để lấy dayOfWeek từ date
  const getDayOfWeek = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  };

  // Helper function để kiểm tra có phải ngày Chủ nhật không
  const isSunday = (dateString: string) => {
    const date = new Date(dateString);
    return date.getDay() === 0; // 0 = Sunday
  };

  // Helper function để tạo ngày mới
  const createNewDate = (baseDate: string, daysToAdd: number = 1) => {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + daysToAdd);
    return date.toISOString().split('T')[0];
  };

  // Helper function để thêm ngày mở rộng
  const addExtendedDate = (targetDate: string) => {
    if (!extendedDates.includes(targetDate)) {
      setExtendedDates(prev => [...prev, targetDate]);
      console.log('📅 Thêm ngày mở rộng:', targetDate);
    }
  };

  // Helper function để xóa ngày mở rộng không sử dụng
  const removeUnusedExtendedDates = () => {
    // Tạo danh sách tất cả các ngày có schedule thực tế
    const datesWithSchedules = schedules.map(s => s.date.split('T')[0]);
    const uniqueDatesWithSchedules = [...new Set(datesWithSchedules)].sort();
    
    if (uniqueDatesWithSchedules.length === 0) {
      // Nếu không có schedule nào, xóa tất cả ngày mở rộng
      setExtendedDates([]);
      return;
    }
    
    // Tìm ngày đầu tiên và cuối cùng có schedule thực tế
    const firstDateWithSchedule = uniqueDatesWithSchedules[0];
    const lastDateWithSchedule = uniqueDatesWithSchedules[uniqueDatesWithSchedules.length - 1];
    
    // Xóa các ngày mở rộng không có schedule và nằm ngoài khoảng từ ngày đầu đến ngày cuối có schedule
    setExtendedDates(prev => {
      const newExtendedDates = prev.filter(date => {
        const dateObj = new Date(date);
        const firstDateObj = new Date(firstDateWithSchedule);
        const lastDateObj = new Date(lastDateWithSchedule);
        
        // Giữ lại ngày mở rộng chỉ khi nó nằm trong khoảng từ ngày đầu đến ngày cuối có schedule
        return dateObj >= firstDateObj && dateObj <= lastDateObj;
      });
      
      if (newExtendedDates.length !== prev.length) {
        console.log('🗑️ Xóa ngày mở rộng không sử dụng:', prev.filter(d => !newExtendedDates.includes(d)));
        console.log('📊 Khoảng schedule hiện tại:', firstDateWithSchedule, 'đến', lastDateWithSchedule);
      }
      
      return newExtendedDates;
    });
  };

  // Helper function để tạo các ngày mở rộng khi cần
  const ensureExtendedDates = (targetDate: string) => {
    // Tạo groupedByDate tạm thời để tính toán
    const tempGroupedByDate = schedules.reduce((acc, schedule) => {
      if (!acc[schedule.date]) {
        acc[schedule.date] = {
          date: schedule.date,
          sessions: {}
        };
      }
      return acc;
    }, {} as Record<string, { date: string; sessions: Record<string, Record<number, ScheduleItem>> }>);

    const allDates = [...Object.keys(tempGroupedByDate), ...extendedDates];
    const sortedAllDates = allDates.sort();
    
    if (sortedAllDates.length === 0) return;

    const firstDate = sortedAllDates[0];
    const lastDate = sortedAllDates[sortedAllDates.length - 1];
    const targetDateObj = new Date(targetDate);
    const firstDateObj = new Date(firstDate);
    const lastDateObj = new Date(lastDate);

    // Nếu ngày đích nằm ngoài phạm vi hiện tại, thêm ngày mở rộng
    if (targetDateObj < firstDateObj) {
      // Kéo lên trên - thêm ngày trước ngày đầu tiên
      let currentDate = new Date(firstDate);
      while (currentDate > targetDateObj) {
        currentDate.setDate(currentDate.getDate() - 1);
        const newDate = currentDate.toISOString().split('T')[0];
        addExtendedDate(newDate);
      }
      console.log('📅 Thêm ngày mở rộng phía trên cho:', targetDate);
    } else if (targetDateObj > lastDateObj) {
      // Kéo xuống dưới - thêm ngày sau ngày cuối cùng
      let currentDate = new Date(lastDate);
      while (currentDate < targetDateObj) {
        currentDate.setDate(currentDate.getDate() + 1);
        const newDate = currentDate.toISOString().split('T')[0];
        addExtendedDate(newDate);
      }
      console.log('📅 Thêm ngày mở rộng phía dưới cho:', targetDate);
    }
  };

  // Helper function để thêm ngày ở đầu lịch
  const addDayAtBeginning = () => {
    const allDates = [...Object.keys(groupedByDate), ...extendedDates];
    const sortedAllDates = allDates.sort();
    
    if (sortedAllDates.length === 0) return;
    
    const firstDate = sortedAllDates[0];
    const newDate = createNewDate(firstDate, -1);
    
    // Cho phép thêm ngày Chủ nhật
    addExtendedDate(newDate);
    console.log('📅 Thêm ngày ở đầu lịch:', newDate, isSunday(newDate) ? '(Chủ nhật)' : '');
  };

  // Helper function để thêm ngày ở cuối lịch
  const addDayAtEnd = () => {
    const allDates = [...Object.keys(groupedByDate), ...extendedDates];
    const sortedAllDates = allDates.sort();
    
    if (sortedAllDates.length === 0) return;
    
    const lastDate = sortedAllDates[sortedAllDates.length - 1];
    const newDate = createNewDate(lastDate, 1);
    
    // Cho phép thêm ngày Chủ nhật
    addExtendedDate(newDate);
    console.log('📅 Thêm ngày ở cuối lịch:', newDate, isSunday(newDate) ? '(Chủ nhật)' : '');
  };



  // Group schedules by date
  const groupedByDate = schedules.reduce((acc, schedule) => {
    if (!acc[schedule.date]) {
      acc[schedule.date] = {
        date: schedule.date,
        sessions: {}
      };
    }
    if (!acc[schedule.date].sessions[schedule.session]) {
      acc[schedule.date].sessions[schedule.session] = {};
    }
    acc[schedule.date].sessions[schedule.session][schedule.teamId] = schedule;
    return acc;
  }, {} as Record<string, { date: string; sessions: Record<string, Record<number, ScheduleItem>> }>);

  // Tạo danh sách tất cả các ngày trong khoảng thời gian (bao gồm cả Chủ nhật)
  const createFullDateRange = () => {
    if (schedules.length === 0) return [];
    const dates = schedules.map(s => s.date.split('T')[0]);
    const sortedDates = [...new Set(dates)].sort();
    if (sortedDates.length === 0) return [];
    const startDate = new Date(sortedDates[0]);
    const endDate = new Date(sortedDates[sortedDates.length - 1]);
    const allDatesInRange = [];
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      allDatesInRange.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return allDatesInRange;
  };

  // Kết hợp ngày gốc, ngày mở rộng và tất cả ngày trong khoảng thời gian
  const baseDates = createFullDateRange();
  const allDates = [...new Set([...baseDates, ...Object.keys(groupedByDate), ...extendedDates])];
  const sortedDates = allDates.sort();

  // Get unique teams
  const uniqueTeams = Array.from(new Set(schedules.map(s => s.teamId))).sort();

  console.log('Grouped schedules:', groupedByDate);
  console.log('Sorted dates:', sortedDates);
  console.log('Extended dates:', extendedDates);
  console.log('Unique teams:', uniqueTeams);
  console.log('Total schedules:', schedules.length);
  console.log('Schedules with IDs:', schedules.map(s => ({ id: s.id, date: s.date, session: s.session, teamId: s.teamId, subjectId: s.subjectId })));

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-600">Đang tải dữ liệu...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-700">{error}</div>
      </div>
    );
  }

  if (schedules.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <div className="text-gray-600">Không có lịch nào đang chờ sắp giảng viên</div>
      </div>
    );
  }

     return (
     <div className="bg-white rounded-lg shadow-sm border m-4">
       

       {/* Success Notification */}
       {saveSuccess && (
         <div className="bg-green-100 border-l-4 border-green-500 p-4 mb-4 animate-pulse">
           <div className="flex items-center">
             <div className="flex-1">
               <p className="text-sm text-green-700 font-medium">
                 Lưu thành công! Thời khóa biểu đang được cập nhật ...
               </p>
             </div>
           </div>
         </div>
       )}

      <div className="px-6 py-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          THỜI KHÓA BIỂU ĐÃ SẮP MÔN HỌC
        </h3>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            {schedules.length} lịch cần sắp giảng viên
          </div>
                     <button
             className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
             disabled={saving}
             onClick={async () => {
               try {
                 setSaving(true);
                 setError(null);
                 const res = await fetch('/api/save-schedules', {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ schedules })
                 });
                 const data = await res.json();
                 if (!data.success) throw new Error(data.error || 'Lỗi khi lưu file');
                 
                                   // Show success notification
                  setSaveSuccess(true);
                  
                  // Tự động xóa ngày mở rộng không sử dụng sau khi lưu
                  setTimeout(() => {
                    removeUnusedExtendedDates();
                  }, 500);
                  
                                     // Fetch lại dữ liệu thay vì refresh trang
                   setTimeout(async () => {
                     setSaveSuccess(false);
                     setLoading(true); // Sử dụng loading overlay có sẵn
                     
                     try {
                       let url = '';
                       let params = new URLSearchParams();

                       if (courseId) {
                         url = '/api/get-schedules-by-course';
                         params.append('courseId', courseId.toString());
                         params.append('status', 'scheduled');
                       } else {
                         url = '/api/get-schedules';
                         if (startDate) params.append('startDate', startDate);
                         if (endDate) params.append('endDate', endDate);
                         if (teamId) params.append('teamId', teamId.toString());
                         params.append('status', 'scheduled');
                       }

                       const res = await fetch(`${url}?${params}`);
                       const data = await res.json();
                       
                       if (data.success) {
                         // Chỉ lấy các lịch đã có subjectId (đã sắp môn) nhưng chưa có lecturerId
                         const processingSchedules = data.data.filter((schedule: ScheduleItem) => 
                           schedule.subjectId && (!schedule.lecturerId || schedule.lecturerId === null)
                         ).map((s: ScheduleItem) => ({ ...s, id: makeScheduleId(s) }));
                         
                         console.log('Reloaded schedules:', processingSchedules);
                         setSchedules(processingSchedules);
                         setExtendedDates([]); // Reset extended dates
                       } else {
                         setError(data.error || 'Lỗi khi tải lại dữ liệu');
                       }
                     } catch (err) {
                       console.error('Error reloading schedules:', err);
                       setError('Lỗi kết nối khi tải lại dữ liệu');
                     } finally {
                       setLoading(false); // Tắt loading overlay
                     }
                   }, 2000);
               } catch (err: any) {
                 setError(err.message || 'Lỗi khi lưu file');
               } finally {
                 setSaving(false);
               }
             }}
           >
             {saving ? 'ĐANG LƯU...' : 'LƯU THAY ĐỔI'}
           </button>
        </div>
      </div>
      
                      <div className="p-4">
           {/* Button thêm ngày ở đầu lịch */}
           <div className="flex justify-center mb-4">
             <button
               onClick={addDayAtBeginning}
               className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
             >
               <span>+</span>
               Thêm ngày ở đầu lịch
             </button>
           </div>
           
           <div className="overflow-x-auto border border-gray-300 rounded-lg">
             <DndContext onDragEnd={handleDragEnd}>
               <table className="border-collapse border-2 border-gray-300" style={{ width: '800px', tableLayout: 'fixed' }}>
          <thead className="bg-blue-50">
            <tr>
                             <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300 sticky left-0 bg-blue-50 z-10" style={{ width: '150px' }}>
                 NGÀY THÁNG
               </th>
               <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300 sticky left-0 bg-blue-50 z-10" style={{ width: '100px' }}>
                 BUỔI HỌC
               </th>
                             {uniqueTeams.length > 0 ? (
                 uniqueTeams.map(teamId => (
                   <th key={teamId} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300" style={{ width: `${(800 - 250) / uniqueTeams.length}px` }}>
                     {getTeamName(teamId)}
                   </th>
                 ))
               ) : (
                 <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300" style={{ width: '550px' }}>
                   ĐẠI ĐỘI
                 </th>
               )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
                         {sortedDates.map(date => {
               const dateData = groupedByDate[date] || { date, sessions: {} };
               const isExtendedDate = extendedDates.includes(date);
               const isSundayDate = isSunday(date);
              
              // Nếu là ngày Chủ nhật, chỉ hiển thị 1 dòng
              if (isSundayDate) {
                return (
                  <tr key={`${date}-sunday`} className={`hover:bg-gray-50 ${isExtendedDate ? 'extended-date-row' : ''}`}>
                                                                 <td className={`px-3 py-4 whitespace-nowrap text-sm border-r border-gray-300 ${isExtendedDate ? 'text-blue-600 font-semibold bg-blue-50' : 'text-gray-900'} sticky left-0 z-10`} style={{ backgroundColor: isExtendedDate ? '#dbeafe' : 'white', width: '150px' }}>
                         {formatDateToVietnamese(date)}
                         {isExtendedDate && <span className="ml-1 text-xs text-blue-500">(Mở rộng)</span>}
                       </td>
                                         <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-600 border-r sticky left-0 bg-white z-10" style={{ width: '100px' }}>
                       Chủ nhật
                     </td>
                                         {uniqueTeams.length > 0 ? (
                       uniqueTeams.map(teamId => {
                         const cellId = `${date}-sunday-${teamId}`;
                         
                         return (
                           <DraggableDroppableCell key={teamId} id={cellId}>
                             <div className="sunday-cell" style={{ width: '100%' }}>
                               <div>Chủ nhật</div>
                             </div>
                           </DraggableDroppableCell>
                         );
                       })
                     ) : (
                       <td colSpan={1} className="sunday-cell" style={{ width: '550px' }}>
                         <div>Chủ nhật</div>
                       </td>
                     )}
                  </tr>
                );
              }
             
              // Nếu không phải ngày Chủ nhật, hiển thị 3 dòng như bình thường
              const sessions = ['morning', 'afternoon', 'evening'] as const;
             
              return sessions.map((session, sessionIndex) => {
                const sessionData = dateData.sessions[session] || {};
                const isFirstSession = sessionIndex === 0;
                
                return (
                  <tr key={`${date}-${session}`} className={`hover:bg-gray-50 ${isExtendedDate ? 'extended-date-row' : ''}`}>
                                         {isFirstSession && (
                       <td className={`px-3 py-4 whitespace-nowrap text-sm border-r border-gray-300 ${isExtendedDate ? 'text-blue-600 font-semibold bg-blue-50' : 'text-gray-900'} sticky left-0 z-10`} rowSpan={3} style={{ backgroundColor: isExtendedDate ? '#dbeafe' : 'white', width: '150px' }}>
                         {formatDateToVietnamese(date)}
                         {isExtendedDate && <span className="ml-1 text-xs text-blue-500">(Mở rộng)</span>}
                       </td>
                     )}
                                                                <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-600 border-r border-gray-300 sticky left-0 bg-white z-10" style={{ width: '100px' }}>
                       {getSessionLabel(session)}
                     </td>
                                         {uniqueTeams.length > 0 ? (
                       uniqueTeams.map(teamId => {
                         const schedule = sessionData[teamId];
                         const cellId = `${date}-${session}-${teamId}`;
                         const isSundayDate = isSunday(date);
                         
                         return (
                           <DraggableDroppableCell key={teamId} id={cellId}>
                          {editingCell === cellId ? (
                            <div className="schedule-cell-edit">
                              <div className="edit-field">
                                <label>Học phần:</label>
                                <select
                                  value={editData.subjectId}
                                  onChange={(e) => setEditData(prev => ({ ...prev, subjectId: e.target.value }))}
                                  className="edit-select"
                                >
                                  <option value="">Chọn môn học</option>
                                  {subjects.map((subject) => (
                                    <option key={subject.id} value={subject.id}>
                                      {subject.name || subject.subjectName}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="edit-field">
                                <label>Giảng viên:</label>
                                <select
                                  value={editData.lecturerId}
                                  onChange={(e) => setEditData(prev => ({ ...prev, lecturerId: e.target.value }))}
                                  className="edit-select"
                                >
                                  <option value="">Chọn giảng viên</option>
                                  {lecturers.map((lecturer) => (
                                    <option key={lecturer.id} value={lecturer.id}>
                                      {lecturer.name || lecturer.fullName}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="edit-field">
                                <label>Địa điểm:</label>
                                <select
                                  value={editData.locationId}
                                  onChange={(e) => setEditData(prev => ({ ...prev, locationId: e.target.value }))}
                                  className="edit-select"
                                >
                                  <option value="">Chọn địa điểm</option>
                                  {locations.map((location) => (
                                    <option key={location.id} value={location.id}>
                                      {location.name || location.locationName}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="edit-buttons">
                                <button
                                  onClick={() => handleSaveEdit(cellId, date, session, teamId)}
                                  className="save-btn"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="cancel-btn"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                                                     ) : (
                             <div 
                               className={`${!schedule ? "schedule-cell-empty" : "schedule-cell"} ${isSundayDate ? "sunday-cell" : "clickable"}`}
                               onClick={() => !isSundayDate && handleCellEdit(cellId, schedule)}
                             >
                                                                                            {!schedule ? (
                                 <div>{isSundayDate ? "Chủ nhật" : "Lịch trống"}</div>
                               ) : (
                                 <div className="subject-name">
                                   {getSubjectName(schedule.subjectId)}
                                 </div>
                               )}
                            </div>
                          )}
                                                 </DraggableDroppableCell>
                       );
                     })
                                        ) : (
                       <td colSpan={1} className="schedule-cell-empty" style={{ width: '550px' }}>
                         <div>Lịch trống</div>
                       </td>
                     )}
                  </tr>
                );
              });
            })}
          </tbody>
                              </table>
       </DndContext>
     </div>
     
     {/* Button thêm ngày ở cuối lịch */}
     <div className="flex justify-center mt-4">
       <button
         onClick={addDayAtEnd}
         className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
       >
         <span>+</span>
         Thêm ngày ở cuối lịch
       </button>
     </div>
   </div>


      <style>{`
        .schedule-cell {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          min-height: 50px;
          text-align: center;
          padding: 4px 2px;
          gap: 0px;
        }
        
        .schedule-cell-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          min-height: 50px;
          color: #6b7280;
          font-style: italic;
          text-align: center;
          font-size: 12px;
          font-weight: 600;
          border: 2px dashed #d1d5db;
          border-radius: 4px;
          background-color: #f9fafb;
          transition: all 0.2s;
        }
        
        .schedule-cell-empty:hover {
          border-color: #3b82f6;
          background-color: #eff6ff;
          color: #1e40af;
        }
        
        .field-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2px;
          width: 100%;
          margin-bottom: 0px;
        }
        
        .label {
          font-weight: 600;
          color: #1e40af;
          font-size: 11px;
          white-space: nowrap;
          font-family: inherit;
        }
        
        .value {
          color: #1e40af;
          font-size: 11px;
          font-weight: 600;
          text-align: center;
          word-wrap: break-word;
          flex: 1;
          font-family: inherit;
        }
        
        .subject-name {
          color: #1e40af;
          font-weight: 700;
        }
        
        .tba-text {
          color: #1e40af;
          font-weight: 600;
          font-style: normal;
        }
        
        .clickable {
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .clickable:hover {
          background-color: #f3f4f6;
          transform: scale(1.02);
        }
        
        .schedule-cell-edit {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          min-height: 60px;
          text-align: center;
          padding: 4px;
          gap: 2px;
          background-color: #fef3c7;
          border: 2px solid #f59e0b;
          border-radius: 4px;
        }
        
        .edit-field {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          margin-bottom: 1px;
        }
        
        .edit-field label {
          font-weight: 600;
          color: #1e40af;
          font-size: 9px;
          margin-bottom: 1px;
        }
        
        .edit-select {
          width: 100%;
          font-size: 9px;
          padding: 1px 2px;
          border: 1px solid #d1d5db;
          border-radius: 2px;
          background-color: white;
        }
        
        .edit-buttons {
          display: flex;
          gap: 2px;
          margin-top: 2px;
        }
        
        .save-btn, .cancel-btn {
          width: 16px;
          height: 16px;
          border: none;
          border-radius: 2px;
          font-size: 10px;
          font-weight: bold;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .save-btn {
          background-color: #10b981;
          color: white;
        }
        
        .cancel-btn {
          background-color: #ef4444;
          color: white;
        }
        
        .save-btn:hover {
          background-color: #059669;
        }
        
                 .cancel-btn:hover {
           background-color: #dc2626;
         }
         
                   /* Styles cho ngày mở rộng */
          .extended-date-row {
            background-color: #f0f9ff;
            border-left: 4px solid #3b82f6;
          }
          
          .extended-date-row:hover {
            background-color: #e0f2fe;
          }
          
                     /* Styles cho ngày Chủ nhật */
           .sunday-cell {
             display: flex;
             align-items: center;
             justify-content: center;
             height: 100%;
             min-height: 50px;
             color: #dc2626;
             font-style: italic;
             text-align: center;
             font-size: 12px;
             font-weight: 600;
             border: 2px dashed #fca5a5;
             border-radius: 4px;
             background-color: #fef2f2;
             transition: all 0.2s;
             cursor: not-allowed;
             opacity: 0.7;
           }
           
           .sunday-cell:hover {
             border-color: #f87171;
             background-color: #fee2e2;
             color: #b91c1c;
             transform: none;
           }
      `}</style>
    </div>
  );
};

export default ProcessingTimetable; 