'use client';

import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';

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

interface ManualEditTimetableProps {
  onSave?: (data: ScheduleItem[]) => void;
  initialData?: ScheduleItem[];
}

const ManualEditTimetable: React.FC<ManualEditTimetableProps> = ({
  onSave,
  initialData = []
}) => {
  const [schedules, setSchedules] = useState<ScheduleItem[]>(initialData);
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

  const handleCellEdit = (date: string, session: string, teamId: number, field: 'subjectId' | 'lecturerId' | 'locationId', value: string) => {
    setSchedules(prev => {
      const newSchedules = [...prev];
      const index = newSchedules.findIndex(s => 
        s.date === date && s.session === session && s.teamId === teamId
      );
      
      if (index !== -1) {
        newSchedules[index] = {
          ...newSchedules[index],
          [field]: value === '' ? null : Number(value)
        };
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

  const sortedDates = Object.keys(groupedByDate).sort();

  // Get unique teams
  const uniqueTeams = Array.from(new Set(schedules.map(s => s.teamId))).sort();

  const handleSave = () => {
    if (onSave) {
      onSave(schedules);
    }
  };

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
        <div className="text-gray-600">Không có dữ liệu lịch học</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          CHỈNH SỬA LỊCH GIẢNG DẠY
        </h3>
        <button 
          onClick={handleSave}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          LƯU
        </button>
      </div>
      
      <div className="overflow-x-auto">
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
                      
                      return (
                        <td key={teamId} className="px-6 py-4 text-sm border-r">
                          <div className="space-y-2">
                            <div>
                              <span className="text-blue-600 font-medium">Học phần:</span>
                              <select
                                className="ml-2 border border-gray-300 rounded px-2 py-1 text-sm"
                                value={schedule?.subjectId || ''}
                                onChange={(e) => handleCellEdit(date, session, teamId, 'subjectId', e.target.value)}
                              >
                                <option value="">TBA</option>
                                {subjects.map(subject => (
                                  <option key={subject.id} value={subject.id}>
                                    {subject.name || subject.subjectName}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <span className="text-blue-600 font-medium">Giảng viên:</span>
                              <select
                                className="ml-2 border border-gray-300 rounded px-2 py-1 text-sm"
                                value={schedule?.lecturerId || ''}
                                onChange={(e) => handleCellEdit(date, session, teamId, 'lecturerId', e.target.value)}
                              >
                                <option value="">TBA</option>
                                {lecturers.map(lecturer => (
                                  <option key={lecturer.id} value={lecturer.id}>
                                    {lecturer.fullName || lecturer.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <span className="text-blue-600 font-medium">Địa điểm:</span>
                              <select
                                className="ml-2 border border-gray-300 rounded px-2 py-1 text-sm"
                                value={schedule?.locationId || ''}
                                onChange={(e) => handleCellEdit(date, session, teamId, 'locationId', e.target.value)}
                              >
                                <option value="">TBA</option>
                                {locations.map(location => (
                                  <option key={location.id} value={location.id}>
                                    {location.name || location.locationName}
                                  </option>
                                ))}
                              </select>
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
      </div>
      <div className="px-6 py-2 text-gray-400">
        <svg className="w-4 h-4 inline-block mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
  );
};

export default ManualEditTimetable; 