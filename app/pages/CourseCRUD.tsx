import Header from '../components/Header'
import SideBar from '../components/SideBar'
import Grid from '../components/Grid'
import { ObjectAttribute } from '../types/ObjectAttribute';

function CourseCRUD() {
	const courseAttributes: ObjectAttribute[] = [
        { name: 'fullname', label: 'Họ và tên', type: 'string' },
        { name: 'email', label: 'Email', type: 'string' },
        { name: 'phone', label: 'Số điện thoại', type: 'string' },
        { name: 'specialty', label: 'Chuyên môn', type: 'string' },
        { name: 'isSpecialist', label: 'Chuyên sâu', type: 'boolean' },
        { name: 'classesPerWeek', label: 'Ca dạy/tuần', type: 'number' },
        { name: 'sessionsPerClass', label: 'Số lớp', type: 'number' },
    ];

	const course = [
        {
            fullname: 'Nguyễn Trần Trung Thành',
            email: 'trungthanh@vnu.edu.vn',
            phone: '096696692',
            specialty: 'Chính trị',
            isSpecialist: true,
            classesPerWeek: 6,
            sessionsPerClass: 3,
        }
    ];

	return (
		<>
			<Header />
			<main className='d-flex justify-content-between'>
				<SideBar />
				<Grid
					objectName='MÔN HỌC'
					attributes={courseAttributes}
					gridData={course}
				/>
			</main>
		</>
	)
}

export default CourseCRUD;
