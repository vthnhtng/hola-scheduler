'use client';
import { useState } from 'react';
import { ObjectAttribute } from '../types/object-attribute';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

interface DeleteModal {
    title: string;
    button: React.ReactNode;
    record: Record<string, any> | null;
    onClose: () => void;
    formAction: string;
    show?: boolean;
}

function DeleteModal({ title, button, record, onClose, formAction, show: showProp }: DeleteModal ) {
    const [internalShow, setInternalShow] = useState(false);
    const show = typeof showProp === 'boolean' ? showProp : internalShow;

    const handleClose = () => {
        if (onClose) onClose();
        else setInternalShow(false);
    }
    const handleShow = () => setInternalShow(true);
    const handleDelete = async () => {
        if (!record) return;
    
        try {
            const firstProperty = Object.keys(record)[0];
            const response = await fetch(formAction, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: record[firstProperty] }),
            });

            const data = await response.json();

            if (response.ok) {
                alert('Xóa thành công');
                window.location.reload();
            } else {
                alert('Lỗi khi xóa: ' +  data.error);
            }
        } catch (error) {
            alert('Lỗi kết nối tới server: ' + error);
        } finally {
            handleClose();
        }
    };    

    return (
        <>
            {typeof showProp !== 'boolean' && (
                <div onClick={() => setInternalShow(true)} style={{ cursor: 'pointer' }}>
                    {button}
                </div>
            )}

            <Modal show={show} onHide={handleClose} centered>
                <Modal.Header closeButton style={{ backgroundColor: '#b71c1c', color: '#fff' }}>
                    <Modal.Title>XÓA {title}</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto', color: '#b71c1c' }}>
                    <span><strong>Cảnh báo:</strong> Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa mục này không?</span>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose} style={{ backgroundColor: '#e57373', borderColor: '#e57373', color: '#fff' }}>
                        Hủy
                    </Button>
                    <Button variant="danger" onClick={handleDelete} style={{ backgroundColor: '#d32f2f', borderColor: '#d32f2f' }}>
                        Xóa
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default DeleteModal;
