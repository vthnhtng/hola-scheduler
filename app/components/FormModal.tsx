'use client';
import { useState } from 'react';
import { ObjectAttribute } from '../types/ObjectAttribute';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';

interface FormModalProps {
    title: string;
    button: React.ReactNode;
    attributes: ObjectAttribute[];
    record: Record<string, any> | null;
    onClose: () => void
}

function FormModal({ title, button, attributes, record, onClose }: FormModalProps ) {
    const [show, setShow] = useState(false);

    const handleClose = () => {
        setShow(false);
        onClose();
    }
    const handleShow = () => setShow(true);
    const handleSave = () => {
        alert("To be developed");
        handleClose();
    }

    const renderFormField = (attribute: ObjectAttribute, index: number, record: Record<string, any> | null) => {
        const { name, label, type } = attribute;

        switch (type) {
            case 'string':
                return (
                    <Form.Group key={index} className="mb-3" controlId={name}>
                        <Form.Label>{label}</Form.Label>
                        <Form.Control type="text" placeholder={`Nhập ${label}`} defaultValue={record?.[name] || ''} />
                    </Form.Group>
                );

            case 'number':
                return (
                    <Form.Group key={index} className="mb-3" controlId={name}>
                        <Form.Label>{label}</Form.Label>
                        <Form.Control type="number" placeholder={`Nhập ${label}`} defaultValue={record?.[name] || ''} />
                    </Form.Group>
                );

            case 'boolean':
                return (
                    <Form.Group key={index} className="mb-3" controlId={name}>
                        <div className='d-flex gap-1'>
                            <Form.Label>{label}</Form.Label>
                            <Form.Check type="checkbox" defaultChecked={record?.[name] || false} />
                        </div>
                    </Form.Group>
                );

            case 'image':
                return (
                    <Form.Group key={index} className="mb-3" controlId={name}>
                        <Form.Label>{label}</Form.Label>
                        <Form.Control type="file" accept="image/*" />
                    </Form.Group>
                );

            default:
                return <></>;
        }
    };

    return (
        <>
            <div onClick={handleShow}>
                {button}
            </div>

            <Modal show={show} onHide={handleClose} centered>
                <Modal.Header closeButton style={{backgroundColor: '#28a745'}}>
                    <Modal.Title>{title}</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    <Form>
                        {attributes.map((attribute, index) => (
                            renderFormField(attribute, index, record)
                        ))}
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button 
                        variant="success" 
                        style={{ backgroundColor: '#28a745', borderColor: '#218838' }} 
                        onClick={handleClose}
                    >
                        Đóng
                    </Button>
                    <Button 
                        variant="success" 
                        style={{ backgroundColor: '#218838', borderColor: '#1e7e34' }} 
                        onClick={handleSave}
                    >
                        Lưu
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default FormModal;
