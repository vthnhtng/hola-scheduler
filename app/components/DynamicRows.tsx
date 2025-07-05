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
    onLoadingChange?: (loading: boolean) => void;
    onSaved?: () => void;
}

function DynamicRows({ title, attribute, button, getRowsUrl, saveUrl, getSelectionsUrl, targetId, onLoadingChange, onSaved }: DynamicRowsProps) {
    const [selections, setSelections] = useState<{ value: string; label: string }[]>([]);
    const [rows, setRows] = useState<{ value: string; label: string }[]>([]);
    const [show, setShow] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRemoveSpecificRow = (idx: number) => {
        setRows(rows.filter((_, i) => i !== idx));
    }

    const handleAddRow = () => {
        setRows([...rows, { value: '', label: '---------' }]);
    }

    const handleSave = async () => {
        if (onLoadingChange) onLoadingChange(true);
        setError(null);
        try {
            const tableData = rows
                .filter(row => row.value && !isNaN(Number(row.value)))
                .map(row => ({ [attribute.name]: String(Number(row.value)) }));
            console.log('TableData gửi lên:', tableData);
            const response = await fetch(saveUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    "targetId": targetId,
                    "data": tableData
                })
            });

            if (response.ok) {
                handleClose();
                if (onSaved) onSaved();
            } else {
                const res = await response.json();
                setError(res?.error || 'Lưu thất bại');
            }
        } catch (err) {
            setError('Lỗi khi lưu dữ liệu');
        } finally {
            if (onLoadingChange) onLoadingChange(false);
        }
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

        (Array.isArray(data.data) ? data.data : []).map((item: { id: string; name: string }) => {
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

    const handleSelectChange = (idx: number, value: string) => {
        setRows(prevRows => prevRows.map((row, i) => i === idx ? { ...row, value } : row));
    };

    const renderRow = (attribute: { name: string; label: string }, item: { value: string; label: string }) => {
        return (
            <Form.Group className="mb-3" controlId={attribute.name}>
                <Form.Select name={attribute.name} defaultValue={item.value ? item.value : ''}>
                    {selections.map((item) => (
                        <option key={item.value} value={item.value}>{item.label}</option>
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
            if (select && select.value && !isNaN(Number(select.value))) {
                data.push({
                    [attribute.name]: String(Number(select.value))
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
                <Modal.Header closeButton style={{ backgroundColor: '#28a745' }}>
                    <Modal.Title>{title}</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    {error && <div style={{color: 'red', marginBottom: 8}}>{error}</div>}
                    <div className="row clearfix" style={{ padding: '0' }}>
                        <div className="col-md-12 column">
                            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                                <div style={{ fontWeight: 600, display: 'flex', gap: 12, marginBottom: 8 }}>
                                    <div style={{ width: 32, textAlign: 'center' }}>#</div>
                                    <div style={{ flex: 1 }}>MÔN</div>
                                    <div style={{ width: 90, textAlign: 'center' }}>THAO TÁC</div>
                                </div>
                                {rows.map((item, idx) => (
                                    <div key={idx} className="d-flex align-items-center mb-2" style={{ gap: 12 }}>
                                        <div style={{ width: 32, textAlign: 'center' }}>{idx + 1}</div>
                                        <select
                                            name={attribute.name}
                                            value={item.value ? item.value : ''}
                                            onChange={e => handleSelectChange(idx, e.target.value)}
                                            style={{
                                                flex: 1,
                                                height: 44,
                                                fontSize: 16,
                                                padding: '2px 16px',
                                                borderRadius: 8,
                                                border: '1px solid #ced4da',
                                                background: '#fff',
                                                boxSizing: 'border-box',
                                                marginRight: 0
                                            }}
                                        >
                                            {selections.map((item) => (
                                                <option key={item.value} value={item.value}>{item.label}</option>
                                            ))}
                                        </select>
                                        <button
                                            className="btn btn-outline-danger btn-sm"
                                            style={{
                                                minWidth: 80,
                                                height: 44,
                                                fontSize: 16,
                                                padding: 0,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderRadius: 8
                                            }}
                                            onClick={() => handleRemoveSpecificRow(idx)}
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="d-flex justify-content-between">
                                <button onClick={handleAddRow} className="btn btn-primary">
                                    Thêm
                                </button>
                            </div>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <button className="btn btn-secondary" onClick={handleClose} style={{ backgroundColor: '#28a745', borderColor: '#28a745', color: '#fff' }}>
                        Đóng
                    </button>
                    <button onClick={handleSave} className="btn btn-success">
                        Lưu
                    </button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default DynamicRows;
