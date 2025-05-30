'use client';

import React from 'react';
import { FiCalendar, FiUsers } from 'react-icons/fi';

interface TimeTableHeaderProps {
    classes: string[];
}

function TimeTableHeader({ classes }: TimeTableHeaderProps) {
    return (
        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
            <tr>
                <th colSpan={2}
                    className="px-6 py-4 text-left text-sm font-semibold text-gray-700 border-r border-gray-200 bg-white sticky left-0 z-30"
                    style={{ minWidth: 200 }}
                >
                    <div className="flex items-center gap-2">
                        <FiCalendar className="text-blue-500" size={16} />
                        Day / Time
                    </div>
                </th>
                {classes.map((cls) => (
                    <th key={cls} className="px-4 py-4 text-center text-sm font-semibold text-gray-700 border-r border-gray-200 last:border-r-0 bg-white">
                        <div className="flex items-center justify-center gap-2">
                            <FiUsers className="text-green-500" size={16} />
                            {cls}
                        </div>
                    </th>
                ))}
            </tr>
        </thead>
    );
}

export default TimeTableHeader; 