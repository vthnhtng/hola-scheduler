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
            key={record.id || index}
            className='align-middle' 
            style={{ cursor: 'pointer'}}
        >
            <td>{Object.keys(record).length === 0 ? '' : index + 1}</td>
            {attributes.map((attribute) => (
                Object.keys(record).length === 0
                    ? <td key={attribute.name}></td>
                    : attribute.type === 'select'
                        ? <td key={attribute.name}>{getLabelByValue(record[attribute.name], attribute.selections)}</td>
                        : attribute.type === 'password'
                            ? <td key={attribute.name} style={{ width: 100, textAlign: 'center' }}>
                                <input
                                    type="password"
                                    value={record[attribute.name] || ''}
                                    readOnly
                                    style={{
                                        fontSize: 20,
                                        padding: '2px 0',
                                        border: 'none',
                                        background: 'transparent',
                                        width: 70,
                                        letterSpacing: 2,
                                        outline: 'none',
                                        fontFamily: 'inherit',
                                        pointerEvents: 'none',
                                        textAlign: 'center',
                                        display: 'inline-block',
                                    }}
                                />
                              </td>
                            : <td key={attribute.name}>{record[attribute.name]}</td>
            ))}
            <td className='w-auto' style={{ height: '70px'}}>
                {Object.keys(record).length === 0 ? null : (
                    <div className="action-group">
                        {actions.map((action) => action)}
                    </div>
                )}
            </td>
        </tr>
    )
}
