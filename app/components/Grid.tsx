'use client';
import { useState } from 'react';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { ObjectAttribute } from '../types/ObjectAttribute';
import FormModal from './FormModal';
import DeleteModal from './DeleteModal';

interface GridProps {
    objectName: string;
    attributes: ObjectAttribute[];
    gridData: (Record<string, any> | null)[];
    formAction: string;
}

function Grid({ objectName, attributes, gridData, formAction }: GridProps) {
    const [selectedRow, setSelectedRow] = useState<number | null>(null);

    const handleClickAction = (index: number) => {
        setSelectedRow((prev) => (prev === index ? null : index));
    };

    const renderAttribute = (attribute: ObjectAttribute, record: Record<string, any>) => {
        const attributeType = attribute.type;   
        const attributeName = attribute.name;
        const attributeValue = record[attribute.name];

        switch (attributeType) {
            case 'string':
            case 'number':
                return <td key={attributeName}>{attributeValue}</td>;
    
            case 'boolean':
                return (
                    <td key={attributeName}>
                        <input type="checkbox" checked={Boolean(attributeValue)} readOnly />
                    </td>
                );
    
            case 'image':
                return (
                    <td key={attributeName}>
                        {attributeValue ? (
                            <img
                                src={attributeValue}
                                alt={attribute.label}
                                className="me-2 rounded-circle"
                                style={{ width: '40px', height: '40px' }}
                            />
                        ) : (
                            'No Image'
                        )}
                    </td>
                );

            default:
                return <td key={attributeName}></td>;
        }
    };

    return (
        <div
            className="d-flex flex-column"
            style={{
                width: 'calc(100% - 200px)',
                marginLeft: "20px" //khoiph - Add left margin to grid
            }}
        >
            <div className="d-flex justify-content-between align-items-center mb-3 mt-3">
                <h2 className="fw-bold text-uppercase">DANH SÁCH {objectName}</h2>
                <FormModal
                    title={'THÊM ' + objectName}
                    button={
                        <button className="btn btn-success text-uppercase" style={{marginRight: '10px'}}>THÊM {objectName}</button>
                    }
                    attributes={attributes}
                    record={null}
                    formAction={formAction}
                    formMethod='POST'
                    onClose={() => {}}
                />
            </div>
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
                    {gridData.length > 0 ? (
                        gridData.map((record, index) => (
                            record && (
                                <tr 
                                    key={index} 
                                    className={`align-middle ${selectedRow === index ? 'table-primary' : ''}`} 
                                    style={{ cursor: 'pointer' }}
                                >
                                    <td>{index + 1}</td>
                                    {attributes.map((attribute) => (
                                        renderAttribute(attribute, record)
                                    ))}
                                    <td className='d-flex' style={{ width: 'auto', height: '70px'}}> {/*khoiph - Add height CSS */}
                                        <div>
                                            <FormModal
                                                title={'CHỈNH SỬA ' + objectName}
                                                button={<button className="btn btn-outline-success me-2" onClick={() => handleClickAction(index)}><FaEdit /></button>}
                                                attributes={attributes}
                                                record={record}
                                                formAction={formAction + '/' + record.id}
                                                formMethod='PUT'
                                                onClose={() => setSelectedRow(null)}
                                            />
                                        </div>
                                        <div>
                                            <DeleteModal
                                                title={objectName}
                                                button={<button className="btn btn-outline-danger" onClick={() => handleClickAction(index)}><FaTrashAlt /></button>}
                                                record={record}
                                                onClose={() => setSelectedRow(null)}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            )
                        ))
                    ) : (
                        <tr>
                            <td colSpan={attributes.length + 1} className="text-left">Chưa có dữ liệu</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default Grid;
