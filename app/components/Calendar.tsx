import { useState } from 'react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    isSameMonth,
    isToday
} from 'date-fns';

interface CalendarProps {
    onDateSelect?: (date: Date) => void;
    selectedDates?: Set<string>;
    holidays?: Set<string>;
}

export default function Calendar({ onDateSelect, selectedDates = new Set(), holidays = new Set() }: CalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Hàm chuyển tháng
    const nextMonth = () => {
        setCurrentMonth(addMonths(currentMonth, 1));
    };

    const prevMonth = () => {
        setCurrentMonth(subMonths(currentMonth, 1));
    };

    // Render header tháng + nút
    const renderHeader = () => (
        <div className="flex items-center justify-between w-full bg-slate-800 rounded-t-xl px-4 py-3">
            <button 
                onClick={prevMonth} 
                className="text-white text-2xl font-bold px-2 hover:bg-slate-700 rounded transition-colors"
            >
                &#8592;
            </button>
            <div className="text-2xl font-bold text-white tracking-widest uppercase">{format(currentMonth, 'MMMM')}</div>
            <button 
                onClick={nextMonth} 
                className="text-white text-2xl font-bold px-2 hover:bg-slate-700 rounded transition-colors"
            >
                &#8594;
            </button>
        </div>
    );

    // Render tiêu đề ngày trong tuần
    const renderDays = () => {
        const days = ['S', 'M', 'T', 'W', 'Th', 'F', 'S'];
        return (
            <div className="grid grid-cols-7">
                {days.map((day, idx) => (
                    <div key={idx} className="text-center font-semibold text-white py-2 bg-orange-500 border-b border-orange-400">
                        {day}
                    </div>
                ))}
            </div>
        );
    };

    // Render các ngày trong tháng
    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

        const days = [];
        let day = startDate;

        while (day <= endDate) {
            const formattedDate = format(day, 'd');
            const fullDateStr = format(day, 'yyyy-MM-dd');
            const isSelected = selectedDates.has(fullDateStr);
            const isHoliday = holidays.has(fullDateStr);
            const isCurrentDay = isToday(day);
            const isCurrentMonth = isSameMonth(day, monthStart);

            days.push(
                <div
                    key={fullDateStr}
                    onClick={() => isCurrentMonth && onDateSelect?.(day)}
                    className={`
                        aspect-square w-10 h-10 mx-auto my-1 flex items-center justify-center text-center cursor-pointer select-none
                        text-base
                        ${isCurrentMonth ? 'text-slate-800' : 'text-gray-300'}
                        ${isSelected ? 'bg-blue-500 text-white font-bold' : ''}
                        ${isHoliday ? 'bg-orange-100 text-orange-600 font-bold' : ''}
                        ${isCurrentDay ? 'ring-2 ring-blue-500' : ''}
                        ${isCurrentMonth && !isSelected && !isHoliday ? 'hover:bg-orange-50' : ''}
                        rounded-full transition-all
                        ${!isCurrentMonth ? 'pointer-events-none' : ''}
                    `}
                >
                    {formattedDate}
                </div>
            );
            day = addDays(day, 1);
        }

        return (
            <div className="grid grid-cols-7 bg-white px-2 pb-4 rounded-b-xl w-full">
                {days}
            </div>
        );
    };

    return (
        <div className="rounded-xl shadow-lg w-[340px] bg-white mx-auto">
            {renderHeader()}
            {renderDays()}
            {renderCells()}
        </div>
    );
} 