import { Curriculum } from "@prisma/client";

export class CurriculumDataProvider {
    private static instance: CurriculumDataProvider;

    private constructor() {}

    public static getInstance(): CurriculumDataProvider {
        if (!CurriculumDataProvider.instance) {
            CurriculumDataProvider.instance = new CurriculumDataProvider();
        }
        return CurriculumDataProvider.instance;
    }

    public getPrograms(): { value: string; label: string }[] {
        return [
            { value: "DH", label: "Đại học" },
            { value: "CD", label: "Cao đẳng" }
        ]
    }
}
