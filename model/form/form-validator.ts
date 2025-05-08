export class FormValidator {
    private static instance: FormValidator;
    private constructor() {}

    public static getInstance(): FormValidator {
        if (!FormValidator.instance) {
            FormValidator.instance = new FormValidator();
        }
        return FormValidator.instance;
    }

    public validateField({ type, value }: { type: string; value: string }): boolean {
        switch (type) {
            case 'string':
                return this.validateStringField(value);
            case 'number':
                return this.validateNumberField(value);
            default:
                return true;
        }
    }

    private validateStringField(value: string): boolean {
        return value.length > 0;
    }

    private validateNumberField(value: string): boolean {
        return value !== '' && Number(value) >= 0;
    }
}
