import { ObjectAttribute } from "@/app/types/object-attribute";
import { DataProvider } from "@/interface/data-provider-interface";
import Form from 'react-bootstrap/Form';

export class FieldRenderer {
    private static instance: FieldRenderer;
    private constructor() {}

    public static getInstance(): FieldRenderer {
        if (!FieldRenderer.instance) {
            FieldRenderer.instance = new FieldRenderer();
        }
        return FieldRenderer.instance;
    }

    public renderFormField(
        attribute: ObjectAttribute,
        record?: Record<string, any>
    ) {
        const { name, label, type } = attribute;

        switch (type) {
            case 'string':
                return this.renderStringField(attribute, record);
        }
    };

    public renderStringField(
        attribute: ObjectAttribute,
        record?: Record<string, any>
    ) {
        const { name, label } = attribute;
        return (
            <Form.Group className="mb-3" controlId={name}>
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

    public renderNumberField(attribute: ObjectAttribute, record?: Record<string, any>) {
        const { name, label } = attribute;
        return (
            <Form.Group className="mb-3" controlId={name}>
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

    public renderBooleanField(attribute: ObjectAttribute, record?: Record<string, any>) {
        const { name, label } = attribute;
        return (
            <Form.Group className="mb-3" controlId={name}>
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

    public renderSelectField(attribute: ObjectAttribute, record?: Record<string, any>) {
        const { name, label, selections } = attribute;
        return (
            <Form.Group className="mb-3" controlId={name}>
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
}

