'use client';

import React, { useState } from "react";
import Scheduler from "../components/Scheduler";
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
    const { isScheduler } = usePermissions();

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

    return (
        <>
            <Header />
            <main className="d-flex">
                <SideBar />
                <div style={{ width: '100%', minHeight: '100vh', background: '#f9fafb' }}>
                    <div className="px-4 py-3 max-w-6xl mx-auto">
                        <h2 className="page-title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>SẮP XẾP LỊCH GIẢNG DẠY</h2>
                        <div className="flex justify-center mt-10">
                            <div className="w-full max-w-4xl">
                                <Scheduler onScheduleGenerated={handleScheduleGenerated} />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
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
