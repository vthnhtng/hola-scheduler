"use client";

import React, { useState, useEffect } from "react";
import TimetableGrid from "../components/TimetableGrid";
import SideBar from "../components/SideBar";
import Header from "../components/Header";

function TimetablePage() {
    const [courses, setCourses] = useState<any[]>([]);
    const [teams, setTeams] = useState<any[]>([]);
    
    const [filters, setFilters] = useState({
        courseId: '',
        teamId: '',
        startDate: '',
        endDate: '',
        status: 'all' as 'scheduled' | 'done' | 'all'
    });

    // Load courses and teams data
    useEffect(() => {
        const loadData = async () => {
            try {
                const [coursesRes, teamsRes] = await Promise.all([
                    fetch('/api/courses'),
                    fetch('/api/teams')
                ]);
                
                const coursesData = await coursesRes.json();
                const teamsData = await teamsRes.json();
                
                setCourses(coursesData.data || []);
                setTeams(teamsData.data || []);
            } catch (error) {
                console.error('Error loading dropdown data:', error);
            }
        };
        
        loadData();
    }, []);

    const handleFilterChange = (field: string, value: string) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <>
            <Header />
            <main className="d-flex justify-content-start align-items-start" style={{ minHeight: '100vh' }}>
                <SideBar />
                <div style={{ width: '100%', background: '#f9fafb' }}>
                    <div className="px-4 py-3 max-w-6xl mx-auto">
                        <h2 className="page-title" style={{ fontSize: '2rem', marginBottom: '1rem' }}>
                            XEM LỊCH GIẢNG DẠY
                        </h2>
                        
                        {/* Filters */}
                        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bộ lọc</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Khóa học
                                    </label>
                                    <select
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                        value={filters.courseId}
                                        onChange={(e) => handleFilterChange('courseId', e.target.value)}
                                    >
                                        <option value="">Tất cả khóa học</option>
                                        {courses.map((course) => (
                                            <option key={course.id} value={course.id}>
                                                {course.name || `Khóa học ${course.id}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Đại đội
                                    </label>
                                    <select
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                        value={filters.teamId}
                                        onChange={(e) => handleFilterChange('teamId', e.target.value)}
                                    >
                                        <option value="">Tất cả đại đội</option>
                                        {teams.map((team) => (
                                            <option key={team.id} value={team.id}>
                                                {team.name || `Đại đội ${team.id}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Từ ngày
                                    </label>
                                    <input
                                        type="date"
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                        value={filters.startDate}
                                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Đến ngày
                                    </label>
                                    <input
                                        type="date"
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                        value={filters.endDate}
                                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Trạng thái
                                    </label>
                                    <select
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                        value={filters.status}
                                        onChange={(e) => handleFilterChange('status', e.target.value as any)}
                                    >
                                        <option value="all">Tất cả</option>
                                        <option value="scheduled">Đã lên lịch</option>
                                        <option value="done">Hoàn thành</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Timetable Grid */}
                        <TimetableGrid
                            courseId={filters.courseId ? Number(filters.courseId) : undefined}
                            teamId={filters.teamId ? Number(filters.teamId) : undefined}
                            startDate={filters.startDate || undefined}
                            endDate={filters.endDate || undefined}
                            status={filters.status}
                            enableDragDrop={true}
                            restrictToTeam={false}
                            onScheduleUpdate={(updatedSchedules) => {
                                console.log('Schedules updated:', updatedSchedules);
                            }}
                        />
                    </div>
                </div>
            </main>
        </>
    );
}

export default TimetablePage;
