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
  id?: string; // Thêm id property để hỗ trợ drag & drop
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

interface CompletedTimetableProps {
  courseId?: number;
  teamId?: number;
  startDate?: string;
  endDate?: string;
  onScheduleUpdate?: (schedules: ScheduleItem[]) => void;
}

const CompletedTimetable: React.FC<CompletedTimetableProps> = ({
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
  const [dragSuccess, setDragSuccess] = useState(false);

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
  const makeScheduleId = (s: ScheduleItem) => `${s.date.split('T')[0]}-${s.session}-${s.teamId}`;

  // Load schedules với status = 'done' (đã hoàn thành)
  useEffect(() => {
    if ((!startDate || !endDate) && !courseId) return;

    setLoading(true);
    setError(null);

    let url = '';
    let params = new URLSearchParams();

    if (courseId) {
      url = '/api/get-schedules-by-course';
      params.append('courseId', courseId.toString());
      params.append('status', 'done');
    } else {
      url = '/api/get-schedules';
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (teamId) params.append('teamId', teamId.toString());
      params.append('status', 'done');
    }

    console.log('🔍 Fetching schedules from:', `${url}?${params}`);
    fetch(`${url}?${params}`)
      .then(res => res.json())
      .then(data => {
        console.log('📥 API response:', data);
        if (data.success) {
          // Lấy tất cả lịch từ API và thêm id
          const completedSchedules = data.data.map((s: ScheduleItem) => ({ ...s, id: makeScheduleId(s) }));
          console.log('✅ Loaded schedules:', completedSchedules.length, 'items');
          setSchedules(completedSchedules);
        } else {
          console.log('❌ API error:', data.error);
          setError(data.error || 'Lỗi khi tải dữ liệu');
        }
      })
      .catch(err => {
        console.error('Error loading schedules:', err);
        setError('Lỗi kết nối khi tải dữ liệu');
      })
      .finally(() => setLoading(false));
  }, [courseId, teamId, startDate, endDate]);

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

  // Drag and Drop Components cho Lecturer
  const DraggableLecturer = ({ id, children, teamId }: { id: string, children: React.ReactNode, teamId: number }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
    
    const style = {
      transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      opacity: isDragging ? 0.5 : 1,
      cursor: 'grab',
      zIndex: isDragging ? 1000 : 'auto',
    };

    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="inline-block">
        {children}
      </div>
    );
  };

  const DroppableLecturer = ({ id, children, teamId }: { id: string, children: React.ReactNode, teamId: number }) => {
    const { setNodeRef, isOver } = useDroppable({ id });
    
    const style = {
      background: isOver ? '#e0e7ff' : undefined,
      padding: '4px',
      borderRadius: '4px',
      border: isOver ? '2px dashed #3b82f6' : '2px solid transparent',
      transition: 'all 0.2s ease',
    };

    return (
      <div ref={setNodeRef} style={style} className="inline-block">
        {children}
      </div>
    );
  };

  // Drag and Drop Components cho Location
  const DraggableLocation = ({ id, children, teamId }: { id: string, children: React.ReactNode, teamId: number }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
    
    const style = {
      transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      opacity: isDragging ? 0.5 : 1,
      cursor: 'grab',
      zIndex: isDragging ? 1000 : 'auto',
    };

    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="inline-block">
        {children}
      </div>
    );
  };

  const DroppableLocation = ({ id, children, teamId }: { id: string, children: React.ReactNode, teamId: number }) => {
    const { setNodeRef, isOver } = useDroppable({ id });
    
    const style = {
      background: isOver ? '#e0e7ff' : undefined,
      padding: '4px',
      borderRadius: '4px',
      border: isOver ? '2px dashed #3b82f6' : '2px solid transparent',
      transition: 'all 0.2s ease',
    };

    return (
      <div ref={setNodeRef} style={style} className="inline-block">
        {children}
      </div>
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // id format: lecturer-<scheduleId> hoặc location-<scheduleId>
    const parseDragId = (id: string) => {
      const [type, ...rest] = id.split('-');
      return { type, scheduleId: rest.join('-') };
    };

    const from = parseDragId(String(active.id));
    const to = parseDragId(String(over.id));

    // Chỉ cho phép kéo thả cùng loại (lecturer với lecturer, location với location)
    if (from.type !== to.type) return;

    setSchedules(prev => {
      // Clone mảng mới để React nhận biết thay đổi
      const newSchedules = prev.map(s => ({ ...s }));

      const fromIdx = newSchedules.findIndex(s => s.id === from.scheduleId);
      const toIdx = newSchedules.findIndex(s => s.id === to.scheduleId);

      if (fromIdx === -1 || toIdx === -1) return prev;

      // Chỉ swap nếu cùng session
      if (newSchedules[fromIdx].session !== newSchedules[toIdx].session) return prev;

      if (from.type === 'lecturer') {
        const temp = newSchedules[fromIdx].lecturerId;
        newSchedules[fromIdx].lecturerId = newSchedules[toIdx].lecturerId;
        newSchedules[toIdx].lecturerId = temp;
      } else if (from.type === 'location') {
        const temp = newSchedules[fromIdx].locationId;
        newSchedules[fromIdx].locationId = newSchedules[toIdx].locationId;
        newSchedules[toIdx].locationId = temp;
      }

      setDragSuccess(true);
      setTimeout(() => setDragSuccess(false), 2000);

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

  const sortedDates = Object.keys(groupedByDate).sort();

  // Get unique teams
  const uniqueTeams = Array.from(new Set(schedules.map(s => s.teamId))).sort();
  
  console.log('📊 Render debug:', {
    schedulesCount: schedules.length,
    groupedDatesCount: Object.keys(groupedByDate).length,
    sortedDates: sortedDates,
    uniqueTeams: uniqueTeams
  });

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
        <div className="text-gray-600">Không có thời khóa biểu đã hoàn thành</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border m-4">
      {/* Success Notifications */}
      {saveSuccess && (
        <div className="bg-green-100 border-l-4 border-green-500 p-4 mb-4 animate-pulse">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-green-700 font-medium">
                Lưu thành công! Lịch giảng dạy đã được cập nhật.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-red-700 font-medium">
                Lỗi: {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {dragSuccess && (
        <div className="bg-blue-100 border-l-4 border-blue-500 p-4 mb-4 animate-pulse">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-blue-700 font-medium">
                Hoán đổi thành công! Nhớ lưu thay đổi để cập nhật lịch.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="px-6 py-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          THỜI KHÓA BIỂU ĐÃ HOÀN THÀNH
        </h3>
        <button 
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
          } text-white`}
          disabled={loading}
          onClick={async () => {
            try {
              setLoading(true);
              setError(null);
              console.log('Saving schedules:', schedules);
              console.log('Schedules count:', schedules.length);
              
              if (schedules.length === 0) {
                setError('Không có dữ liệu để lưu');
                return;
              }
              
              const res = await fetch('/api/save-schedules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ schedules })
              });
              
              const data = await res.json();
              console.log('Save response:', data);
              
              if (!data.success) throw new Error(data.error || 'Lỗi khi lưu file');
              
              setSaveSuccess(true);
              setTimeout(() => setSaveSuccess(false), 3000);
            } catch (err: any) {
              console.error('Save error:', err);
              setError(err.message || 'Lỗi khi lưu file');
            } finally {
              setLoading(false);
            }
          }}
        >
          {loading ? 'ĐANG LƯU...' : 'LƯU THAY ĐỔI'}
        </button>
      </div>
      
      <div className="overflow-x-auto p-4">
        <DndContext onDragEnd={handleDragEnd}>
          <table className="w-full border-collapse border-2 border-gray-300">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                  NGÀY THÁNG
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                  BUỔI HỌC
                </th>
                {uniqueTeams.map(teamId => (
                  <th key={teamId} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                    {getTeamName(teamId)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedDates.map(date => {
                const dateData = groupedByDate[date];
                const sessions = ['morning', 'afternoon', 'evening'] as const;
                
                return sessions.map((session, sessionIndex) => {
                  const sessionData = dateData.sessions[session] || {};
                  const isFirstSession = sessionIndex === 0;
                  
                  return (
                    <tr key={`${date}-${session}`} className="hover:bg-gray-50">
                      {isFirstSession && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300" rowSpan={3}>
                          {formatDateToVietnamese(date)}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 border-r border-gray-300">
                        {getSessionLabel(session)}
                      </td>
                      {uniqueTeams.map(teamId => {
                        const schedule = sessionData[teamId];
                        if (!schedule) {
                          return (
                            <td key={teamId} className="px-6 py-4 text-sm border-r border-gray-300">
                              <div className="schedule-cell-empty">Trống</div>
                            </td>
                          );
                        }
                        
                        return (
                          <td key={teamId} className="px-6 py-4 text-sm border-r border-gray-300">
                            <div className="schedule-cell">
                              <div className="field-row">
                                <span className="label">Học phần:</span>
                                <span className="value subject-name">{getSubjectName(schedule.subjectId)}</span>
                              </div>
                              <div className="field-row">
                                <span className="label">Giảng viên:</span>
                                <DroppableLecturer id={`lecturer-${schedule.id}`} teamId={teamId}>
                                  <DraggableLecturer id={`lecturer-${schedule.id}`} teamId={teamId}>
                                    <span className="lecturer-badge">
                                      {getLecturerName(schedule.lecturerId) || 'TBA'}
                                    </span>
                                  </DraggableLecturer>
                                </DroppableLecturer>
                              </div>
                              <div className="field-row">
                                <span className="label">Địa điểm:</span>
                                <DroppableLocation id={`location-${schedule.id}`} teamId={teamId}>
                                  <DraggableLocation id={`location-${schedule.id}`} teamId={teamId}>
                                    <span className="location-badge">
                                      {getLocationName(schedule.locationId) || 'TBA'}
                                    </span>
                                  </DraggableLocation>
                                </DroppableLocation>
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </DndContext>
      </div>
      <div className="px-6 py-2 text-gray-400">
        <svg className="w-4 h-4 inline-block mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
        </svg>
        Kéo thả giảng viên hoặc địa điểm để hoán đổi giữa các lớp
      </div>

      <style>{`
        .schedule-cell {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: flex-start;
          height: 100%;
          min-height: 50px;
          text-align: left;
          padding: 4px 2px;
          gap: 0px;
        }
        
        .schedule-cell-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          min-height: 50px;
          color: #1e40af;
          font-style: italic;
          text-align: center;
          font-size: 12px;
          font-weight: 600;
        }
        
        .field-row {
          display: flex;
          align-items: center;
          justify-content: flex-start;
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
          text-align: left;
          word-wrap: break-word;
          flex: 1;
          font-family: inherit;
        }
        
        .subject-name {
          color: #1e40af;
          font-weight: 700;
        }
        
        .lecturer-badge {
          background-color: #dbeafe;
          color: #1e40af;
          padding: 2px 4px;
          border-radius: 4px;
          cursor: grab;
          font-weight: 600;
          font-size: 11px;
          border: 1px solid #1e40af;
          flex: 1;
          text-align: left;
          font-family: inherit;
          transition: all 0.2s ease;
          user-select: none;
        }
        
        .lecturer-badge:hover {
          background-color: #bfdbfe;
          transform: scale(1.05);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .location-badge {
          background-color: #dbeafe;
          color: #1e40af;
          padding: 2px 4px;
          border-radius: 4px;
          cursor: grab;
          font-weight: 600;
          font-size: 11px;
          border: 1px solid #1e40af;
          flex: 1;
          text-align: left;
          font-family: inherit;
          transition: all 0.2s ease;
          user-select: none;
        }
        
        .location-badge:hover {
          background-color: #bfdbfe;
          transform: scale(1.05);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
};

export default CompletedTimetable; 