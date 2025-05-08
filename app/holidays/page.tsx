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
        </>
    );
} 