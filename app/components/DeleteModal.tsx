'use client';
import { useState } from 'react';
import { ObjectAttribute } from '../types/ObjectAttribute';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

interface DeleteModal {
    title: string;
    button: React.ReactNode;
    record: Record<string, any> | null;
    onClose: () => void
}

function DeleteModal({ title, button, record, onClose}: DeleteModal ) {
    const [show, setShow] = useState(false);

    const handleClose = () => {
        setShow(false);
        onClose();
    }
    const handleShow = () => setShow(true);
    const handleDelete = () => {
        record = null;
        handleClose();
    }

    return (
        <>
            <div onClick={handleShow} style={{ cursor: 'pointer' }}>
                {button}
            </div>

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
