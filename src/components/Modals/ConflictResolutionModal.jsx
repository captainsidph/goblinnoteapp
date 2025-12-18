import React, { useState } from 'react';
import { useNotes } from '../../context/NoteContext';
import { X, ArrowRight, Save, Copy } from 'lucide-react';
import './CreateModal.css';
import './SettingsModal.css';

const ConflictResolutionModal = ({ isOpen, conflicts, onClose }) => {
    const { resolveConflict } = useNotes();
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!isOpen || conflicts.length === 0) return null;

    const currentConflict = conflicts[currentIndex];
    const isLast = currentIndex === conflicts.length - 1;

    const handleResolve = async (choice) => {
        await resolveConflict(currentConflict.local.id, choice, currentConflict.imported);

        if (isLast) {
            onClose();
        } else {
            setCurrentIndex(prev => prev + 1);
        }
    };

    return (
        <div className="modal-overlay" style={{ zIndex: 1100 }}> {/* Higher z-index than Settings */}
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                <div className="modal-header">
                    <h2>Resolve Conflict ({currentIndex + 1}/{conflicts.length})</h2>
                    {/* No close button, force resolution? Or maybe allow cancel? Let's allow cancel but verify logic. */}
                    {/* Ideally user should resolve all. If they close, what happens? Notes are left in conflicting state? No, they were not imported yet. So effectively 'Keep Local'. */}
                    <button className="close-btn" onClick={onClose}><X size={18} /></button>
                </div>

                <div className="modal-body conflict-container">
                    <div className="conflict-card">
                        <div className="conflict-note-title">
                            <span style={{ color: 'var(--text-secondary)' }}>Note:</span>
                            {currentConflict.local.title}
                        </div>

                        <div className="comparison-grid">
                            <div className="version-column">
                                <span className="version-label">Local Version</span>
                                <div className="version-preview">
                                    {currentConflict.local.content.slice(0, 300)}...
                                </div>
                                <div className="backup-info">Last Modified: {currentConflict.local.date}</div>
                            </div>
                            <div className="version-column">
                                <span className="version-label">Imported Version</span>
                                <div className="version-preview">
                                    {currentConflict.imported.content.slice(0, 300)}...
                                </div>
                                <div className="backup-info">Last Modified: {currentConflict.imported.date}</div>
                            </div>
                        </div>
                    </div>

                    <div className="conflict-actions">
                        <button className="modal-btn secondary" onClick={() => handleResolve('keep_local')}>
                            Keep Local
                        </button>
                        <button className="modal-btn secondary" onClick={() => handleResolve('keep_both')}>
                            <Copy size={16} style={{ marginRight: '6px' }} /> Keep Both
                        </button>
                        <button className="modal-btn primary" onClick={() => handleResolve('keep_imported')}>
                            <Save size={16} style={{ marginRight: '6px' }} /> Overwrite with Imported
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConflictResolutionModal;
