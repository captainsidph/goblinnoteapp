import React, { useState } from 'react';
import { useNotes } from '../../context/NoteContext';
import { CheckSquare, Square, FileText, CheckCircle2, Eye, EyeOff, ArrowDownWideNarrow } from 'lucide-react';
import './TaskDashboard.css';

const TaskDashboard = () => {
    const { allTasks, toggleTask, setSelectedNoteId, setFilter, setViewMode, setActivePage } = useNotes();
    const [sortOption, setSortOption] = useState('dateDesc');
    const [filterTag, setFilterTag] = useState('all'); // 'all' or specific tag
    const [hideCompleted, setHideCompleted] = useState(false);

    const openNote = (noteId) => {
        setSelectedNoteId(noteId);
        // We stay in task view to allow side-by-side editing
    };

    // Extract all unique tags for filtering
    const availableTags = [...new Set(allTasks.flatMap(task => task.tags || []))].sort();

    const sortedAndFilteredTasks = allTasks
        .filter(task => !hideCompleted || !task.checked)
        .filter(task => filterTag === 'all' || (task.tags && task.tags.includes(filterTag)))
        .sort((a, b) => {
            if (sortOption === 'dateDesc') {
                if (b.noteId !== a.noteId) return b.noteId - a.noteId;
                return a.index - b.index;
            }
            if (sortOption === 'dateAsc') {
                if (a.noteId !== b.noteId) return a.noteId - b.noteId;
                return a.index - b.index;
            }
            if (sortOption === 'alphaAsc') {
                return a.text.localeCompare(b.text);
            }
            if (sortOption === 'alphaDesc') {
                return b.text.localeCompare(a.text);
            }
            if (sortOption === 'dueDateAsc') {
                if (!a.dueDate) return 1; // No date goes to bottom
                if (!b.dueDate) return -1;
                return a.dueDate.localeCompare(b.dueDate);
            }
            if (sortOption === 'dueDateDesc') {
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return b.dueDate.localeCompare(a.dueDate);
            }
            return 0;
        });

    const incompleteTasksCount = allTasks.filter(t => !t.checked).length;
    const completedTasksCount = allTasks.filter(t => t.checked).length;

    if (allTasks.length === 0) {
        return (
            <div className="task-dashboard-empty">
                <CheckCircle2 size={64} className="empty-icon" />
                <h2>No Tasks Found</h2>
                <p>Add tasks to your notes using <code>[ ]</code> or the checklist button.</p>
            </div>
        );
    }

    return (
        <div className="task-dashboard">
            <div className="task-header">
                <div>
                    <h1>Tasks</h1>
                    <div className="task-stats">
                        <span>{incompleteTasksCount} Open</span>
                        <span className="divider">•</span>
                        <span>{completedTasksCount} Completed</span>
                    </div>
                </div>

                <div className="task-controls">
                    <button
                        className={`control-btn ${hideCompleted ? 'active' : ''}`}
                        onClick={() => setHideCompleted(!hideCompleted)}
                        title={hideCompleted ? "Show Completed" : "Hide Completed"}
                    >
                        {hideCompleted ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>

                    {/* Tag Filter */}
                    <div className="sort-dropdown-wrapper">
                        {/* Reusing wrapper for style, maybe rename class later if needed */}
                        <select
                            value={filterTag}
                            onChange={(e) => setFilterTag(e.target.value)}
                            className="task-sort-select"
                            style={{ marginRight: '8px' }}
                        >
                            <option value="all">All Tags</option>
                            {availableTags.map(tag => (
                                <option key={tag} value={tag}>#{tag}</option>
                            ))}
                        </select>
                    </div>

                    <div className="sort-dropdown-wrapper">
                        <ArrowDownWideNarrow size={18} className="sort-icon" />
                        <select
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value)}
                            className="task-sort-select"
                        >
                            <option value="dateDesc">Newest First</option>
                            <option value="dateAsc">Oldest First</option>
                            <option value="dueDateAsc">Due Date (Earliest)</option>
                            <option value="dueDateDesc">Due Date (Latest)</option>
                            <option value="alphaAsc">A-Z</option>
                            <option value="alphaDesc">Z-A</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="task-list">
                {sortedAndFilteredTasks.length === 0 ? (
                    <div className="no-tasks-filtered">
                        <p>No tasks match your filters.</p>
                    </div>
                ) : (
                    sortedAndFilteredTasks.map((task) => (
                        <div key={task.id} className={`task-item ${task.checked ? 'completed' : ''}`}>
                            <button
                                className="task-checkbox-btn"
                                onClick={() => toggleTask(task.noteId, task.index)}
                            >
                                {task.checked ? (
                                    <CheckSquare size={20} className="checkbox-icon checked" />
                                ) : (
                                    <Square size={20} className="checkbox-icon" />
                                )}
                            </button>
                            <div className="task-content">
                                <div className="task-text-row">
                                    <span className="task-text">{task.text}</span>
                                    {task.dueDate && (
                                        <span className={`task-date ${task.dueDate < new Date().toISOString().slice(0, 10) && !task.checked ? 'overdue' : ''
                                            }`}>
                                            {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                    )}
                                </div>
                                <div className="task-meta-row">
                                    <button
                                        className="task-source-link"
                                        onClick={() => openNote(task.noteId)}
                                    >
                                        <FileText size={12} />
                                        {task.noteTitle || 'Untitled Note'}
                                    </button>
                                    {task.tags && task.tags.length > 0 && (
                                        <div className="task-tags">
                                            {task.tags.map(tag => (
                                                <span key={tag} className="task-tag">#{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TaskDashboard;
