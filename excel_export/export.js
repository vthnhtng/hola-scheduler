import ExcelJS from 'exceljs';
import fs from 'fs/promises';

async function readJSON(filePath) {
    try {
        const jsonString = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(jsonString);
        return data;
    } catch (error) {
        console.error('Error reading JSON file:', error);
        throw error;
    }
}

function getStartAndEndTimeSlot(jsonFileData) {
    const start = jsonFileData[0];
    const end = jsonFileData[jsonFileData.length - 1];

    return { start, end };
}

function fillDays(worksheet, data) {
    const { start, end } = getStartAndEndTimeSlot(data);
    const dates = Array.from(new Set(data.map(item => item.date)));
    const dayColumn = 'A';
    const timeSlotColumn = 'B';

    const rowPerTimeSlot = 1;
    const slots = ['S', 'C', 'T'];
    const daysNumber = getDaysCount(new Date(start.date), new Date(end.date));

    const firstTimeSlotRow = 4;
    for (let i = 0; i < dates.length; i++) {
        const startRow = firstTimeSlotRow + i * rowPerTimeSlot * slots.length;
        const endRow = startRow + rowPerTimeSlot * slots.length - 1;
        slots.forEach((slot, index) => {
            fillCell(worksheet, `${timeSlotColumn}${String(startRow + index)}`, slot);
        });
        worksheet.mergeCells(`${dayColumn}${String(startRow)}:${dayColumn}${String(endRow)}`);

        const dateObject = new Date(dates[i]);
        const day = dateObject.toLocaleDateString('en-US', { weekday: 'short' });
        const dateExcelValue = dateObject.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });

        fillCell(worksheet, `${dayColumn}${String(startRow)}`, `${day}\n${dateExcelValue}`);
    }
}

function fillPeriodData(worksheet, data) {
    
}

/**
 * Get the number of days between two dates
 *
 * @param {Date} startDate - The start date
 * @param {Date} endDate - The end date
 * @returns {number} The number of days between the two dates
 */
function getDaysCount(startDate, endDate) {
    if (startDate >= endDate) {
        return 0;
    }

    const timeDiff = endDate.getTime() - startDate.getTime();
    const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    return dayDiff;
}

async function getExcelTemplate(filePath) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    return workbook;
}

function fillCell(worksheet, cell, value) {
    worksheet.getCell(cell).value = value;
}

function saveExcel(workbook, filePath) {
    workbook.xlsx.writeFile(filePath);
}

async function main() {
    const excelTemplate = await getExcelTemplate('template.xlsx');
    const worksheet = excelTemplate.getWorksheet(1);
    const data = await readJSON('data.json');

    fillDays(worksheet, data);
    saveExcel(excelTemplate, 'output.xlsx');
}

main();
