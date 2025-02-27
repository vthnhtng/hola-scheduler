import { ObjectAttribute } from '../../models/ObjectAttribute';
import { Teacher } from '../../models/Teacher';
import avatar from './assets/avatar.jpg';
import Grid from '../../components/Grid';

const TeachersPage = () => {
	const teacherAttributes: ObjectAttribute[] = [];
    // Object.entries(Teacher).forEach(([key, value]) => {

        
    // });


    //     { key: 'fullname', label: 'Họ và tên', renderType: 'string' },
    //     { key: 'email', label: 'Email', renderType: 'string' },
    //     { key: 'phone', label: 'Số điện thoại', renderType: 'string' },
    //     { key: 'specialty', label: 'Chuyên môn', renderType: 'string' },
    //     { key: 'isSpecialist', label: 'Chuyên sâu', renderType: 'boolean' },
    //     { key: 'classesPerWeek', label: 'Ca dạy/tuần', renderType: 'number' },
    //     { key: 'sessionsPerClass', label: 'Số lớp', renderType: 'number' },
    // ];

	const teachers : Teacher[] = [
        {
            id: "1",
            name: "test",
            email: "test",
            createdAt: new Date(),
            updatedAt: new Date()
        }
    ];

    // const teacherRows = [];
    // teacherRows.push(null);
    // for (let i = 0; i < 10; i++) {
    //     teacherRows.push(...teachers);
    // }

	return (
		<>
            <main style={{
                width: 'calc(100% - 200px)'
            }}>
                <Grid
					data={teachers}
				/>
            </main>
		</>
	)
}

export default TeachersPage
