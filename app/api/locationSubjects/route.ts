import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const locationId = searchParams.get('locationId');
    if (!locationId) {
        return NextResponse.json({ data: [] });
    }
    const links = await prisma.locationSubject.findMany({
        where: { locationId: parseInt(locationId) },
        include: { SubjectIdReference: true }
    });
    const data = links.map(link => ({
        value: link.subjectId.toString(),
        label: link.SubjectIdReference?.name || ''
    }));
    return NextResponse.json({ data });
} 