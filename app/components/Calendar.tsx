import { useState, useEffect } from 'react';
import {
    format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isToday
} from 'date-fns';

interface CalendarProps {
    onDateSelect?: (date: Date) => void;
    selectedDates?: Set<string>;
    holidays?: Set<string>;
}

export default function Calendar({ onDateSelect, selectedDates = new Set(), holidays = new Set() }: CalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [hoveredDate, setHoveredDate] = useState<string | null>(null);
    const [holidaySet, setHolidaySet] = useState<Set<string>>(new Set());

    // Hàm chuyển tháng
    const nextMonth = () => {
        setCurrentMonth(addMonths(currentMonth, 1));
    };

    const prevMonth = () => {
        setCurrentMonth(subMonths(currentMonth, 1));
    };

    // Fetch holidays khi load hoặc khi currentMonth thay đổi
    useEffect(() => {
        fetch('/api/holiday')
            .then(res => res.json())
            .then(data => {
                // data là mảng holiday, mỗi holiday có trường date
                setHolidaySet(new Set(data.map((h: { date: string }) => h.date)));
            });
    }, [currentMonth]);

    // Xử lý click vào ngày
    const handleDateClick = async (dateObj: Date) => {
        const dateStr = format(dateObj, 'yyyy-MM-dd');
        if (holidaySet.has(dateStr)) {
            // Đã active, xóa ngày nghỉ
            await fetch(`/api/holiday?date=${dateStr}`, { method: 'DELETE' });
            setHolidaySet(prev => {
                const newSet = new Set(prev);
                newSet.delete(dateStr);
                return newSet;
            });
        } else {
            // Chưa active, thêm ngày nghỉ
            await fetch('/api/holiday', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: dateStr })
            });
            setHolidaySet(prev => new Set(prev).add(dateStr));
        }
    };

    // Render header tháng + nút
    const renderHeader = () => (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#fff",
                borderRadius: "12px 12px 0 0",
                padding: "8px 0 4px 0",
                borderBottom: "none"
            }}
        >
            <button
                onClick={prevMonth}
                style={{
                    background: "none",
                    border: "none",
                    outline: "none",
                    fontSize: "1.2rem",
                    color: "#222",
                    cursor: "pointer",
                    padding: 0,
                    marginRight: 12,
                    transition: "color 0.2s"
                }}
                aria-label="Previous month"
            >
                &#60;
            </button>

            <div style={{ flex: 1, textAlign: "center" }}>
                <span style={{
                    fontSize: "1.05rem",
                    fontWeight: 600,
                    color: "#222",
                    letterSpacing: 1
                }}>
                    {format(currentMonth, 'MMMM yyyy')}
                </span>
            </div>

            <button
                onClick={nextMonth}
                style={{
                    background: "none",
                    border: "none",
                    outline: "none",
                    fontSize: "1.2rem",
                    color: "#222",
                    cursor: "pointer",
                    padding: 0,
                    marginLeft: 12,
                    transition: "color 0.2s"
                }}
                aria-label="Next month"
            >
                &#62;
            </button>
        </div>
    );

    // Render tiêu đề ngày trong tuần
    const renderDays = () => {
        const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        return (
            <div style={{ display: 'flex', background: 'transparent', borderRadius: 0, marginBottom: 2 }}>
                {days.map((day, idx) => (
                    <div
                        key={idx}
                        style={{ flex: 1, textAlign: 'center', fontWeight: 600, color: '#888', padding: '4px 0', fontSize: 13, letterSpacing: 1 }}
                    >
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
            const isHoliday = holidaySet.has(fullDateStr);
            const isCurrentDay = isToday(day);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isHovered = hoveredDate === fullDateStr;

            days.push(
                <div
                    key={fullDateStr}
                    onClick={() => isCurrentMonth && onDateSelect?.(day)}
                    onMouseEnter={() => isCurrentMonth && setHoveredDate(fullDateStr)}
                    onMouseLeave={() => isCurrentMonth && setHoveredDate(null)}
                    style={{
                        flex: 1,
                        textAlign: 'center',
                        padding: '7px 0',
                        fontWeight: isHoliday ? 700 : (isHovered && isCurrentMonth ? 700 : 500),
                        color: isHoliday ? '#fff' : (isCurrentMonth ? '#222' : '#bbb'),
                        background: isHoliday
                            ? '#4CAF50'
                            : (isHovered && isCurrentMonth ? '#e6f4ff' : 'transparent'),
                        borderRadius: isSelected ? '50%' : (isHovered && isCurrentMonth ? '50%' : 'none'),
                        cursor: isCurrentMonth ? 'pointer' : 'default',
                        minHeight: 32,
                        fontSize: 15,
                        margin: '1.5px 0',
                        transition: 'background 0.2s, color 0.2s, font-weight 0.2s',
                        border: 'none',
                        boxShadow: 'none',
                        outline: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {formattedDate}
                </div>
            );
            if ((idx + 1) % 7 === 0) {
                rows.push(<div style={{ display: 'flex' }} key={day.toISOString()}>{days}</div>);
                days = [];
            }
            day = addDays(day, 1);
            idx++;
        }
        if (days.length > 0) {
            while (days.length < 7) {
                days.push(<div style={{ flex: 1 }} key={`empty-${days.length}`}></div>);
            }
            rows.push(<div style={{ display: 'flex' }} key="last-row">{days}</div>);
        }
        return <div style={{ background: '#fff', padding: 2 }}>{rows}</div>;
    };

    return (
        <div
            className="mx-auto"
            style={{
                width: 340,
                minHeight: 400,
                maxWidth: 340,
                borderRadius: 16,
                boxShadow: "0 12px 32px 0 rgba(60,60,60,0.22), 0 2px 12px 0 rgba(60,60,60,0.16)",
                background: '#fff',
                padding: 24,
                margin: 32,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
            }}
        >
            {renderHeader()}
            {renderDays()}
            {renderCells()}
        </div>
    );
} 