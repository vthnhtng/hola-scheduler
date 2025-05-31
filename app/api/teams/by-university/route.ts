import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * @returns - Returns a list of teams for a specific university.
 */
export async function GET(request: Request) {
	try {
		const url = new URL(request.url);
		const universityId = url.searchParams.get('universityId');

		if (!universityId) {
			return NextResponse.json({ error: 'University ID is required' }, { status: 400 });
		}

		const teams = await prisma.team.findMany({
			where: {
				universityId: parseInt(universityId)
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
		return NextResponse.json({ error: 'Failed to fetch university teams' }, { status: 500 });
	} finally {
		await prisma.$disconnect();
	}
} 