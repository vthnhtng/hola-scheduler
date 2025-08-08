import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        // Get data from request body
        const body = await request.json();
        const { data } = body;

        if (!data || !Array.isArray(data)) {
            return NextResponse.json(
                { error: 'Data is required and must be an array' },
                { status: 400 }
            );
        }
        if (data.length > 0) {
            const requiredFields = ['week', 'teamId', 'subjectId', 'date', 'dayOfWeek', 'session'];
            const sampleItem = data[0];
            const missingFields = requiredFields.filter(field => !(field in sampleItem));

            if (missingFields.length > 0) {
                return NextResponse.json(
                    { error: `Missing required fields: ${missingFields.join(', ')}` },
                    { status: 400 }
                );
            }
        }

        // Create workbook and worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet([]);

        const teams = ['C1 (Nghĩaaasiu)', 'C2 (Nghĩa)', 'C3 (Đức)', 'C4 (TG.Tùng)', 'C5 (Việt Anh)', 'C6 (Đức)', 'C7 (TG.Lâm)'];

        // Create header row
        const headerRow = ['Ngày', 'Buổi', ...teams];

        // Group data by date and session
        const groupedData: Record<string, Record<string, any[]>> = {};
        data.forEach((item: any) => {
            if (!groupedData[item.date]) {
                groupedData[item.date] = {};
            }
            if (!groupedData[item.date][item.session]) {
                groupedData[item.date][item.session] = [];
            }
            groupedData[item.date][item.session].push(item);
        });

        // Prepare data rows
        const dataRows: any[][] = [headerRow];
        const dates = Object.keys(groupedData).sort();

        dates.forEach((date, dateIndex) => {
            const sessions = ['morning', 'afternoon', 'evening'];
            let isFirstSession = true;

            sessions.forEach((session) => {
                const sessionData = groupedData[date]?.[session] || [];

                // Map session to Vietnamese
                const sessionMap: Record<string, string> = {
                    'morning': 'S',
                    'afternoon': 'C',
                    'evening': 'T'
                };

                const row: any[] = [];

                // Fill date (only for first session of the day)
                if (isFirstSession) {
                    const dateObj = new Date(date);
                    const day = dateObj.getDate().toString().padStart(2, '0');
                    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
                    const year = dateObj.getFullYear();
                    row.push(`${day}/${month}/${year}`);
                } else {
                    row.push('');
                }

                // Fill session
                row.push(sessionMap[session] || session);

                // Fill team data
                teams.forEach((team, teamIndex) => {
                    const teamData = sessionData.find((item: any) => item.teamId === teamIndex + 1);

                    if (teamData) {
                        row.push(`Subject ${teamData.subjectId}`);
                    } else {
                        // Default value for empty slots
                        if (session === 'evening') {
                            row.push('Tự học');
                        } else {
                            row.push('');
                        }
                    }
                });

                dataRows.push(row);
                isFirstSession = false;
            });

            // Add separator row between days (except for last day)
            if (dateIndex < dates.length - 1) {
                const separatorRow = new Array(teams.length + 2).fill('');
                dataRows.push(separatorRow);
            }
        });

        // Create worksheet from data
        const ws = XLSX.utils.aoa_to_sheet(dataRows);
        ws['!cols'] = [
            { width: 12 }, // Ngày
            { width: 8 },  // Buổi
            ...teams.map(() => ({ width: 15 })) // Teams
        ];
        XLSX.utils.book_append_sheet(workbook, ws, 'Schedule');
        const outputDir = path.join(process.cwd(), 'public', 'exports');
        try {
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
        } catch (dirError) {
            console.error('Error creating directory:', dirError);
            throw new Error(`Failed to create directory: ${dirError}`);
        }

        // Generate unique filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `schedule-export-${timestamp}.xlsx`;
        const filepath = path.join(outputDir, filename);
        try {
            // Use buffer approach instead of direct file writing
            const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
            fs.writeFileSync(filepath, buffer);
        } catch (writeError) {
            console.error('Error writing file:', writeError);
            throw new Error(`Failed to write file: ${writeError}`);
        }

        // Return the file path in response
        return NextResponse.json({
            success: true,
            message: 'Excel file created successfully',
            filepath: `/exports/${filename}`,
            filename: filename
        });

    } catch (error) {
        console.error('Export failed:', error);
        return NextResponse.json(
            { error: 'Failed to export Excel file' },
            { status: 500 }
        );
    }
}
