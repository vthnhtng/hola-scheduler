'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ClassElementProps, DateRange, TimetableData } from '@/types/TimeTableTypes';
import { ApiResponseHandler } from '@/model/time-table/ApiResponseHandler';


function TimeTable() {
    const [dateRange, setDateRange] = useState<DateRange>();
    const [teams, setTeams] = useState<string[]>([]);
    const [timetableData, setTimetableData] = useState<TimetableData[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [showFloatingControls, setShowFloatingControls] = useState(false);
    const teamsPerPage = 10;
    
    const tableRef = useRef<HTMLDivElement>(null);
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
            setCurrentPage(0);
        };

        fetchData();
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            if (tableRef.current) {
                const rect = tableRef.current.getBoundingClientRect();
                const isTableVisible = rect.top < window.innerHeight && rect.bottom > 0;
                const isBottomControlsVisible = rect.bottom <= window.innerHeight;
                
                setShowFloatingControls(isTableVisible && !isBottomControlsVisible && teams.length > teamsPerPage);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [teams.length, teamsPerPage]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (teams.length <= teamsPerPage) return;

            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                goToPreviousPage();
            } else if (event.key === 'ArrowRight') {
                event.preventDefault();
                goToNextPage();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentPage, teams.length, teamsPerPage]);

    const totalPages = Math.ceil(teams.length / teamsPerPage);
    const startIndex = currentPage * teamsPerPage;
    const endIndex = Math.min(startIndex + teamsPerPage, teams.length);
    const currentTeams = teams.slice(startIndex, endIndex);

    const goToNextPage = () => {
        if (currentPage < totalPages - 1) {
            setCurrentPage(currentPage + 1);
        }
    };

    const goToPreviousPage = () => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
        }
    };

    const goToPage = (page: number) => {
        if (page >= 0 && page < totalPages) {
            setCurrentPage(page);
        }
    };

    const renderTableRows = () => {
        const rows: React.ReactElement[] = [];
        
        if (!dateRange) return rows;

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
                        {currentTeams.map((team) => {
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

    const PaginationControls = ({ isFloating = false }: { isFloating?: boolean }) => (
        <div className={`flex items-center space-x-2 ${isFloating ? 'justify-center' : ''}`}>
            <button
                onClick={goToPreviousPage}
                disabled={currentPage === 0}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
                ←
            </button>
            
            {!isFloating && (
                <div className="flex space-x-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                            pageNum = i;
                        } else if (currentPage < 3) {
                            pageNum = i;
                        } else if (currentPage >= totalPages - 3) {
                            pageNum = totalPages - 5 + i;
                        } else {
                            pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                            <button
                                key={pageNum}
                                onClick={() => goToPage(pageNum)}
                                className={`px-2 py-1 text-sm rounded transition-colors ${
                                    currentPage === pageNum
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                {pageNum + 1}
                            </button>
                        );
                    })}
                </div>
            )}
            
            {isFloating && (
                <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded">
                    {currentPage + 1}/{totalPages}
                </span>
            )}
            
            <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages - 1}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
                →
            </button>
        </div>
    );

    return (
        <div className="w-full overflow-x-auto bg-white rounded-lg shadow-lg" ref={tableRef}>
            <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Team Schedule</h2>
                
                {dateRange && (
                    <div className="mb-4 text-sm text-gray-600">
                        <strong>Schedule Period:</strong> {' '}
                        {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                    </div>
                )}

                {teams.length > teamsPerPage && (
                    <div className="mb-4 flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-600">
                            Showing teams {startIndex + 1}-{endIndex} of {teams.length} teams
                            <div className="text-xs text-gray-500 mt-1">
                                Use ← → keys to navigate
                            </div>
                        </div>
                        
                        <PaginationControls />
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
                            {currentTeams.map((team) => (
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
                
                {teams.length > teamsPerPage && (
                    <div className="mt-4 flex items-center justify-center">
                        <PaginationControls />
                    </div>
                )}
                
                <div className="mt-4 text-sm text-gray-600">
                    <p className="mb-2"><strong>Sessions:</strong></p>
                    <ul className="list-disc list-inside space-y-1">
                        <li><strong>Morning:</strong> 9:00 AM - 12:00 PM</li>
                        <li><strong>Afternoon:</strong> 1:00 PM - 5:00 PM</li>
                        <li><strong>Evening:</strong> 6:00 PM - 9:00 PM</li>
                    </ul>
                </div>
            </div>

            {showFloatingControls && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-full px-4 py-2 border z-50">
                    <PaginationControls isFloating={true} />
                </div>
            )}
        </div>
    );
}

export default TimeTable;
