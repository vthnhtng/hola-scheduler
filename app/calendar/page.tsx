'use client';

import { useState } from 'react';
import Header from '../components/Header';
import SideBar from '../components/SideBar';
import Footer from '../components/Footer';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth
} from 'date-fns';

function HolidaySelectPage() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());

    const nextMonth = () => {
        setCurrentMonth(addMonths(currentMonth, 1));
    };

    const prevMonth = () => {
        setCurrentMonth(subMonths(currentMonth, 1));
    };

    const toggleDate = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const updated = new Set(selectedDates);
        if (updated.has(dateStr)) {
            updated.delete(dateStr);
        } else {
            updated.add(dateStr);
        }
        setSelectedDates(updated);
    };

    const renderHeader = () => (
        <div className="flex items-center justify-between w-full mb-4">
            <button onClick={prevMonth} className="p-2 border rounded hover:bg-gray-100">
                &#8592;
            </button>
            <div className="text-lg font-bold">{format(currentMonth, 'MMMM yyyy')}</div>
            <button onClick={nextMonth} className="p-2 border rounded hover:bg-gray-100">
                &#8594;
            </button>
        </div>
    );

    const renderDays = () => {
        const days = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
        return (
            <div className="grid grid-cols-7 gap-2 mb-2 text-center font-semibold text-gray-600">
                {days.map((day, idx) => (
                    <div key={idx}>{day}</div>
                ))}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

        const rows = [];
        let day = startDate;

        while (day <= endDate) {
            const days = [];

            for (let i = 0; i < 7; i++) {
                const formattedDate = format(day, 'd');
                const fullDateStr = format(day, 'yyyy-MM-dd');
                const isSelected = selectedDates.has(fullDateStr);

                days.push(
                    <div
                        key={fullDateStr}
                        onClick={() => toggleDate(day)}
                        className={`p-2 text-center cursor-pointer transition-all select-none ${!isSameMonth(day, monthStart)
                                ? 'text-gray-300'
                                : 'text-gray-800'
                            } ${isSelected
                                ? 'bg-blue-500 text-white rounded-full'
                                : 'hover:bg-blue-100 rounded-full'
                            }`}
                    >
                        {formattedDate}
                    </div>
                );
                day = addDays(day, 1);
            }

            rows.push(
                <div className="grid grid-cols-7 gap-2" key={day.toISOString()}>
                    {days}
                </div>
            );
        }

        return <div>{rows}</div>;
    };

    return (
        <>
            <Header />
            <main className="d-flex">
                <SideBar />
                <div className="flex-grow-1 d-flex justify-content-center items-center p-4 min-h-screen">
                    <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center w-[400px]">
                        {renderHeader()}
                        {renderDays()}
                        {renderCells()}
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}

export default HolidaySelectPage;
