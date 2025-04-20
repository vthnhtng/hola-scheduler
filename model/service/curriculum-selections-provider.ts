export class CurriculumSelectionsProvider {
    private static instance: CurriculumSelectionsProvider;
    private constructor() {}

    public static getInstance(): CurriculumSelectionsProvider {
        if (!CurriculumSelectionsProvider.instance) {
            CurriculumSelectionsProvider.instance = new CurriculumSelectionsProvider();
        }
        return CurriculumSelectionsProvider.instance;
    }

    public getProgramMappings(): { value: string; label: string }[] {
        const programs = [
            { value: 'CD', label: 'Cao đẳng' },
            { value: 'DH', label: 'Đại học' },
        ];

        return programs;
    }
}
