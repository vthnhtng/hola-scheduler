'use client';

import React, { useState, useEffect } from 'react';
import { FiX, FiUser, FiMapPin, FiBook, FiClock } from 'react-icons/fi';

interface ClassModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (classData: ClassData) => void;
    initialData?: ClassData | null;
    day: string;
    time: string;
    className: string;
}

interface ClassData {
    subject: string;
    lecturer: string;
    room: string;
}

function ClassModal({ isOpen, onClose, onSave, initialData, day, time, className }: ClassModalProps) {
    const [formData, setFormData] = useState<ClassData>({
        subject: '',
        lecturer: '',
        room: ''
    });

    const [errors, setErrors] = useState<Partial<ClassData>>({});

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData({ subject: '', lecturer: '', room: '' });
        }
        setErrors({});
    }, [initialData, isOpen]);

    const validateForm = (): boolean => {
        const newErrors: Partial<ClassData> = {};

        if (!formData.subject.trim()) {
            newErrors.subject = 'Subject is required';
        }
        if (!formData.lecturer.trim()) {
            newErrors.lecturer = 'Lecturer is required';
        }
        if (!formData.room.trim()) {
            newErrors.room = 'Room is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            onSave(formData);
            onClose();
        }
    };

    const handleInputChange = (field: keyof ClassData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-scale-in">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold">
                                {initialData ? 'Edit Class' : 'Add New Class'}
                            </h2>
                            <p className="text-blue-100 text-sm mt-1">
                                {day} • {time} • {className}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-blue-600 rounded-lg transition-colors"
                        >
                            <FiX size={20} />
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Subject Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <FiBook className="inline mr-2" size={16} />
                            Subject
                        </label>
                        <input
                            type="text"
                            value={formData.subject}
                            onChange={(e) => handleInputChange('subject', e.target.value)}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                errors.subject ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Enter subject name"
                        />
                        {errors.subject && <p className="text-red-500 text-sm mt-1">{errors.subject}</p>}
                    </div>

                    {/* Lecturer Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <FiUser className="inline mr-2" size={16} />
                            Lecturer
                        </label>
                        <input
                            type="text"
                            value={formData.lecturer}
                            onChange={(e) => handleInputChange('lecturer', e.target.value)}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                errors.lecturer ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Enter lecturer name"
                        />
                        {errors.lecturer && <p className="text-red-500 text-sm mt-1">{errors.lecturer}</p>}
                    </div>

                    {/* Room Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <FiMapPin className="inline mr-2" size={16} />
                            Room
                        </label>
                        <input
                            type="text"
                            value={formData.room}
                            onChange={(e) => handleInputChange('room', e.target.value)}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                errors.room ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Enter room number"
                        />
                        {errors.room && <p className="text-red-500 text-sm mt-1">{errors.room}</p>}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg"
                        >
                            {initialData ? 'Update Class' : 'Add Class'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ClassModal; 