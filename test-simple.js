import ExcelJS from 'exceljs';
import fs from 'fs/promises';

// Sample data matching the format from the user's example
const sampleData = [
  // Day 1 - 19/5/2025
  { week: 1, teamId: 1, subjectId: 1, date: "2025-05-19", dayOfWeek: "Mon", session: "morning", lecturerId: null, locationId: null },
  { week: 1, teamId: 2, subjectId: 2, date: "2025-05-19", dayOfWeek: "Mon", session: "morning", lecturerId: null, locationId: null },
  { week: 1, teamId: 3, subjectId: 3, date: "2025-05-19", dayOfWeek: "Mon", session: "morning", lecturerId: null, locationId: null },
  { week: 1, teamId: 4, subjectId: 4, date: "2025-05-19", dayOfWeek: "Mon", session: "morning", lecturerId: null, locationId: null },
  { week: 1, teamId: 5, subjectId: 5, date: "2025-05-19", dayOfWeek: "Mon", session: "morning", lecturerId: null, locationId: null },
  { week: 1, teamId: 6, subjectId: 6, date: "2025-05-19", dayOfWeek: "Mon", session: "morning", lecturerId: null, locationId: null },
  { week: 1, teamId: 7, subjectId: 7, date: "2025-05-19", dayOfWeek: "Mon", session: "morning", lecturerId: null, locationId: null },
  
  { week: 1, teamId: 1, subjectId: 8, date: "2025-05-19", dayOfWeek: "Mon", session: "afternoon", lecturerId: null, locationId: null },
  { week: 1, teamId: 2, subjectId: 9, date: "2025-05-19", dayOfWeek: "Mon", session: "afternoon", lecturerId: null, locationId: null },
  { week: 1, teamId: 3, subjectId: 10, date: "2025-05-19", dayOfWeek: "Mon", session: "afternoon", lecturerId: null, locationId: null },
  { week: 1, teamId: 4, subjectId: 11, date: "2025-05-19", dayOfWeek: "Mon", session: "afternoon", lecturerId: null, locationId: null },
  { week: 1, teamId: 5, subjectId: 12, date: "2025-05-19", dayOfWeek: "Mon", session: "afternoon", lecturerId: null, locationId: null },
  { week: 1, teamId: 6, subjectId: 13, date: "2025-05-19", dayOfWeek: "Mon", session: "afternoon", lecturerId: null, locationId: null },
  { week: 1, teamId: 7, subjectId: 14, date: "2025-05-19", dayOfWeek: "Mon", session: "afternoon", lecturerId: null, locationId: null },
  
  { week: 1, teamId: 1, subjectId: 15, date: "2025-05-19", dayOfWeek: "Mon", session: "evening", lecturerId: null, locationId: null },
  { week: 1, teamId: 2, subjectId: 16, date: "2025-05-19", dayOfWeek: "Mon", session: "evening", lecturerId: null, locationId: null },
  { week: 1, teamId: 3, subjectId: 17, date: "2025-05-19", dayOfWeek: "Mon", session: "evening", lecturerId: null, locationId: null },
  { week: 1, teamId: 4, subjectId: 18, date: "2025-05-19", dayOfWeek: "Mon", session: "evening", lecturerId: null, locationId: null },
  { week: 1, teamId: 5, subjectId: 19, date: "2025-05-19", dayOfWeek: "Mon", session: "evening", lecturerId: null, locationId: null },
  { week: 1, teamId: 6, subjectId: 20, date: "2025-05-19", dayOfWeek: "Mon", session: "evening", lecturerId: null, locationId: null },
  { week: 1, teamId: 7, subjectId: 21, date: "2025-05-19", dayOfWeek: "Mon", session: "evening", lecturerId: null, locationId: null },

  // Day 2 - 20/5/2025
  { week: 1, teamId: 1, subjectId: 22, date: "2025-05-20", dayOfWeek: "Tue", session: "morning", lecturerId: null, locationId: null },
  { week: 1, teamId: 2, subjectId: 23, date: "2025-05-20", dayOfWeek: "Tue", session: "morning", lecturerId: null, locationId: null },
  { week: 1, teamId: 3, subjectId: 24, date: "2025-05-20", dayOfWeek: "Tue", session: "morning", lecturerId: null, locationId: null },
  { week: 1, teamId: 4, subjectId: 25, date: "2025-05-20", dayOfWeek: "Tue", session: "morning", lecturerId: null, locationId: null },
  { week: 1, teamId: 5, subjectId: 26, date: "2025-05-20", dayOfWeek: "Tue", session: "morning", lecturerId: null, locationId: null },
  { week: 1, teamId: 6, subjectId: 27, date: "2025-05-20", dayOfWeek: "Tue", session: "morning", lecturerId: null, locationId: null },
  { week: 1, teamId: 7, subjectId: 28, date: "2025-05-20", dayOfWeek: "Tue", session: "morning", lecturerId: null, locationId: null },
  
  { week: 1, teamId: 1, subjectId: 29, date: "2025-05-20", dayOfWeek: "Tue", session: "afternoon", lecturerId: null, locationId: null },
  { week: 1, teamId: 2, subjectId: 30, date: "2025-05-20", dayOfWeek: "Tue", session: "afternoon", lecturerId: null, locationId: null },
  { week: 1, teamId: 3, subjectId: 31, date: "2025-05-20", dayOfWeek: "Tue", session: "afternoon", lecturerId: null, locationId: null },
  { week: 1, teamId: 4, subjectId: 32, date: "2025-05-20", dayOfWeek: "Tue", session: "afternoon", lecturerId: null, locationId: null },
  { week: 1, teamId: 5, subjectId: 33, date: "2025-05-20", dayOfWeek: "Tue", session: "afternoon", lecturerId: null, locationId: null },
  { week: 1, teamId: 6, subjectId: 34, date: "2025-05-20", dayOfWeek: "Tue", session: "afternoon", lecturerId: null, locationId: null },
  { week: 1, teamId: 7, subjectId: 35, date: "2025-05-20", dayOfWeek: "Tue", session: "afternoon", lecturerId: null, locationId: null },
  
  { week: 1, teamId: 1, subjectId: 36, date: "2025-05-20", dayOfWeek: "Tue", session: "evening", lecturerId: null, locationId: null },
  { week: 1, teamId: 2, subjectId: 37, date: "2025-05-20", dayOfWeek: "Tue", session: "evening", lecturerId: null, locationId: null },
  { week: 1, teamId: 3, subjectId: 38, date: "2025-05-20", dayOfWeek: "Tue", session: "evening", lecturerId: null, locationId: null },
  { week: 1, teamId: 4, subjectId: 39, date: "2025-05-20", dayOfWeek: "Tue", session: "evening", lecturerId: null, locationId: null },
  { week: 1, teamId: 5, subjectId: 40, date: "2025-05-20", dayOfWeek: "Tue", session: "evening", lecturerId: null, locationId: null },
  { week: 1, teamId: 6, subjectId: 41, date: "2025-05-20", dayOfWeek: "Tue", session: "evening", lecturerId: null, locationId: null },
  { week: 1, teamId: 7, subjectId: 42, date: "2025-05-20", dayOfWeek: "Tue", session: "evening", lecturerId: null, locationId: null },
];

// Simple Excel export function
async function createScheduleExcel(data, outputPath) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Schedule');
  
  const teams = ['C1 (Nghĩaaasiu)', 'C2 (Nghĩa)', 'C3 (Đức)', 'C4 (TG.Tùng)', 'C5 (Việt Anh)', 'C6 (Đức)', 'C7 (TG.Lâm)'];
  
  // Create header
  const headerRow = worksheet.getRow(1);
  headerRow.getCell('A').value = 'Ngày';
  headerRow.getCell('B').value = 'Buổi';
  
  teams.forEach((team, index) => {
    const column = String.fromCharCode(67 + index); // C, D, E, F, G, H, I
    headerRow.getCell(column).value = team;
  });
  
  // Style header
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  
  // Group data by date and session
  const groupedData = {};
  data.forEach(item => {
    if (!groupedData[item.date]) {
      groupedData[item.date] = {};
    }
    if (!groupedData[item.date][item.session]) {
      groupedData[item.date][item.session] = [];
    }
    groupedData[item.date][item.session].push(item);
  });
  
  // Fill data
  const dates = Object.keys(groupedData).sort();
  let currentRow = 2;
  
  dates.forEach((date, dateIndex) => {
    const sessions = ['morning', 'afternoon', 'evening'];
    let isFirstSession = true;
    
    sessions.forEach((session) => {
      const row = worksheet.getRow(currentRow);
      const sessionData = groupedData[date]?.[session] || [];
      
      // Map session to Vietnamese
      const sessionMap = {
        'morning': 'S',
        'afternoon': 'C',
        'evening': 'T'
      };
      
      // Fill date (only for first session of the day)
      if (isFirstSession) {
        const dateObj = new Date(date);
        const day = dateObj.getDate().toString().padStart(2, '0');
        const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        const year = dateObj.getFullYear();
        row.getCell('A').value = `${day}/${month}/${year}`;
        row.getCell('A').alignment = { vertical: 'middle' };
      }
      
      // Fill session
      row.getCell('B').value = sessionMap[session] || session;
      
      // Fill team data
      teams.forEach((team, teamIndex) => {
        const column = String.fromCharCode(67 + teamIndex);
        const cell = row.getCell(column);
        
        // Find data for this team
        const teamData = sessionData.find(item => item.teamId === teamIndex + 1);
        
        if (teamData) {
          cell.value = `Subject ${teamData.subjectId}`;
        } else {
          // Default value for empty slots
          if (session === 'evening') {
            cell.value = 'Tự học';
          } else {
            cell.value = '';
          }
        }
      });
      
      // Style the row
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });
      
      currentRow++;
      isFirstSession = false;
    });
    
    // Add separator row between days (except for last day)
    if (dateIndex < dates.length - 1) {
      const separatorRow = worksheet.getRow(currentRow);
      separatorRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
      currentRow++;
    }
  });
  
  // Adjust column widths
  worksheet.getColumn('A').width = 12;
  worksheet.getColumn('B').width = 8;
  teams.forEach((_, index) => {
    const column = String.fromCharCode(67 + index);
    worksheet.getColumn(column).width = 15;
  });
  
  // Save workbook
  await workbook.xlsx.writeFile(outputPath);
  console.log(`Excel file saved: ${outputPath}`);
}

// Run the test
async function testExcelExport() {
  try {
    console.log('Starting Excel export test...');
    await createScheduleExcel(sampleData, 'test-output/schedule-export.xlsx');
    console.log('✅ Excel export completed successfully!');
  } catch (error) {
    console.error('❌ Export failed:', error);
  }
}

testExcelExport(); 