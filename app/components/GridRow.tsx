'use client'

import { ObjectAttribute } from '../types/object-attribute';

interface GridRowProps {
    attributes: ObjectAttribute[];
    record: Record<string, any>;
    index: number;
    actions: React.ReactElement[];
}

export default function GridRow({
    attributes,
    record,
    index,
    actions
}: GridRowProps) {
    const getLabelByValue = (value: string, selections: { value: string; label: string }[] | undefined) => {
        return selections?.find(selection => selection.value == value)?.label || "Không";
    }

    return (
        <tr
            key={record.id}
            className='align-middle' 
            style={{ cursor: 'pointer'}}
        >
            <td>{index + 1}</td>
            {attributes.map((attribute) => (
                attribute.type === 'select' ?
                <td key={attribute.name}>{getLabelByValue(record[attribute.name], attribute.selections)}</td>
                :
                <td key={attribute.name}>{record[attribute.name]}</td>
            ))}
            <td className='d-flex w-auto' style={{ height: '70px'}}>
                {actions.map((action) => (
                    action
                ))}
            </td>
        </tr>
    )
}
