import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import avatar from '../assets/avatar/avatar.jpg';

function Grid() {
    const teachers = [
        {
            name: 'Nguyễn Trần Trung Thành',
            email: 'trungthanh@vnu.edu.vn',
            phone: '096696692',
            specialty: 'Chính trị',
            isSpecialist: true,
            classesPerWeek: 6,
            sessionsPerClass: 3,
            joinDate: '08/02/2025',
            avatar: avatar
        }
    ];

    const teacherRows = [];
    for (let i = 0; i < 10; i++) {
        teacherRows.push(...teachers);
    }

    return (
        <main className="container">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="fw-bold">Danh sách Giảng viên</h2>
                <button className="btn btn-success">THÊM GIẢNG VIÊN</button>
            </div>
            <table className="table table-hover">
                <thead className="table-light">
                    <tr>
                        <th></th>
                        <th>Họ và tên</th>
                        <th>Email</th>
                        <th>Số điện thoại</th>
                        <th>Chuyên môn</th>
                        <th>Chuyên sâu</th>
                        <th>Ca dạy / tuần</th>
                        <th>Số lớp</th>
                        <th>Ngày tham gia</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {teacherRows.map((teacher, index) => (
                        <tr key={index} className="align-middle">
                            <td>
                                <img src={teacher.avatar} alt="avatar" className="me-2 rounded-circle" style={{ width: '40px', height: '40px' }} />
                            </td>
                            <td>
                                {teacher.name}
                            </td>
                            <td>{teacher.email}</td>
                            <td>{teacher.phone}</td>
                            <td>{teacher.specialty}</td>
                            <td>
                                <input type="checkbox" checked={teacher.isSpecialist} readOnly />
                            </td>
                            <td>{teacher.classesPerWeek}</td>
                            <td>{teacher.sessionsPerClass}</td>
                            <td>{teacher.joinDate}</td>
                            <td>
                                <button className="btn btn-outline-success me-2"><FaEdit /></button>
                                <button className="btn btn-outline-danger"><FaTrashAlt /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </main>
    );
}

export default Grid;
