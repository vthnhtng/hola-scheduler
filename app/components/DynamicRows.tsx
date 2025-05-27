'use client';

import React, { useEffect, useState } from "react";
import Modal from 'react-bootstrap/Modal';
import { Form } from "react-bootstrap";

interface DynamicRowsProps {
    title: string;
    attribute:  {
        name: string;
        label: string;
    };
    button: React.ReactNode;
    getSelectionsUrl: string;
    getRowsUrl: string;
    saveUrl: string;
    targetId: string;
}

function DynamicRows({ title, attribute, button, getRowsUrl, saveUrl, getSelectionsUrl, targetId }: DynamicRowsProps) {
    const [selections, setSelections] = useState<{ value: string; label: string }[]>([]);
    const [rows, setRows] = useState<{ value: string; label: string }[]>([]);
    const [show, setShow] = useState(false);

    const handleRemoveSpecificRow = (idx: number) => {
        setRows(rows.filter((_, i) => i !== idx));
    }

    const handleAddRow = () => {
        setRows([...rows, { value: '', label: '---------' }]);
    }

    const handleSave = async () => {
        const tableData = getTableData();
        const response = await fetch(saveUrl, {
            method: 'POST',
            body: JSON.stringify({
                "targetId": targetId,
                "data": tableData
            })
        });

        if (!response.ok) {
            alert('Lỗi khi lưu dữ liệu');
        } else {
            alert('Lưu dữ liệu thành công');
        }

        handleClose();
    }

    const handleClose = () => {
        setRows([]);
        setShow(false);
    }

    const openModal = async () => {
        const response = await fetch(getSelectionsUrl);
        const data = await response.json();
        
        let selections: { value: string; label: string }[] = [
            {
                value: '',
                label: '---------'
            }
        ];

        data.data.map((item: { id: string; name: string }) => {
            selections.push({
                value: item.id,
                label: item.name
            });
        });

        setSelections(selections);

        const rowsResponse = await fetch(getRowsUrl);
        const rowsData = await rowsResponse.json();
        console.log(rowsData);
        const formattedRows = rowsData.data.map((row: { value: string; label: string }) => ({
            value: row.value,
            label: row.label
        }));

        setRows(formattedRows);

        setShow(true);
    }

    const renderRow = (attribute: { name: string; label: string }, item: { value: string; label: string }) => {
        return (
            <Form.Group className="mb-3" controlId={attribute.name}>
                <Form.Select name={attribute.name} defaultValue={item.value ? item.value : ''}>
                    {selections.map((item) => (
                        <option value={item.value}>{item.label}</option>
                    ))}
                </Form.Select>
            </Form.Group>
        );
    }

    const getTableData = () => {
        const table = document.getElementById('dynamic-table-' + targetId);
        if (!table) return [];

        const rows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
        const data = [];

        for (let i = 0; i < rows.length; i++) {
            const select = rows[i].querySelector(`select[name="${attribute.name}"]`) as HTMLSelectElement;
            if (select) {
                data.push({
                    [attribute.name]: select.value
                });
            }
        }

        return data;
    }

    return (
        <>
            <div className="d-flex align-items-center" style={{ marginBottom: '10px' }}>       
                <div onClick={openModal}>
                    {button}
                </div>
            </div>
            <Modal show={show} onHide={handleClose} centered>
                <div className="row clearfix"
                    style={{
                        padding: '20px',
                    }}
                >
                    <h1>{title}</h1>
                    <div className="col-md-12 column">
                        <div
                            style={{
                                maxHeight: '80vh',
                                overflowY: 'auto'
                            }}
                        >
                            <table className="table table-bordered table-hover" id={'dynamic-table-' + targetId}>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>{attribute.label}</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>{idx + 1}</td>
                                            <td>
                                                {renderRow(attribute, item)}
                                            </td>
                                            <td>
                                                <button
                                                    className="btn btn-outline-danger btn-sm"
                                                    onClick={() => handleRemoveSpecificRow(idx)}
                                                >
                                                    Xóa
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table> 
                        </div>
                        <div className="d-flex justify-content-between">
                            <button onClick={handleAddRow} className="btn btn-primary">
                                Thêm
                            </button>
                            <button
                                onClick={() => handleSave()}
                                className="btn btn-success"
                            >
                                Lưu
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        </>
    );
}

export default DynamicRows;
