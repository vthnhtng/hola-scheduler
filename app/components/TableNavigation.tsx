'use client';

import React, { useState, useEffect } from 'react';

interface TableNavigationProps {
    classes: string[];
    onClassClick: (classIndex: number) => void;
    visibleStartIndex?: number;
    visibleEndIndex?: number;
}

function TableNavigation({ 
    classes, 
    onClassClick, 
    visibleStartIndex = 0, 
    visibleEndIndex = 2 
}: TableNavigationProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleClassClick = (index: number) => {
        onClassClick(index);
    };

    if (classes.length <= 6) {
        return null; // Don't show navigation for small number of classes
    }

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700">Classes Navigation</h3>
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                >
                    {isCollapsed ? 'Show' : 'Hide'}
                </button>
            </div>
            
            {!isCollapsed && (
                <div className="flex flex-wrap gap-1">
                    {classes.map((cls, index) => {
                        const isVisible = index >= visibleStartIndex && index <= visibleEndIndex;
                        return (
                            <button
                                key={cls}
                                onClick={() => handleClassClick(index)}
                                className={`px-2 py-1 text-xs rounded transition-all duration-200 ${
                                    isVisible
                                        ? 'bg-blue-500 text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                                title={`Go to ${cls}`}
                            >
                                {cls}
                            </button>
                        );
                    })}
                </div>
            )}
            
            <div className="mt-2 text-xs text-gray-500">
                Showing {visibleEndIndex - visibleStartIndex + 1} of {classes.length} classes
            </div>
        </div>
    );
}

export default TableNavigation; 