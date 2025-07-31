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
  };
  
  return (
    <td ref={setRef} style={style} {...attributes} {...listeners} className="px-6 py-4 text-sm border-r">
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
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editData, setEditData] = useState<{subjectId: string, lecturerId: string, locationId: string}>({
    subjectId: '',
    lecturerId: '',
    locationId: ''
  });

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
      morning: 'Morning',
      afternoon: 'Afternoon', 
      evening: 'Evening'
    };
    return labels[session as keyof typeof labels] || session;
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

    console.log('🎯 PARSED:', { from, to });

    // Chỉ swap cùng team
    if (from.teamId !== to.teamId) {
      console.log('❌ DIFFERENT TEAMS - NO SWAP');
      return;
    }

    console.log('💥 SWAPPING same team:', from.teamId);

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

      console.log('📍 FOUND INDICES:', { fromIdx, toIdx });

      if (fromIdx === -1 || toIdx === -1) {
        console.log('❌ SCHEDULE NOT FOUND');
        return newSchedules;
      }

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

      console.log('✅ SWAPPED DATE/SESSION!');
      if (onScheduleUpdate) onScheduleUpdate(newSchedules);

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

  console.log('Grouped schedules:', groupedByDate);
  console.log('Sorted dates:', sortedDates);
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
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700 font-medium">
                ✅ Lưu thành công! Thời khóa biểu đã được cập nhật.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="px-6 py-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          THỜI KHÓA BIỂU ĐÃ SẮP MÔN HỌC
        </h3>
        <div className="text-sm text-gray-500">
          {schedules.length} lịch cần sắp giảng viên
        </div>
      </div>
      
      <div className="overflow-x-auto p-4">
        <DndContext onDragEnd={handleDragEnd}>
          <table className="w-full">
          <thead className="bg-blue-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                Session
              </th>
              {uniqueTeams.map(teamId => (
                <th key={teamId} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                  Team {getTeamName(teamId)}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r" rowSpan={3}>
                        {format(parseISO(date), 'EEE, MMM d')}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 border-r">
                      {getSessionLabel(session)}
                    </td>
                    {uniqueTeams.map(teamId => {
                      const schedule = sessionData[teamId];
                      const cellId = `${date}-${session}-${teamId}`;
                      
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
                              className={!schedule ? "schedule-cell-empty clickable" : "schedule-cell clickable"}
                              onClick={() => handleCellEdit(cellId, schedule)}
                            >
                              {!schedule ? (
                                <div>+ Thêm lịch</div>
                              ) : (
                                <>
                                  <div className="field-row">
                                    <span className="label">Học phần:</span>
                                    <span className="value subject-name">{getSubjectName(schedule.subjectId)}</span>
                                  </div>
                                  <div className="field-row">
                                    <span className="label">Giảng viên:</span>
                                    <span className="value tba-text">TBA</span>
                                  </div>
                                  <div className="field-row">
                                    <span className="label">Địa điểm:</span>
                                    <span className="value">{getLocationName(schedule.locationId) || 'TBA'}</span>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </DraggableDroppableCell>
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
      <div className="flex justify-end px-6 py-4">
        <button
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          onClick={async () => {
            try {
              setLoading(true);
              setError(null);
              const res = await fetch('/api/save-schedules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ schedules })
              });
              const data = await res.json();
              if (!data.success) throw new Error(data.error || 'Lỗi khi lưu file');
              
              // Hiển thị success notification
              setSaveSuccess(true);
              setTimeout(() => setSaveSuccess(false), 3000);
            } catch (err: any) {
              setError(err.message || 'Lỗi khi lưu file');
            } finally {
              setLoading(false);
            }
          }}
        >
          LƯU THAY ĐỔI
        </button>
      </div>
      <div className="px-6 py-2 text-gray-400">
        <svg className="w-4 h-4 inline-block mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
        </svg>
        Kéo thả để đổi môn học trong cùng 1 đại đội • Click để thêm/sửa lịch
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
          color: #1e40af;
          font-style: italic;
          text-align: center;
          font-size: 12px;
          font-weight: 600;
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
      `}</style>
    </div>
  );
};

export default ProcessingTimetable; 