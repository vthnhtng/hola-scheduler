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
            <div className="row g-0">
                {days.map((day, idx) => (
                    <div key={idx} className="col text-center fw-bold text-white py-2 bg-warning border-bottom border-warning">
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
        const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

        const rows = [];
        let days = [];
        let day = startDate;
        let idx = 0;

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
                    className={`col text-center align-middle py-2 border bg-white ${isCurrentMonth ? '' : 'text-secondary'} ${isSelected ? 'bg-primary text-white fw-bold' : ''} ${isHoliday ? 'bg-warning text-danger fw-bold' : ''} ${isCurrentDay ? 'border border-primary border-2' : ''} ${!isCurrentMonth ? 'opacity-50' : ''} rounded-circle`}
                    style={{ cursor: isCurrentMonth ? 'pointer' : 'default', minHeight: 40 }}
                >
                    {formattedDate}
                </div>
            );
            if ((idx + 1) % 7 === 0) {
                rows.push(<div className="row g-0" key={day.toISOString()}>{days}</div>);
                days = [];
            }
            day = addDays(day, 1);
            idx++;
        }
        // Nếu còn ngày lẻ cuối tháng
        if (days.length > 0) {
            while (days.length < 7) {
                days.push(<div className="col" key={`empty-${days.length}`}></div>);
            }
            rows.push(<div className="row g-0" key="last-row">{days}</div>);
        }
        return <div className="bg-white p-2">{rows}</div>;
    };

    return (
        <div className="rounded shadow w-100 mx-auto bg-white p-3" style={{maxWidth: 500}}>
            {renderHeader()}
            {renderDays()}
            {renderCells()}
        </div>
    );
} 