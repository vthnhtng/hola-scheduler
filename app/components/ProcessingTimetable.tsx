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

// DraggableDroppableCell component with improved visual feedback
function DraggableDroppableCell({ id, children }: { id: string, children: React.ReactNode }) {
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({ id });
  const { attributes, listeners, setNodeRef: setDraggableRef, transform, isDragging } = useDraggable({ id });
  
  const setRef = (node: HTMLElement | null) => {
    setDroppableRef(node);
    setDraggableRef(node);
  };
  
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: isDragging ? 1000 : 'auto',
    position: isDragging ? ('relative' as const) : ('static' as const),
  };
  
  return (
    <td 
      ref={setRef} 
      style={style} 
      {...attributes} 
      {...listeners} 
      className={`${isDragging ? 'dragging' : ''} ${isOver ? 'droppable' : ''}`}
    >
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
  onShowNotification?: (message: string) => void;
}

const ProcessingTimetable: React.FC<ProcessingTimetableProps> = ({
  courseId,
  teamId,
  startDate,
  endDate,
  onScheduleUpdate,
  onShowNotification
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

  const getSubjectName = (subjectId: number | null) => {
    if (!subjectId) return 'Trống';
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
    
    // Debug logging for location lookup
    if (!location && locationId) {
      console.warn(`Location ID ${locationId} not found in locations array. Available IDs:`, 
        locations.map(l => l.id).join(', '));
    }
    
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

  // Get unique teams
  const uniqueTeams = Array.from(new Set(schedules.map(s => s.teamId))).sort();

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

  // Helper function để check ngày có content hay không
  const isDateEmpty = (date: string) => {
    const dateData = groupedByDate[date];
    if (!dateData) return true;
    
    const sessions = ['morning', 'afternoon', 'evening'];
    return sessions.every(session => {
      const sessionData = dateData.sessions[session] || {};
      return uniqueTeams.every(teamId => {
        const schedule = sessionData[teamId];
        return !schedule || !schedule.subjectId;
      });
    });
  };

  // Kết hợp ngày gốc, ngày mở rộng và tất cả ngày trong khoảng thời gian
  const baseDates = createFullDateRange();
  const allDates = [...new Set([...baseDates, ...Object.keys(groupedByDate), ...extendedDates])];
  const filteredDates = allDates.filter(date => !isDateEmpty(date));
  const sortedDates = filteredDates.sort();

  console.log('Grouped schedules:', groupedByDate);
  console.log('Sorted dates:', sortedDates);
  console.log('Extended dates:', extendedDates);
  console.log('Unique teams:', uniqueTeams);
  console.log('Total schedules:', schedules.length);
  console.log('Schedules with IDs:', schedules.map(s => ({ id: s.id, date: s.date, session: s.session, teamId: s.teamId, subjectId: s.subjectId })));

  if (loading) {
    return (
      <div className="loading-state">
        <div className="text-gray-600">Đang tải dữ liệu...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <div>{error}</div>
      </div>
    );
  }

  if (schedules.length === 0) {
    return (
      <div className="empty-state">
        <div>Không có lịch nào đang chờ sắp giảng viên</div>
      </div>
    );
  }

     return (
     <div className="bg-white rounded-lg shadow-lg border border-gray-200 m-4 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col">
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            THỜI KHÓA BIỂU ĐÃ SẮP MÔN HỌC
          </h3>
          <div className="text-sm text-gray-600">
            {schedules.length} lịch cần sắp giảng viên
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            className="save-changes-btn"
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
                
                // Show success notification through parent
                if (onShowNotification) {
                  onShowNotification('Lưu thành công! Thời khóa biểu đang được cập nhật...');
                }
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
      
      <div className="timetable-container p-4">
        {/* Button thêm ngày ở đầu lịch */}
        <div className="flex justify-center mb-4">
          <button
            onClick={addDayAtBeginning}
            className="add-day-btn"
          >
            <span className="text-lg">+</span>
            Thêm ngày ở đầu lịch
          </button>
        </div>
        
        <DndContext onDragEnd={handleDragEnd}>
          <table className="timetable-table">
            <thead className="timetable-header">
              <tr>
                <th>NGÀY THÁNG</th>
                <th>BUỔI HỌC</th>
                {uniqueTeams.map(teamId => (
                  <th key={teamId}>
                    {getTeamName(teamId)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="timetable-body">
              {sortedDates.map(date => {
                const dateData = groupedByDate[date];

                return ['morning', 'afternoon', 'evening'].map((session, sessionIndex) => {
                  const sessionData = dateData.sessions[session] || {};

                  return (
                    <tr key={`${date}-${session}`} className={extendedDates.includes(date) ? 'extended-date-row' : ''}>
                      {sessionIndex === 0 ? (
                        <td 
                          rowSpan={3} 
                          className="date-cell"
                        >
                          <div className="date">{format(parseISO(date), 'dd/MM/yyyy')}</div>
                          <div className="day">{format(parseISO(date), 'EEEE')}</div>
                        </td>
                      ) : null}
                      <td className="session-cell">
                        {session === 'morning' ? 'Sáng' : session === 'afternoon' ? 'Chiều' : 'Tối'}
                      </td>
                      {uniqueTeams.map(teamId => {
                        const schedule = sessionData[teamId];
                        const cellId = `${date}-${session}-${teamId}`;
                        
                        // Check if it's Sunday
                        const isSundayDate = isSunday(date);
                        
                        if (isSundayDate) {
                          return (
                            <td key={teamId} className="sunday-cell">
                              Chủ nhật
                            </td>
                          );
                        }
                        
                        const cellContent = (
                          <div className="cell-content">
                            {schedule ? (
                              <>
                                {schedule.subjectId && (
                                  <div className="subject-name">
                                    {getSubjectName(schedule.subjectId)}
                                  </div>
                                )}
                                {schedule.lecturerId && (
                                  <div className="lecturer-name">
                                    {getLecturerName(schedule.lecturerId)}
                                  </div>
                                )}
                                {schedule.locationId && (
                                  <div className="location-name">
                                    {getLocationName(schedule.locationId)}
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="schedule-cell-empty">Trống</div>
                            )}
                          </div>
                        );

                        // Chỉ cho phép kéo thả nếu có subjectId (đã sắp môn)
                        if (schedule?.subjectId) {
                          return (
                            <DraggableDroppableCell key={teamId} id={cellId}>
                              <div className="schedule-cell">
                                {cellContent}
                              </div>
                            </DraggableDroppableCell>
                          );
                        } else {
                          return (
                            <DraggableDroppableCell key={teamId} id={cellId}>
                              <div className="schedule-cell">
                                {cellContent}
                              </div>
                            </DraggableDroppableCell>
                          );
                        }
                      })}
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </DndContext>

        {/* Button thêm ngày ở cuối lịch */}
        <div className="flex justify-center mt-4">
          <button
            onClick={addDayAtEnd}
            className="add-day-btn"
          >
            <span className="text-lg">+</span>
            Thêm ngày ở cuối lịch
          </button>
        </div>
      </div>


      <style>{`
        /* Responsive container */
        .timetable-container {
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        
        /* Table responsive styles */
        .timetable-table {
          width: 100%;
          min-width: 800px; /* Minimum width to prevent squashing */
          border-collapse: collapse;
          font-size: 14px;
        }
        
        /* Header styles */
        .timetable-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          position: sticky;
          top: 0;
          z-index: 20;
        }
        
        .timetable-header th {
          padding: 12px 8px;
          text-align: left;
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-right: 1px solid rgba(255, 255, 255, 0.2);
          white-space: nowrap;
          min-width: 120px;
        }
        
        .timetable-header th:first-child {
          min-width: 100px;
          position: sticky;
          left: 0;
          z-index: 21;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .timetable-header th:nth-child(2) {
          min-width: 80px;
          position: sticky;
          left: 100px;
          z-index: 21;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        /* Body styles */
        .timetable-body tr {
          transition: background-color 0.2s ease;
        }
        
        .timetable-body tr:hover {
          background-color: #f8fafc;
        }
        
        .timetable-body td {
          padding: 8px;
          border-right: 1px solid #e2e8f0;
          border-bottom: 1px solid #e2e8f0;
          vertical-align: top;
          min-height: 60px;
        }
        
        /* Sticky columns */
        .timetable-body td:first-child {
          position: sticky;
          left: 0;
          z-index: 10;
          background: white;
          font-weight: 600;
          min-width: 100px;
        }
        
        .timetable-body td:nth-child(2) {
          position: sticky;
          left: 100px;
          z-index: 10;
          background: white;
          font-weight: 600;
          min-width: 80px;
        }
        
        /* Date cell styles */
        .date-cell {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          text-align: center;
          font-size: 12px;
        }
        
        .date-cell .date {
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 2px;
        }
        
        .date-cell .day {
          color: #64748b;
          font-size: 11px;
        }
        
        /* Session cell styles */
        .session-cell {
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
          text-align: center;
          font-weight: 600;
          color: #475569;
          font-size: 12px;
        }
        
        /* Schedule cell styles */
        .schedule-cell {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: flex-start;
          min-height: 60px;
          padding: 8px;
          gap: 4px;
          background: white;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          transition: all 0.2s ease;
          cursor: grab;
          position: relative;
          overflow: hidden;
        }
        
        .schedule-cell:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border-color: #3b82f6;
        }
        
        .schedule-cell:active {
          cursor: grabbing;
        }
        
        .schedule-cell.dragging {
          opacity: 0.7;
          transform: rotate(2deg);
          z-index: 1000;
        }
        
        .schedule-cell.droppable {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          border-color: #3b82f6;
          border-width: 2px;
        }
        
        /* Cell content styles */
        .cell-content {
          width: 100%;
        }
        
        .subject-name {
          font-weight: 700;
          color: #1e40af;
          font-size: 12px;
          line-height: 1.3;
          margin-bottom: 4px;
          word-break: break-word;
        }
        
        .lecturer-name {
          color: #374151;
          font-size: 11px;
          font-weight: 500;
          margin-bottom: 2px;
        }
        
        .location-name {
          color: #6b7280;
          font-size: 10px;
          font-weight: 400;
        }
        
        /* Empty cell styles */
        .schedule-cell-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 60px;
          color: #9ca3af;
          font-style: italic;
          text-align: center;
          font-size: 12px;
          font-weight: 500;
          border: 2px dashed #d1d5db;
          border-radius: 6px;
          background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
          transition: all 0.2s ease;
          cursor: pointer;
        }
        
        .schedule-cell-empty:hover {
          border-color: #3b82f6;
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          color: #1e40af;
        }
        
        /* Sunday cell styles */
        .sunday-cell {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 60px;
          color: #dc2626;
          font-style: italic;
          text-align: center;
          font-size: 12px;
          font-weight: 600;
          border: 2px dashed #fca5a5;
          border-radius: 6px;
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
          transition: all 0.2s ease;
          cursor: not-allowed;
          opacity: 0.8;
        }
        
        .sunday-cell:hover {
          border-color: #f87171;
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          color: #b91c1c;
        }
        
        /* Edit mode styles */
        .schedule-cell-edit {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 80px;
          text-align: center;
          padding: 8px;
          gap: 4px;
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 2px solid #f59e0b;
          border-radius: 6px;
        }
        
        .edit-field {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          margin-bottom: 4px;
        }
        
        .edit-field label {
          font-weight: 600;
          color: #92400e;
          font-size: 10px;
          margin-bottom: 2px;
        }
        
        .edit-select {
          width: 100%;
          font-size: 10px;
          padding: 4px 6px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          background-color: white;
          outline: none;
        }
        
        .edit-select:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }
        
        .edit-buttons {
          display: flex;
          gap: 4px;
          margin-top: 4px;
        }
        
        .save-btn, .cancel-btn {
          width: 20px;
          height: 20px;
          border: none;
          border-radius: 4px;
          font-size: 10px;
          font-weight: bold;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        
        .save-btn {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }
        
        .cancel-btn {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
        }
        
        .save-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
        }
        
        .cancel-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
        }
        
        /* Extended date styles */
        .extended-date-row {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border-left: 4px solid #3b82f6;
        }
        
        .extended-date-row:hover {
          background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
        }
        
        /* Button styles */
        .add-day-btn {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
        }
        
        .add-day-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        
        .add-day-btn:active {
          transform: translateY(0);
        }
        
        /* Save button styles */
        .save-changes-btn {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
        }
        
        .save-changes-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        
        .save-changes-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        
        /* Responsive breakpoints */
        @media (max-width: 1024px) {
          .timetable-table {
            min-width: 700px;
          }
          
          .timetable-header th,
          .timetable-body td {
            padding: 6px 4px;
            font-size: 12px;
          }
          
          .schedule-cell {
            padding: 6px;
            min-height: 50px;
          }
          
          .subject-name {
            font-size: 11px;
          }
          
          .lecturer-name {
            font-size: 10px;
          }
          
          .location-name {
            font-size: 9px;
          }
        }
        
        @media (max-width: 768px) {
          .timetable-container {
            margin: 0 -16px;
          }
          
          .timetable-table {
            min-width: 600px;
          }
          
          .timetable-header th,
          .timetable-body td {
            padding: 4px 2px;
            font-size: 11px;
          }
          
          .schedule-cell {
            padding: 4px;
            min-height: 45px;
          }
          
          .subject-name {
            font-size: 10px;
          }
          
          .lecturer-name {
            font-size: 9px;
          }
          
          .location-name {
            font-size: 8px;
          }
          
          .add-day-btn {
            padding: 8px 12px;
            font-size: 12px;
          }
          
          .save-changes-btn {
            padding: 10px 16px;
            font-size: 12px;
          }
        }
        
        @media (max-width: 480px) {
          .timetable-table {
            min-width: 500px;
          }
          
          .timetable-header th,
          .timetable-body td {
            padding: 2px 1px;
            font-size: 10px;
          }
          
          .schedule-cell {
            padding: 2px;
            min-height: 40px;
          }
          
          .subject-name {
            font-size: 9px;
          }
          
          .lecturer-name {
            font-size: 8px;
          }
          
          .location-name {
            font-size: 7px;
          }
        }
        
        /* Loading and error states */
        .loading-state {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 40px;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-radius: 8px;
        }
        
        .error-state {
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
          border: 1px solid #fca5a5;
          border-radius: 8px;
          padding: 16px;
          color: #dc2626;
        }
        
        .empty-state {
          background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 32px;
          text-align: center;
          color: #6b7280;
        }
        
        /* Scrollbar styling */
        .timetable-container::-webkit-scrollbar {
          height: 8px;
        }
        
        .timetable-container::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        
        .timetable-container::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%);
          border-radius: 4px;
        }
        
        .timetable-container::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
        }
      `}</style>
    </div>
  );
};

export default ProcessingTimetable; 