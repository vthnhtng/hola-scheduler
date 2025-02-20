'use client';
import Header from '../components/Header'
import SideBar from '../components/SideBar'
import Grid from '../components/Grid'
import Footer from '../components/Footer'

import { ObjectAttribute } from '../types/ObjectAttribute';
import avatar from '../assets/avatar/avatar.jpg';

function TeacherCRUD() {
	const teacherAttributes: ObjectAttribute[] = [
        { name: 'fullname', label: 'Họ và tên', type: 'string' },
        { name: 'email', label: 'Email', type: 'string' },
        { name: 'phone', label: 'Số điện thoại', type: 'string' },
        { name: 'specialty', label: 'Chuyên môn', type: 'string' },
        { name: 'isSpecialist', label: 'Chuyên sâu', type: 'boolean' },
        { name: 'classesPerWeek', label: 'Ca dạy/tuần', type: 'number' },
        { name: 'sessionsPerClass', label: 'Số lớp', type: 'number' },
    ];

	const teachers = [
        {
            fullname: 'Nguyễn Trần Trung Thành',
            email: 'trungthanh@vnu.edu.vn',
            phone: '096696692',
            specialty: 'Chính trị',
            isSpecialist: true,
            classesPerWeek: 6,
            sessionsPerClass: 3,
            avatar: avatar
        }
    ];

    const teacherRows = [];
    teacherRows.push(null);
    for (let i = 0; i < 10; i++) {
        teacherRows.push(...teachers);
    }

	return (
		<>
			<Header />
			<main className='d-flex justify-content-between'>
				<SideBar />
				<Grid
					objectName='GIẢNG VIÊN'
					attributes={teacherAttributes}
					gridData={teacherRows}
				/>
			</main>
            <Footer/>
		</>
	)
}

export default TeacherCRUD;
