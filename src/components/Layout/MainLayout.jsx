import React, { useState, useCallback, useEffect } from 'react';
import { useNotes } from '../../context/NoteContext';
import './MainLayout.css';

const MainLayout = ({ sidebar, noteList, editor }) => {
    const { viewMode } = useNotes();
    const [sidebarWidth, setSidebarWidth] = useState(250);
    const [noteListWidth, setNoteListWidth] = useState(300);
    const [isResizing, setIsResizing] = useState(null); // 'sidebar' or 'noteList'

    const startResizing = useCallback((pane) => {
        setIsResizing(pane);
    }, []);

    const stopResizing = useCallback(() => {
        setIsResizing(null);
    }, []);

    const resize = useCallback((e) => {
        if (isResizing === 'sidebar') {
            const newWidth = e.clientX;
            if (newWidth > 150 && newWidth < 500) {
                setSidebarWidth(newWidth);
            }
        } else if (isResizing === 'noteList') {
            // The note list width is the mouse position minus the sidebar width and the first resizer
            // In list mode, sidebarWidth is effectively 0 for calculation purposes if we want to drag it,
            // but simplified: if we are in list mode, the sidebar isn't there, so e.clientX is directly the width.

            let newWidth;
            if (viewMode === 'default') {
                newWidth = e.clientX - sidebarWidth - 4;
            } else {
                newWidth = e.clientX;
            }

            if (newWidth > 200 && newWidth < 600) {
                setNoteListWidth(newWidth);
            }
        }
    }, [isResizing, sidebarWidth, viewMode]);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResizing);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none'; // Prevent text selection while dragging
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
        if (viewMode === 'focus') return '1fr';
        if (viewMode === 'list') return `${noteListWidth}px 4px 1fr`;
        return `${sidebarWidth}px 4px ${noteListWidth}px 4px 1fr`;
    };

    return (
        <div
            className="main-layout"
            style={{
                gridTemplateColumns: getGridTemplateColumns()
            }}
        >
            {viewMode === 'default' && (
                <>
                    <div className="pane sidebar-pane">
                        {sidebar}
                    </div>

                    <div
                        className={`resizer ${isResizing === 'sidebar' ? 'active' : ''}`}
                        onMouseDown={() => startResizing('sidebar')}
                    />
                </>
            )}

            {viewMode !== 'focus' && noteList && (
                <>
                    <div className="pane note-list-pane">
                        {noteList}
                    </div>

                    <div
                        className={`resizer ${isResizing === 'noteList' ? 'active' : ''}`}
                        onMouseDown={() => startResizing('noteList')}
                    />
                </>
            )}

            <div className="pane editor-pane">
                {editor}
            </div>
        </div>
    );
};

export default MainLayout;
