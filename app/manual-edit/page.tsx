"use client";
import React, { useEffect, useState } from "react";
import { DndContext, DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import { format, startOfWeek, endOfWeek, format as formatDate, parseISO, addDays } from 'date-fns';
import LoadingOverlay from "../components/LoadingOverlay";

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
    <td ref={setRef} style={style} {...attributes} {...listeners}>
      {children}
    </td>
  );
}

export default function ManualEditPage() {
  const [timetableData, setTimetableData] = useState<any[]>([]);
  const [teams, setTeams] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{from: Date, to: Date}|undefined>();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const sessions = ['Morning', 'Afternoon', 'Evening'] as const;
  const sessionKeys = ['morning', 'afternoon', 'evening'] as const;
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [filePath, setFilePath] = useState<string>("");
  const [courseId, setCourseId] = useState<string | number>("");

  useEffect(() => {
    setLoading(true);
    const raw = localStorage.getItem("manualEditScheduleData");
    console.log('Raw data from localStorage:', raw);
    
    if (raw) {
      try {
        const data = JSON.parse(raw);
        console.log('Parsed data:', data);
        console.log('Data length:', data.length);
        
        setTimetableData(data);
        // Lấy filePath và courseId nếu có
        if (data && data.length > 0) {
          if (data[0].filePath) setFilePath(data[0].filePath);
          if (data[0].courseId) setCourseId(data[0].courseId);
          console.log('Course ID:', data[0].courseId);
        }
        const allTeams = Array.from(new Set(data.map((row: any) => row.teamName || row.teamId))).map(String);
        setTeams(allTeams);
        console.log('Extracted teams:', allTeams);
        
        if (data.length > 0) {
          const dates = data.map((row: any) => row.date).sort();
          setDateRange({ from: new Date(dates[0]), to: new Date(dates[dates.length-1]) });
          console.log('Date range:', { from: dates[0], to: dates[dates.length-1] });
        }
      } catch {
        console.error('Error parsing schedule data');
        setTimetableData([]); setTeams([]); setDateRange(undefined);
      }
    } else {
      console.warn('No data found in localStorage');
      setTimetableData([]); setTeams([]); setDateRange(undefined);
    }
    Promise.all([
      fetch("/api/subjects").then(res => res.json()).then(res => setSubjects(res.data || [])),
      fetch("/api/lecturers").then(res => res.json()).then(res => setLecturers(res.data || [])),
      fetch("/api/locations").then(res => res.json()).then(res => setLocations(res.data || [])),
    ]).finally(() => setLoading(false));
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    console.log('handleDragEnd called', event);
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
    setTimetableData(prev => {
      const newData = prev.map(item => ({ ...item }));
      const fromIdx = newData.findIndex(
        item => item.date === from.date && item.session === from.session && (item.teamName || item.teamId).toString() === from.team.toString()
      );
      const toIdx = newData.findIndex(
        item => item.date === to.date && item.session === to.session && (item.teamName || item.teamId).toString() === to.team.toString()
      );
      if (fromIdx === -1 || toIdx === -1) return newData;
      // Swap subjectId, lecturerId, locationId
      [newData[fromIdx].subjectId, newData[toIdx].subjectId] = [newData[toIdx].subjectId, newData[fromIdx].subjectId];
      [newData[fromIdx].lecturerId, newData[toIdx].lecturerId] = [newData[toIdx].lecturerId, newData[fromIdx].lecturerId];
      [newData[fromIdx].locationId, newData[toIdx].locationId] = [newData[toIdx].locationId, newData[fromIdx].locationId];
      console.log('Timetable after drag:', newData);
      return newData;
    });
  };

  const handleEdit = (idx: number, field: string, value: string) => {
    setTimetableData(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const handleSave = async () => {
    console.log('handleSave called');
    console.log('Timetable at save:', timetableData);
    setLoading(true);
    setSaveSuccess(false);
    // Tách dữ liệu theo từng team
    const teamMap: Record<string, any[]> = {};
    timetableData.forEach(row => {
      const teamId = String(row.teamId || row.teamName || '1');
      if (!teamMap[teamId]) teamMap[teamId] = [];
      teamMap[teamId].push(row);
    });
    // Lưu từng file cho từng team, tách theo tuần
    await Promise.all(Object.entries(teamMap).map(async ([teamId, rows]) => {
      // Tách rows thành từng tuần
      const weekMap: Record<string, any[]> = {};
      rows.forEach(r => {
        if (!r.date) return;
        const d = typeof r.date === 'string' ? parseISO(r.date) : r.date;
        const day = d.getDay();
        if (day === 0) return; // Bỏ qua Chủ nhật hoàn toàn
        const weekStartDate = startOfWeek(d, { weekStartsOn: 1 });
        const weekEndDate = addDays(weekStartDate, 5);
        if (weekEndDate.getDay() !== 6) return; // Chỉ group tuần kết thúc là Thứ 7
        const weekStart = formatDate(weekStartDate, 'yyyy-MM-dd');
        const weekEnd = formatDate(weekEndDate, 'yyyy-MM-dd');
        const key = `${weekStart}_${weekEnd}`;
        if (!weekMap[key]) weekMap[key] = [];
        // Chỉ giữ trường cần thiết
        const cleaned = {
          week: r.week,
          teamId: r.teamId,
          subjectId: r.subjectId,
          date: r.date,
          dayOfWeek: r.dayOfWeek,
          session: r.session,
          lecturerId: r.lecturerId,
          locationId: r.locationId
        };
        weekMap[key].push(cleaned);
      });
      // Lưu từng tuần
      await Promise.all(Object.entries(weekMap).map(async ([weekKey, weekRows]) => {
        if (weekRows.length === 0) return; // Không lưu file rỗng
        const fileName = `week_${weekKey}.json`;
        const filePath = `team${teamId}/scheduled/${fileName}`;
        try {
          const res = await fetch("/api/schedule/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filePath, content: weekRows }),
          });
          const result = await res.json();
          console.log('Save API response:', filePath, result);
          if (!res.ok) {
            console.error('Save API error:', filePath, result);
          }
        } catch (err) {
          console.error('Save API exception:', filePath, err);
        }
      }));
    }));
    // Kiểm tra trạng thái: nếu còn cell nào thiếu lecturerId hoặc locationId thì là processing
    let status = 'scheduled';
    if (timetableData.some(row => !row.lecturerId || !row.locationId)) {
      status = 'processing';
    }
    // Gọi API đổi trạng thái khóa học
    if (courseId) {
      await fetch("/api/courses/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, status }),
      });
    }
    setLoading(false);
    setSaveSuccess(true);
    // Đóng cửa sổ popup nếu có
    if (window.opener) {
      setTimeout(() => { window.close(); }, 600);
    }
  };

  const renderTableRows = () => {
    console.log('Render table rows with timetableData:', timetableData);
    if (!dateRange) return null;
    const uniqueDates = [...new Set(timetableData.map(item => item.date))].sort();
    return uniqueDates.flatMap((date) =>
      sessionKeys.map((sessionKey, sessionIndex) => {
        const sessionName = sessions[sessionIndex];
        return (
          <tr key={`${date}-${sessionKey}`} className={sessionIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
            {sessionIndex === 0 && (
              <td rowSpan={3} className="w-28 h-16 px-2 py-2 border border-gray-400 text-center font-medium bg-gray-100 align-middle text-base text-gray-700">
                {format(new Date(date), 'EEE, MMM d')}
              </td>
            )}
            <td className="w-24 h-16 px-2 py-2 border border-gray-400 text-center font-medium bg-gray-50 align-middle text-base text-gray-700">
              {sessionName}
            </td>
            {teams.map((team) => {
              const teamId = team;
              const cellId = `${date}-${sessionKey}-${teamId}`;
              const classData = timetableData.find(item =>
                item.date === date &&
                item.session === sessionKey &&
                (item.teamName || item.teamId).toString() === (teamId || '').toString()
              );
              return (
                <DraggableDroppableCell key={cellId} id={cellId}>
                  {(!classData ||
                    (!classData.subjectId && !classData.lecturerId && !classData.locationId) ||
                    ([classData?.subjectId, classData?.lecturerId, classData?.locationId].every(v => !v || v === 'TBA'))
                  ) ? (
                    <span className="manual-edit-empty">Trống</span>
                  ) : (
                    <div className="manual-edit-cell">
                      <span className="label">Học phần:</span>
                      <span className="value">
                        {classData.subjectId
                          ? (subjects.find(s => String(s.id) === String(classData.subjectId))?.name
                            ?? subjects.find(s => String(s.id) === String(classData.subjectId))?.subjectName
                            ?? "TBA")
                          : "TBA"}
                      </span>
                      <span className="label">Giảng viên:</span>
                      <span className="value">
                        {classData.lecturerId
                          ? (lecturers.find(l => String(l.id) === String(classData.lecturerId))?.name
                            ?? lecturers.find(l => String(l.id) === String(classData.lecturerId))?.lecturerName
                            ?? "TBA")
                          : "TBA"}
                      </span>
                      <span className="label">Địa điểm:</span>
                      <span className="value">
                        {classData.locationId
                          ? (locations.find(l => String(l.id) === String(classData.locationId))?.name
                            ?? locations.find(l => String(l.id) === String(classData.locationId))?.locationName
                            ?? "TBA")
                          : "TBA"}
                      </span>
                    </div>
                  )}
                </DraggableDroppableCell>
              );
            })}
          </tr>
        );
      })
    );
  };

  return (
    <div style={{ padding: 24 }}>
      <LoadingOverlay show={loading} />
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-sans font-bold text-4xl text-gray-900 tracking-wide">CHỈNH SỬA LỊCH GIẢNG DẠY</h2>
        <button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-sans font-semibold text-base shadow">LƯU</button>
      </div>
      {saveSuccess && !loading && (
        <div className="text-green-600 font-sans text-base mb-4">Lưu thành công!</div>
      )}
      <div className="overflow-x-auto">
        <DndContext onDragEnd={handleDragEnd}>
          <table className="w-full table-fixed border-collapse border border-gray-400 shadow-lg bg-white">
            <thead>
              <tr className="bg-blue-100">
                <th className="border border-gray-400 p-3 text-center text-base font-semibold text-blue-900">Date</th>
                <th className="border border-gray-400 p-3 text-center text-base font-semibold text-blue-900">Session</th>
                {teams.map((team) => (
                  <th key={team} className="border border-gray-400 p-3 text-center text-base font-semibold text-blue-900">Team {team}</th>
                ))}
              </tr>
            </thead>
            <tbody>{
              renderTableRows()
            }</tbody>
          </table>
        </DndContext>
      </div>
      <style>{`
        .manual-edit-cell {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          min-height: 80px;
          text-align: center;
          border: 1px solid #cbd5e1;
          background: #f8fafc;
          border-radius: 6px;
          padding: 8px 0;
          font-size: 13px;
        }
        .manual-edit-cell span.label {
          font-weight: 600;
          color: #2563eb;
          display: block;
          font-size: 11px;
        }
        .manual-edit-cell span.value {
          color: #111827;
          display: block;
          font-size: 13px;
          margin-bottom: 2px;
        }
        .manual-edit-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          color: #9ca3af;
          font-style: italic;
          text-align: center;
          font-size: 15px;
          font-weight: 500;
          padding: 12px 0;
        }
      `}</style>
    </div>
  );
} 