'use client';

import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { DndContext, DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core';

interface ScheduleItem {
  week: number;
  teamId: number;
  subjectId: number;
  date: string;
  dayOfWeek: string;
  session: 'morning' | 'afternoon' | 'evening';
  lecturerId: number | null;
  locationId: number | null;
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

interface TimetableGridProps {
  courseId?: number;
  teamId?: number;
  startDate?: string;
  endDate?: string;
  status?: 'scheduled' | 'done' | 'all';
  enableDragDrop?: boolean;
  restrictToTeam?: boolean;
  onScheduleUpdate?: (schedules: ScheduleItem[]) => void;
  initialData?: ScheduleItem[];
}

const TimetableGrid: React.FC<TimetableGridProps> = ({
  courseId,
  teamId,
  startDate,
  endDate,
  status = 'all',
  enableDragDrop = false,
  restrictToTeam = false,
  onScheduleUpdate,
  initialData
}) => {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Load schedules
  useEffect(() => {
    // Nếu có initialData, sử dụng nó thay vì fetch từ API
    if (initialData && initialData.length > 0) {
      setSchedules(initialData);
      return;
    }

    if ((!startDate || !endDate) && !courseId) return;

    setLoading(true);
    setError(null);

    let url = '';
    let params = new URLSearchParams();

    if (courseId) {
      url = '/api/get-schedules-by-course';
      params.append('courseId', courseId.toString());
      if (status !== 'all') params.append('status', status);
    } else {
      url = '/api/get-schedules';
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (teamId) params.append('teamId', teamId.toString());
      if (status !== 'all') params.append('status', status);
    }

    fetch(`${url}?${params}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSchedules(data.data);
        } else {
          setError(data.error || 'Lỗi khi tải dữ liệu');
        }
      })
      .catch(err => {
        console.error('Error loading schedules:', err);
        setError('Lỗi kết nối khi tải dữ liệu');
      })
      .finally(() => setLoading(false));
  }, [courseId, teamId, startDate, endDate, status, initialData]);

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

  // Drag and Drop Components
  const DraggableCell = ({ id, children, teamId }: { id: string, children: React.ReactNode, teamId: number }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
    
    const style = {
      transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      opacity: isDragging ? 0.7 : 1,
      cursor: isDragging ? 'grabbing' : 'grab',
      background: isDragging ? '#f3f4f6' : undefined,
      border: isDragging ? '2px dashed #6b7280' : undefined,
      borderRadius: isDragging ? '4px' : undefined,
      transition: 'all 0.2s ease',
      zIndex: isDragging ? 1000 : 'auto',
      position: isDragging ? 'relative' : 'static',
      boxShadow: isDragging ? '0 4px 12px rgba(0, 0, 0, 0.15)' : undefined,
    };

    return (
      <td 
        ref={setNodeRef} 
        style={style} 
        {...attributes} 
        {...listeners} 
        className={`px-6 py-4 text-sm border-r border-gray-400 border-b border-gray-400 ${isDragging ? 'no-select' : ''}`}
      >
        {children}
      </td>
    );
  };

  const DroppableCell = ({ id, children, teamId }: { id: string, children: React.ReactNode, teamId: number }) => {
    const { setNodeRef, isOver } = useDroppable({ id });
    
    const style = {
      background: isOver ? '#e0e7ff' : undefined,
      border: isOver ? '2px solid #3b82f6' : undefined,
      borderRadius: isOver ? '4px' : undefined,
      transition: 'all 0.2s ease',
    };

    return (
      <td ref={setNodeRef} style={style} className="px-6 py-4 text-sm border-r border-gray-400 border-b border-gray-400">
        {children}
      </td>
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const parseId = (id: string) => {
      const parts = id.split('-');
      const date = parts.slice(0, 3).join('-');
      const session = parts[3];
      const team = parts.slice(4).join('-');
      return { date, session, team };
    };

    const from = parseId(String(active.id));
    const to = parseId(String(over.id));

    // Nếu restrictToTeam = true, chỉ cho phép kéo thả trong cùng team
    if (restrictToTeam && from.team !== to.team) {
      return;
    }

    setSchedules(prev => {
      const newSchedules = [...prev];
      const fromIdx = newSchedules.findIndex(
        item => item.date === from.date && item.session === from.session && item.teamId.toString() === from.team
      );
      const toIdx = newSchedules.findIndex(
        item => item.date === to.date && item.session === to.session && item.teamId.toString() === to.team
      );

      if (fromIdx === -1 || toIdx === -1) return newSchedules;

      // Swap subjectId, lecturerId, locationId
      [newSchedules[fromIdx].subjectId, newSchedules[toIdx].subjectId] = [newSchedules[toIdx].subjectId, newSchedules[fromIdx].subjectId];
      [newSchedules[fromIdx].lecturerId, newSchedules[toIdx].lecturerId] = [newSchedules[toIdx].lecturerId, newSchedules[fromIdx].lecturerId];
      [newSchedules[fromIdx].locationId, newSchedules[toIdx].locationId] = [newSchedules[toIdx].locationId, newSchedules[fromIdx].locationId];

      if (onScheduleUpdate) {
        onScheduleUpdate(newSchedules);
      }

      return newSchedules;
    });
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

  const filteredDates = Object.keys(groupedByDate).filter(date => !isDateEmpty(date));
  const sortedDates = filteredDates.sort();

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
      <div className="bg-white rounded-lg shadow-sm border m-4 min-h-[calc(100vh-20px)] flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-lg mb-2">Không có dữ liệu lịch học</div>
          <div className="text-gray-400 text-sm">Vui lòng chọn bộ lọc khác hoặc tạo lịch mới</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border m-4">
      <div className="px-6 py-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          CHỈNH SỬA LỊCH GIẢNG DẠY
        </h3>
        <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium">
          LƯU
        </button>
      </div>
      
      <div className="overflow-x-auto p-4">
        <DndContext onDragEnd={handleDragEnd}>
          <div className="overflow-x-auto border border-gray-300 rounded-lg">
            <table className="w-full border-collapse">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300 border-b border-gray-300 sticky left-0 z-10 bg-blue-50 min-w-[80px] max-w-[90px]">
                    NGÀY THÁNG
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300 border-b border-gray-300 sticky left-[90px] z-10 bg-blue-50 min-w-[60px] max-w-[70px]">
                    BUỔI HỌC
                  </th>
                  {uniqueTeams.map(teamId => (
                    <th key={teamId} className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300 border-b border-gray-300 min-w-[120px] max-w-[140px]">
                      {getTeamName(teamId)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedDates.map(date => {
                  const dateData = groupedByDate[date];

                  return ['morning', 'afternoon', 'evening'].map((session, sessionIndex) => {
                    const sessionData = dateData.sessions[session] || {};

                    return (
                      <tr key={`${date}-${session}`} className="hover:bg-gray-50">
                        {sessionIndex === 0 ? (
                                                  <td 
                          rowSpan={3} 
                          className="px-3 py-2 text-xs text-gray-900 border-r border-gray-300 border-b border-gray-300 sticky left-0 z-10 bg-white align-top"
                        >
                            <div className="font-medium">{format(parseISO(date), 'dd/MM/yyyy')}</div>
                            <div className="text-gray-500">{format(parseISO(date), 'EEEE', { locale: require('date-fns/locale/vi') })}</div>
                          </td>
                        ) : null}
                        <td className="px-3 py-2 text-xs text-gray-900 border-r border-gray-300 border-b border-gray-300 sticky left-[120px] z-10 bg-white font-medium">
                          {session === 'morning' ? 'Sáng' : session === 'afternoon' ? 'Chiều' : 'Tối'}
                        </td>
                        {uniqueTeams.map(teamId => {
                          const schedule = sessionData[teamId];
                          const cellId = `${date}-${session}-${teamId}`;
                          
                          const cellContent = (
                            <div className="p-2 text-xs">
                              {schedule ? (
                                <>
                                  {schedule.subjectId && (
                                    <div className="font-medium text-blue-600 mb-1">
                                      {getSubjectName(schedule.subjectId)}
                                    </div>
                                  )}
                                  {schedule.lecturerId && (
                                    <div className="text-gray-600 mb-1">
                                      {getLecturerName(schedule.lecturerId)}
                                    </div>
                                  )}
                                  {schedule.locationId && (
                                    <div className="text-gray-500">
                                      {getLocationName(schedule.locationId)}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="text-gray-400 italic">Trống</div>
                              )}
                            </div>
                          );

                          // Chỉ cho phép kéo thả nếu enableDragDrop = true và có subjectId (đã sắp môn)
                          if (enableDragDrop && schedule?.subjectId) {
                            return (
                              <DraggableCell key={teamId} id={cellId} teamId={teamId}>
                                {cellContent}
                              </DraggableCell>
                            );
                          } else {
                            return (
                              <DroppableCell key={teamId} id={cellId} teamId={teamId}>
                                {cellContent}
                              </DroppableCell>
                            );
                          }
                        })}
                      </tr>
                    );
                  });
                })}
              </tbody>
            </table>
          </div>
        </DndContext>
      </div>
      <div className="px-6 py-2 text-gray-400">
        <svg className="w-4 h-4 inline-block mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
        </svg>
        Kéo thả để sắp xếp lại lịch học
      </div>
    </div>
  );
};

export default TimetableGrid; 