import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (id) {
            const holiday = await prisma.holiday.findUnique({
                where: { id: Number(id) },
            });

            if (!holiday) {
                return NextResponse.json({ error: 'Holiday not found' }, { status: 404 });
            }

            return NextResponse.json(holiday);
        }

        const holidays = await prisma.holiday.findMany();
        return NextResponse.json(holidays);
    } catch (error) {
        console.error('GET error:', error);
        return NextResponse.json({ error: 'Unable to fetch holidays' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { date } = body;

        const holiday = await prisma.holiday.create({
            data: { date },
        });

        return NextResponse.json(holiday, { status: 201 });
    } catch (error) {
        console.error('POST error:', error);
        return NextResponse.json({ error: 'Unable to create holiday' }, { status: 400 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');
        if (!date) {
            return NextResponse.json({ error: 'Date is required' }, { status: 400 });
        }

        await prisma.holiday.delete({
            where: { date },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('DELETE error:', error);
        return NextResponse.json({ error: 'Unable to delete holiday' }, { status: 400 });
    }
}
