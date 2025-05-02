// import LecturersPage from "./lecturers/page";
// import CoursesPage from "./courses/page";
// import LocationsPage from "./locations/page";
// import CurriculumsPage from "./curriculums/page";
import { generateSchedulesForTeams } from '../app/scheduler/generator.ts';
import TeamsPage from "./teams/page";

export default function Home() {
    return (
        <div>
            <TeamsPage />
        </div>
    );
}
