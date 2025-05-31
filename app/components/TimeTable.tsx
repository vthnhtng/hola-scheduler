'use client';

import React, { useState, useEffect } from 'react';
import { ClassElementProps, DateRange, TimetableData } from '@/types/TimeTableTypes';
import { ApiResponseHandler } from '@/model/time-table/ApiResponseHandler';


function TimeTable() {
    const [dateRange, setDateRange] = useState<DateRange>();
    const [teams, setTeams] = useState<string[]>([]);
    const [timetableData, setTimetableData] = useState<TimetableData[]>([]);
    const sessions = ['Morning', 'Afternoon', 'Evening'] as const;
    const sessionKeys = ['morning', 'afternoon', 'evening'] as const;

    useEffect(() => {

        const fetchData = async () => {
            const response = await fetch('/sample-timetable-data.json');
            const data = await response.json();
            const dateRange = ApiResponseHandler.getDateRange(data);
            const timetableResult = ApiResponseHandler.getTimetableData(data);
            setDateRange(dateRange);
            setTimetableData(timetableResult.timetableData);
            setTeams(timetableResult.teams);
        };

        fetchData();
    }, []);

    const renderTableRows = () => {
        const rows: React.ReactElement[] = [];
        
        if (!dateRange) return rows;

        // Get unique dates from timetable data
        const uniqueDates = [...new Set(timetableData.map(item => item.date))].sort();

        uniqueDates.forEach((date) => {
            sessionKeys.forEach((sessionKey, sessionIndex) => {
                const sessionName = sessions[sessionIndex];

                rows.push(
                    <tr key={`${date}-${sessionKey}`}>
                        {sessionIndex === 0 && (
                            <td 
                                rowSpan={3} 
                                className="w-20 h-16 px-2 py-2 border border-gray-300 text-center font-medium bg-gray-50 align-middle text-sm"
                            >
                                {new Date(date).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </td>
                        )}
                        <td className="w-20 h-16 px-2 py-2 border border-gray-300 text-center font-medium align-middle text-sm">
                            {sessionName}
                        </td>
                        {teams.map((team) => {
                            // Find if there's data for this team, date, and session
                            const classData = timetableData.find(item => 
                                item.date === date && 
                                item.session === sessionKey &&
                                item.teamId === team
                            );

                            return (
                                <td 
                                    key={`${date}-${sessionKey}-${team}`}
                                    className="w-24 h-16 px-2 py-2 border border-gray-300 text-center align-middle"
                                >
                                    {classData ? (
                                        <div className="space-y-1">
                                            <div className="font-medium text-blue-600 text-sm">
                                                Subject: {classData.class.subject}
                                            </div>
                                            <div className="text-xs text-gray-600">
                                                Lecturer: {classData.class.lecturer || 'TBA'}
                                            </div>
                                            <div className="text-xs text-gray-600">
                                                Location: {classData.class.location || 'TBA'}
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400">-</span>
                                    )}
                                </td>
                            );
                        })}
                    </tr>
                );
            });
        });
        
        return rows;
    };

    return (
        <div className="w-full overflow-x-auto bg-white rounded-lg shadow-lg">
            <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Team Schedule</h2>
                
                {dateRange && (
                    <div className="mb-4 text-sm text-gray-600">
                        <strong>Schedule Period:</strong> {' '}
                        {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                    </div>
                )}
                
                <table className="w-full table-fixed border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="w-20 h-12 px-2 py-2 border border-gray-300 text-center font-semibold text-gray-700 text-sm">
                                Date
                            </th>
                            <th className="w-20 h-12 px-2 py-2 border border-gray-300 text-center font-semibold text-gray-700 text-sm">
                                Session
                            </th>
                            {teams.map((team) => (
                                <th 
                                    key={team} 
                                    className="w-24 h-12 px-2 py-2 border border-gray-300 text-center font-semibold text-gray-700 text-sm"
                                >
                                    Team {team}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {renderTableRows()}
                    </tbody>
                </table>
                
                <div className="mt-4 text-sm text-gray-600">
                    <p className="mb-2"><strong>Sessions:</strong></p>
                    <ul className="list-disc list-inside space-y-1">
                        <li><strong>Morning:</strong> 9:00 AM - 12:00 PM</li>
                        <li><strong>Afternoon:</strong> 1:00 PM - 5:00 PM</li>
                        <li><strong>Evening:</strong> 6:00 PM - 9:00 PM</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default TimeTable;
