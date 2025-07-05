'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import Header from '../components/Header';
import SideBar from '../components/SideBar';
import Footer from '../components/Footer';
import Calendar from '../components/Calendar';
import { usePermissions } from '../hooks/usePermissions';

export default function HolidaysPage() {
    const [holidays, setHolidays] = useState<Set<string>>(new Set());
    const [modalDate, setModalDate] = useState<Date | null>(null);
    const [modalType, setModalType] = useState<'add' | 'remove' | null>(null);
    const { isScheduler } = usePermissions();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchHolidays();
    }, []);

    const fetchHolidays = async () => {
        const res = await fetch('/api/holiday');
        const data = await res.json();
        setHolidays(new Set(data.map((h: { date: string }) => h.date)));
    };

    const handleDateSelect = async (date: Date) => {
        if (!isScheduler) return;
        setIsLoading(true);
        const dateStr = format(date, 'yyyy-MM-dd');
        try {
            if (holidays.has(dateStr)) {
                await fetch(`/api/holiday?date=${dateStr}`, { method: 'DELETE' });
            } else {
                await fetch('/api/holiday', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ date: dateStr })
                });
            }
            await fetchHolidays();
        } finally {
            setIsLoading(false);
        }
    };

    const handleModalSave = async () => {
        if (!modalDate) return;
        if (!isScheduler) {
            setModalDate(null);
            setModalType(null);
            return;
        }
        const dateStr = format(modalDate, 'yyyy-MM-dd');
        if (modalType === 'add') {
            await fetch('/api/holiday', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: dateStr })
            });
        } else if (modalType === 'remove') {
            await fetch(`/api/holiday?date=${dateStr}`, { method: 'DELETE' });
        }
        await fetchHolidays();
        setModalDate(null);
        setModalType(null);
    };

    const handleModalClose = () => {
        setModalDate(null);
        setModalType(null);
    };

    return (
        <>
            <Header />
            <main className="d-flex">
                <SideBar />
                <div className="flex-grow-1 px-4 py-3 min-h-screen bg-gray-50">
                    <h2 className="page-title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>DANH SÁCH NGÀY NGHỈ LỄ</h2>
                    <div className="max-w-6xl mx-auto">
                        <div className="flex justify-center">
                            <Calendar 
                                onDateSelect={isScheduler ? handleDateSelect : undefined}
                                holidays={holidays}
                            />
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
            {isLoading && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(128,128,128,0.35)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div style={{
                  background: 'white',
                  borderRadius: 12,
                  padding: '32px 48px',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 16,
                }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    border: '5px solid #4CAF50',
                    borderTop: '5px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginBottom: 12,
                  }} />
                  <span style={{ color: '#222', fontWeight: 600, fontSize: 18 }}>Đang cập nhật dữ liệu...</span>
                  <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                </div>
              </div>
            )}
        </>
    );
} 