'use client';

import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface ScrollableTableProps {
    children: React.ReactNode;
    className?: string;
}

export interface ScrollableTableRef {
    scrollToColumn: (columnIndex: number) => void;
    getVisibleRange: () => { start: number; end: number };
}

const ScrollableTable = forwardRef<ScrollableTableRef, ScrollableTableProps>(
    ({ children, className = '' }, ref) => {
        const scrollRef = useRef<HTMLDivElement>(null);
        const [canScrollLeft, setCanScrollLeft] = useState(false);
        const [canScrollRight, setCanScrollRight] = useState(false);
        const [isDragging, setIsDragging] = useState(false);
        const [dragStart, setDragStart] = useState({ x: 0, scrollLeft: 0 });

        // Expose methods via ref
        useImperativeHandle(ref, () => ({
            scrollToColumn: (columnIndex: number) => {
                if (scrollRef.current) {
                    // Approximate column width (120px min-width + padding)
                    const columnWidth = 140; 
                    const dayTimeWidth = 200; // Approximate width of day/time columns
                    const targetPosition = dayTimeWidth + (columnIndex * columnWidth);
                    
                    scrollRef.current.scrollTo({
                        left: targetPosition,
                        behavior: 'smooth'
                    });
                }
            },
            getVisibleRange: () => {
                if (!scrollRef.current) return { start: 0, end: 2 };
                
                const { scrollLeft, clientWidth } = scrollRef.current;
                const columnWidth = 140;
                const dayTimeWidth = 200;
                
                const adjustedScrollLeft = Math.max(0, scrollLeft - dayTimeWidth);
                const startIndex = Math.floor(adjustedScrollLeft / columnWidth);
                const endIndex = Math.min(
                    Math.ceil((adjustedScrollLeft + clientWidth) / columnWidth),
                    25 // Assuming max 26 classes (A-Z)
                );
                
                return { start: startIndex, end: endIndex };
            }
        }));

        // Check scroll position and update arrow visibility
        const checkScrollPosition = () => {
            if (scrollRef.current) {
                const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
                setCanScrollLeft(scrollLeft > 0);
                setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
            }
        };

        useEffect(() => {
            checkScrollPosition();
            window.addEventListener('resize', checkScrollPosition);
            return () => window.removeEventListener('resize', checkScrollPosition);
        }, []);

        // Mouse drag handlers
        const handleMouseDown = (e: React.MouseEvent) => {
            if (!scrollRef.current) return;
            
            setIsDragging(true);
            setDragStart({
                x: e.pageX - scrollRef.current.offsetLeft,
                scrollLeft: scrollRef.current.scrollLeft
            });
            scrollRef.current.style.cursor = 'grabbing';
            scrollRef.current.style.userSelect = 'none';
        };

        const handleMouseMove = (e: React.MouseEvent) => {
            if (!isDragging || !scrollRef.current) return;
            
            e.preventDefault();
            const x = e.pageX - scrollRef.current.offsetLeft;
            const walk = (x - dragStart.x) * 1.5; // Reduced multiplier for smoother scrolling
            scrollRef.current.scrollLeft = dragStart.scrollLeft - walk;
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            if (scrollRef.current) {
                scrollRef.current.style.cursor = 'grab';
                scrollRef.current.style.userSelect = 'auto';
            }
        };

        const handleMouseLeave = () => {
            setIsDragging(false);
            if (scrollRef.current) {
                scrollRef.current.style.cursor = 'grab';
                scrollRef.current.style.userSelect = 'auto';
            }
        };

        // Touch handlers for mobile
        const handleTouchStart = (e: React.TouchEvent) => {
            if (!scrollRef.current) return;
            
            setIsDragging(true);
            setDragStart({
                x: e.touches[0].pageX - scrollRef.current.offsetLeft,
                scrollLeft: scrollRef.current.scrollLeft
            });
        };

        const handleTouchMove = (e: React.TouchEvent) => {
            if (!isDragging || !scrollRef.current) return;
            
            const x = e.touches[0].pageX - scrollRef.current.offsetLeft;
            const walk = (x - dragStart.x) * 1.2; // Reduced multiplier for smoother scrolling
            scrollRef.current.scrollLeft = dragStart.scrollLeft - walk;
        };

        const handleTouchEnd = () => {
            setIsDragging(false);
        };

        // Arrow button handlers
        const scrollLeft = () => {
            if (scrollRef.current) {
                scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
            }
        };

        const scrollRight = () => {
            if (scrollRef.current) {
                scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
            }
        };

        return (
            <div className={`relative ${className}`}>
                {/* Left Arrow */}
                {canScrollLeft && (
                    <button
                        onClick={scrollLeft}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full p-2 shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200"
                        aria-label="Scroll left"
                    >
                        <FiChevronLeft size={20} className="text-gray-600" />
                    </button>
                )}

                {/* Right Arrow */}
                {canScrollRight && (
                    <button
                        onClick={scrollRight}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full p-2 shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200"
                        aria-label="Scroll right"
                    >
                        <FiChevronRight size={20} className="text-gray-600" />
                    </button>
                )}

                {/* Scrollable Container */}
                <div
                    ref={scrollRef}
                    className="overflow-x-auto custom-scrollbar scroll-smooth"
                    style={{ 
                        cursor: isDragging ? 'grabbing' : 'grab',
                        scrollbarWidth: 'thin',
                        scrollBehavior: 'smooth'
                    }}
                    onScroll={checkScrollPosition}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {children}
                </div>

                {/* Scroll Indicator */}
                {(canScrollLeft || canScrollRight) && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/10 backdrop-blur-sm rounded-full px-3 py-1">
                        <p className="text-xs text-gray-600 font-medium">
                            ← Drag to scroll →
                        </p>
                    </div>
                )}
            </div>
        );
    }
);

ScrollableTable.displayName = 'ScrollableTable';

export default ScrollableTable; 