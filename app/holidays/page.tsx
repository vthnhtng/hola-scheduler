'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import Header from '../components/Header';
import SideBar from '../components/SideBar';
import Footer from '../components/Footer';
import Calendar from '../components/Calendar';

export default function HolidaysPage() {
    const [holidays, setHolidays] = useState<Set<string>>(new Set());
    const [modalDate, setModalDate] = useState<Date | null>(null);
    const [modalType, setModalType] = useState<'add' | 'remove' | null>(null);

    const handleDateSelect = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        if (holidays.has(dateStr)) {
            setModalType('remove');
        } else {
            setModalType('add');
        }
        setModalDate(date);
    };

    const handleModalSave = () => {
        if (!modalDate) return;
        const dateStr = format(modalDate, 'yyyy-MM-dd');
        const newHolidays = new Set(holidays);
        if (modalType === 'add') {
            newHolidays.add(dateStr);
        } else if (modalType === 'remove') {
            newHolidays.delete(dateStr);
        }
        setHolidays(newHolidays);
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
                <div className="flex-grow-1 p-4 min-h-screen bg-gray-50">
                    <div className="max-w-6xl mx-auto">
                        <h1 className="text-2xl font-bold mb-6 text-center">Quản lý ngày nghỉ</h1>
                        <div className="flex justify-center">
                            <Calendar 
                                onDateSelect={handleDateSelect}
                                holidays={holidays}
                            />
                        </div>
                    </div>
                </div>
            </main>
            <Footer />

            {/* Modal */}
            {modalDate && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-lg p-8 min-w-[320px] flex flex-col items-center">
                        <div className="text-lg font-semibold mb-4">
                            {modalType === 'add' ? 'Thêm ngày nghỉ' : 'Xóa ngày nghỉ'}
                        </div>
                        <div className="mb-6 text-gray-700 text-center">
                            {format(modalDate, 'EEEE, dd/MM/yyyy')}
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={handleModalSave}
                                className={`px-4 py-2 rounded text-white font-semibold transition-colors ${modalType === 'add' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-red-500 hover:bg-red-600'}`}
                            >
                                Lưu
                            </button>
                            <button
                                onClick={handleModalClose}
                                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold"
                            >
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
} 