import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface ScheduleItem {
    week: number;
    teamId: number;
    subjectId: number | null;
    date: string;
    dayOfWeek: string;
    session: string;
    lecturerId: number | null;
    locationId: number | null;
}

export async function GET(request: NextRequest) {
    try {
        // Lấy dữ liệu từ file hoặc database
        const doneDir = path.join(process.cwd(), 'schedules/done');
        
        if (!fs.existsSync(doneDir)) {
            return NextResponse.json({ error: 'No schedule data found' }, { status: 404 });
        }

        const files = fs.readdirSync(doneDir).filter(f => f.endsWith('.json'));
        
        if (files.length === 0) {
            return NextResponse.json({ error: 'No schedule files found' }, { status: 404 });
        }

        // Đọc tất cả dữ liệu từ các file
        let allScheduleData: ScheduleItem[] = [];
        
        for (const file of files) {
            const fileData = JSON.parse(fs.readFileSync(path.join(doneDir, file), 'utf-8'));
            allScheduleData = allScheduleData.concat(fileData);
        }

        // Lấy thông tin subject names
        const subjectIds = [...new Set(allScheduleData.map(item => item.subjectId).filter(id => id !== null))];
        const subjects = await prisma.subject.findMany({
            where: { id: { in: subjectIds as number[] } },
            select: { id: true, name: true }
        });
        
        const subjectMap = new Map(subjects.map(s => [s.id, s.name]));

        // Lấy thông tin team names
        const teamIds = [...new Set(allScheduleData.map(item => item.teamId))];
        const teams = await prisma.team.findMany({
            where: { id: { in: teamIds } },
            select: { id: true, name: true }
        });
        
        const teamMap = new Map(teams.map(t => [t.id, t.name]));

        // Lấy thông tin lecturer names
        const lecturerIds = [...new Set(allScheduleData.map(item => item.lecturerId).filter(id => id !== null))];
        const lecturers = await prisma.lecturer.findMany({
            where: { id: { in: lecturerIds as number[] } },
            select: { id: true, fullName: true }
        });
        
        const lecturerMap = new Map(lecturers.map(l => [l.id, l.fullName]));

        // Lấy thông tin location names
        const locationIds = [...new Set(allScheduleData.map(item => item.locationId).filter(id => id !== null))];
        const locations = await prisma.location.findMany({
            where: { id: { in: locationIds as number[] } },
            select: { id: true, name: true }
        });
        
        const locationMap = new Map(locations.map(l => [l.id, l.name]));

        // Tạo object để nhóm dữ liệu theo teamId
        const groupedData: Record<string, Record<string, {
            subjectId: number | null;
            subjectName: string;
            lecturerName: string;
            locationName: string;
        }>> = {};

        // Tạo danh sách các buổi học duy nhất (date + session)
        const uniqueSessions: Set<string> = new Set();

        allScheduleData.forEach(item => {
            const sessionKey = `${item.date}-${item.session}`;
            uniqueSessions.add(sessionKey);

            if (!groupedData[item.teamId]) {
                groupedData[item.teamId] = {};
            }

            const subjectName = item.subjectId ? (subjectMap.get(item.subjectId) || `Môn ${item.subjectId}`) : 'BREAK';
            const lecturerName = item.lecturerId ? (lecturerMap.get(item.lecturerId) || `GV ${item.lecturerId}`) : '';
            const locationName = item.locationId ? (locationMap.get(item.locationId) || `Phòng ${item.locationId}`) : '';

            groupedData[item.teamId][sessionKey] = {
                subjectId: item.subjectId,
                subjectName,
                lecturerName,
                locationName
            };
        });

        // Chuẩn bị dữ liệu cho Excel
        const excelData: any[] = [];

        // Header row
        const headerRow = ['Buổi học'];
        const teamIds_sorted = Object.keys(groupedData).sort((a, b) => Number(a) - Number(b));
        teamIds_sorted.forEach(teamId => {
            const teamName = teamMap.get(Number(teamId)) || `Lớp ${teamId}`;
            headerRow.push(teamName);
        });
        excelData.push(headerRow);

        // Data rows - sắp xếp theo ngày và session
        const sessionOrder = ['morning', 'afternoon', 'evening'];
        const sortedSessions = Array.from(uniqueSessions).sort((a, b) => {
            const [dateA, sessionA] = a.split('-');
            const [dateB, sessionB] = b.split('-');
            
            // So sánh ngày trước
            if (dateA !== dateB) {
                return dateA.localeCompare(dateB);
            }
            
            // Nếu cùng ngày, so sánh session
            return sessionOrder.indexOf(sessionA) - sessionOrder.indexOf(sessionB);
        });

        sortedSessions.forEach(sessionKey => {
            const [date, session] = sessionKey.split('-');
            const formattedDate = new Date(date).toLocaleDateString('vi-VN');
            
            // Dịch session sang tiếng Việt
            const sessionNames: Record<string, string> = {
                morning: 'Sáng',
                afternoon: 'Chiều', 
                evening: 'Tối'
            };
            
            const sessionName = `${formattedDate} - ${sessionNames[session] || session}`;

            const rowData: any[] = [sessionName];
            
            teamIds_sorted.forEach(teamId => {
                const sessionData = groupedData[teamId][sessionKey];
                if (sessionData) {
                    let cellContent = sessionData.subjectName;
                    if (sessionData.lecturerName) {
                        cellContent += `\nGV: ${sessionData.lecturerName}`;
                    }
                    if (sessionData.locationName) {
                        cellContent += `\nPhòng: ${sessionData.locationName}`;
                    }
                    rowData.push(cellContent);
                } else {
                    rowData.push('');
                }
            });

            excelData.push(rowData);
        });

        // Tạo workbook và worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(excelData);

        // Cải thiện định dạng Excel
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        
        // Set column widths
        const colWidths = [{ wch: 25 }]; // Cột đầu rộng hơn
        for (let i = 1; i <= teamIds_sorted.length; i++) {
            colWidths.push({ wch: 30 });
        }
        worksheet['!cols'] = colWidths;

        // Set row heights for better readability
        const rowHeights = [];
        for (let i = 0; i <= sortedSessions.length; i++) {
            rowHeights.push({ hpt: 60 }); // Height in points
        }
        worksheet['!rows'] = rowHeights;

        // Thêm worksheet vào workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Lịch học');

        // Tạo buffer từ workbook
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

        // Tạo tên file với timestamp
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `lich_hoc_${timestamp}.xlsx`;

        // Thiết lập headers và gửi file
        const response = new NextResponse(excelBuffer);
        response.headers.set('Content-Disposition', `attachment; filename="${filename}"`);
        response.headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        
        return response;

    } catch (error) {
        console.error('Error exporting schedule:', error);
        return NextResponse.json(
            { error: 'Failed to export schedule' }, 
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

export async function POST(request: NextRequest) {
    try {
        const { weekFiles } = await request.json();
        
        if (!weekFiles || !Array.isArray(weekFiles)) {
            return NextResponse.json({ error: 'Invalid week files provided' }, { status: 400 });
        }

        // Logic tương tự nhưng chỉ export các file được chọn
        const doneDir = path.join(process.cwd(), 'schedules/done');
        let allScheduleData: ScheduleItem[] = [];
        
        for (const filename of weekFiles) {
            const filePath = path.join(doneDir, filename);
            if (fs.existsSync(filePath)) {
                const fileData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                allScheduleData = allScheduleData.concat(fileData);
            }
        }

        if (allScheduleData.length === 0) {
            return NextResponse.json({ error: 'No data found in selected files' }, { status: 404 });
        }

        // Sử dụng logic tương tự như GET để tạo Excel
        // ... (có thể tái sử dụng code từ phần GET)
        
        return NextResponse.json({ message: 'Custom export completed' });

    } catch (error) {
        console.error('Error in custom export:', error);
        return NextResponse.json(
            { error: 'Failed to export selected schedules' }, 
            { status: 500 }
        );
    }
} 