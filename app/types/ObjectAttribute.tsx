export interface ObjectAttribute {
    name: string;
    label: string;
    type: 'string' | 'boolean' | 'image' | 'number' | 'date' | 'select';
    select_data?: string[];
}
