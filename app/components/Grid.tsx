'use client';
import { useState } from 'react';
import { ObjectAttribute } from '../types/object-attribute';
import GridRow from './GridRow';

interface GridProps {
    attributes: ObjectAttribute[];
    gridData: (Record<string, any> | null)[];
    recordActions: React.ReactElement[];
}

function Grid({
    attributes,
    gridData,
    recordActions
}: GridProps) {
    const [records, setRecords] = useState(gridData);
    const [page, setPage] = useState(1);

    return (
        <div
            className="d-flex flex-column"
            style={{
                width: 'calc(100% - 20px)',
                marginLeft: "20px"
            }}
        >
            <table className="table table-hover">
                <thead className="table-light">
                    <tr>
                        <th>STT</th>
                        {attributes.map((attribute, index) => (
                            <th key={index}>{attribute.label}</th>
                        ))}
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {records.length > 0 ? (
                        records.map((record, index) =>
                            record && (
                                <GridRow
                                    key={index + (page - 1) * 10}
                                    attributes={attributes}
                                    record={record}
                                    index={index + (page - 1) * 10}
                                    actions={recordActions}
                                />
                            )
                        )
                    ) : (
                        <tr>
                            <td colSpan={attributes.length + 2} className="text-left">Chưa có dữ liệu</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default Grid;
