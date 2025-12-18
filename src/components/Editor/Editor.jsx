import React, { useState, useEffect, useRef } from 'react';
import { useNotes } from '../../context/NoteContext';
import { Folder, Tag, X, Plus, Trash2, RotateCcw, Trash, LayoutTemplate, Columns, Maximize, Monitor, AlignJustify, Link, PanelBottom, Eye, EyeOff, Type, Download } from 'lucide-react';
import TabBar from './TabBar';
import './Editor.css';
import LinkNoteModal from '../Modals/LinkNoteModal';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SlashMenu from './SlashMenu';
import { getCaretCoordinates } from '../../utils/caretCoordinates';
import { exportNoteAsMarkdown, exportNoteToPDF } from '../../utils/exportUtils';

const Editor = () => {
    const { selectedNote, updateNote, folders, deleteNote, restoreNote, permanentlyDeleteNote, filteredNotes, filter, addNote, viewMode, setViewMode, noteWidth, setNoteWidth, setSelectedNoteId, notes, tags, addTag, saveImageToDb, getImageFromDb, fontSize: fontSizeContext, setFontSize } = useNotes();
    const [tagInput, setTagInput] = useState('');
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [showFooter, setShowFooter] = useState(true);
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [showFontSizeMenu, setShowFontSizeMenu] = useState(false); // New state
    const [showExportMenu, setShowExportMenu] = useState(false); // Export menu state
    const [slashMenuPosition, setSlashMenuPosition] = useState(null);
    const [slashQuery, setSlashQuery] = useState('');
    const [slashTriggerIndex, setSlashTriggerIndex] = useState(null);
    const textareaRef = useRef(null);

    // Extract OUTGOING links (notes linked FROM this note)
    const outgoingLinks = React.useMemo(() => {
        if (!selectedNote?.content) return [];

        const matches = selectedNote.content.match(/\[\[(.*?)\]\]/g);
        if (!matches) return [];

        const titles = matches.map(m => m.slice(2, -2).trim().toLowerCase()); // remove [[ and ]]

        const uniqueNotes = new Map();

        titles.forEach(title => {
            const foundNode = notes.find(n => n.title.toLowerCase() === title && !n.isTrashed);
            if (foundNode && !uniqueNotes.has(foundNode.id)) {
                uniqueNotes.set(foundNode.id, foundNode);
            }
        });

        return Array.from(uniqueNotes.values());
    }, [selectedNote?.content, notes]);

    // Extract INCOMING links (notes linking TO this note)
    const incomingLinks = React.useMemo(() => {
        if (!selectedNote) return [];

        const myTitle = selectedNote.title.toLowerCase();
        // Regex to match [[My Title]] loosely (ignoring case)
        // We escape special chars in title just in case
        const escapedTitle = myTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\[\\[${escapedTitle}\\]\\]`, 'i');

        return notes.filter(n =>
            n.id !== selectedNote.id && // not self
            !n.isTrashed &&
            n.content && regex.test(n.content)
        );
    }, [selectedNote, notes]);

    const handleTitleChange = (e) => {
        updateNote(selectedNote.id, { title: e.target.value });
    };

    // Sync local state with context if needed (though using context directly is better)
    // Actually, let's just use the context value directly for display, but here we might need local for UI

    // Slash Command Logic
    const handleSlashKeyDown = (e) => {
        if (slashMenuPosition) {
            if (['ArrowUp', 'ArrowDown', 'Enter', 'Tab', 'Escape'].includes(e.key)) {
                // Let the SlashMenu component handle these via its own listener
                // BUT we need to prevent default behavior here regarding the textarea
                if (e.key === 'Enter' || e.key === 'Tab') {
                    e.preventDefault();
                    // The SlashMenu's internal listener will fire and call onSelect
                }
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                    e.preventDefault();
                }
                if (e.key === 'Escape') {
                    setSlashMenuPosition(null);
                }
            }
        }
    };

    const checkForSlashCommand = (e) => {
        const val = e.target.value;
        const selStart = e.target.selectionStart;

        // If menu is open, update query or close
        if (slashMenuPosition) {
            if (selStart < slashTriggerIndex) {
                setSlashMenuPosition(null);
                return;
            }
            const query = val.substring(slashTriggerIndex, selStart);
            if (query.includes(' ')) {
                // Simple heuristic: if space, close menu (unless we want multi-word commands)
                setSlashMenuPosition(null);
            } else {
                setSlashQuery(query);
            }
            return;
        }

        // Detect triggering '/'
        // Check if just typed '/' (last char before cursor is /)
        if (val[selStart - 1] === '/') {
            // Check if it's at start of line or preceded by space
            const prevChar = val[selStart - 2];
            if (!prevChar || prevChar === '\n' || prevChar === ' ') {
                const coords = getCaretCoordinates(e.target, selStart);
                // Adjust for scroll and relative position if needed
                // Since textarea is in a relative parent, coords are relative to it.
                // We might need to adjust for the toolbar height or container padding if getCaretCoordinates doesn't account for it entirely perfectly relative to viewport
                // But getCaretCoordinates returns relative to element usually. 
                // Let's pass the relative coords and position absolute within the wrapper.

                setSlashMenuPosition({ top: coords.top, left: coords.left });
                setSlashTriggerIndex(selStart);
                setSlashQuery('');
            }
        }
    };

    const handleContentChange = (e) => {
        const newContent = e.target.value;
        updateNote(selectedNote.id, { content: newContent });

        // Check for slash command triggers
        checkForSlashCommand(e);
    };

    const handleSlashSelect = (command) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const currentContent = selectedNote.content || '';
        const beforeTrigger = currentContent.substring(0, slashTriggerIndex - 1); // remove the '/'
        const afterCursor = currentContent.substring(textarea.selectionStart);

        // Remove the slash command text (the '/' was already excluded from beforeTrigger, so we just join)
        // Wait, slashTriggerIndex is where query starts (after '/').
        // So `slashTriggerIndex - 1` is the `/`.

        let newContent;
        let finalCursorPos;

        if (command.id === 'link-note') {
            // Remove the slash syntax first
            newContent = beforeTrigger + afterCursor;
            updateNote(selectedNote.id, { content: newContent });
            setSlashMenuPosition(null);

            // Open Link Modal
            setIsLinkModalOpen(true);

            // We need to set cursor position to where the link should go (at beforeTrigger length)
            // But state update might be async.
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(beforeTrigger.length, beforeTrigger.length);
            }, 0);
            return;
        }

        let newTextForBlock = command.syntax;
        let cursorOffset = command.cursorOffset || command.syntax.length;

        newContent = beforeTrigger + newTextForBlock + afterCursor;

        updateNote(selectedNote.id, { content: newContent });
        setSlashMenuPosition(null);

        // Restore cursor
        setTimeout(() => {
            textarea.focus();
            const newCursorPos = beforeTrigger.length + cursorOffset;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    const handleFolderChange = (e) => {
        updateNote(selectedNote.id, { folderId: parseInt(e.target.value) });
    };

    const handleAddTag = (e) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            const newTag = tagInput.trim();

            // Check if tag exists globally, if not create it
            const tagExists = tags.some(t => t.name === newTag);
            if (!tagExists) {
                addTag(newTag);
            }

            if (!selectedNote.tags.includes(newTag)) {
                updateNote(selectedNote.id, { tags: [...selectedNote.tags, newTag] });
            }
            setTagInput('');
        }
    };

    // Auto-focus textarea when note changes
    useEffect(() => {
        if (selectedNote && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [selectedNote?.id]);

    const removeTag = (tagToRemove) => {
        updateNote(selectedNote.id, {
            tags: selectedNote.tags.filter(tag => tag !== tagToRemove)
        });
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        const imageFile = files.find(file => file.type.startsWith('image/'));

        if (imageFile) {
            // Create a unique ID for the image
            const imageId = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            // Convert to blob/buffer to store? 
            // IndexedDB can store Blobs directly.
            // We'll store: { id: imageId, blob: imageFile, timestamp: Date.now() }

            try {
                await saveImageToDb({ id: imageId, blob: imageFile, timestamp: Date.now() });

                // Insert markdown at cursor
                const textarea = textareaRef.current;
                if (textarea) {
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const content = selectedNote.content || '';
                    const imageMarkdown = `\n![Image](${imageId})\n`;

                    const newContent = content.substring(0, start) + imageMarkdown + content.substring(end);
                    updateNote(selectedNote.id, { content: newContent });

                    // We need to manually update selection/focus but React state update might jump cursor. 
                    // Let's just update content for now.
                } else {
                    // If dropping on preview or empty area, append to end?
                    // Currently drop listener is on editor-body, so if in preview mode drop might assume append.
                    // But we only want drop in Edit mode usually? 
                    // Let's support drop in Edit mode for now.
                    const content = selectedNote.content || '';
                    updateNote(selectedNote.id, { content: content + `\n![Image](${imageId})\n` });
                }
            } catch (error) {
                console.error("Failed to save image", error);
                alert("Failed to save image.");
            }
        }
    };

    if (!selectedNote) {
        return (
            <div className="editor-empty">
                {filteredNotes.length === 0 ? (
                    <div className="empty-state-content">
                        {filter.type === 'trash' ? (
                            <>
                                <Trash2 size={48} className="empty-state-icon" />
                                <h2 className="empty-state-title">Trash is Empty</h2>
                                <p className="empty-state-description">No notes in trash</p>
                            </>
                        ) : (
                            <>
                                <div className="empty-state-icon-wrapper">
                                    <Plus size={48} className="empty-state-icon" />
                                </div>
                                <h2 className="empty-state-title">{filter.type === 'folder' ? 'Folder is Empty' : 'No Notes Found'}</h2>
                                <p className="empty-state-description">Get started by creating a new note</p>
                                <button className="create-note-btn large" onClick={addNote}>
                                    <Plus size={20} />
                                    Create New Note
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="empty-state-content">
                        <p>Select a note to view or edit</p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="editor">
            <TabBar />
            <div className="editor-header">
                <input
                    type="text"
                    className="editor-title-input"
                    value={selectedNote.title}
                    onChange={handleTitleChange}
                    placeholder="Note Title"
                />

                <div className="editor-meta-row">
                    <div className="meta-item">
                        <span className="editor-date">{selectedNote.date}</span>
                    </div>

                    <div className="meta-divider"></div>

                    <div className="meta-item folder-select-wrapper">
                        <Folder size={14} className="meta-icon" />
                        <select
                            value={selectedNote.folderId}
                            onChange={handleFolderChange}
                            className="folder-select"
                        >
                            {folders.map(folder => (
                                <option key={folder.id} value={folder.id}>
                                    {folder.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="meta-divider"></div>

                    <div className="meta-item tags-wrapper">
                        <div className="tags-list">
                            {selectedNote.tags.map(tag => (
                                <span key={tag} className="tag-pill">
                                    <Tag size={10} className="tag-icon" />
                                    {tag}
                                    <button onClick={() => removeTag(tag)} className="remove-tag-btn">
                                        <X size={10} />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <input
                            type="text"
                            className="add-tag-input"
                            placeholder="+ Add tag"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleAddTag}
                        />
                    </div>
                </div>
            </div>

            <div className="editor-toolbar">
                <div className="view-toggles">
                    <button
                        className={`action-btn ${viewMode === 'default' ? 'active' : ''}`}
                        onClick={() => setViewMode('default')}
                        title="Default View"
                    >
                        <LayoutTemplate size={18} />
                    </button>
                    <button
                        className={`action-btn ${viewMode === 'list' ? 'active' : ''}`}
                        onClick={() => setViewMode('list')}
                        title="List View"
                    >
                        <Columns size={18} />
                    </button>
                    <button
                        className={`action-btn ${viewMode === 'focus' ? 'active' : ''}`}
                        onClick={() => setViewMode('focus')}
                        title="Focus Mode"
                    >
                        <Maximize size={18} />
                    </button>
                </div>
                <div className="view-toggles" style={{ marginLeft: '8px' }}>
                    <button
                        className={`action-btn ${noteWidth === 'optimum' ? 'active' : ''}`}
                        onClick={() => setNoteWidth('optimum')}
                        title="Optimum Width"
                    >
                        <AlignJustify size={18} />
                    </button>
                    <button
                        className={`action-btn ${noteWidth === 'full' ? 'active' : ''}`}
                        onClick={() => setNoteWidth('full')}
                        title="Full Width"
                    >
                        <Monitor size={18} />
                    </button>
                </div>

                <div className="view-toggles" style={{ marginLeft: '8px', display: 'flex', gap: '2px', position: 'relative' }}>
                    <button
                        className={`action-btn ${showFontSizeMenu ? 'active' : ''}`}
                        onClick={() => setShowFontSizeMenu(!showFontSizeMenu)}
                        title="Font Size"
                    >
                        <Type size={18} />
                    </button>
                    {showFontSizeMenu && (
                        <div className="font-size-dropdown" style={{ display: 'flex', flexDirection: 'row', minWidth: 'auto', padding: '4px', top: '100%', left: '0' }}>
                            {['small', 'medium', 'large', 'xl'].map(size => (
                                <div
                                    key={size}
                                    className={`font-size-item ${fontSizeContext === size ? 'active' : ''}`}
                                    onClick={() => { setFontSize(size); setShowFontSizeMenu(false); }}
                                    style={{ padding: '6px 10px', textAlign: 'center', borderRadius: '4px' }}
                                    title={size.charAt(0).toUpperCase() + size.slice(1)}
                                >
                                    {size === 'small' ? 'S' : size === 'medium' ? 'M' : size === 'large' ? 'L' : 'XL'}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ marginLeft: '8px', borderLeft: '1px solid var(--border-color)', paddingLeft: '8px', display: 'flex', gap: '4px' }}>
                    <button
                        className="action-btn"
                        onClick={() => setIsLinkModalOpen(true)}
                        title="Link Note"
                    >
                        <Link size={18} />
                    </button>
                    <button
                        className={`action-btn ${showFooter ? 'active' : ''}`}
                        onClick={() => setShowFooter(!showFooter)}
                        title="Toggle Linked Notes Footer"
                    >
                        <PanelBottom size={18} />
                    </button>
                    <button
                        className={`action-btn ${isPreviewMode ? 'active' : ''}`}
                        onClick={() => setIsPreviewMode(!isPreviewMode)}
                        title={isPreviewMode ? "Edit Mode" : "Preview Mode"}
                    >
                        {isPreviewMode ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>

                <div className="view-toggles" style={{ marginLeft: '8px', display: 'flex', gap: '2px', position: 'relative' }}>
                    <button
                        className={`action-btn ${showExportMenu ? 'active' : ''}`}
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        title="Export Note"
                    >
                        <Download size={18} />
                    </button>
                    {showExportMenu && (
                        <div className="font-size-dropdown" style={{
                            display: 'flex',
                            flexDirection: 'column',
                            minWidth: '160px',
                            padding: '4px',
                            top: '100%',
                            right: '0',
                            gap: '2px'
                        }}>
                            <div
                                className="font-size-item"
                                onClick={() => {
                                    exportNoteAsMarkdown(selectedNote);
                                    setShowExportMenu(false);
                                }}
                                style={{ padding: '8px 12px', textAlign: 'left', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                Export as Markdown
                            </div>
                            <div
                                className="font-size-item"
                                onClick={() => {
                                    exportNoteToPDF();
                                    setShowExportMenu(false);
                                }}
                                style={{ padding: '8px 12px', textAlign: 'left', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                Print / PDF
                            </div>
                        </div>
                    )}
                </div>

                <div className="toolbar-spacer"></div>

                {selectedNote.isTrashed ? (
                    <>
                        <button
                            className="action-btn restore-btn"
                            onClick={() => restoreNote(selectedNote.id)}
                            title="Restore Note"
                        >
                            <RotateCcw size={18} />
                        </button>
                        <button
                            className="action-btn delete-forever-btn"
                            onClick={() => permanentlyDeleteNote(selectedNote.id)}
                            title="Delete Forever"
                        >
                            <Trash size={18} />
                        </button>
                    </>
                ) : (
                    <button
                        className="action-btn trash-btn"
                        onClick={() => deleteNote(selectedNote.id)}
                        title="Move to Trash"
                        rel="trash"
                    >
                        <Trash2 size={18} />
                    </button>
                )}
            </div>

            <div
                className="editor-body plain-text-body"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            >
                {isPreviewMode ? (
                    <div className={`markdown-preview ${noteWidth === 'optimum' ? 'optimum-width' : 'full-width'}`}>
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                code({ node, inline, className, children, ...props }) {
                                    return !inline ? (
                                        <pre className={className}>
                                            <code {...props}>{children}</code>
                                        </pre>
                                    ) : (
                                        <code className={className} {...props}>
                                            {children}
                                        </code>
                                    );
                                },
                                img({ node, src, alt, ...props }) {
                                    // Custom image renderer to fetch blob from IDB
                                    const [imgUrl, setImgUrl] = useState(null);

                                    // Parse alt for size: "Alt Text|300"
                                    let actualAlt = alt;
                                    let width = '100%';
                                    let style = { maxWidth: '100%', borderRadius: '8px', margin: '1em 0' };

                                    if (alt && alt.includes('|')) {
                                        const parts = alt.split('|');
                                        actualAlt = parts[0];
                                        const widthPart = parts[1].trim();
                                        if (widthPart) {
                                            if (!isNaN(widthPart)) {
                                                style.width = `${widthPart}px`;
                                            } else {
                                                style.width = widthPart;
                                            }
                                        }
                                    }

                                    useEffect(() => {
                                        let isMounted = true;
                                        if (src && src.startsWith('img-')) {
                                            getImageFromDb(src).then(imgData => {
                                                if (isMounted && imgData && imgData.blob) {
                                                    const url = URL.createObjectURL(imgData.blob);
                                                    setImgUrl(url);
                                                }
                                            });
                                        } else {
                                            // Normal URL
                                            setImgUrl(src);
                                        }

                                        return () => {
                                            isMounted = false;
                                            if (imgUrl && src.startsWith('img-')) {
                                                URL.revokeObjectURL(imgUrl);
                                            }
                                        };
                                    }, [src]);

                                    if (!imgUrl) return <span className="image-loading">[Loading Image...]</span>;

                                    return (
                                        <img src={imgUrl} alt={actualAlt} {...props} style={style} />
                                    );
                                },
                                a({ node, href, children, ...props }) {
                                    if (href && href.startsWith('#wikilink:')) {
                                        const targetTitle = decodeURIComponent(href.replace('#wikilink:', ''));
                                        return (
                                            <span
                                                className="wiki-link"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    const cleanTitle = targetTitle.trim().toLowerCase();
                                                    const targetNote = notes.find(n => n.title.toLowerCase() === cleanTitle);

                                                    if (targetNote) {
                                                        setSelectedNoteId(targetNote.id);
                                                    } else {
                                                        alert(`Note "${targetTitle}" not found.`);
                                                    }
                                                }}
                                                title={`Go to ${targetTitle}`}
                                            >
                                                {children}
                                            </span>
                                        );
                                    }
                                    return <a href={href} {...props}>{children}</a>;
                                }
                            }}
                        >
                            {(selectedNote.content || '').replace(/\[\[(.*?)\]\]/g, (match, title) => `[${title}](#wikilink:${encodeURIComponent(title)})`)}
                        </ReactMarkdown>
                    </div>
                ) : (
                    <div className={`editor-textarea-wrapper ${noteWidth === 'optimum' ? 'optimum-width' : 'full-width'}`} style={{ height: '100%' }}>
                        <textarea
                            ref={textareaRef}
                            className="editor-textarea"
                            value={selectedNote.content || ''}
                            onChange={handleContentChange}
                            onKeyDown={handleSlashKeyDown}
                            placeholder="Start writing..."
                            style={{
                                fontSize: fontSizeContext === 'small' ? '14px' : fontSizeContext === 'medium' ? '16px' : fontSizeContext === 'large' ? '18px' : '20px',
                            }}
                        />
                    </div>
                )
                }

                {
                    (showFooter && (outgoingLinks.length > 0 || incomingLinks.length > 0)) && (
                        <div className="editor-footer">
                            {outgoingLinks.length > 0 && (
                                <div className="link-section">
                                    <div className="linked-notes-title">Outgoing Links</div>
                                    <div className="linked-notes-list">
                                        {outgoingLinks.map(note => (
                                            <button
                                                key={note.id}
                                                className="linked-note-pill"
                                                onClick={() => setSelectedNoteId(note.id)}
                                            >
                                                <span className="linked-note-icon">📄</span>
                                                {note.title}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {incomingLinks.length > 0 && (
                                <div className="link-section">
                                    <div className="linked-notes-title">Incoming Links</div>
                                    <div className="linked-notes-list">
                                        {incomingLinks.map(note => (
                                            <button
                                                key={note.id}
                                                className="linked-note-pill"
                                                onClick={() => setSelectedNoteId(note.id)}
                                            >
                                                <span className="linked-note-icon">🔗</span>
                                                {note.title}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                }
            </div >

            {slashMenuPosition && (
                <SlashMenu
                    position={slashMenuPosition}
                    onSelect={handleSlashSelect}
                    onClose={() => setSlashMenuPosition(null)}
                    query={slashQuery}
                />
            )}

            <LinkNoteModal
                isOpen={isLinkModalOpen}
                onClose={() => setIsLinkModalOpen(false)}
                onSelectNote={(noteToLink) => {
                    const linkText = `[[${noteToLink.title}]]`;
                    const textarea = textareaRef.current;
                    if (textarea) {
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const currentContent = selectedNote.content || '';

                        const newContent = currentContent.substring(0, start) + linkText + currentContent.substring(end);

                        updateNote(selectedNote.id, { content: newContent });
                        setIsLinkModalOpen(false);

                        // Restore focus and move cursor after the link (tricky with React state update, but good enough)
                        setTimeout(() => {
                            textarea.focus();
                            textarea.selectionStart = start + linkText.length;
                            textarea.selectionEnd = start + linkText.length;
                        }, 0);
                    }
                }}
            />
        </div >
    );
};

export default Editor;
