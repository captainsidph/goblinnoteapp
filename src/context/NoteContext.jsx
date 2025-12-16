import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import * as db from '../db';
import { cloudService } from '../services/CloudStorageService';

const NoteContext = createContext();

export const useNotes = () => {
    const context = useContext(NoteContext);
    if (!context) {
        throw new Error('useNotes must be used within a NoteProvider');
    }
    return context;
};

export const NoteProvider = ({ children }) => {
    const [notes, setNotes] = useState([]);
    const [folders, setFolders] = useState([]);
    const [tags, setTags] = useState([]);
    const [selectedNoteId, _setSelectedNoteId] = useState(null);
    const [filter, setFilter] = useState({ type: 'all', id: null });
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('default'); // 'default', 'list', 'focus'
    const [noteWidth, setNoteWidth] = useState('optimum'); // 'optimum', 'full'
    const [activePage, setActivePage] = useState('notes'); // 'notes', 'tasks'

    // Tab management state
    const [openTabs, setOpenTabs] = useState(() => {
        const saved = localStorage.getItem('openTabs');
        return saved ? JSON.parse(saved) : [];
    });
    const [activeTabId, setActiveTabId] = useState(() => {
        const saved = localStorage.getItem('activeTabId');
        return saved ? parseInt(saved) : null;
    });

    // Custom setSelectedNoteId to sync tabs
    const setSelectedNoteId = (id) => {
        _setSelectedNoteId(id);

        // If we are working with tabs (have an active tab), sync the navigation
        if (id && activeTabId) {
            // Check if target note is already in a tab
            if (openTabs.includes(id)) {
                // Just switch focus to that tab
                setActiveTabId(id);
            } else {
                // Replace current tab with new note
                setOpenTabs(prev => prev.map(tid => tid === activeTabId ? id : tid));
                setActiveTabId(id);
            }
        } else if (id && openTabs.length > 0 && !activeTabId) {
            // Edge case: Tabs exist but none active? unlikely, but handle by setting active
            if (openTabs.includes(id)) {
                setActiveTabId(id);
            }
        }
    };

    // Initialize theme from localStorage or system preference
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) return savedTheme;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    const [fontSize, setFontSize] = useState(() => {
        const savedSize = localStorage.getItem('fontSize');
        return savedSize || 'medium';
    });

    const [isLoading, setIsLoading] = useState(true);

    // Apply theme and font size to document
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        document.documentElement.setAttribute('data-font-size', fontSize);
        localStorage.setItem('fontSize', fontSize);
    }, [fontSize]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    // Persist tabs to localStorage
    useEffect(() => {
        localStorage.setItem('openTabs', JSON.stringify(openTabs));
        if (activeTabId !== null) {
            localStorage.setItem('activeTabId', activeTabId.toString());
        } else {
            localStorage.removeItem('activeTabId');
        }
    }, [openTabs, activeTabId]);

    // Initial Data for seeding
    const initialNotes = [
        {
            id: 1,
            title: 'Project Ideas',
            content: 'Here are some ideas for the new project. We should consider using React...',
            preview: 'Here are some ideas for the new project. We should consider using React...',
            date: 'Oct 24',
            tags: ['work', 'ideas'],
            folderId: 2
        },
        {
            id: 2,
            title: 'Grocery List',
            content: 'Milk, Eggs, Bread, Butter, Cheese, Apples, Bananas...',
            preview: 'Milk, Eggs, Bread, Butter, Cheese, Apples, Bananas...',
            date: 'Oct 23',
            tags: ['personal'],
            folderId: 1
        },
        {
            id: 3,
            title: 'Meeting Notes',
            content: 'Discussed the Q4 roadmap. Key takeaways: 1. Focus on performance...',
            preview: 'Discussed the Q4 roadmap. Key takeaways: 1. Focus on performance...',
            date: 'Oct 22',
            tags: ['work'],
            folderId: 2
        },
        {
            id: 4,
            title: 'Book Recommendations',
            content: 'The Pragmatic Programmer, Clean Code, Refactoring...',
            preview: 'The Pragmatic Programmer, Clean Code, Refactoring...',
            date: 'Oct 20',
            tags: ['reading'],
            folderId: 3
        }
    ];

    const initialFolders = [
        { id: 1, name: 'Personal' },
        { id: 2, name: 'Work' },
        { id: 3, name: 'Ideas' },
    ];

    // Load data from DB on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                let dbNotes = await db.getAllNotes();
                let dbFolders = await db.getAllFolders();
                let dbTags = await db.getAllTags();

                // Seed DB if empty
                if (dbNotes.length === 0 && dbFolders.length === 0) {
                    console.log('Seeding database...');
                    for (const note of initialNotes) {
                        await db.saveNote(note);
                    }
                    for (const folder of initialFolders) {
                        await db.saveFolder(folder);
                    }
                    dbNotes = initialNotes;
                    dbFolders = initialFolders;
                }

                // Migration: If tags are empty but notes exist, derive tags and save them
                if (dbTags.length === 0 && dbNotes.length > 0) {
                    const derivedTags = new Set();
                    dbNotes.forEach(note => {
                        if (note.tags) note.tags.forEach(t => derivedTags.add(t));
                    });

                    if (derivedTags.size > 0) {
                        console.log('Migrating tags to persistent storage...');
                        const newTags = Array.from(derivedTags).map((tag, index) => ({
                            id: Date.now() + index,
                            name: tag,
                            parentId: null
                        }));

                        for (const tag of newTags) {
                            await db.saveTag(tag);
                        }
                        dbTags = newTags;
                    }
                }

                setNotes(dbNotes.sort((a, b) => b.id - a.id)); // Sort by newest
                setFolders(dbFolders);
                setTags(dbTags);

                // Set selection based on active tab or defaults
                if (activeTabId && dbNotes.find(n => n.id === activeTabId)) {
                    _setSelectedNoteId(activeTabId);
                } else if (dbNotes.length > 0) {
                    _setSelectedNoteId(dbNotes[0].id);
                }
            } catch (error) {
                console.error('Failed to load data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    // Tags are now persistent state, not derived
    // const tags = useMemo(() => ... );

    const [sortOption, setSortOption] = useState('dateDesc');

    // ... (theme logic matches existing)

    // Filter and Sort notes
    const filteredNotes = useMemo(() => {
        let result = [];
        if (filter.type === 'all') result = notes.filter(n => !n.isTrashed);
        else if (filter.type === 'pinned') result = notes.filter(n => n.isPinned && !n.isTrashed);
        else if (filter.type === 'folder') result = notes.filter(n => n.folderId === filter.id && !n.isTrashed);
        else if (filter.type === 'tag') result = notes.filter(n => n.tags && n.tags.includes(filter.id) && !n.isTrashed);
        else if (filter.type === 'date') {
            const filterDateStr = new Date(filter.id).toDateString(); // Compare by date string (ignoring time)
            result = notes.filter(n => {
                if (n.isTrashed) return false;
                // Handle legacy IDs (small numbers) vs Timestamps
                // If ID is small, we fallback to 'date' string parsing? 
                // Creating a date from small int results in 1970. 
                // Let's assume ID is timestamp. If it's legacy, tough luck for now or we rely on 'date' field parsing if standardized.
                // Our current seed data has date: 'Oct 24'. 
                // Let's just use timestamp.
                const noteDate = new Date(n.id);
                return noteDate.toDateString() === filterDateStr;
            });
        }
        else if (filter.type === 'trash') result = notes.filter(n => n.isTrashed);
        else result = notes.filter(n => !n.isTrashed);

        return result.filter(n => {
            if (!searchQuery) return true;
            const query = searchQuery.toLowerCase();
            return (
                (n.title && n.title.toLowerCase().includes(query)) ||
                (n.content && n.content.toLowerCase().includes(query)) ||
                (n.tags && n.tags.some(tag => tag.toLowerCase().includes(query)))
            );
        }).sort((a, b) => {
            // Pinned notes always at top (unless in trash? User didn't specify, but usually yes)
            if (filter.type !== 'trash') {
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
            }

            if (sortOption === 'dateDesc') return b.id - a.id; // Using ID as generic timestamp
            if (sortOption === 'dateAsc') return a.id - b.id;
            if (sortOption === 'titleAsc') return (a.title || '').localeCompare(b.title || '');
            if (sortOption === 'titleDesc') return (b.title || '').localeCompare(a.title || '');
            return 0;
        });
    }, [notes, filter, sortOption, searchQuery]);

    const addNote = async () => {
        const newNote = {
            id: Date.now(),
            title: 'New Note',
            content: '',
            preview: 'No additional text',
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            tags: [],
            folderId: filter.type === 'folder' ? filter.id : (folders[0]?.id || 1),
            isTrashed: false,
            isPinned: false
        };

        // Optimistic update
        setNotes([newNote, ...notes]);
        setSelectedNoteId(newNote.id);

        // Save to DB
        await db.saveNote(newNote);
    };

    const updateNote = async (id, updatedFields) => {
        // Optimistic update
        const updatedNotes = notes.map(note => {
            if (note.id === id) {
                const updatedNote = { ...note, ...updatedFields };
                // Update preview if content changes
                if (updatedFields.content !== undefined) {
                    updatedNote.preview = updatedFields.content.slice(0, 100) + (updatedFields.content.length > 100 ? '...' : '');
                }
                return updatedNote;
            }
            return note;
        });
        setNotes(updatedNotes);

        // Save to DB
        const noteToSave = updatedNotes.find(n => n.id === id);
        if (noteToSave) {
            await db.saveNote(noteToSave);
        }
    };

    const deleteNote = async (id) => {
        // Find next note to select if we are deleting the selected one
        if (selectedNoteId === id) {
            const currentIndex = filteredNotes.findIndex(n => n.id === id);
            let nextId = null;
            if (currentIndex !== -1) {
                if (currentIndex < filteredNotes.length - 1) {
                    nextId = filteredNotes[currentIndex + 1].id;
                } else if (currentIndex > 0) {
                    nextId = filteredNotes[currentIndex - 1].id;
                }
            }
            setSelectedNoteId(nextId);
        }

        // Soft delete
        updateNote(id, { isTrashed: true });
    };

    const restoreNote = async (id) => {
        updateNote(id, { isTrashed: false });
    };

    const permanentlyDeleteNote = async (id) => {
        // Find next note to select if we are deleting the selected one
        if (selectedNoteId === id) {
            const currentIndex = filteredNotes.findIndex(n => n.id === id);
            let nextId = null;
            if (currentIndex !== -1) {
                if (currentIndex < filteredNotes.length - 1) {
                    nextId = filteredNotes[currentIndex + 1].id;
                } else if (currentIndex > 0) {
                    nextId = filteredNotes[currentIndex - 1].id;
                }
            }
            setSelectedNoteId(nextId);
        }

        // Optimistic update
        setNotes(notes.filter(n => n.id !== id));

        // Delete from DB
        await db.deleteNote(id);
    };

    const emptyTrash = async () => {
        const trashedNotes = notes.filter(n => n.isTrashed);
        if (trashedNotes.length === 0) return;

        // Optimistic update: keep only non-trashed notes
        setNotes(notes.filter(n => !n.isTrashed));

        // Reset selection if the selected note was in trash
        const selectedOriginal = notes.find(n => n.id === selectedNoteId);
        if (selectedOriginal && selectedOriginal.isTrashed) {
            setSelectedNoteId(null);
        }

        // Delete all trashed notes from DB
        for (const note of trashedNotes) {
            await db.deleteNote(note.id);
        }
    };

    const getTasksFromNote = (note) => {
        if (!note.content) return [];

        const tasks = [];
        const lines = note.content.split('\n');

        lines.forEach((line, index) => {
            // Match "- [ ] text" or "[ ] text" or "- [x] text"
            const match = line.match(/^[-*]?\s*\[([ xX])\]\s*(.*)$/);
            if (match) {
                const isChecked = match[1].toLowerCase() === 'x';
                let text = match[2];

                // Extract due date: @YYYY-MM-DD
                let dueDate = null;
                const dueDateMatch = text.match(/@(\d{4}-\d{2}-\d{2})/);
                if (dueDateMatch) {
                    dueDate = dueDateMatch[1];
                    // Option: Remove date from text? Keeping it for now as per plan users might want to see context
                }

                // Extract tags: #tag
                const tags = [];
                const tagMatches = text.match(/#[a-zA-Z0-9_\-]+/g);
                if (tagMatches) {
                    tagMatches.forEach(tag => tags.push(tag.substring(1))); // Remove #
                }

                tasks.push({
                    id: `${note.id}-${index}`,
                    noteId: note.id,
                    noteTitle: note.title,
                    text: text,
                    originalText: text, // Keep original parsing
                    dueDate: dueDate,
                    tags: tags,
                    checked: isChecked,
                    index: index // Line number as index
                });
            }
        });

        return tasks;
    };

    const allTasks = useMemo(() => {
        // Filter out trashed notes for global tasks view
        return notes
            .filter(n => !n.isTrashed)
            .flatMap(note => getTasksFromNote(note));
    }, [notes]);

    const toggleTask = (noteId, taskIndex) => {
        const note = notes.find(n => n.id === noteId);
        if (!note) return;

        const lines = note.content.split('\n');
        if (taskIndex >= 0 && taskIndex < lines.length) {
            const line = lines[taskIndex];
            // Toggle [ ] to [x] and vice versa
            // We use a regex to replace just the brackets part to preserve indentation/dash if present
            const newLine = line.replace(/^([-*]?\s*)\[([ xX])\]/, (match, prefix, status) => {
                const isChecked = status.toLowerCase() === 'x';
                return `${prefix}[${isChecked ? ' ' : 'x'}]`;
            });

            if (newLine !== line) {
                const newLines = [...lines];
                newLines[taskIndex] = newLine;
                updateNote(noteId, { content: newLines.join('\n') });
            }
        }
    };

    const selectedNote = notes.find(n => n.id === selectedNoteId);

    const togglePin = async (id) => {
        const note = notes.find(n => n.id === id);
        if (note) {
            updateNote(id, { isPinned: !note.isPinned });
        }
    };

    // Tab management functions
    const openTab = (noteId) => {
        // Check if tab is already open
        if (openTabs.includes(noteId)) {
            // Switch to existing tab
            setActiveTabId(noteId);
            setSelectedNoteId(noteId);
        } else {
            // Open new tab (max 10 tabs)
            if (openTabs.length >= 10) {
                // Remove oldest tab (first in array)
                const newTabs = [...openTabs.slice(1), noteId];
                setOpenTabs(newTabs);
            } else {
                setOpenTabs([...openTabs, noteId]);
            }
            setActiveTabId(noteId);
            setSelectedNoteId(noteId);
        }
    };

    const closeTab = (noteId) => {
        const tabIndex = openTabs.indexOf(noteId);
        if (tabIndex === -1) return;

        const newTabs = openTabs.filter(id => id !== noteId);
        setOpenTabs(newTabs);

        // If closing active tab, switch to adjacent tab
        if (activeTabId === noteId) {
            if (newTabs.length === 0) {
                setActiveTabId(null);
                setSelectedNoteId(null);
            } else {
                // Switch to next tab, or previous if closing last tab
                const newActiveId = newTabs[tabIndex] || newTabs[tabIndex - 1];
                setActiveTabId(newActiveId);
                setSelectedNoteId(newActiveId);
            }
        }
    };

    const switchTab = (noteId) => {
        if (openTabs.includes(noteId)) {
            setActiveTabId(noteId);
            setSelectedNoteId(noteId);
        }
    };

    const closeAllTabs = () => {
        setOpenTabs([]);
        setActiveTabId(null);
        setSelectedNoteId(null);
    };

    const addFolder = async (name, parentId = null) => {
        const newFolder = {
            id: Date.now(),
            name,
            parentId
        };
        setFolders([...folders, newFolder]);
        await db.saveFolder(newFolder);
    };

    const deleteFolder = async (id) => {
        // Prevent deletion if it has children folders
        if (folders.some(f => f.parentId === id)) {
            alert("Cannot delete folder with subfolders. Please delete subfolders first.");
            return;
        }
        // Move notes in this folder to default folder (or Trash? let's move to default for safety)
        // Actually, let's just not allow deleting non-empty folders for now for simplicity
        const hasNotes = notes.some(n => n.folderId === id && !n.isTrashed);
        if (hasNotes) {
            alert("Cannot delete non-empty folder. Please move or delete notes first.");
            return;
        }

        setFolders(folders.filter(f => f.id !== id));
        await db.deleteFolder(id);
    };

    const addTag = async (name, parentId = null) => {
        const newTag = {
            id: Date.now(),
            name,
            parentId
        };
        setTags([...tags, newTag]);
        await db.saveTag(newTag);
    };

    const deleteTag = async (id) => {
        // Recursive delete or prevent? Let's prevent for now
        if (tags.some(t => t.parentId === id)) {
            alert("Cannot delete tag with subtags.");
            return;
        }

        const tagToDelete = tags.find(t => t.id === id);
        if (!tagToDelete) return;

        // Remove tag from all notes? 
        // Existing logic uses tag NAME in notes. 
        // We should probably allow deleting the tag entity, but the notes will still have the string?
        // Or we should clean up notes.
        // For now, just delete the tag entity. Notes will keep the string but it won't show in sidebar.
        setTags(tags.filter(t => t.id !== id));
        await db.deleteTag(id);
    };

    const exportData = async () => {
        const data = {
            notes,
            folders,
            tags,
            version: 1,
            timestamp: Date.now()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `note-app-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const importData = async (jsonData) => {
        try {
            const data = JSON.parse(jsonData);
            if (!data.notes || !data.folders || !data.tags) {
                throw new Error("Invalid backup file format");
            }

            const conflicts = [];
            const nonConflictingNotes = [];

            // 1. Process Folders (Overwrite/Union - Folders logic is simple, assume overwrite for simplicity or standard union)
            // For now, let's just save all imported folders.
            for (const folder of data.folders) {
                await db.saveFolder(folder);
            }

            // 2. Process Tags
            for (const tag of data.tags) {
                await db.saveTag(tag);
            }

            // 3. Process Notes (Detect Conflicts)
            for (const impNote of data.notes) {
                const existing = notes.find(n => n.id === impNote.id);
                // Conflict condition: ID matches AND content matches AND date is different or content different
                // Actually, if content is different, it's a conflict.
                if (existing) {
                    if (existing.content !== impNote.content || existing.title !== impNote.title) {
                        conflicts.push({
                            local: existing,
                            imported: impNote
                        });
                    } else {
                        // Content identical, do nothing or just update (idempotent)
                        // We can skip to save perf, or save to be sure.
                    }
                } else {
                    nonConflictingNotes.push(impNote);
                }
            }

            // Save non-conflicting notes
            for (const note of nonConflictingNotes) {
                await db.saveNote(note);
            }

            // Refresh state
            const newFolders = await db.getAllFolders();
            const newTags = await db.getAllTags();
            const newNotes = await db.getAllNotes();

            setFolders(newFolders);
            setTags(newTags);
            setNotes(newNotes.sort((a, b) => b.id - a.id));

            return { success: true, conflicts };

        } catch (error) {
            console.error("Import failed:", error);
            return { success: false, error: error.message };
        }
    };

    // Cloud Storage Logic
    const [isCloudLoading, setIsCloudLoading] = useState(false);
    const [cloudConnection, setCloudConnection] = useState(false);

    // Check connection on mount
    useEffect(() => {
        // We import cloudService here dynamically or outside? 
        // Best to use the one imported at top (need to add import).
        // Assuming cloudService handles its own persistence check in constructor,
        // we just update our local state to match.
        // Actually we need to import it first. 
    }, []);




    const resolveConflict = async (conflictId, choice, importedNote) => {
        if (choice === 'keep_imported') {
            await db.saveNote(importedNote);
        } else if (choice === 'keep_both') {
            const newNote = { ...importedNote, id: Date.now(), title: `${importedNote.title} (Imported)` };
            await db.saveNote(newNote);
        }
        // 'keep_local' logic is simply doing nothing.

        // Refresh state after resolution
        const allNotes = await db.getAllNotes();
        setNotes(allNotes.sort((a, b) => b.id - a.id));
    };

    // Cloud Functions
    const checkForRedirect = () => {
        const token = cloudService.handleRedirect();
        if (token) {
            // Token found and set
            return true;
        }
        return false;
    };

    const loginWithDropbox = (appKey) => {
        return cloudService.getAuthUrl(appKey);
    };

    const connectDropbox = (token) => {
        cloudService.setAccessToken(token);
        return true;
    };

    const disconnectDropbox = () => {
        cloudService.logout();
    };

    const isDropboxConnected = () => cloudService.isConnected();

    const uploadBackup = async () => {
        setIsLoading(true); // Reuse main loading or local?
        try {
            const data = {
                notes,
                folders,
                tags,
                version: 1,
                timestamp: Date.now()
            };
            const jsonString = JSON.stringify(data, null, 2);
            const fileName = `note-app-backup-${new Date().toISOString().slice(0, 10)}.json`; // Basic name
            // Add time to make it unique? Dropbox overwrites by default in our service logic or we can append time.
            // Let's stick to date for simplicity, maybe add time.
            const uniqueName = `backup-${new Date().getTime()}.json`;

            await cloudService.upload(uniqueName, jsonString);
            return { success: true };
        } catch (error) {
            console.error("Upload failed", error);
            return { success: false, error: error.message };
        } finally {
            setIsLoading(false);
        }
    };

    const listCloudBackups = async () => {
        try {
            const files = await cloudService.list();
            return files.sort((a, b) => {
                // simple sort by name or client_modified
                return new Date(b.client_modified).getTime() - new Date(a.client_modified).getTime();
            });
        } catch (error) {
            console.error("List failed", error);
            return [];
        }
    };

    const restoreFromCloud = async (path) => {
        setIsLoading(true);
        try {
            const jsonString = await cloudService.download(path);
            // Reuse importData logic!
            return await importData(jsonString);
        } catch (error) {
            console.error("Cloud Restore failed", error);
            return { success: false, error: error.message };
        } finally {
            setIsLoading(false);
        }
    };
    const value = {
        notes,
        filteredNotes,
        folders,
        tags,
        selectedNoteId,
        setSelectedNoteId,
        selectedNote,
        addNote,
        updateNote,
        deleteNote,
        restoreNote,

        permanentlyDeleteNote,
        emptyTrash,
        addFolder,
        deleteFolder,
        addTag,
        deleteTag,
        filter,
        setFilter,
        viewMode,
        setViewMode,
        noteWidth,
        setNoteWidth,
        activePage,
        setActivePage,
        theme,
        toggleTheme,
        setTheme,
        fontSize,
        setFontSize,
        isLoading,
        allTasks,
        toggleTask,
        sortOption,
        setSortOption,
        searchQuery,
        setSearchQuery,
        togglePin,
        // Tab management
        openTabs,
        activeTabId,
        openTab,
        closeTab,
        switchTab,
        closeAllTabs,
        // Backup
        exportData,
        importData,
        resolveConflict,
        // Cloud
        connectDropbox,
        loginWithDropbox,
        checkForRedirect,
        disconnectDropbox,
        disconnectDropbox,
        isDropboxConnected,
        uploadBackup,
        listCloudBackups,
        restoreFromCloud,
        saveImageToDb: db.saveImage,
        getImageFromDb: db.getImage
    };

    if (isLoading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
    }

    return (
        <NoteContext.Provider value={value}>
            {children}
        </NoteContext.Provider>
    );
};
