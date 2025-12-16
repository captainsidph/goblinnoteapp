import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, Settings, Moon, Sun, Plus, Terminal } from 'lucide-react';
import { useNotes } from '../../context/NoteContext';
import './CommandPalette.css';

const CommandPalette = () => {
    const {
        notes,
        setSelectedNoteId,
        addNote,
        toggleTheme,
        theme,
        setTheme, // Need this for specific theme commands
        setIsSettingsOpen // Assuming we expose this in context or need to find another way
    } = useNotes();

    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const listRef = useRef(null);

    // Global Key Listener for Toggle
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Input Focus when open
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
        }
    }, [isOpen]);

    // Commands List
    const commands = [
        {
            id: 'new-note',
            title: 'Create New Note',
            icon: <Plus size={18} />,
            category: 'Commands',
            action: () => {
                addNote();
            }
        },
        {
            id: 'toggle-theme',
            title: `Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`,
            icon: theme === 'light' ? <Moon size={18} /> : <Sun size={18} />,
            category: 'Commands',
            action: () => {
                toggleTheme();
            }
        },
        // Specific Theme Commands
        {
            id: 'theme-light',
            title: 'Theme: Light',
            icon: <Sun size={18} />,
            category: 'Themes',
            action: () => {
                setTheme('light');
            }
        },
        {
            id: 'theme-dark',
            title: 'Theme: Dark',
            icon: <Moon size={18} />,
            category: 'Themes',
            action: () => {
                setTheme('dark');
            }
        },
        {
            id: 'theme-latte',
            title: 'Theme: Catppuccin Latte',
            icon: <Sun size={18} />,
            category: 'Themes',
            action: () => {
                setTheme('catppuccin-latte');
            }
        },
        {
            id: 'theme-forest',
            title: 'Theme: Everforest Light',
            icon: <Sun size={18} />,
            category: 'Themes',
            action: () => {
                setTheme('everforest-light');
            }
        },
        {
            id: 'theme-nord',
            title: 'Theme: Nord',
            icon: <Moon size={18} />,
            category: 'Themes',
            action: () => {
                setTheme('nord');
            }
        },
        {
            id: 'theme-gruvbox',
            title: 'Theme: Gruvbox',
            icon: <Moon size={18} />,
            category: 'Themes',
            action: () => {
                setTheme('gruvbox');
            }
        }
    ];

    // Filter Logic
    const filteredNotes = notes
        .filter(note =>
            note.title.toLowerCase().includes(query.toLowerCase()) ||
            (note.content && note.content.toLowerCase().includes(query.toLowerCase()))
        )
        .slice(0, 10)
        .map(note => ({
            id: note.id,
            title: note.title || 'Untitled',
            icon: <FileText size={18} />,
            category: 'Notes',
            subtext: note.content ? note.content.replace(/[#*`]/g, '').slice(0, 50) + '...' : 'No content',
            action: () => {
                setSelectedNoteId(note.id);
            }
        }));

    const filteredCommands = commands.filter(cmd =>
        cmd.title.toLowerCase().includes(query.toLowerCase())
    );

    const allItems = [...filteredCommands, ...filteredNotes];

    // Navigation Logic
    useEffect(() => {
        const handleNavigation = (e) => {
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % allItems.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + allItems.length) % allItems.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (allItems[selectedIndex]) {
                    allItems[selectedIndex].action();
                    setIsOpen(false);
                }
            }
        };

        window.addEventListener('keydown', handleNavigation);
        return () => window.removeEventListener('keydown', handleNavigation);
    }, [isOpen, allItems, selectedIndex]);

    // Ensure active item is visible
    useEffect(() => {
        if (listRef.current) {
            const activeItem = listRef.current.children[selectedIndex];
            if (activeItem) {
                // activeItem.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [selectedIndex]);


    if (!isOpen) return null;

    return (
        <div className="command-palette-overlay" onClick={() => setIsOpen(false)}>
            <div className="command-palette-modal" onClick={e => e.stopPropagation()}>
                <div className="command-palette-input-wrapper">
                    <Search className="command-palette-icon" size={20} />
                    <input
                        ref={inputRef}
                        className="command-palette-input"
                        placeholder="Type a command or search..."
                        value={query}
                        onChange={e => {
                            setQuery(e.target.value);
                            setSelectedIndex(0);
                        }}
                    />
                </div>

                <div className="command-palette-list" ref={listRef}>
                    {allItems.length === 0 ? (
                        <div className="command-palette-empty">No results found</div>
                    ) : (
                        allItems.map((item, index) => (
                            <div
                                key={item.id}
                                className={`command-palette-item ${index === selectedIndex ? 'active' : ''}`}
                                onClick={() => {
                                    item.action();
                                    setIsOpen(false);
                                }}
                                onMouseEnter={() => setSelectedIndex(index)}
                            >
                                <div className="command-palette-item-icon">
                                    {item.icon}
                                </div>
                                <div className="command-palette-item-content">
                                    <span className="command-palette-item-title">{item.title}</span>
                                    {item.subtext && (
                                        <span className="command-palette-item-subtext">{item.subtext}</span>
                                    )}
                                </div>
                                <div style={{ flex: 1 }}></div>
                                {item.category === 'Commands' && index === selectedIndex && (
                                    <span className="key-hint">Enter</span>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <div className="command-palette-footer">
                    <span><span className="key-hint">↑↓</span>to navigate</span>
                    <span><span className="key-hint">↵</span>to select</span>
                    <span><span className="key-hint">esc</span>to close</span>
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;
