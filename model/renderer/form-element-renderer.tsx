import Form from 'react-bootstrap/Form';

export class FormElementRenderer {
    private static instance: FormElementRenderer;

    private constructor() {}

    public static getInstance(): FormElementRenderer {
        if (!FormElementRenderer.instance) {
            FormElementRenderer.instance = new FormElementRenderer();
        }
        return FormElementRenderer.instance;
    }

    public renderFormElement({
        name,
        label,
        type,
        selections,
        index,
        record
    }: {
        name: string,
        label: string,
        type: string,
        selections?: {value: string, label: string}[],
        index: number,
        record: Record<string, any> | null
    }): React.ReactNode {
        switch (type) {
            case 'string':
                return this.renderString(name, label, index, record);
            case 'number':
                return this.renderNumber(name, label, index, record);
            case 'select':
            case 'multiple-select':
                return this.renderSelect(name, label, selections as {value: string, label: string}[], index, record);
            case 'boolean':
                return this.renderBoolean(name, label, index, record);
            case 'image':
                return this.renderImage(name, label, index, record);
            default:
                return this.renderString(name, label, index, record);
        }
    }

    private renderString(name: string, label: string, index: number, record: Record<string, any> | null): React.ReactNode {
        return (
            <Form.Group key={index} className="mb-3" controlId={name}>
                <Form.Label>{label}</Form.Label>
                <Form.Control
                    name={name}
                    type="text"
                    placeholder={`Nhập ${label}`}
                    defaultValue={record?.[name] || ''}
                />
            </Form.Group>
        );
    }

    private renderNumber(name: string, label: string, index: number, record: Record<string, any> | null): React.ReactNode {
        return (
            <Form.Group key={index} className="mb-3" controlId={name}>
                <Form.Label>{label}</Form.Label>
                <Form.Control
                    name={name}
                    type="number"
                    placeholder={`Nhập ${label}`}
                    defaultValue={record?.[name] || 1}
                />
            </Form.Group>
        );
    }

    private renderImage(name: string, label: string, index: number, record: Record<string, any> | null): React.ReactNode {
        return (
            <Form.Group key={index} className="mb-3" controlId={name}>
                <Form.Label>{label}</Form.Label>
                <Form.Control name={name} type="file" accept="image/*" />
            </Form.Group>
        );
    }

    private renderSelect(name: string, label: string, selections: {value: string, label: string}[], index: number, record: Record<string, any> | null): React.ReactNode {
        return (
            <Form.Group key={index} className="mb-3" controlId={name}>
                <Form.Label>{label}</Form.Label>
                <Form.Select name={name} defaultValue={record?.[name] || ''}>
                    {selections?.map((option, i) => (
                        <option key={i} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </Form.Select>
            </Form.Group>
        );
    }

    private renderBoolean(name: string, label: string, index: number, record: Record<string, any> | null): React.ReactNode {
        return (
            <Form.Group key={index} className="mb-3" controlId={name}>
                <div className="d-flex gap-1">
                    <Form.Label>{label}</Form.Label>
                    <Form.Check
                        name={name}
                        type="checkbox"
                        defaultChecked={record?.[name] || false}
                    />
                </div>
            </Form.Group>
        );
    }
}
