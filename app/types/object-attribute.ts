export interface ObjectAttribute {
    name: string;
    label: string;
    type: 'string' | 'boolean' | 'image' | 'number' | 'date' | 'select' | 'password';
    selections?: { value: string; label: string }[]
}
