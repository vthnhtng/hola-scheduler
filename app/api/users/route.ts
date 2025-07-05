import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * @returns - Returns a list of users from the database.
 */
export async function GET(request: Request) {
	try {
		const url = new URL(request.url);
		const page = parseInt(url.searchParams.get('page') || '1', 10);
		const recordsPerPage = parseInt(url.searchParams.get('recordsPerPage') || '10', 10);
		const skip = (page - 1) * recordsPerPage;
		const take = recordsPerPage;

		const appUsers = await prisma.appUser.findMany({
			skip,
			take,
			select: {
				id: true,
				username: true,
				fullName: true,
				email: true,
				role: true,
				password: true,
			},
		});

		const totalCount = await prisma.appUser.count();
		const totalPages = Math.ceil(totalCount / recordsPerPage);

		return NextResponse.json({
			data: appUsers,
			pagination: {
				currentPage: page,
				totalPages: totalPages,
				totalCount: totalCount,
			},
		});
	} catch (error) {
		return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
	} finally {
		await prisma.$disconnect();
	}
}
// export async function GET() {
//     try {
//         const users = await prisma.appUser.findMany({
//             select: {
//                 id: true,
//                 username: true,
//                 fullName: true,
//                 email: true,
//                 role: true,
//                 password: true,
//             },
//         });

//         return NextResponse.json(users);
//     } catch (error) {
//         return NextResponse.json({ error: error }, { status: 500 });
//     } finally {
//         await prisma.$disconnect();
//     }
// }

/**
 * @param request - Request object containing user data.
 * @returns - Create new user in the database.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, password, fullName, email, role } = body;

        // Validate required fields
        if (!username || !password) {
            return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
        }

        // Store password directly (no hashing)
        const newUser = await prisma.appUser.create({
            data: {
                username,
                password: password,
                fullName,
                email,
                role,
            },
            select: {
                id: true,
                username: true,
                fullName: true,
                email: true,
                role: true,
                password: true,
            },
        });

        return NextResponse.json({ success: true, user: newUser }, { status: 201 });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

/**
 * @param request - Request object containing the user data to update.
 * @returns - Change user information in the database.
 */
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, username, password, fullName, email, role } = body;

        if (typeof id !== 'number') {
            return NextResponse.json({ error: 'Invalid or missing user id' }, { status: 400 });
        }

        const updateData: any = {
            username,
            fullName,
            email,
            role,
        };

        // Only update password if provided (no hashing)
        if (password) {
            updateData.password = password;
        }

        const updatedUser = await prisma.appUser.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                username: true,
                fullName: true,
                email: true,
                role: true,
                password: true,
            },
        });

        return NextResponse.json({ success: true, user: updatedUser }, { status: 200 });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

/**
 * @param request - Request object containing the user ID to delete.
 * @returns - Delete user from the database.
 */
export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();
        if (typeof id !== 'number') {
            return NextResponse.json({ error: 'Invalid or missing user id' }, { status: 400 });
        }

        const deletedUser = await prisma.appUser.delete({
            where: { id },
            select: {
                id: true,
                username: true,
                fullName: true,
                email: true,
                role: true,
                password: true,
            },
        });

        return NextResponse.json({ success: true, user: deletedUser }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
