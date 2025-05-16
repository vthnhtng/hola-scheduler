import SubjectsPage from "./subjects/page";
import LecturersPage from "./lecturers/page";
import CurriculumsPage from "./curriculums/page";

export default function HomePage() {
	return (
		<iframe
			src="https://qpan.vnu.edu.vn/"
			style={{ width: '100vw', height: '100vh', border: 'none', minHeight: '100dvh' }}
			title="Trang chủ QPAN"
			allowFullScreen
		/>
	);
}
