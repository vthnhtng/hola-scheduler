import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * @returns - Returns a list of locations from the database. 
 */
export async function GET(request: Request) {
	try {
		const url = new URL(request.url);
		const page = parseInt(url.searchParams.get('page') || '1', 10);
		const recordsPerPage = parseInt(url.searchParams.get('recordsPerPage') || '10', 10);
		const skip = (page - 1) * recordsPerPage;
		const take = recordsPerPage;

		const locations = await prisma.location.findMany({
			skip,
			take,
		});

		const totalCount = await prisma.location.count();
		const totalPages = Math.ceil(totalCount / recordsPerPage);

		return NextResponse.json({
			data: locations,
			pagination: {
				currentPage: page,
				totalPages: totalPages,
				totalCount: totalCount,
			},
		});
	} catch (error) {
		return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
	} finally {
		await prisma.$disconnect();
	}
}

/**
 * @param request - Request object containing the location data.
 * @returns - Create new location in the database.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, capacity } = body;

        const newLocation = await prisma.location.create({
            data: {
                name,
                capacity,
            },
        });

        return NextResponse.json(
            { success: true, location: newLocation },
            { status: 201 }
        );
    } catch (e) {
        return NextResponse.json(
            { error: 'Failed to create location' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

/**
 * @param request - Request object containing the location ID to delete.
 * @returns - Delete location from the database.
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

        const deletedLocation = await prisma.location.delete({
            where: { id },
        });

        return NextResponse.json(
            { success: true, location: deletedLocation },
            { status: 200 }
        );
    } catch (e) {
        return NextResponse.json(
            { error: 'Failed to delete location' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

/**
 * @param request - Request object containing the location data to update.
 * @returns - Change location information in the database.
 */
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, name, capacity } = body;

        if (typeof id !== 'number') {
            return NextResponse.json(
                { error: 'Invalid or missing location_id' },
                { status: 400 }
            );
        }

        const updatedLocation = await prisma.location.update({
            where: { id },
            data: {
                name,
                capacity,
            },
        });

        return NextResponse.json(
            { success: true, location: updatedLocation },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to update location' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}