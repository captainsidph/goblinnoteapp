import React from 'react';
import { useNotes } from '../../context/NoteContext';
import { X } from 'lucide-react';
import './TabBar.css';

const TabBar = () => {
    const { openTabs, activeTabId, notes, switchTab, closeTab } = useNotes();

    // Get note details for each tab
    const tabNotes = openTabs.map(tabId => notes.find(n => n.id === tabId)).filter(Boolean);

    if (tabNotes.length === 0) {
        return null; // Don't render if no tabs
    }

    const handleTabClick = (noteId) => {
        switchTab(noteId);
    };

    const handleCloseTab = (e, noteId) => {
        e.stopPropagation(); // Prevent tab switch when closing
        closeTab(noteId);
    };

    return (
        <div className="tab-bar">
            <div className="tab-bar-scroll">
                {tabNotes.map(note => (
                    <div
                        key={note.id}
                        className={`tab ${activeTabId === note.id ? 'active' : ''}`}
                        onClick={() => handleTabClick(note.id)}
                        title={note.title}
                    >
                        <span className="tab-title">{note.title || 'Untitled'}</span>
                        <button
                            className="tab-close-btn"
                            onClick={(e) => handleCloseTab(e, note.id)}
                            aria-label="Close tab"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TabBar;
