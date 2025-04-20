export interface ObjectAttribute {
    name: string;
    label: string;
    type: 'string' | 'boolean' | 'image' | 'number' | 'date' | 'select';
    selections?: { value: string; label: string }[];
}
