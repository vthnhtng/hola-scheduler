import { Subject } from "@prisma/client";
import { DataProvider } from "@/interface/data-provider-interface";

export class SubjectDataProvider implements DataProvider {
    private static instance: SubjectDataProvider;

    private constructor() {}

    public static getInstance(): SubjectDataProvider {
        if (!SubjectDataProvider.instance) {
            SubjectDataProvider.instance = new SubjectDataProvider();
        }
        return SubjectDataProvider.instance;
    }

    public getSelections(): { value: string; label: string }[] {
        return this.getCategories();
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
            { value: "", label: "Không" },
            ...subjects.data.map((subject: Subject) => ({
                value: subject.id.toString(),
                label: subject.name
            }))
        ];

        return prerequisites;
    }
}
