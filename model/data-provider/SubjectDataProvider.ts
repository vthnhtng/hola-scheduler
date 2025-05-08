import { Subject } from "@prisma/client";

export class SubjectDataProvider {
    private static instance: SubjectDataProvider;

    private constructor() {}

    public static getInstance(): SubjectDataProvider {
        if (!SubjectDataProvider.instance) {
            SubjectDataProvider.instance = new SubjectDataProvider();
        }
        return SubjectDataProvider.instance;
    }

    public getCategories(): { value: string; label: string }[] {
        return [
            { value: "CT", label: "Chính trị" },
            { value: "QS", label: "Quân sự" }
        ]
    }

    public async getPrerequisites(): Promise<{ value: string; label: string }[]> {
        const response = await fetch('/api/subjects');
        const subjects = await response.json();
        const prerequisites = [
            { value: null, label: "Không" },
            ...subjects.data.map((subject: Subject) => ({
                value: subject.id.toString(),
                label: subject.name
            }))
        ];

        return prerequisites;
    }
}
