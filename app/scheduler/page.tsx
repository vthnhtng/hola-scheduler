'use client';

import React, { useState, useEffect } from "react";
import Scheduler from "../components/Scheduler";
import TimetableGrid from "../components/TimetableGrid";
import ProcessingTimetable from "../components/ProcessingTimetable";
import CompletedTimetable from "../components/CompletedTimetable";
import SuccessNotification from "../components/SuccessNotification";
import SideBar from "../components/SideBar";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { usePermissions } from "../hooks/usePermissions";

function EditableTimetable({ schedule, onChange }: { schedule: any, onChange: (s: any) => void }) {
    // Simple editable table for demo (edit subjectId directly)
    if (!schedule) return null;
    const rows = Array.isArray(schedule) ? schedule : [schedule];
    return (
        <table className="table table-bordered">
            <thead>
                <tr>
                    <th>Tuần</th>
                    <th>Ngày</th>
                    <th>Buổi</th>
                    <th>Môn học (subjectId)</th>
                </tr>
            </thead>
            <tbody>
                {rows.map((row: any, idx: number) => (
                    <tr key={idx}>
                        <td>{row.week}</td>
                        <td>{row.date}</td>
                        <td>{row.session}</td>
                        <td>
                            <input
                                value={row.subjectId ?? ''}
                                onChange={e => {
                                    const newRows = [...rows];
                                    newRows[idx] = { ...row, subjectId: e.target.value };
                                    onChange(newRows);
                                }}
                                style={{ width: 80 }}
                            />
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export default function SchedulerPage() {
    const [showModal, setShowModal] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<any>(null);
    const [filePath, setFilePath] = useState<string>("");
    const [activeTab, setActiveTab] = useState<'generate' | 'view' | 'processing'>('generate');
    const [showSuccessNotification, setShowSuccessNotification] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    
    // Dynamic data for dropdowns
    const [courses, setCourses] = useState<any[]>([]);
    const [teams, setTeams] = useState<any[]>([]);
    
    // Schedule viewing filters
    const [viewFilters, setViewFilters] = useState({
        courseId: '',
        teamId: '',
        startDate: '',
        endDate: ''
    });
    
    const { isScheduler } = usePermissions();

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

    // Listener để nhận message từ popup window
    React.useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data.type === 'SAVE_SCHEDULE') {
                console.log('Received save schedule message:', event.data);
                // Có thể thêm logic xử lý nếu cần
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const handleScheduleGenerated = (schedule: any, fileName: string) => {
        // console.log('handleScheduleGenerated called with:', schedule, fileName); // Debug
        setEditingSchedule(schedule);
        setFilePath(fileName);
        setShowModal(true);
        // console.log('Modal should be visible now, showModal:', true); // Debug
    };

    const handleScheduleSuccess = (courseId: number, actionType: 'generate' | 'assign' = 'generate') => {
        console.log('Schedule action completed successfully for course:', courseId, 'Action:', actionType);
        
        if (actionType === 'generate') {
            // Khi tạo lịch mới - chuyển sang tab "Thời khóa biểu đã sắp môn học"
            setSuccessMessage('Lịch đã được sắp xếp thành công! Lịch mới đã được thêm vào "Thời khóa biểu đã sắp môn học".');
            setShowSuccessNotification(true);
            
            setTimeout(() => {
                setActiveTab('processing');
                setViewFilters(prev => ({
                    ...prev,
                    courseId: courseId.toString()
                }));
            }, 2000);
        } else {
            // Khi sắp giảng viên địa điểm - chuyển sang tab "Thời khóa biểu đã hoàn thành"
            console.log('🔄 Switching to view tab for assign action');
            setSuccessMessage('Đã sắp xếp giảng viên và địa điểm thành công! Lịch đã được chuyển vào "Thời khóa biểu đã hoàn thành".');
            setShowSuccessNotification(true);
            
            setTimeout(() => {
                console.log('⏰ Timeout triggered, setting activeTab to view');
                setActiveTab('view');
                setViewFilters(prev => ({
                    ...prev,
                    courseId: courseId.toString()
                }));
                console.log('✅ Tab switched to view, filters updated');
            }, 2000);
        }
    };

    async function handleSave() {
        try {
            const res = await fetch('/api/schedule/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filePath, content: editingSchedule })
            });
            
            if (res.ok) {
                alert('Lưu lịch thành công!');
                setShowModal(false);
            } else {
                alert('Có lỗi khi lưu lịch');
            }
        } catch (error) {
            console.error('Error saving schedule:', error);
            alert('Có lỗi khi lưu lịch');
        }
    }

    const handleViewFilterChange = (field: string, value: string) => {
        setViewFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <>
            <Header />
            <main className="d-flex">
                <SideBar />
                <div style={{ width: '100%', minHeight: '100vh', background: '#f9fafb' }}>
                    <div className="px-4 py-3 max-w-6xl mx-auto">
                        <h2 className="page-title" style={{ fontSize: '2rem', marginBottom: '1rem' }}>
                            SẮP XẾP LỊCH GIẢNG DẠY
                        </h2>
                        
                        {/* Tab Navigation */}
                        <div className="mb-6">
                            <div className="border-b border-gray-200">
                                <nav className="-mb-px flex space-x-8">
                                    <button
                                        onClick={() => setActiveTab('generate')}
                                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                            activeTab === 'generate'
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        Tạo thời khóa biểu mới
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('view')}
                                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                            activeTab === 'view'
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        Thời khóa biểu đã hoàn thành
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('processing')}
                                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                            activeTab === 'processing'
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        Thời khóa biểu đã sắp môn học
                                    </button>
                                </nav>
                            </div>
                        </div>

                        {/* Tab Content */}
                        {activeTab === 'generate' && (
                            <div className="flex justify-center mt-10">
                                <div className="w-full max-w-4xl">
                                    <Scheduler 
                                        onScheduleGenerated={handleScheduleGenerated} 
                                        onScheduleSuccess={handleScheduleSuccess}
                                        onDeleteSuccess={() => {
                                            setSuccessMessage('Đã xóa lịch thành công!');
                                            setShowSuccessNotification(true);
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'view' && (
                            <div className="space-y-6">
                                {/* Filters */}
                                <div className="bg-white rounded-lg shadow-sm border p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Bộ lọc</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Khóa học
                                            </label>
                                            <select
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                                value={viewFilters.courseId}
                                                onChange={(e) => handleViewFilterChange('courseId', e.target.value)}
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
                                                value={viewFilters.teamId}
                                                onChange={(e) => handleViewFilterChange('teamId', e.target.value)}
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
                                                value={viewFilters.startDate}
                                                onChange={(e) => handleViewFilterChange('startDate', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Đến ngày
                                            </label>
                                            <input
                                                type="date"
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                                value={viewFilters.endDate}
                                                onChange={(e) => handleViewFilterChange('endDate', e.target.value)}
                                            />
                                        </div>

                                    </div>
                                </div>

                                {/* Completed Timetable */}
                                <CompletedTimetable
                                    courseId={viewFilters.courseId ? Number(viewFilters.courseId) : undefined}
                                    teamId={viewFilters.teamId ? Number(viewFilters.teamId) : undefined}
                                    startDate={viewFilters.startDate || undefined}
                                    endDate={viewFilters.endDate || undefined}
                                    onScheduleUpdate={(updatedSchedules) => {
                                        console.log('Completed schedules updated:', updatedSchedules);
                                        // Có thể thêm logic lưu cập nhật vào database
                                    }}
                                />
                            </div>
                        )}

                        {activeTab === 'processing' && (
                            <div className="space-y-6">
                                {/* Filters */}
                                <div className="bg-white rounded-lg shadow-sm border p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Bộ lọc</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Khóa học
                                            </label>
                                            <select
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                                value={viewFilters.courseId}
                                                onChange={(e) => handleViewFilterChange('courseId', e.target.value)}
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
                                                value={viewFilters.teamId}
                                                onChange={(e) => handleViewFilterChange('teamId', e.target.value)}
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
                                                value={viewFilters.startDate}
                                                onChange={(e) => handleViewFilterChange('startDate', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Đến ngày
                                            </label>
                                            <input
                                                type="date"
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                                value={viewFilters.endDate}
                                                onChange={(e) => handleViewFilterChange('endDate', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Processing Timetable */}
                                <ProcessingTimetable
                                    courseId={viewFilters.courseId ? Number(viewFilters.courseId) : undefined}
                                    teamId={viewFilters.teamId ? Number(viewFilters.teamId) : undefined}
                                    startDate={viewFilters.startDate || undefined}
                                    endDate={viewFilters.endDate || undefined}
                                    onScheduleUpdate={(updatedSchedules) => {
                                        console.log('Processing schedules updated:', updatedSchedules);
                                        // Có thể thêm logic lưu cập nhật vào database
                                    }}
                                    onShowNotification={(message) => {
                                        setSuccessMessage(message);
                                        setShowSuccessNotification(true);
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
            
            {/* Success Notification */}
            <SuccessNotification
                message={successMessage}
                isVisible={showSuccessNotification}
                onClose={() => setShowSuccessNotification(false)}
                autoHide={true}
                duration={4000}
            />
            
            {/* Modal chỉnh sửa lịch dạng timetable đơn giản */}
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#fff', padding: 24, borderRadius: 8, width: 800, maxHeight: '80vh', overflow: 'auto' }}>
                        <h4>Chỉnh sửa lịch tuần - {filePath}</h4>
                        <p>Debug: showModal = {showModal.toString()}, editingSchedule = {editingSchedule ? 'exists' : 'null'}</p>
                        <EditableTimetable schedule={editingSchedule} onChange={setEditingSchedule} />
                        <div className="d-flex justify-content-end gap-2 mt-3">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Đóng</button>
                            {isScheduler ? (
                                <button className="btn btn-success" onClick={handleSave}>Lưu</button>
                            ) : (
                                <button className="btn btn-success" disabled style={{ pointerEvents: 'none', opacity: 0.6 }}>Lưu</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
            <style jsx global>{`
                main.d-flex {
                    align-items: flex-start !important;
                }
                .sidebar {
                    height: auto !important;
                    min-height: 100vh;
                }
                .px-4.py-3.bg-gray-50 {
                    height: auto !important;
                    min-height: unset !important;
                }
            `}</style>
        </>
    );
}
