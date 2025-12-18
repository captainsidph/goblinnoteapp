import React, { useState, useMemo } from 'react';
import { X, FileText, Search } from 'lucide-react';
import { useNotes } from '../../context/NoteContext';
import './LinkNoteModal.css';

const LinkNoteModal = ({ isOpen, onClose, onSelectNote }) => {
    const { notes } = useNotes();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredNotes = useMemo(() => {
        if (!searchQuery.trim()) return notes.filter(n => !n.isTrashed);
        const query = searchQuery.toLowerCase();
        return notes.filter(n =>
            !n.isTrashed &&
            (n.title.toLowerCase().includes(query) ||
                n.content.toLowerCase().includes(query))
        );
    }, [notes, searchQuery]);

    if (!isOpen) return null;

    return (
        <div className="link-note-modal-overlay" onClick={onClose}>
            <div className="link-note-modal-content" onClick={e => e.stopPropagation()}>
                <div className="link-note-modal-header">
                    <h3 className="link-note-modal-title">Link to a Note</h3>
                    <button className="close-modal-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="link-note-search-wrapper">
                    <input
                        type="text"
                        className="link-note-search-input"
                        placeholder="Search notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                </div>

                <div className="link-note-list">
                    {filteredNotes.length === 0 ? (
                        <div className="no-notes-found">
                            No notes found
                        </div>
                    ) : (
                        filteredNotes.map(note => (
                            <div
                                key={note.id}
                                className="link-note-item"
                                onClick={() => onSelectNote(note)}
                            >
                                <span className="link-note-item-title">{note.title || 'Untitled Note'}</span>
                                <div className="link-note-item-meta">
                                    <span>{note.date}</span>
                                    {note.folderId && <span>• Folder #{note.folderId}</span>}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default LinkNoteModal;
