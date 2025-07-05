import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Category } from '@prisma/client';

/**
 * @returns - Returns a list of subjects by category. 
 */
export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    if (request.method !== 'GET') {
        return NextResponse.json({ message: 'Phương thức không hợp lệ' }, { status: 405 })
    }

    try {
        const category = searchParams.get('category') || '';

        if (category === 'all') {
            const subjects = await prisma.subject.findMany();
            return NextResponse.json({ data: subjects });
        }

        if (category !== 'CT' && category !== 'QS') {
            return NextResponse.json({ data: [] });
        }

        const subjects = await prisma.subject.findMany({
            where: {
                category:  category as Category
            }
        });

        return NextResponse.json({
            data: subjects
        });
    } catch (error) {
        return NextResponse.json({ data: [] });
    } finally {
        await prisma.$disconnect();
    }
}

