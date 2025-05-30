'use client';

import React from 'react';
import { FiPlus, FiClock, FiCalendar } from 'react-icons/fi';

interface TimeSlotProps {
    day: string;
    time: string;
    className: string;
    hasClass?: boolean;
    classInfo?: {
        subject: string;
        lecturer: string;
        room: string;
    };
    onAddClass: () => void;
    onEditClass?: () => void;
}

function TimeSlot({ 
    day, 
    time, 
    className, 
    hasClass = false, 
    classInfo, 
    onAddClass, 
    onEditClass 
}: TimeSlotProps) {
    return (
        <td className="relative group border border-gray-200 hover:border-blue-300 transition-all duration-200 min-w-[120px]">
            <div className="p-3 min-h-[80px] flex flex-col justify-center">
                {hasClass && classInfo ? (
                    <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-3 cursor-pointer hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-md"
                        onClick={onEditClass}
                    >
                        <div className="font-semibold text-sm mb-1 truncate">{classInfo.subject}</div>
                        <div className="text-xs opacity-90 flex items-center gap-1">
                            <FiCalendar size={10} />
                            <span className="truncate">{classInfo.lecturer}</span>
                        </div>
                        <div className="text-xs opacity-90 flex items-center gap-1">
                            <FiClock size={10} />
                            <span className="truncate">{classInfo.room}</span>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={onAddClass}
                        className="w-full h-full flex flex-col items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all duration-200 group-hover:border-blue-300 opacity-0 group-hover:opacity-100"
                    >
                        <FiPlus size={20} className="mb-1" />
                        <span className="text-xs font-medium">Add Class</span>
                    </button>
                )}
            </div>
        </td>
    );
}

export default TimeSlot; 