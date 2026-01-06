import React from 'react';
import Modal from './Modal';
import Button from './Button';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
}) => {
    const variantStyles = {
        danger: 'danger',
        warning: 'primary',
        info: 'primary',
    } as const;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <p className="mb-6" style={{ color: '#6B7280' }}>{message}</p>
            <div className="flex justify-end space-x-3">
                <Button variant="secondary" onClick={onClose}>
                    {cancelText}
                </Button>
                <Button variant={variantStyles[variant]} onClick={onConfirm}>
                    {confirmText}
                </Button>
            </div>
        </Modal>
    );
};

export default ConfirmationModal;
