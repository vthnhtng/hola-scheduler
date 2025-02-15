import Header from '../components/Header'
import SideBar from '../components/SideBar'
import Grid from '../components/Grid'

function TeacherCRUD() {
	return (
		<>
			<Header />
			<div className='d-flex justify-content-between'>
				<SideBar />
				<Grid />
			</div>
		</>
	)
}

export default TeacherCRUD;