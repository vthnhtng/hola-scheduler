'use client';

import React from 'react';
import { FiPlus, FiDownload, FiSettings, FiRefreshCw } from 'react-icons/fi';

interface TimeTableActionsProps {
    onAddClass: () => void;
    onExport: () => void;
    onSettings: () => void;
    onRefresh: () => void;
}

function TimeTableActions({ onAddClass, onExport, onSettings, onRefresh }: TimeTableActionsProps) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-800">Class Timetable</h1>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                    Academic Schedule
                </span>
            </div>
            
            <div className="flex items-center gap-2">
                <button
                    onClick={onAddClass}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                >
                    <FiPlus size={16} />
                    Add Class
                </button>
                
                <button
                    onClick={onExport}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                    <FiDownload size={16} />
                    Export
                </button>
                
                <button
                    onClick={onRefresh}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200"
                >
                    <FiRefreshCw size={16} />
                </button>
                
                <button
                    onClick={onSettings}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200"
                >
                    <FiSettings size={16} />
                </button>
            </div>
        </div>
    );
}

export default TimeTableActions; 