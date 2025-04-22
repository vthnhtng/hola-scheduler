import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * @returns - Returns a list of users from the database.
 */
export async function GET() {
    try {
        const users = await prisma.appUser.findMany({
            select: {
                id: true,
                username: true,
                fullName: true,
                email: true,
                role: true,
                password: true,
            },
        });

        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ error: error }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

/**
 * @param request - Request object containing user data.
 * @returns - Create new user in the database.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, password, fullName, email, role } = body;

        const newUser = await prisma.appUser.create({
            data: {
                username,
                password,
                fullName,
                email,
                role,
            },
        });

        return NextResponse.json({ success: true, user: newUser }, { status: 201 });
    } catch (error) {
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

        const updatedUser = await prisma.appUser.update({
            where: { id },
            data: {
                username,
                password,
                fullName,
                email,
                role,
            },
        });

        return NextResponse.json({ success: true, user: updatedUser }, { status: 200 });
    } catch (error) {
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
        });

        return NextResponse.json({ success: true, user: deletedUser }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
