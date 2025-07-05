import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const curriculumId = searchParams.get('curriculumId');
    if (!curriculumId) {
        return NextResponse.json({ data: [] });
    }
    const links = await prisma.curriculumSubject.findMany({
        where: { curriculumId: parseInt(curriculumId) },
        include: { SubjectReference: true }
    });
    const data = links.map(link => ({
        value: link.subjectId.toString(),
        label: link.SubjectReference?.name || ''
    }));
    return NextResponse.json({ data });
} 