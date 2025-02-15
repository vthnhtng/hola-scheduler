import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { ObjectAttribute } from '../types/ObjectAttribute';

interface GridProps {
    objectName: string;
    attributes: ObjectAttribute[];
    gridData: Record<string, any>[];
}

function Grid({ objectName, attributes, gridData }: GridProps) {
    const renderAttribute = (attribute: ObjectAttribute, obj: Record<string, any>) => {
        const value = obj[attribute.name];
    
        switch (attribute.type) {
            case 'string':
            case 'number':
                return <td key={attribute.name}>{value}</td>;
    
            case 'boolean':
                return (
                    <td key={attribute.name}>
                        <input type="checkbox" checked={Boolean(value)} readOnly />
                    </td>
                );
    
            case 'image':
                return (
                    <td key={attribute.name}>
                        {value ? (
                            <img
                                src={value}
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
                return <td key={attribute.name}></td>;
        }
    };

    return (
        <div
            className="d-flex flex-column"
            style={{
                width: 'calc(100% - 200px)'
            }}
        >
            <div className="d-flex justify-content-between align-items-center mb-3 mt-3">
                <h2 className="fw-bold text-uppercase">DANH SÁCH {objectName}</h2>
                <button className="btn btn-success text-uppercase" style={{marginRight: '10px'}}>THÊM {objectName}</button>
            </div>
            <table className="table table-hover">
                <thead className="table-light">
                    <tr>
                        {attributes.map((attribute, index) => (
                            <th key={index}>{attribute.label}</th>
                        ))}
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {gridData.length > 0 ? (
                        gridData.map((obj, index) => (
                            <tr key={index} className="align-middle">
                                {attributes.map((attribute) => (
                                    renderAttribute(attribute, obj)
                                ))}
                                <td>
                                    <button className="btn btn-outline-success me-2"><FaEdit /></button>
                                    <button className="btn btn-outline-danger"><FaTrashAlt /></button>
                                </td>
                            </tr>
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
