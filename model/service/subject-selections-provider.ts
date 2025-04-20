export class SubjectSelectionsProvider {
    private static instance: SubjectSelectionsProvider;
    private constructor() {}

    public static getInstance(): SubjectSelectionsProvider {
        if (!SubjectSelectionsProvider.instance) {
            SubjectSelectionsProvider.instance = new SubjectSelectionsProvider();
        }
        return SubjectSelectionsProvider.instance;
    }

    public getCategoryMappings(): { value: string; label: string }[] {
        const categories = [
            { value: 'CT', label: 'Chính trị' },
            { value: 'QS', label: 'Quân sự' },
        ];

        return categories;
    }

    public async getPrerequisiteMappings(): Promise<{ value: string; label: string }[]> {
        const response = await fetch('/api/subjects');
        const subjects = await response.json();
        const prerequisites = subjects.map((subject: any) => ({
            value: subject.id.toString(),
            label: subject.name
        }));
        return prerequisites;
    }
}
