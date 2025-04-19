import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface Course {
	id: number;
	name: string;
	category: string;
	prerequisiteId?: number | null;
	prerequisite?: string | null;
}

// GET all courses
export async function GET() {
	try {
		const courses = await prisma.subject.findMany();

		const prereqIds = courses
			.map((c) => c.prerequisiteId)
			.filter((id): id is number => id !== null);

		const prereqCourses = await prisma.subject.findMany({
			where: { id: { in: prereqIds } },
			select: { id: true, name: true },
		});

		const prereqMap = new Map(prereqCourses.map((c) => [c.id, c.name]));

		const result: Course[] = courses.map((course) => ({
			id: course.id,
			name: course.name,
			category: course.category,
			prerequisiteId: course.prerequisiteId,
			prerequisite: course.prerequisiteId
				? prereqMap.get(course.prerequisiteId) || null
				: null,
		}));

		return NextResponse.json(result);
	} catch (error) {
		return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
	} finally {
		await prisma.$disconnect();
	}
}

// POST new course
export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { name, category, prerequisite } = body;

		let prerequisiteId: number | null = null;

		if (prerequisite && typeof prerequisite === 'string') {
			const trimmedName = prerequisite.trim();
			const prereqCourse = await prisma.subject.findFirst({
				where: { name: trimmedName },
				select: { id: true },
			});

			if (!prereqCourse) {
				return NextResponse.json(
					{ error: `Prerequisite course with name "${trimmedName}" not found` },
					{ status: 400 }
				);
			}

			prerequisiteId = prereqCourse.id;
		}

		const newCourse = await prisma.subject.create({
			data: {
				name,
				category,
				prerequisiteId,
			},
		});

		return NextResponse.json(
			{
				success: true,
				course: {
					...newCourse,
					prerequisite: prerequisite || null,
				},
			},
			{ status: 201 }
		);
	} catch (e) {
		return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
	} finally {
		await prisma.$disconnect();
	}
}

// PUT update course
export async function PUT(request: Request) {
	try {
		const body = await request.json();
		const { id, name, category, prerequisite } = body;

		if (typeof id !== 'number') {
			return NextResponse.json({ error: 'Invalid or missing course id' }, { status: 400 });
		}

		let prerequisiteId: number | null = null;

		if (prerequisite && typeof prerequisite === 'string') {
			const trimmedName = prerequisite.trim();
			const prereqCourse = await prisma.subject.findFirst({
				where: { name: trimmedName },
				select: { id: true },
			});

			if (!prereqCourse) {
				return NextResponse.json(
					{ error: `Prerequisite course with name "${trimmedName}" not found` },
					{ status: 400 }
				);
			}

			prerequisiteId = prereqCourse.id;
		}

		const updatedCourse = await prisma.subject.update({
			where: { id },
			data: {
				name,
				category,
				prerequisiteId,
			},
		});

		return NextResponse.json(
			{
				success: true,
				course: {
					...updatedCourse,
					prerequisite: prerequisite || null,
				},
			},
			{ status: 200 }
		);
	} catch (error) {
		return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
	} finally {
		await prisma.$disconnect();
	}
}

// DELETE course
export async function DELETE(request: Request) {
	try {
		const { id } = await request.json();
		if (typeof id !== 'number') {
			return NextResponse.json({ error: 'Invalid or missing course id' }, { status: 400 });
		}

		const deletedCourse = await prisma.subject.delete({
			where: { id },
		});

		let prerequisite: string | null = null;
		if (deletedCourse.prerequisiteId) {
			const prereq = await prisma.subject.findUnique({
				where: { id: deletedCourse.prerequisiteId },
				select: { name: true },
			});
			prerequisite = prereq?.name || null;
		}

		return NextResponse.json(
			{
				success: true,
				course: {
					...deletedCourse,
					prerequisite,
				},
			},
			{ status: 200 }
		);
	} catch (e) {
		return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
	} finally {
		await prisma.$disconnect();
	}
}
