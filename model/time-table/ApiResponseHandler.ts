import { DateRange } from "@/types/TimeTableTypes";
import { TimetableData } from "@/types/TimeTableTypes";

export class ApiResponseHandler {
    static getTimetableData(response: any): { timetableData: TimetableData[], teams: string[] } {
        const fileContents = response.data.fileContents;
        const weeks = Object.keys(fileContents);
        let timetableData: TimetableData[] = [];
        let teams: string[] = [];

        weeks.forEach((week: string) => {
            const weekData = fileContents[week];
            weekData.forEach((day: any) => {
                timetableData.push({
                    date: day.date,
                    session: day.session,
                    teamId: day.teamId.toString(),
                    class: {
                        subject: day.subjectId,
                        lecturer: day.lecturerId,
                        location: day.locationId
                    }
                });
                teams.push(day.teamId.toString());
            });
        });

        return { timetableData, teams: [...new Set(teams)] };
    }

    static getDateRange(response: any): DateRange {
        const fileNames = response?.data?.processedFiles;
        if (!Array.isArray(fileNames) || fileNames.length === 0) {
            const now = new Date();
            return { from: now, to: now };
        }
        const dateRanges = fileNames.map((fileName: string) => {
            const dateRange = fileName.replace('.json', '').split('_');
            const from = new Date(dateRange[1]);
            const to = new Date(dateRange[2]);
            return { from, to };
        });
        return { from: dateRanges[0].from, to: dateRanges[dateRanges.length - 1].to };
    }    
}
