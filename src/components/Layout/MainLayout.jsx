import React, { useState, useCallback, useEffect } from 'react';
import { useNotes } from '../../context/NoteContext';
import './MainLayout.css';

const MainLayout = ({ sidebar, noteList, editor }) => {
    const { viewMode } = useNotes();
    const [sidebarWidth, setSidebarWidth] = useState(250);
    const [noteListWidth, setNoteListWidth] = useState(300);
    const [isResizing, setIsResizing] = useState(null); // 'sidebar' or 'noteList'
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [activePane, setActivePane] = useState('list'); // 'sidebar', 'list', 'editor'
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            if (!mobile) setIsSidebarOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Sync activePane with context selection
    const { selectedNoteId } = useNotes();
    useEffect(() => {
        if (isMobile && selectedNoteId) {
            setActivePane('editor');
        }
    }, [selectedNoteId, isMobile]);

    const startResizing = useCallback((pane) => {
        if (isMobile) return;
        setIsResizing(pane);
    }, [isMobile]);

    const stopResizing = useCallback(() => {
        setIsResizing(null);
    }, []);

    const resize = useCallback((e) => {
        if (isMobile) return;
        if (isResizing === 'sidebar') {
            const newWidth = e.clientX;
            if (newWidth > 150 && newWidth < 500) {
                setSidebarWidth(newWidth);
            }
        } else if (isResizing === 'noteList') {
            let newWidth;
            if (viewMode === 'default') {
                newWidth = e.clientX - sidebarWidth - 12;
            } else {
                newWidth = e.clientX;
            }

            if (newWidth > 200 && newWidth < 600) {
                setNoteListWidth(newWidth);
            }
        }
    }, [isResizing, sidebarWidth, viewMode, isMobile]);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResizing);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        } else {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }

        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isResizing, resize, stopResizing]);

    const getGridTemplateColumns = () => {
        if (isMobile) return '1fr';
        if (viewMode === 'focus') return '1fr';
        if (viewMode === 'list') return `${noteListWidth}px 12px 1fr`;
        return `${sidebarWidth}px 12px ${noteListWidth}px 12px 1fr`;
    };

    const handleBackToList = () => {
        setActivePane('list');
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div
            className={`main-layout ${isMobile ? 'mobile-view' : ''} ${isSidebarOpen ? 'sidebar-open' : ''}`}
            style={{
                gridTemplateColumns: getGridTemplateColumns()
            }}
        >
            {/* Sidebar Overlay for Mobile */}
            {isMobile && isSidebarOpen && (
                <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
            )}

            {(viewMode === 'default' || (isMobile && isSidebarOpen)) && (
                <>
                    <div className={`pane sidebar-pane ${isMobile && isSidebarOpen ? 'active-mobile-drawer' : ''}`}>
                        {React.cloneElement(sidebar, { onSelect: () => isMobile && setIsSidebarOpen(false) })}
                    </div>

                    {!isMobile && (
                        <div
                            className={`resizer ${isResizing === 'sidebar' ? 'active' : ''}`}
                            onMouseDown={() => startResizing('sidebar')}
                        />
                    )}
                </>
            )}

            {viewMode !== 'focus' && noteList && (!isMobile || activePane === 'list') && (
                <>
                    <div className="pane note-list-pane">
                        {React.cloneElement(noteList, { 
                            onMenuClick: isMobile ? toggleSidebar : undefined,
                            isMobile 
                        })}
                    </div>

                    {!isMobile && (
                        <div
                            className={`resizer ${isResizing === 'noteList' ? 'active' : ''}`}
                            onMouseDown={() => startResizing('noteList')}
                        />
                    )}
                </>
            )}

            <div className={`pane editor-pane ${isMobile && activePane !== 'editor' ? 'hidden-mobile' : ''}`}>
                {React.cloneElement(editor, { 
                    onBack: isMobile ? handleBackToList : undefined,
                    isMobile 
                })}
            </div>
        </div>
    );
};

export default MainLayout;
