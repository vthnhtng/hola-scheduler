import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * @returns - Returns a list of universities with their status from the database. 
 */
export async function GET(request: Request) {
	try {
		const universities = await prisma.university.findMany({
			select: {
				id: true,
				name: true,
				status: true
			}
		});

		return NextResponse.json({
			data: universities,
		});
	} catch (error) {
		return NextResponse.json({ error: 'Failed to fetch universities' }, { status: 500 });
	} finally {
		await prisma.$disconnect();
	}
}
