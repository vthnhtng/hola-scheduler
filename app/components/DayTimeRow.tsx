'use client';

import React from 'react';
import { FiSun, FiSunset, FiMoon } from 'react-icons/fi';

interface DayTimeRowProps {
    day: string;
    time: string;
    isFirstTimeSlot: boolean;
    totalTimeSlots: number;
}

function DayTimeRow({ day, time, isFirstTimeSlot, totalTimeSlots }: DayTimeRowProps) {
    const getTimeIcon = (timeSlot: string) => {
        switch (timeSlot.toLowerCase()) {
            case 'morning':
                return <FiSun className="text-yellow-500" size={16} />;
            case 'afternoon':
                return <FiSunset className="text-orange-500" size={16} />;
            case 'evening':
                return <FiMoon className="text-purple-500" size={16} />;
            default:
                return null;
        }
    };

    return (
        <>
            {isFirstTimeSlot && (
                <td 
                    rowSpan={totalTimeSlots} 
                    className="px-6 py-4 border-r border-gray-200 align-middle text-left font-bold text-gray-800 bg-gradient-to-b from-gray-50 to-white sticky left-0 z-20"
                    style={{ minWidth: 122, background: 'white' }}
                >
                    <div className="writing-mode-vertical-rl text-lg tracking-wider">
                        {day}
                    </div>
                </td>
            )}
            <td className="px-4 py-3 border-r border-gray-200 text-left font-medium text-gray-700 bg-gray-50 sticky left-[120px] z-10"
                style={{ minWidth: 80, background: 'white'}}>
                <div className="flex items-center gap-2">
                    {getTimeIcon(time)}
                    {time}
                </div>
            </td>
        </>
    );
}

export default DayTimeRow; 