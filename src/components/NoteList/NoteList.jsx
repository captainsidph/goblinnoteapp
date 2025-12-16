import React from 'react';
import { useNotes } from '../../context/NoteContext';
import { Search, Pin, ArrowDownWideNarrow, Trash } from 'lucide-react';
import './NoteList.css';

const NoteList = () => {
    const { filteredNotes, selectedNoteId, setSelectedNoteId, filter, folders, sortOption, setSortOption, togglePin, openTabs, openTab, emptyTrash, searchQuery, setSearchQuery } = useNotes();

    const getHeaderTitle = () => {
        if (filter.type === 'all') return 'All Notes';
        if (filter.type === 'folder') {
            const folder = folders.find(f => f.id === filter.id);
            return folder ? folder.name : 'Folder';
        }
        if (filter.type === 'tag') return `#${filter.id}`;
        if (filter.type === 'pinned') return 'Favorites';
        if (filter.type === 'trash') return 'Trash';
        return 'Notes';
    };

    return (
        <div className="note-list">
            <div className="note-list-header">
                <div className="header-top-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>{getHeaderTitle()}</h2>
                    {filter.type === 'trash' && filteredNotes.length > 0 && (
                        <button
                            className="empty-trash-btn"
                            onClick={emptyTrash}
                            title="Empty Trash"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--danger-color)',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.8rem',
                                fontWeight: '500'
                            }}
                        >
                            <Trash size={14} />
                            Empty
                        </button>
                    )}
                </div>
                <span className="note-count">{filteredNotes.length} notes</span>
            </div>

            <div className="search-bar-container">
                <div className="search-bar">
                    <Search size={16} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="sort-wrapper">
                    <ArrowDownWideNarrow size={16} className="sort-icon" />
                    <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value)}
                        className="sort-select"
                        title="Sort notes"
                    >
                        <option value="dateDesc">Newest</option>
                        <option value="dateAsc">Oldest</option>
                        <option value="titleAsc">Title (A-Z)</option>
                        <option value="titleDesc">Title (Z-A)</option>
                    </select>
                </div>
            </div>

            <div className="notes-container">
                {filteredNotes.length === 0 ? (
                    <div className="note-list-empty">
                        <p>No notes found</p>
                    </div>
                ) : (
                    filteredNotes.map(note => (
                        <div
                            key={note.id}
                            className={`note-card ${selectedNoteId === note.id ? 'active' : ''} ${note.isPinned ? 'pinned-note' : ''} ${openTabs.includes(note.id) ? 'has-tab' : ''}`}
                            draggable="true"
                            onDragStart={(e) => {
                                e.dataTransfer.setData('text/plain', note.id);
                                e.dataTransfer.effectAllowed = 'move';
                            }}
                            onClick={(e) => {
                                if (e.shiftKey) {
                                    // Shift+Click: Open in new tab
                                    openTab(note.id);
                                } else {
                                    // Normal click: Replace current tab
                                    setSelectedNoteId(note.id);
                                }
                            }}
                        >
                            <div className="note-card-header">
                                <h4 className="note-title">{note.title || 'Untitled'}</h4>
                                {filter.type !== 'trash' && (
                                    <button
                                        className={`pin-btn ${note.isPinned ? 'active' : ''}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            togglePin(note.id);
                                        }}
                                        title={note.isPinned ? "Unpin note" : "Pin note"}
                                    >
                                        <Pin size={14} className={note.isPinned ? 'fill-current' : ''} />
                                    </button>
                                )}
                            </div>
                            <p className="note-preview">{note.preview}</p>
                            <div className="note-meta">
                                <span className="note-date">{note.date}</span>
                                <div className="note-tags">
                                    {note.tags.map(tag => (
                                        <span key={tag} className="tag-pill">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default NoteList;
