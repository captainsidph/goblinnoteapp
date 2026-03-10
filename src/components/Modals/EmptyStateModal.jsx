import React from 'react';
import { createPortal } from 'react-dom';
import { useNotes } from '../../context/NoteContext';
import FluentEmoji from '../FluentEmoji.jsx';
import './Modal.css';

const EmptyStateModal = () => {
    const { filteredNotes, addNote, filter, setFilter, isLoading, searchQuery, setSearchQuery } = useNotes();

    // Don't show if loading or if there are notes
    if (isLoading || filteredNotes.length > 0) {
        return null;
    }

    const handleCreateNote = () => {
        addNote();
    };

    const handleGoToAll = () => {
        setFilter({ type: 'all', id: null });
    };

    const handleClearSearch = () => {
        setSearchQuery('');
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget && searchQuery) {
            handleClearSearch();
        }
    };

    const getContent = () => {
        if (searchQuery) {
            return {
                icon: <FluentEmoji name="Search" size={40} className="modal-icon" />,
                title: 'No Notes Found',
                description: `No notes match "${searchQuery}"`,
                showCreate: false,
                isSearch: true
            };
        }

        if (filter.type === 'trash') {
            return {
                icon: <FluentEmoji name="Trash" size={40} className="modal-icon" />,
                title: 'Trash is Empty',
                description: 'There are no notes in the trash. Deleted notes will appear here.',
                showCreate: false
            };
        }

        if (filter.type === 'folder') {
            return {
                icon: <FluentEmoji name="Folder" size={40} className="modal-icon" />,
                title: 'Folder is Empty',
                description: 'This folder currently has no notes. Create a new one to get started.',
                showCreate: true
            };
        }

        return {
            icon: <FluentEmoji name="Plus" size={40} className="modal-icon" />,
            title: 'No Notes Found',
            description: 'You don\'t have any notes yet. Create your first note to get started!',
            showCreate: true
        };
    };

    const content = getContent();

    return createPortal(
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal-content">
                <div className="modal-icon-wrapper">
                    {content.icon}
                </div>
                <h2 className="modal-title">{content.title}</h2>
                <p className="modal-description">{content.description}</p>

                <div className="modal-actions">
                    {content.showCreate && (
                        <button className="modal-btn primary" onClick={handleCreateNote}>
                            <FluentEmoji name="Plus" size={20} />
                            Create New Note
                        </button>
                    )}

                    {content.isSearch && (
                        <button className="modal-btn primary" onClick={handleClearSearch}>
                            Clear Search
                        </button>
                    )}

                    {filter.type !== 'all' && !content.isSearch && (
                        <button className="modal-btn secondary" onClick={handleGoToAll}>
                            Go to All Notes
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default EmptyStateModal;
