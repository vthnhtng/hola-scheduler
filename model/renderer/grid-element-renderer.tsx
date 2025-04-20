import { ObjectAttribute } from "@/app/types/object-attribute";

export class GridElementRenderer {
    private static instance: GridElementRenderer;

    private constructor() {}

    public static getInstance(): GridElementRenderer {
        if (!GridElementRenderer.instance) {
            GridElementRenderer.instance = new GridElementRenderer();
        }
        return GridElementRenderer.instance;
    }

    public renderGridElement({value, type, selections}: {value: string|boolean, type: string, selections?: {value: string, label: string}[]}): React.ReactNode {
        switch (type) {
            case 'string':
            case 'number':
                return this.renderString(value as string);
            case 'select':
                return this.renderSelect(value as string, selections as {value: string, label: string}[]);
            case 'boolean':
                return this.renderBoolean(value as boolean);
            case 'image':
                return this.renderImage(value as string);
            default:
                return this.renderString(value as string);
        }
    }

    private renderString(value: string): React.ReactNode {
        return <td key={value}>{value}</td>;
    }

    private renderBoolean(value: boolean): React.ReactNode {
        return <td><input type="checkbox" checked={value} readOnly /></td>;
    }

    private renderImage(value: string): React.ReactNode {
        return (
            <td key={value}>
                {value ? (
                    <img
                        src={value}
                        alt={value}
                        className="me-2 rounded-circle"
                        style={{ width: '40px', height: '40px' }}
                />
            ) : (
                'No Image'
            )}
        </td>
        )
    }

    private renderSelect(value: string, selections: {value: string, label: string}[]): React.ReactNode {
        var mappedSelections: { [key: string]: string } = {};
        selections.forEach(selection => {
            mappedSelections[selection.value] = selection.label;
        });
        const selection = mappedSelections[value];
        return <td key={value}>{selection ? selection : value}</td>;
    }
}
