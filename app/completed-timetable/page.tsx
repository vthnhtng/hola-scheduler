'use client';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import CompletedTimetable from '../components/CompletedTimetable';

export default function CompletedTimetablePage() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) {
      setError('Không tìm thấy courseId');
      setLoading(false);
      return;
    }
    setLoading(false);
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-600 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            THỜI KHÓA BIỂU HOÀN THÀNH
          </h1>
          <p className="text-gray-600">
            Khóa học ID: {courseId}
          </p>
        </div>
        
        <CompletedTimetable courseId={parseInt(courseId!)} />
      </div>
    </div>
  );
} 