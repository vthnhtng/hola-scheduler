import ExcelJS from 'exceljs';
export class ExcelExporter {
    constructor(config = {}) {
        this.config = {
            templatePath: config.templatePath || './excel_export/template.xlsx',
            outputPath: config.outputPath || './excel_export/output.xlsx',
            worksheetIndex: config.worksheetIndex || 1,
            startRow: config.startRow || 3,
            dayColumn: config.dayColumn || 'A',
            sessionColumn: config.sessionColumn || 'B',
            subjectColumns: config.subjectColumns || ['C', 'D', 'E', 'F', 'G', 'H', 'I'],
            lecturerColumns: config.lecturerColumns || ['C', 'D', 'E', 'F', 'G', 'H', 'I'],
            locationColumns: config.locationColumns || ['C', 'D', 'E', 'F', 'G', 'H', 'I'],
        };
    }
    /**
     * Initialize the workbook and worksheet
     */
    async initialize() {
        try {
            this.workbook = new ExcelJS.Workbook();
            await this.workbook.xlsx.readFile(this.config.templatePath);
            const worksheet = this.workbook.getWorksheet(this.config.worksheetIndex);
            if (!worksheet) {
                throw new Error(`Worksheet at index ${this.config.worksheetIndex} not found`);
            }
            this.worksheet = worksheet;
        }
        catch (error) {
            // If template doesn't exist, create a new workbook
            this.workbook = new ExcelJS.Workbook();
            this.worksheet = this.workbook.addWorksheet('Schedule');
            this.setupWorksheet();
        }
    }
    /**
     * Setup the basic worksheet structure
     */
    setupWorksheet() {
        // Set up headers
        this.worksheet.getCell('A1').value = 'Tuần - ngày';
        this.worksheet.mergeCells('A1:A2');
        // Set up column headers
        const headers = ['c1 Nghi', 'c2 Nghĩa', 'c3 Đức', 'c4 Sáng', 'c5 TG.Tùng', 'c6 Việt Anh', 'c7 TG.Lâm'];
        headers.forEach((header, index) => {
            const column = String.fromCharCode(67 + index); // C, D, E, F, G, H, I
            this.worksheet.getCell(`${column}1`).value = header;
        });
        // Set up borders
        this.setupBorders();
    }
    /**
     * Setup borders for the worksheet
     */
    setupBorders() {
        const borderStyle = 'thin';
        const border = {
            style: borderStyle,
            color: { argb: 'FF000000' }
        };
        // Apply borders to all cells in the schedule area
        for (let row = 1; row <= 20; row++) {
            for (let col = 1; col <= 9; col++) {
                const cell = this.worksheet.getCell(row, col);
                cell.border = {
                    top: border,
                    left: border,
                    bottom: border,
                    right: border
                };
                cell.alignment = {
                    horizontal: 'center',
                    vertical: 'middle'
                };
            }
        }
    }
    /**
     * Convert session string to Vietnamese format
     */
    sessionToVietnamese(session) {
        switch (session.toLowerCase()) {
            case 'morning':
                return 'S';
            case 'afternoon':
                return 'C';
            case 'evening':
                return 'T';
            default:
                return session;
        }
    }
    /**
     * Convert Vietnamese session to English
     */
    sessionToEnglish(session) {
        switch (session.toUpperCase()) {
            case 'S':
                return 'morning';
            case 'C':
                return 'afternoon';
            case 'T':
                return 'evening';
            default:
                return session;
        }
    }
    /**
     * Format date to Vietnamese format
     */
    formatDate(date) {
        const dateObj = new Date(date);
        const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        const dayName = dayNames[dateObj.getDay()];
        const dateStr = dateObj.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        return { dayName, dateStr };
    }
    /**
     * Group schedule data by date and session
     */
    groupScheduleData(data) {
        const groupedData = new Map();
        data.forEach(item => {
            const { dayName, dateStr } = this.formatDate(item.date);
            const sessionKey = this.sessionToVietnamese(item.session);
            if (!groupedData.has(item.date)) {
                groupedData.set(item.date, {
                    date: item.date,
                    dayOfWeek: dayName,
                    sessions: {
                        S: null,
                        C: null,
                        T: null
                    }
                });
            }
            const daySchedule = groupedData.get(item.date);
            daySchedule.sessions[sessionKey] = item;
        });
        return Array.from(groupedData.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    /**
     * Fill the schedule data into the worksheet
     */
    fillScheduleData(groupedData) {
        let currentRow = this.config.startRow;
        groupedData.forEach(daySchedule => {
            const sessions = ['S', 'C', 'T'];
            const startRow = currentRow;
            const endRow = currentRow + 2;
            // Merge day column for the three sessions
            this.worksheet.mergeCells(`${this.config.dayColumn}${startRow}:${this.config.dayColumn}${endRow}`);
            // Fill day information
            const { dayName, dateStr } = this.formatDate(daySchedule.date);
            this.worksheet.getCell(`${this.config.dayColumn}${startRow}`).value = `${dayName}\n${dateStr}`;
            // Fill session data
            sessions.forEach((session, sessionIndex) => {
                const row = currentRow + sessionIndex;
                const scheduleData = daySchedule.sessions[session];
                // Fill session column
                this.worksheet.getCell(`${this.config.sessionColumn}${row}`).value = session;
                if (scheduleData) {
                    // Fill subject data across columns
                    this.config.subjectColumns.forEach((column, colIndex) => {
                        const cell = this.worksheet.getCell(`${column}${row}`);
                        // For now, just use the subjectId as requested
                        cell.value = `Subject-${scheduleData.subjectId}`;
                        // If there's lecturer data, add it on a new line
                        if (scheduleData.lecturerId) {
                            const currentValue = cell.value;
                            cell.value = `${currentValue}\nLecturer-${scheduleData.lecturerId}`;
                        }
                    });
                }
                else {
                    // Fill empty cells or "Tự học" for empty sessions
                    this.config.subjectColumns.forEach((column) => {
                        this.worksheet.getCell(`${column}${row}`).value = 'Tự học';
                    });
                }
            });
            currentRow += 3; // Move to next day (3 sessions per day)
        });
    }
    /**
     * Export schedule data to Excel
     */
    async exportToExcel(data, outputPath) {
        await this.initialize();
        const groupedData = this.groupScheduleData(data);
        this.fillScheduleData(groupedData);
        const finalOutputPath = outputPath || this.config.outputPath;
        await this.workbook.xlsx.writeFile(finalOutputPath);
        return finalOutputPath;
    }
    /**
     * Export schedule data to buffer (for API responses)
     */
    async exportToBuffer(data) {
        await this.initialize();
        const groupedData = this.groupScheduleData(data);
        this.fillScheduleData(groupedData);
        return await this.workbook.xlsx.writeBuffer();
    }
    /**
     * Get the worksheet for direct manipulation
     */
    getWorksheet() {
        return this.worksheet;
    }
    /**
     * Get the workbook for direct manipulation
     */
    getWorkbook() {
        return this.workbook;
    }
}
// Export default instance for easy use
export const excelExporter = new ExcelExporter();
