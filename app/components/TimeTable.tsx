'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DateRange, TimetableData } from '@/types/TimeTableTypes';
import { format } from 'date-fns';
import LoadingOverlay from "./LoadingOverlay";

function TimeTable() {
    // State cho date picker và filters
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [selectedTeam, setSelectedTeam] = useState<string>("");
    const [selectedLecturer, setSelectedLecturer] = useState<string>("");
    const [hasInitialLoad, setHasInitialLoad] = useState<boolean>(false);
    
    const [teams, setTeams] = useState<string[]>([]);
    const [timetableData, setTimetableData] = useState<TimetableData[]>([]);
    const [filteredData, setFilteredData] = useState<TimetableData[]>([]);
    const [hasExistingSchedules, setHasExistingSchedules] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [dateRange, setDateRange] = useState<DateRange>();
    const [error, setError] = useState<string | null>(null);
    
    // Reference data
    const [lecturers, setLecturers] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [locations, setLocations] = useState<any[]>([]);
    const [editingCell, setEditingCell] = useState<string | null>(null);
    const [editData, setEditData] = useState<{lecturerId: string, locationId: string}>({lecturerId: '', locationId: ''});
    
    const tableRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLTableRowElement>(null);
    const sessions = ['Morning', 'Afternoon', 'Evening'] as const;
    const sessionKeys = ['morning', 'afternoon', 'evening'] as const;

    useEffect(() => {
        console.log('TimeTable render', timetableData);
    }, [timetableData]);

    // Load reference data
    useEffect(() => {
        Promise.all([
            fetch("/api/lecturers").then(res => res.json()).then(res => res.data || []),
            fetch("/api/courses").then(res => res.json()).then(res => res.data || []),
            fetch("/api/locations").then(res => res.json()).then(res => res.data || [])
        ]).then(([lecturersData, coursesData, locationsData]) => {
            setLecturers(lecturersData);
            setCourses(coursesData);
            setLocations(locationsData);
        }).catch(console.error);
    }, []);

    // Set default dates to current month
    useEffect(() => {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const defaultStartDate = startOfMonth.toISOString().split('T')[0];
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const defaultEndDate = endOfMonth.toISOString().split('T')[0];
        
        setStartDate(defaultStartDate);
        setEndDate(defaultEndDate);
    }, []);

    // Hàm fetch dữ liệu từ API
    const fetchSchedule = async () => {
        if (!startDate || !endDate) {
            setError('Vui lòng chọn ngày bắt đầu và kết thúc');
            return;
        }
        
        setIsLoading(true);
        setError(null);
        
        try {
            const params = new URLSearchParams({
                startDate,
                endDate,
                status: 'done' // Chỉ xem lịch done
            });
            
            if (selectedTeam) params.append('courseId', selectedTeam);
            
            const url = `/api/get-schedules-by-time?${params}`;
            console.log('Fetching from:', url);
            
            const res = await fetch(url);
            const data = await res.json();
            
            if (res.ok) {
            if (!data) {
                setTimetableData([]);
                setTeams([]);
                setDateRange(undefined);
                setHasExistingSchedules(false);
                    setError('Không tìm thấy lịch học trong khoảng thời gian này');
                return;
            }
                
                console.log('API Response:', data);
                
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
                setTeams([...new Set(allTeams)].sort());
                setDateRange(minDate && maxDate ? { 
                    from: new Date(minDate), 
                    to: new Date(maxDate) 
                } : undefined);
                setHasExistingSchedules(allData.length > 0);
                
                console.log('Processed data:', {
                    timetableData: allData.length,
                    teams: [...new Set(allTeams)],
                    dateRange: { from: minDate, to: maxDate }
                });
            } else {
                setError(data.error || 'Lỗi khi tải dữ liệu');
                setTimetableData([]);
                setTeams([]);
                setDateRange(undefined);
                setHasExistingSchedules(false);
            }
        } catch (error) {
            console.error('Error fetching schedule:', error);
            setError('Lỗi kết nối khi tải dữ liệu');
            setTimetableData([]);
            setTeams([]);
            setDateRange(undefined);
            setHasExistingSchedules(false);
        } finally {
            setIsLoading(false);
        }
    };

    // Initial load when default dates are set
    useEffect(() => {
        // Only auto-load on first time when default dates are ready
        if (startDate && endDate && !hasInitialLoad) {
            fetchSchedule();
            setHasInitialLoad(true);
        }
    }, [startDate, endDate]); // Run when dates are initially set

    // Function to delete schedule
    const deleteSchedule = async (date: string, session: string, teamId: string) => {
        if (!confirm('Bạn có chắc muốn xóa lịch này?')) {
            return;
        }

        try {
            const response = await fetch('/api/schedule/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    date,
                    session,
                    teamId,
                    status: 'done' // Chỉ xóa lịch done
                })
            });

            if (response.ok) {
                // Refresh data after deletion
                fetchSchedule();
                alert('Đã xóa lịch thành công!');
            } else {
                alert('Có lỗi khi xóa lịch');
            }
        } catch (error) {
            console.error('Error deleting schedule:', error);
            alert('Có lỗi khi xóa lịch');
        }
    };

    // Edit functions
    const startEdit = (cellId: string, lecturerId: string, locationId: string) => {
        setEditingCell(cellId);
        setEditData({ lecturerId, locationId });
    };

    const saveEdit = async (date: string, session: string, teamId: string) => {
        try {
            // Find the item to update
            const itemIndex = filteredData.findIndex(item =>
                item.date === date &&
                item.session === session &&
                item.teamId.toString() === teamId.toString()
            );

            if (itemIndex === -1) {
                setError('Không tìm thấy lịch cần cập nhật');
                return;
            }

            // Update the item
            const updatedData = [...filteredData];
            const lecturer = lecturers.find(l => l.id.toString() === editData.lecturerId);
            const location = locations.find(l => l.id.toString() === editData.locationId);

            updatedData[itemIndex] = {
                ...updatedData[itemIndex],
                class: {
                    ...updatedData[itemIndex].class,
                    lecturer: lecturer?.fullName || lecturer?.name || 'TBA',
                    location: location?.name || location?.locationName || 'TBA'
                }
            };

            setFilteredData(updatedData);
            setEditingCell(null);
            setEditData({ lecturerId: '', locationId: '' });

            // TODO: Save to backend
            console.log('Updated schedule:', updatedData[itemIndex]);
        } catch (error) {
            console.error('Error updating schedule:', error);
            setError('Có lỗi xảy ra khi cập nhật lịch');
        }
    };

    const cancelEdit = () => {
        setEditingCell(null);
        setEditData({ lecturerId: '', locationId: '' });
    };

    // Apply client-side filters
    useEffect(() => {
        let filtered = [...timetableData];

        // Filter by lecturer
        if (selectedLecturer) {
            const lecturer = lecturers.find(l => l.id.toString() === selectedLecturer);
            if (lecturer) {
                filtered = filtered.filter(item => 
                    item.class.lecturer === lecturer.fullName || 
                    item.class.lecturer === lecturer.name
                );
            }
        }

        setFilteredData(filtered);
    }, [timetableData, selectedLecturer, lecturers]);

    const renderTableRows = () => {
        if (!dateRange) return null;
        const uniqueDates = [...new Set(filteredData.map(item => item.date))].sort();
        const sessions = ['Morning', 'Afternoon', 'Evening'] as const;
        const sessionKeys = ['morning', 'afternoon', 'evening'] as const;
        
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
                            const classData = filteredData.find(item =>
                                item.date === date &&
                                item.session === sessionKey &&
                                item.teamId.toString() === (teamId || '').toString()
                            );
                            return (
                                <td key={cellId} className="border border-gray-400 p-2">
                                    {(!classData ||
                                        (!classData.class.subject && !classData.class.lecturer && !classData.class.location) ||
                                        ([classData?.class?.subject, classData?.class?.lecturer, classData?.class?.location].every(v => !v || v === 'TBA'))
                                    ) ? (
                                        <span className="manual-edit-empty">Trống</span>
                                    ) : (
                                        <div className="manual-edit-cell relative">
                                            <span className="label">Học phần:</span>
                                            <span className="value">
                                                {classData.class.subject || "TBA"}
                                            </span>
                                            
                                            {editingCell === cellId ? (
                                                // Edit mode
                                                <div className="edit-controls">
                                                    <span className="label">Giảng viên:</span>
                                                    <select
                                                        value={editData.lecturerId}
                                                        onChange={(e) => setEditData({...editData, lecturerId: e.target.value})}
                                                        className="w-full text-xs border border-gray-300 rounded px-1 py-1"
                                                    >
                                                        <option value="">Chọn giảng viên</option>
                                                        {lecturers.map(lecturer => (
                                                            <option key={lecturer.id} value={lecturer.id}>
                                                                {lecturer.fullName || lecturer.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    
                                                    <span className="label">Địa điểm:</span>
                                                    <select
                                                        value={editData.locationId}
                                                        onChange={(e) => setEditData({...editData, locationId: e.target.value})}
                                                        className="w-full text-xs border border-gray-300 rounded px-1 py-1"
                                                    >
                                                        <option value="">Chọn địa điểm</option>
                                                        {locations.map(location => (
                                                            <option key={location.id} value={location.id}>
                                                                {location.name || location.locationName}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    
                                                    <div className="flex space-x-1 mt-2">
                                                        <button
                                                            onClick={() => saveEdit(date, sessionKey, teamId)}
                                                            className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                                                        >
                                                            Lưu
                                                        </button>
                                                        <button
                                                            onClick={cancelEdit}
                                                            className="bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600"
                                                        >
                                                            Hủy
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                // View mode
                                                <>
                                                    <span className="label">Giảng viên:</span>
                                                    <span className="value">
                                                        {classData.class.lecturer || "TBA"}
                                                    </span>
                                                    <span className="label">Địa điểm:</span>
                                                    <span className="value">
                                                        {classData.class.location || "TBA"}
                                                    </span>
                                                    
                                                    {/* Action buttons */}
                                                    <div className="absolute top-1 right-1 flex space-x-1">
                                                        <button
                                                            onClick={() => startEdit(cellId, '', '')}
                                                            className="bg-blue-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-blue-600"
                                                            title="Chỉnh sửa"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            onClick={() => deleteSchedule(date, sessionKey, teamId)}
                                                            className="bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-600"
                                                            title="Xóa lịch"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </td>
                            );
                        })}
                    </tr>
                );
            })
        );
    };

    const clearAllFilters = () => {
        setSelectedTeam("");
        setSelectedLecturer("");
        // Reset dates to current month
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const defaultStartDate = startOfMonth.toISOString().split('T')[0];
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const defaultEndDate = endOfMonth.toISOString().split('T')[0];
        setStartDate(defaultStartDate);
        setEndDate(defaultEndDate);
        setHasInitialLoad(false);
    };

    if (isLoading) {
        return (
            <>
                <LoadingOverlay show={true} text="Đang tải dữ liệu lịch học..." />
            </>
        );
    }

        return (
        <div style={{ padding: 24 }}>
            <LoadingOverlay show={isLoading} />
            <div className="flex items-center justify-between mb-6">
                <h2 className="font-sans font-bold text-4xl text-gray-900 tracking-wide">XEM LỊCH GIẢNG DẠY</h2>
                <button onClick={fetchSchedule} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-sans font-semibold text-base shadow">TẢI LẠI</button>
            </div>

            {/* Bộ lọc */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Từ ngày:
                        </label>
                        <input 
                            type="date" 
                            value={startDate} 
                            onChange={e => setStartDate(e.target.value)} 
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Đến ngày:
                        </label>
                        <input 
                            type="date" 
                            value={endDate} 
                            onChange={e => setEndDate(e.target.value)} 
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Khóa học:
                        </label>
                        <select
                            value={selectedTeam}
                            onChange={e => setSelectedTeam(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        >
                            <option value="">Tất cả khóa học</option>
                            {courses.map(course => (
                                <option key={course.id} value={course.id}>
                                    {course.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Giảng viên:
                        </label>
                        <select
                            value={selectedLecturer}
                            onChange={e => setSelectedLecturer(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        >
                            <option value="">Tất cả giảng viên</option>
                            {lecturers.map(lecturer => (
                                <option key={lecturer.id} value={lecturer.id}>
                                    {lecturer.fullName || lecturer.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                
                {/* Nút tìm kiếm */}
                <div className="mt-4 flex justify-center space-x-4">
                    <button 
                        onClick={fetchSchedule} 
                        disabled={!startDate || !endDate}
                        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                        Xem lịch
                    </button>
                    <button 
                        onClick={clearAllFilters}
                        className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 transition-colors font-medium"
                    >
                        Reset
                    </button>
                </div>
            </div>

            {/* Thông báo lỗi */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {/* Bảng lịch dạng timetable */}
            {filteredData.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-400 shadow-lg bg-white">
                        <thead>
                            <tr className="bg-blue-100">
                                <th className="border border-gray-400 p-2 text-center text-sm font-semibold text-blue-900 min-w-[80px]">Date</th>
                                <th className="border border-gray-400 p-2 text-center text-sm font-semibold text-blue-900 min-w-[60px]">Session</th>
                                {teams.map((team) => (
                                    <th key={team} className="border border-gray-400 p-2 text-center text-sm font-semibold text-blue-900 min-w-[120px]">Team {team}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {renderTableRows()}
                        </tbody>
                    </table>
                </div>
            ) : !isLoading && !error ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                    <div className="text-gray-600">
                        <div className="text-4xl mb-4">📅</div>
                        <div className="text-lg font-medium mb-2">Không có lịch học</div>
                        <div className="text-sm">
                            {selectedLecturer 
                                ? 'Không tìm thấy lịch học phù hợp với bộ lọc đã chọn'
                                : 'Hãy chọn khoảng thời gian để xem lịch'
                            }
                        </div>
                    </div>
                </div>
            ) : null}

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

export default TimeTable; 