import React, { useState, useMemo } from 'react';
import { useNotes } from '../../context/NoteContext';
import {
    FileText,
    Folder,
    Tag,
    Trash2,
    Plus,
    Settings,
    Moon,
    Sun,
    CheckSquare,
    Star,
    ChevronRight,
    ChevronDown,
    MoreVertical,
    Calendar
} from 'lucide-react';
import CreateModal from '../Modals/CreateModal';
import SettingsModal from '../Modals/SettingsModal';
import CalendarWidget from './CalendarWidget';
import './Sidebar.css';

const SidebarItem = ({ item, type, level = 0, onSelect, activeId, onToggleExpand, expandedIds, onDelete, onNoteDrop }) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedIds.includes(item.id);
    const Icon = type === 'folder' ? Folder : Tag;
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        const noteId = e.dataTransfer.getData('text/plain');
        if (noteId) {
            onNoteDrop(noteId, item, type);
        }
    };

    return (
        <div className="sidebar-item-container">
            <div
                className={`nav-item ${activeId === (type === 'tag' ? item.name : item.id) ? 'active' : ''} ${isDragOver ? 'drag-over' : ''}`}
                style={{
                    paddingLeft: `${12 + level * 12}px`,
                    backgroundColor: isDragOver ? 'var(--hover-bg)' : undefined,
                    border: isDragOver ? '1px dashed var(--primary-color)' : '1px solid transparent'
                }}
                onClick={() => onSelect(item)}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <div
                    className="expand-icon"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleExpand(item.id);
                    }}
                    style={{ visibility: hasChildren ? 'visible' : 'hidden', marginRight: '4px' }}
                >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
                <Icon size={18} />
                <span className="item-name" style={{ flex: 1 }}>{item.name}</span>

                <div
                    className="delete-icon"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Are you sure you want to delete this ${type}?`)) {
                            onDelete(item.id);
                        }
                    }}
                    title={`Delete ${type}`}
                >
                    <Trash2 size={14} />
                </div>
            </div>
            {hasChildren && isExpanded && (
                <div className="sidebar-item-children">
                    {item.children.map(child => (
                        <SidebarItem
                            key={child.id}
                            item={child}
                            type={type}
                            level={level + 1}
                            onSelect={onSelect}
                            activeId={activeId}
                            onToggleExpand={onToggleExpand}
                            expandedIds={expandedIds}
                            onDelete={onDelete}
                            onNoteDrop={onNoteDrop}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const Sidebar = () => {
    const {
        folders,
        tags,
        notes,
        updateNote,
        addNote,
        filter,
        setFilter,
        theme,
        toggleTheme,
        activePage,
        setActivePage,
        addFolder,
        addTag,
        deleteFolder,
        deleteTag,
        setTheme
    } = useNotes();

    const [modal, setModal] = useState({ isOpen: false, type: null });
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [expandedIds, setExpandedIds] = useState([]);
    const [showCalendar, setShowCalendar] = useState(false);
    const [showThemeMenu, setShowThemeMenu] = useState(false); // New state for theme menu

    const themes = [
        { id: 'light', name: 'Light' },
        { id: 'dark', name: 'Dark' },
        { id: 'catppuccin-latte', name: 'Latte' },
        { id: 'everforest-light', name: 'Forest' },
        { id: 'nord', name: 'Nord' },
        { id: 'gruvbox', name: 'Gruvbox' },
    ];

    const toggleThemeMenu = (e) => {
        e.stopPropagation();
        setShowThemeMenu(!showThemeMenu);
    };

    const handleThemeSelect = (e, themeId) => {
        e.stopPropagation();
        setTheme(themeId);
        setShowThemeMenu(false);
    };

    // Close menu when clicking outside
    React.useEffect(() => {
        const checkClickOutside = (e) => {
            if (showThemeMenu) setShowThemeMenu(false);
        };
        window.addEventListener('click', checkClickOutside);
        return () => window.removeEventListener('click', checkClickOutside);
    }, [showThemeMenu]);

    const toggleExpand = (id) => {
        setExpandedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const buildTree = (items) => {
        const itemMap = {};
        const tree = [];

        // Initialize map
        items.forEach(item => {
            itemMap[item.id] = { ...item, children: [] };
        });

        // Build tree
        items.forEach(item => {
            if (item.parentId && itemMap[item.parentId]) {
                itemMap[item.parentId].children.push(itemMap[item.id]);
            } else {
                tree.push(itemMap[item.id]);
            }
        });

        return tree;
    };

    const folderTree = useMemo(() => buildTree(folders), [folders]);
    const tagTree = useMemo(() => buildTree(tags), [tags]);

    const handleCreate = (name, parentId) => {
        if (modal.type === 'folder') {
            addFolder(name, parentId);
        } else {
            addTag(name, parentId);
        }
    };

    const openModal = (type) => {
        setModal({ isOpen: true, type });
    };

    const handleNoteDrop = (noteId, targetItem, targetType) => {
        const note = notes.find(n => n.id === parseInt(noteId));
        if (!note) return;

        if (targetType === 'folder') {
            if (note.folderId !== targetItem.id) {
                updateNote(note.id, { folderId: targetItem.id });
                // Optional: Provide feedback or toast
                console.log(`Moved note ${note.title} to folder ${targetItem.name}`);
            }
        } else if (targetType === 'tag') {
            const tagName = targetItem.name;
            if (!note.tags.includes(tagName)) {
                updateNote(note.id, { tags: [...note.tags, tagName] });
                console.log(`Added tag ${tagName} to note ${note.title}`);
            }
        }
    };

    return (
        <>
            <div className="sidebar">
                <div className="sidebar-header">
                    <div className="user-profile">
                        <div className="avatar">U</div>
                        <span className="username">User</span>
                    </div>
                    <button className="new-note-btn" onClick={addNote}>
                        <Plus size={16} />
                        <span>New Note</span>
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <div
                        className={`nav-item ${filter.type === 'pinned' && activePage === 'notes' ? 'active' : ''}`}
                        onClick={() => {
                            setFilter({ type: 'pinned' });
                            setActivePage('notes');
                        }}
                    >
                        <Star size={18} />
                        <span>Favorites</span>
                    </div>

                    <div
                        className={`nav-item ${filter.type === 'all' && activePage === 'notes' ? 'active' : ''}`}
                        onClick={() => {
                            setFilter({ type: 'all' });
                            setActivePage('notes');
                        }}
                    >
                        <FileText size={18} />
                        <span>All Notes</span>
                    </div>

                    {/* Calendar Toggle */}
                    <div
                        className={`nav-item ${showCalendar ? 'active' : ''}`}
                        onClick={() => setShowCalendar(!showCalendar)}
                    >
                        <Calendar size={18} />
                        <span>Calendar</span>
                    </div>

                    {/* Calendar Widget */}
                    {showCalendar && (
                        <div style={{ padding: '0 10px 10px 10px' }}>
                            <CalendarWidget />
                        </div>
                    )}

                    <div className="nav-section">
                        <div className="section-header">
                            <span className="section-title">FOLDERS</span>
                            <Plus
                                size={14}
                                className="add-icon"
                                onClick={() => openModal('folder')}
                            />
                        </div>
                        <div className="scrollable-section">
                            {folderTree.map(folder => (
                                <SidebarItem
                                    key={folder.id}
                                    item={folder}
                                    type="folder"
                                    activeId={filter.type === 'folder' ? filter.id : null}
                                    onSelect={(item) => {
                                        setFilter({ type: 'folder', id: item.id });
                                        setActivePage('notes');
                                    }}
                                    onToggleExpand={toggleExpand}
                                    expandedIds={expandedIds}
                                    onDelete={deleteFolder}
                                    onNoteDrop={handleNoteDrop}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="nav-section">
                        <div className="section-header">
                            <span className="section-title">TAGS</span>
                            <Plus
                                size={14}
                                className="add-icon"
                                onClick={() => openModal('tag')}
                            />
                        </div>
                        <div className="scrollable-section">
                            {tagTree.map(tag => (
                                <SidebarItem
                                    key={tag.id}
                                    item={tag}
                                    type="tag"
                                    activeId={filter.type === 'tag' ? filter.id : null}
                                    // Note: Filter state uses tag NAME for legacy support, but we might want to switch to ID later.
                                    // For now, let's stick to NAME matching or update Context to support ID filtering for tags.
                                    // Context filter: `n.tags.includes(filter.id)` where filter.id is name.
                                    // So we pass `tag.name` as ID.
                                    onSelect={(item) => {
                                        setFilter({ type: 'tag', id: item.name });
                                        setActivePage('notes');
                                    }}
                                    onToggleExpand={toggleExpand}
                                    expandedIds={expandedIds}
                                    onDelete={deleteTag}
                                    onNoteDrop={handleNoteDrop}
                                />
                            ))}
                        </div>
                    </div>

                    <div
                        className={`nav-item trash-item ${filter.type === 'trash' ? 'active' : ''}`}
                        onClick={() => {
                            setFilter({ type: 'trash' });
                            setActivePage('notes');
                        }}
                    >
                        <Trash2 size={18} />
                        <span>Trash</span>
                    </div>

                    <div className="nav-divider"></div>

                    <div
                        className={`nav-item ${activePage === 'tasks' ? 'active' : ''}`}
                        onClick={() => setActivePage('tasks')}
                    >
                        <CheckSquare size={18} />
                        <span>Tasks</span>
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <div
                        className="nav-item"
                        onClick={() => setIsSettingsOpen(true)}
                    >
                        <Settings size={18} />
                        <span>Settings</span>
                    </div>
                    <div className="nav-item theme-toggle" onClick={toggleThemeMenu} title="Select Theme" style={{ position: 'relative' }}>
                        {theme === 'dark' || theme === 'nord' || theme === 'gruvbox' ? <Moon size={18} /> : <Sun size={18} />}
                        <span>Theme</span>

                        {showThemeMenu && (
                            <div className="theme-dropdown-menu">
                                {themes.map(t => (
                                    <div
                                        key={t.id}
                                        className={`theme-dropdown-item ${theme === t.id ? 'active' : ''}`}
                                        onClick={(e) => handleThemeSelect(e, t.id)}
                                    >
                                        {t.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <CreateModal
                type={modal.type}
                isOpen={modal.isOpen}
                onClose={() => setModal({ ...modal, isOpen: false })}
                onConfirm={handleCreate}
                parents={modal.type === 'folder' ? folders : tags}
            />
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />
        </>
    );
};

export default Sidebar;
