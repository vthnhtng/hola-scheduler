'use client';
import { useState, useRef, useEffect } from 'react';
import { ObjectAttribute } from '../types/object-attribute';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import { FormValidator } from '@/model/form/form-validator';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import React from 'react';

interface FormModalProps {
    title: string;
    button: React.ReactNode;
    attributes: ObjectAttribute[];
    record: Record<string, any> | null;
    formAction: string;
    formMethod: 'POST' | 'PUT';
    show?: boolean;
    onClose?: () => void;
    onLoadingChange?: (loading: boolean) => void;
}

function FormModal({
    title,
    button,
    attributes,
    record,
    formAction,
    formMethod,
    show: showProp,
    onClose,
    onLoadingChange,
}: FormModalProps) {
    const [internalShow, setInternalShow] = useState(false);
    const show = typeof showProp === 'boolean' ? showProp : internalShow;
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (show) {
            setMessage(null);
        }
    }, [show]);

    const handleClose = () => {
        if (onClose) onClose();
        else setInternalShow(false);
    };

    const handleShow = () => {
        setInternalShow(true);
    };

    const handleSave = async () => {
        setSaving(true);
        if (onLoadingChange) onLoadingChange(true);
        setMessage(null);

        try {
            if (!formRef.current) {
                throw new Error('Form element not found.');
            }

            const formData = new FormData(formRef.current);
            const data: Record<string, any> = {};

            if (record) {
                const firstProperty = Object.keys(record)[0];
                data[firstProperty] = record[firstProperty];
            }

            attributes.forEach((attribute) => {
                const value = formData.get(attribute.name);
                if (FormValidator.getInstance().validateField({ type: attribute.type, value: value as string })) {
                    data[attribute.name] = value;
                } else {
                    throw new Error(`Dữ liệu ${attribute.label} không hợp lệ`);
                }
            });

            const response = await fetch(formAction, {
                method: formMethod.toUpperCase(),
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Submission failed.');
            }

            setMessage('Lưu thành công!');
            window.location.reload();
            setTimeout(() => {
                handleClose();
            }, 2000);
        } catch (err: Error | unknown) {
            setMessage('Không thể lưu: ' + err);
        } finally {
            setSaving(false);
            if (onLoadingChange) onLoadingChange(false);
        }
    };

    const renderFormField = (
        attribute: ObjectAttribute,
        index: number,
        record: Record<string, any> | null
    ) => {
        const { name, label, type, selections } = attribute;

        switch (type) {
            case 'string':
                return (
                    <Form.Group key={index} className="mb-3" controlId={name}>
                        <Form.Label>{label}</Form.Label>
                        <Form.Control
                            name={name}
                            type="text"
                            placeholder={`Nhập ${label}`}
                            defaultValue={record?.[name] || ''}
                        />
                    </Form.Group>
                );

            case 'number':
                return (
                    <Form.Group key={index} className="mb-3" controlId={name}>
                        <Form.Label>{label}</Form.Label>
                        <Form.Control
                            name={name}
                            type="number"
                            placeholder={`Nhập ${label}`}
                            defaultValue={record?.[name] || 1}
                        />
                    </Form.Group>
                );

            case 'boolean':
                return (
                    <Form.Group key={index} className="mb-3" controlId={name}>
                        <div className="d-flex gap-1">
                            <Form.Label>{label}</Form.Label>
                            <Form.Check
                                name={name}
                                type="checkbox"
                                defaultChecked={record?.[name] || false}
                            />
                        </div>
                    </Form.Group>
                );

            case 'image':
                return (
                    <Form.Group key={index} className="mb-3" controlId={name}>
                        <Form.Label>{label}</Form.Label>
                        <Form.Control name={name} type="file" accept="image/*" />
                    </Form.Group>
                );
            
            case 'select':
                return (
                    <Form.Group key={index} className="mb-3" controlId={name}>
                        <Form.Label>{label}</Form.Label>
                        <Form.Select name={name} defaultValue={record?.[name] || ''}>
                            {selections?.map((option, i) => (
                                <option key={i} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                );

            case 'password':
                return (
                    <Form.Group key={index} className="mb-3" controlId={name}>
                        <Form.Label>{label}</Form.Label>
                        <div style={{ position: 'relative' }}>
                            <Form.Control
                                name={name}
                                type={showPassword ? 'text' : 'password'}
                                placeholder={`Nhập ${label}`}
                                defaultValue={record?.[name] || ''}
                                autoComplete="new-password"
                            />
                            <span
                                onClick={() => setShowPassword((prev) => !prev)}
                                style={{
                                    position: 'absolute',
                                    right: 10,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    cursor: 'pointer',
                                    zIndex: 2
                                }}
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </span>
                        </div>
                    </Form.Group>
                );

            case 'date':
                return (
                    <Form.Group key={index} className="mb-3" controlId={name}>
                        <Form.Label>{label}</Form.Label>
                        <Form.Control
                            name={name}
                            type="date"
                            placeholder={`Nhập ${label}`}
                            defaultValue={record?.[name] ? record[name].slice(0, 10) : ''}
                            required={formMethod === 'POST'}
                        />
                    </Form.Group>
                );

            default:
                return null;
        }
    };

    return (
        <>
            {typeof showProp !== 'boolean' && (
                <div
                    onClick={e => {
                        if (
                            React.isValidElement(button) &&
                            (button.props.disabled || button.props['aria-disabled'])
                        ) {
                            e.preventDefault();
                            return;
                        }
                        setInternalShow(true);
                    }}
                >
                    {button}
                </div>
            )}
            <Modal show={show} onHide={handleClose} centered>
                <Modal.Header closeButton style={{ backgroundColor: '#28a745' }}>
                    <Modal.Title>{title}</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    <Form ref={formRef}>
                        {attributes.map((attribute, index) =>
                            renderFormField(attribute, index, record)
                        )}
                    </Form>
                    {message && (
                        <p style={{ color: message.includes('Lưu thành công') ? 'green' : 'red' }}>
                            {message}
                        </p>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="success"
                        style={{ backgroundColor: '#28a745', borderColor: '#218838' }}
                        onClick={handleClose}
                        disabled={saving}
                    >
                        Đóng
                    </Button>
                    <Button
                        variant="success"
                        style={{ backgroundColor: '#218838', borderColor: '#1e7e34' }}
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? 'Đang lưu...' : 'Lưu'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default FormModal;