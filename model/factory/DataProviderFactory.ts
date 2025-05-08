import { CurriculumDataProvider } from "../data-provider/CurriculumDataProvider";
import { SubjectDataProvider } from "../data-provider/SubjectDataProvider";

export class DataProviderFactory {
    private static instance: DataProviderFactory;

    private constructor() {}
    
    public static getInstance(): DataProviderFactory {
        if (!DataProviderFactory.instance) {
            DataProviderFactory.instance = new DataProviderFactory();
        }
        return DataProviderFactory.instance;
    }

    public getSubjectDataProvider(): SubjectDataProvider {
        return SubjectDataProvider.getInstance();
    }

    public getCurriculumDataProvider(): CurriculumDataProvider {
        return CurriculumDataProvider.getInstance();
    }
}
