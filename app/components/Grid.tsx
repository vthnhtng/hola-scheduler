'use client';
import { useState } from 'react';
import { FaEdit, FaEye, FaEyeSlash, FaTrashAlt } from 'react-icons/fa';
import { ObjectAttribute } from '../types/object-attribute';
import FormModal from './FormModal';
import DeleteModal from './DeleteModal';
import { GridElementRenderer } from '@/model/renderer/grid-element-renderer';

interface GridProps {
    objectName: string;
    attributes: ObjectAttribute[];
    gridData: (Record<string, any> | null)[];
    formAction: string;
    showPassword?: boolean;
    togglePasswordVisibility?: () => void;
}

function Grid({ objectName, attributes, gridData, formAction, showPassword, togglePasswordVisibility }: GridProps) {
    const [selectedRow, setSelectedRow] = useState<number | null>(null);
    const gridElementRenderer = GridElementRenderer.getInstance();

    const handleClickAction = (index: number) => {
        setSelectedRow((prev) => (prev === index ? null : index));
    };

    const renderAttribute = (attribute: ObjectAttribute, record: Record<string, any>) => {
        const { type, name, label } = attribute;
        const value = record[name];

        switch (type) {
            case 'string':
            case 'number':
            case 'select':
                return <td key={name}>{value}</td>;

            case 'boolean':
                return (
                    <td key={name}>
                        <input type="checkbox" checked={Boolean(value)} readOnly />
                    </td>
                );

            case 'image':
                return (
                    <td key={name}>
                        {value ? (
                            <img
                                src={value}
                                alt={label}
                                className="me-2 rounded-circle"
                                style={{ width: '40px', height: '40px' }}
                            />
                        ) : 'No Image'}
                    </td>
                );

            case 'password':
                return (
                    <td key={name}>
                        {showPassword ? value : '•'.repeat(value.length)}
                    </td>
                );

            default:
                return <td key={name}></td>;
        }
    };

    return (
        <div
            className="d-flex flex-column"
            style={{
                width: 'calc(100% - 20px)',
                marginLeft: "20px"
            }}
        >
            <div className="d-flex justify-content-between align-items-center mb-3 mt-3">
                <h2 className="fw-bold text-uppercase">DANH SÁCH {objectName}</h2>
                <div className="d-flex gap-2">
                    {objectName.toLowerCase() === "người dùng" && (
                        <button
                            className="btn btn-success text-uppercase d-flex align-items-center justify-content-center"
                            onClick={togglePasswordVisibility}
                            style={{marginTop: '0px', marginBottom: '10px'}}
                        >
                            {showPassword ? <><FaEyeSlash className="me-2" />ẨN MẬT KHẨU</> : <><FaEye className="me-2" />HIỂN THỊ MẬT KHẨU</>}
                        </button>
                    )}
                    <FormModal
                        title={'THÊM ' + objectName}
                        button={
                            <button className="btn btn-success text-uppercase d-flex align-items-center justify-content-center">
                                THÊM {objectName}
                            </button>
                        }
                        attributes={attributes}
                        record={null}
                        formAction={formAction}
                        formMethod='POST'
                        onClose={() => { }}
                        showPassword={showPassword}
                    />
                </div>
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
                        gridData.map((record, index) =>
                            record && (
                                <tr
                                    key={index}
                                    className={`align-middle ${selectedRow === index ? 'table-primary' : ''}`}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <td>{index + 1}</td>
                                    {attributes.map((attribute) => (
                                        gridElementRenderer.renderGridElement({value: record[attribute.name], type: attribute.type, selections: attribute.selections})
                                    ))}
                                    <td className='d-flex' style={{ width: 'auto', height: '70px'}}>
                                        <div>
                                            <FormModal
                                                title={'CHỈNH SỬA ' + objectName}
                                                button={<button className="btn btn-outline-success me-2" onClick={() => handleClickAction(index)}><FaEdit /></button>}
                                                attributes={attributes}
                                                record={record}
                                                formAction={formAction}
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
                                                formAction={formAction}
                                            />
                                        </div>
                                    </td>
                                    {attributes.map((attribute) =>
                                        renderAttribute(attribute, record)
                                    )}
                                    <td className='d-flex' style={{ width: 'auto', height: '70px' }}>
                                        <FormModal
                                            title={'CHỈNH SỬA ' + objectName}
                                            button={
                                                <button className="btn btn-outline-success me-2" onClick={() => handleClickAction(index)}>
                                                    <FaEdit />
                                                </button>
                                            }
                                            attributes={attributes}
                                            record={record}
                                            formAction={formAction}
                                            formMethod='PUT'
                                            onClose={() => setSelectedRow(null)}
                                            showPassword={showPassword}
                                        />
                                        <DeleteModal
                                            title={objectName}
                                            button={
                                                <button className="btn btn-outline-danger" onClick={() => handleClickAction(index)}>
                                                    <FaTrashAlt />
                                                </button>
                                            }
                                            record={record}
                                            onClose={() => setSelectedRow(null)}
                                            formAction={formAction}
                                        />
                                    </td>
                                </tr>
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
