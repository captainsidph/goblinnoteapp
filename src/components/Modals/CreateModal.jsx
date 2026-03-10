import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import FluentEmoji from '../FluentEmoji.jsx';
import './CreateModal.css';

const CreateModal = ({ type, isOpen, onClose, onConfirm, parents = [] }) => {
    const [name, setName] = useState('');
    const [parentId, setParentId] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onConfirm(name, parentId ? Number(parentId) : null);
        setName('');
        setParentId('');
        onClose();
    };

    return createPortal(
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Create New {type === 'folder' ? 'Folder' : 'Tag'}</h2>
                    <button className="close-btn" onClick={onClose}><FluentEmoji name="Clear" size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={`Enter ${type} name`}
                            autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <label>Parent (Optional)</label>
                        <select
                            value={parentId}
                            onChange={(e) => setParentId(e.target.value)}
                        >
                            <option value="">None (Root)</option>
                            {parents.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
                        <button type="submit" className="create-btn">Create</button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default CreateModal;
