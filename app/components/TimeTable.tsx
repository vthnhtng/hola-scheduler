'use client';

import React, { useState, useRef, useEffect } from 'react';
import TimeSlot from './TimeSlot';
import TimeTableHeader from './TimeTableHeader';
import DayTimeRow from './DayTimeRow';
import TimeTableActions from './TimeTableActions';
import ClassModal from './ClassModal';
import ScrollableTable, { ScrollableTableRef } from './ScrollableTable';
import TableNavigation from './TableNavigation';

interface ClassInfo {
    subject: string;
    lecturer: string;
    room: string;
}

interface TimeTableData {
    [key: string]: ClassInfo | null;
}

interface TimeTableProps {
    days?: string[];
    timeSlots?: string[];
    classes?: string[];
}

interface ModalState {
    isOpen: boolean;
    day: string;
    time: string;
    className: string;
    editMode: boolean;
    initialData?: ClassInfo | null;
}

function TimeTable({ 
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    timeSlots = ["Morning", "Afternoon", "Evening"],
    classes = ["Class A", "Class B", "Class C", "Class D", "Class E", "Class F", "Class G", "Class H", "Class I", "Class J", "Class K", "Class L", "Class M", "Class N", "Class O", "Class P", "Class Q", "Class R", "Class S", "Class T", "Class U", "Class V", "Class W", "Class X", "Class Y", "Class Z"]
}: TimeTableProps) {
    const scrollableTableRef = useRef<ScrollableTableRef>(null);
    const [visibleRange, setVisibleRange] = useState({ start: 0, end: 2 });

    const [timetableData, setTimetableData] = useState<TimeTableData>({
        'Monday-Morning-Class A': {
            subject: 'Mathematics',
            lecturer: 'Dr. Smith',
            room: 'Room 101'
        },
        'Tuesday-Afternoon-Class B': {
            subject: 'Physics',
            lecturer: 'Prof. Johnson',
            room: 'Lab 205'
        },
        'Wednesday-Evening-Class C': {
            subject: 'Chemistry',
            lecturer: 'Dr. Brown',
            room: 'Lab 301'
        }
    });

    const [modalState, setModalState] = useState<ModalState>({
        isOpen: false,
        day: '',
        time: '',
        className: '',
        editMode: false,
        initialData: null
    });

    const getKey = (day: string, time: string, className: string) => `${day}-${time}-${className}`;

    const handleAddClass = (day: string, time: string, className: string) => {
        setModalState({
            isOpen: true,
            day,
            time,
            className,
            editMode: false,
            initialData: null
        });
    };

    const handleEditClass = (day: string, time: string, className: string) => {
        const key = getKey(day, time, className);
        const classInfo = timetableData[key];
        
        setModalState({
            isOpen: true,
            day,
            time,
            className,
            editMode: true,
            initialData: classInfo
        });
    };

    const handleSaveClass = (classData: ClassInfo) => {
        const key = getKey(modalState.day, modalState.time, modalState.className);
        setTimetableData(prev => ({
            ...prev,
            [key]: classData
        }));
    };

    const handleCloseModal = () => {
        setModalState({
            isOpen: false,
            day: '',
            time: '',
            className: '',
            editMode: false,
            initialData: null
        });
    };

    const handleActions = {
        onAddClass: () => console.log('Global add new class'),
        onExport: () => {
            // Export timetable as JSON for demo
            const dataStr = JSON.stringify(timetableData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'timetable.json';
            link.click();
            URL.revokeObjectURL(url);
        },
        onSettings: () => console.log('Open settings'),
        onRefresh: () => {
            // Reset to initial sample data
            setTimetableData({
                'Monday-Morning-Class A': {
                    subject: 'Mathematics',
                    lecturer: 'Dr. Smith',
                    room: 'Room 101'
                },
                'Tuesday-Afternoon-Class B': {
                    subject: 'Physics',
                    lecturer: 'Prof. Johnson',
                    room: 'Lab 205'
                },
                'Wednesday-Evening-Class C': {
                    subject: 'Chemistry',
                    lecturer: 'Dr. Brown',
                    room: 'Lab 301'
                }
            });
        }
    };

    // Handle navigation to specific class column
    const handleClassNavigation = (classIndex: number) => {
        if (scrollableTableRef.current) {
            scrollableTableRef.current.scrollToColumn(classIndex);
        }
    };

    // Update visible range when scrolling
    useEffect(() => {
        const updateVisibleRange = () => {
            if (scrollableTableRef.current) {
                const range = scrollableTableRef.current.getVisibleRange();
                setVisibleRange(range);
            }
        };

        // Update initially and on window resize
        updateVisibleRange();
        window.addEventListener('resize', updateVisibleRange);
        
        // Set up interval to check scroll position
        const interval = setInterval(updateVisibleRange, 100);

        return () => {
            window.removeEventListener('resize', updateVisibleRange);
            clearInterval(interval);
        };
    }, []);

    return (
        <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
            <div className="mx-auto">
                <TimeTableActions {...handleActions} />
                
                <TableNavigation
                    classes={classes}
                    onClassClick={handleClassNavigation}
                    visibleStartIndex={visibleRange.start}
                    visibleEndIndex={visibleRange.end}
                />
                
                <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-200">
                    <ScrollableTable ref={scrollableTableRef}>
                        <table className="w-full table-auto border-collapse min-w-max">
                            <TimeTableHeader classes={classes} />
                            <tbody>
                                {days.map((day) => (
                                    <React.Fragment key={day}>
                                        {timeSlots.map((slot, idx) => (
                                            <tr 
                                                key={`${day}-${slot}`}
                                                className={idx % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-25 hover:bg-gray-50"}
                                            >
                                                <DayTimeRow 
                                                    day={day}
                                                    time={slot}
                                                    isFirstTimeSlot={idx === 0}
                                                    totalTimeSlots={timeSlots.length}
                                                />
                                                {classes.map((cls) => {
                                                    const key = getKey(day, slot, cls);
                                                    const classInfo = timetableData[key];
                                                    
                                                    return (
                                                        <TimeSlot
                                                            key={key}
                                                            day={day}
                                                            time={slot}
                                                            className={cls}
                                                            hasClass={!!classInfo}
                                                            classInfo={classInfo || undefined}
                                                            onAddClass={() => handleAddClass(day, slot, cls)}
                                                            onEditClass={() => handleEditClass(day, slot, cls)}
                                                        />
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </ScrollableTable>
                </div>
                
                <div className="mt-6 flex justify-center">
                    <div className="bg-white rounded-lg shadow-md p-4">
                        <p className="text-sm text-gray-600 text-center">
                            📝 <strong>Tip:</strong> Drag the table horizontally to see more classes. Click class buttons above to jump to specific columns.
                        </p>
                    </div>
                </div>
            </div>

            <ClassModal
                isOpen={modalState.isOpen}
                onClose={handleCloseModal}
                onSave={handleSaveClass}
                initialData={modalState.initialData}
                day={modalState.day}
                time={modalState.time}
                className={modalState.className}
            />
        </div>
    );
}

export default TimeTable; 