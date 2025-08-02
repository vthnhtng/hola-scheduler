import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * @returns - Returns a list of teams for a specific course.
 */
export async function GET(request: Request) {
	try {
		const url = new URL(request.url);
		const courseId = url.searchParams.get('courseId');

		if (!courseId) {
			return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
		}

		const teams = await prisma.team.findMany({
			where: {
				courseId: parseInt(courseId)
			},
			select: {
				id: true,
				name: true,
				program: true,
			}
		});

		return NextResponse.json({
			data: teams
		});
	} catch (error) {
		return NextResponse.json({ error: 'Có lỗi xảy ra khi lấy danh sách đại đội' }, { status: 500 });
	} finally {
		await prisma.$disconnect();
	}
} 