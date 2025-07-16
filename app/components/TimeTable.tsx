'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DateRange, TimetableData } from '@/types/TimeTableTypes';
import { ApiResponseHandler } from '@/model/time-table/ApiResponseHandler';
import { format } from 'date-fns';
import { DndContext, DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import LoadingOverlay from "./LoadingOverlay";

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

function TimeTable() {
    // Thêm state cho date picker
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [teams, setTeams] = useState<string[]>([]);
    const [timetableData, setTimetableData] = useState<TimetableData[]>([]);
    const [hasExistingSchedules, setHasExistingSchedules] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [dateRange, setDateRange] = useState<DateRange>();
    
    const tableRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLTableRowElement>(null);
    const sessions = ['Morning', 'Afternoon', 'Evening'] as const;
    const sessionKeys = ['morning', 'afternoon', 'evening'] as const;

    useEffect(() => {
        console.log('TimeTable render', timetableData);
    }, [timetableData]);

    // Hàm fetch dữ liệu từ API mới
    const fetchSchedule = async () => {
        if (!startDate || !endDate) return;
        setIsLoading(true);
        try {
            const url = `/api/get-schedules-by-time?startDate=${startDate}&endDate=${endDate}`;
            const res = await fetch(url);
            const data = await res.json();
            if (!data) {
                setTimetableData([]);
                setTeams([]);
                setDateRange(undefined);
                setHasExistingSchedules(false);
                setIsLoading(false);
                return;
            }
            // Xử lý dữ liệu trả về (giả sử data là mảng các tuần)
            // Gộp tất cả các entry lại thành 1 mảng lớn
            let allData: TimetableData[] = [];
            let allTeams: string[] = [];
            let minDate = startDate, maxDate = endDate;
            data.forEach((week: any) => {
                if (week.timetableData) {
                    allData = allData.concat(week.timetableData);
                    allTeams = allTeams.concat(week.teams || []);
                }
                if (week.dateRange) {
                    if (!minDate || week.dateRange.from < minDate) minDate = week.dateRange.from;
                    if (!maxDate || week.dateRange.to > maxDate) maxDate = week.dateRange.to;
                }
            });
            setTimetableData(allData);
            setTeams([...new Set(allTeams)]);
            setDateRange(minDate && maxDate ? { from: new Date(minDate), to: new Date(maxDate) } : undefined);
            setHasExistingSchedules(true);
        } catch (error) {
            setTimetableData([]);
            setTeams([]);
            setDateRange(undefined);
            setHasExistingSchedules(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        console.log('handleDragEnd called', event);
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const parseId = (id: string) => {
            // id dạng: yyyy-mm-dd-session-teamId
            const parts = id.split('-');
            const date = parts.slice(0, 3).join('-'); // yyyy-mm-dd
            const session = parts[3];
            const team = parts.slice(4).join('-');
            return { date, session, team };
        };

        const from = parseId(String(active.id));
        const to = parseId(String(over.id));

        console.log('Drag from:', from, 'to:', to);

        setTimetableData((prev) => {
            // Deep clone để chắc chắn React nhận ra thay đổi
            const newData = prev.map(item => ({ ...item, class: { ...item.class } }));

            const fromIdx = newData.findIndex(
                item =>
                    item.date === from.date &&
                    item.session === from.session &&
                    item.teamId.toString() === from.team.toString()
            );
            const toIdx = newData.findIndex(
                item =>
                    item.date === to.date &&
                    item.session === to.session &&
                    item.teamId.toString() === to.team.toString()
            );

            console.log('fromIdx:', fromIdx, 'toIdx:', toIdx);

            const fromData = fromIdx !== -1 ? newData[fromIdx] : null;
            const toData = toIdx !== -1 ? newData[toIdx] : null;

            console.log('fromData:', fromData, 'toData:', toData);

            // Kiểm tra xem ô nguồn có dữ liệu không
            const hasFromData = fromData && fromData.class && fromData.class.subject && fromData.class.subject.trim() !== '';
            
            // Nếu ô nguồn không có dữ liệu, không làm gì
            if (!hasFromData) {
                console.log('Source cell is empty, no action needed');
                return newData;
            }

            // Nếu ô đích không tồn tại, tạo mới
            if (toIdx === -1) {
                newData.push({
                    date: to.date,
                    session: to.session as "morning" | "afternoon" | "evening",
                    teamId: to.team,
                    class: { ...fromData!.class },
                });
                
                // Xóa dữ liệu từ ô nguồn
                if (fromIdx !== -1) {
                    newData[fromIdx] = {
                        ...newData[fromIdx],
                        class: { subject: '', lecturer: '', location: '' },
                    };
                }
                
                console.log('Created new cell and cleared source');
                return newData;
            }

            // Nếu ô đích tồn tại
            const hasToData = toData && toData.class && toData.class.subject && toData.class.subject.trim() !== '';

            if (hasToData) {
                // Swap: cả hai ô đều có dữ liệu
                const tempClass = { ...fromData!.class };
                newData[fromIdx] = {
                    ...newData[fromIdx],
                    class: { ...toData!.class },
                };
                newData[toIdx] = {
                    ...newData[toIdx],
                    class: tempClass,
                };
                console.log('Swapped data between cells');
            } else {
                // Move: ô đích trống
                newData[toIdx] = {
                    ...newData[toIdx],
                    class: { ...fromData!.class },
                };
                newData[fromIdx] = {
                    ...newData[fromIdx],
                    class: { subject: '', lecturer: '', location: '' },
                };
                console.log('Moved data to empty cell');
            }

            console.log('Updated timetableData:', newData);
            return newData;
        });
    };

    const renderTableRows = () => {
        console.log('renderTableRows', timetableData);
        const rows: React.ReactElement[] = [];
        
        if (!dateRange) return rows;

        const uniqueDates = [...new Set(timetableData.map(item => item.date))].sort();

        uniqueDates.forEach((date) => {
            sessionKeys.forEach((sessionKey, sessionIndex) => {
                const sessionName = sessions[sessionIndex];

                rows.push(
                    <tr key={`${date}-${sessionKey}`} className={`${sessionIndex % 2 === 0 ? 'bg-white' : 'bg-gray-100'}`}>
                        {sessionIndex === 0 && (
                            <td 
                                rowSpan={3} 
                                className="w-20 h-16 px-2 py-2 border border-gray-300 text-center font-medium bg-gray-100 align-middle text-sm text-gray-700"
                            >
                                {format(new Date(date), 'EEE, MMM d')}
                            </td>
                        )}
                        <td className="w-20 h-16 px-2 py-2 border border-gray-300 text-center font-medium bg-gray-50 align-middle text-sm text-gray-700">
                            {sessionName}
                        </td>
                        {teams.map((team) => {
                            const teamId = team.split('-').pop(); // chỉ lấy số cuối
                            const cellId = `${date}-${sessionKey}-${teamId}`;
                            const classData = timetableData.find(item => 
                                item.date === date && 
                                item.session === sessionKey &&
                                item.teamId.toString() === (teamId || '').toString()
                            );
                            return (
                                <DraggableDroppableCell key={cellId} id={cellId}>
                                    {classData && classData.class && classData.class.subject ? (
                                        <div className="space-y-1">
                                            <div className="font-medium text-blue-600 text-sm">
                                                Subject: {classData.class.subject}
                                            </div>
                                            <div className="text-xs text-gray-600">
                                                Lecturer: {classData.class.lecturer || 'TBA'}
                                            </div>
                                            <div className="text-xs text-gray-600">
                                                Location: {classData.class.location || 'TBA'}
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400">-</span>
                                    )}
                                </DraggableDroppableCell>
                            );
                        })}
                    </tr>
                );
            });
        });
        
        return rows;
    };

    if (isLoading) {
        return (
            <>
                <LoadingOverlay show={true} text="Đang tải dữ liệu..." />
            </>
        );
    }

    return (
        <div className="w-full bg-white rounded-lg shadow-lg" ref={tableRef}>
            <div className="p-6">
                <h2 className="page-title" style={{ fontSize: '2rem' }}>LỊCH GIẢNG DẠY</h2>
                {/* Bảng chọn ngày */}
                <div className="flex items-center gap-4 mb-4">
                    <label className="flex items-center gap-2 text-sm">
                        Từ ngày:
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border rounded px-2 py-1" />
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                        Đến ngày:
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border rounded px-2 py-1" />
                    </label>
                    <button onClick={fetchSchedule} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Xem lịch</button>
                </div>
                
                {hasExistingSchedules && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm text-blue-700">
                            <strong>Thông báo:</strong> Đang sử dụng lịch đã được tạo trước đó. 
                            Nếu muốn tạo lịch mới, vui lòng xóa file lịch cũ trong thư mục schedules/scheduled.
                        </p>
                    </div>
                )}
                
                {dateRange && (
                    <div className="mb-4 text-sm text-gray-600">
                        <strong>Schedule Period:</strong> {' '}
                        {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                    </div>
                )}

                <div className="overflow-x-auto">
                    <DndContext onDragEnd={handleDragEnd}>
                        <table className="w-full table-fixed border-collapse border border-gray-300">
                            <thead>
                                <tr ref={headerRef} className="bg-gray-100">
                                    <th className="w-20 h-12 px-2 py-2 border border-gray-300 text-center font-medium text-gray-700 text-sm bg-gray-100">
                                        Date
                                    </th>
                                    <th className="w-20 h-12 px-2 py-2 border border-gray-300 text-center font-medium text-gray-700 text-sm bg-gray-100">
                                        Session
                                    </th>
                                    {teams.map((team) => (
                                        <th 
                                            key={team} 
                                            className="w-24 h-12 px-2 py-2 border border-gray-300 text-center font-medium text-gray-700 text-sm bg-gray-100"
                                        >
                                            Team {team}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {renderTableRows()}
                            </tbody>
                        </table>
                    </DndContext>
                </div>
            </div>
        </div>
    );
}

export default TimeTable; 