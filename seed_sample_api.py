import json
import random
from datetime import datetime, timedelta

teams = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50]
subjects = list(range(1, 50))        # Subject IDs 1–49
lecturers = list(range(101, 151))    # Lecturer IDs 101–150
locations = list(range(201, 251))    # Location IDs 201–250
sessions = ["morning", "afternoon", "evening"]
days_of_week = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

def generate_schedule(start_date_str, num_weeks=2):
    start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
    file_contents = {}
    processed_files = []

    for week in range(num_weeks):
        week_entries = []
        week_start = start_date + timedelta(weeks=week)

        for team_id in teams:
            for day_offset in range(6):  # Monday to Saturday
                current_date = week_start + timedelta(days=day_offset)
                date_str = current_date.strftime("%Y-%m-%d")
                day_name = days_of_week[day_offset]

                for session in sessions:
                    entry = {
                        "week": week + 1,
                        "teamId": team_id,
                        "subjectId": random.choice(subjects),
                        "date": date_str,
                        "dayOfWeek": day_name,
                        "session": session,
                        "lecturerId": random.choice(lecturers),
                        "locationId": random.choice(locations)
                    }
                    week_entries.append(entry)

        filename = f"week_{week_start.strftime('%Y-%m-%d')}_{(week_start + timedelta(days=5)).strftime('%Y-%m-%d')}.json"
        file_contents[filename] = week_entries
        processed_files.append(filename)

    result = {
        "success": True,
        "data": {
            "processedFiles": processed_files,
            "errors": [],
            "fileContents": file_contents
        },
        "message": f"Successfully generated schedules for {num_weeks} file(s)"
    }

    return result

# Generate schedule and export to JSON
if __name__ == "__main__":
    schedule_data = generate_schedule("2025-06-09", num_weeks=2)

    with open("public/sample-timetable-data.json", "w", encoding="utf-8") as f:
        json.dump(schedule_data, f, indent=4)

    print("✅ Full timetable exported to 'schedule_output.json'")
