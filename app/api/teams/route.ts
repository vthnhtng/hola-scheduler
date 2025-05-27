import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * @returns - Returns a list of teams from the database. 
 */
export async function GET(request: NextRequest) {
	const { searchParams } = request.nextUrl;
    if (request.method !== 'GET') {
        return NextResponse.json({ message: 'Phương thức không hợp lệ' }, { status: 405 })
    }

	try {
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '10', 10);
        const teams = await prisma.team.findMany({
            skip: (page - 1) * limit,
            take: limit,
        });

        const totalCount = await prisma.team.count();
        const totalPages = Math.ceil(totalCount / limit);

        return NextResponse.json({
            data: teams,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalCount: totalCount,
            },
        });
	} catch (error) {
		return NextResponse.json({ error: 'Có lỗi xảy ra khi lấy danh sách đại đội' }, { status: 500 });
	} finally {
		await prisma.$disconnect();
	}
}

/**
 * @param request - Request object containing the team data.
 * @returns - Create new team in the database.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, program } = body;

        const newTeam = await prisma.team.create({
            data: {
                name,
                program,
            },
        });

        return NextResponse.json(
            { success: true, team: newTeam },
            { status: 201 }
        );
    } catch (e) {
        return NextResponse.json(
            { error: 'Failed to create team' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

/**
 * @param request - Request object containing the team ID to delete.
 * @returns - Delete team from the database.
 */
export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();
        if (typeof id !== 'number') {
            return NextResponse.json(
                { error: 'Invalid or missing id' },
                { status: 400 }
            );
        }

        const deletedTeam = await prisma.team.delete({
            where: { id },
        });

        return NextResponse.json(
            { success: true, team: deletedTeam },
            { status: 200 }
        );
    } catch (e) {
        return NextResponse.json(
            { error: 'Failed to delete team' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

/**
 * @param request - Request object containing the team data to update.
 * @returns - Change team information in the database.
 */
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, name, program } = body;

        if (typeof id !== 'number') {
            return NextResponse.json(
                { error: 'Invalid or missing team_id' },
                { status: 400 }
            );
        }

        const updatedTeam = await prisma.team.update({
            where: { id },
            data: {
                name,
                program,
            },
        });

        return NextResponse.json(
            { success: true, team: updatedTeam },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to update team' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
