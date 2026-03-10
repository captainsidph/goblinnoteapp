import React, { useState, useMemo } from 'react';
import { useNotes } from '../../context/NoteContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './CalendarWidget.css';

const CalendarWidget = () => {
    const { notes, setFilter, filter } = useNotes();
    const [currentDate, setCurrentDate] = useState(new Date());

    // Helper to get days in month
    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate();
    };

    // Helper to get day of week for first day (0-6)
    const getFirstDayOfMonth = (year, month) => {
        return new Date(year, month, 1).getDay();
    };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    // Identify days with notes
    const daysWithNotes = useMemo(() => {
        const result = new Set();
        notes.forEach(note => {
            if (note.isTrashed) return;
            const noteDate = new Date(note.id);
            if (noteDate.getFullYear() === year && noteDate.getMonth() === month) {
                result.add(noteDate.getDate());
            }
        });
        return result;
    }, [notes, year, month]);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const handleDayClick = (day) => {
        // Construct date for filter (00:00:00 local time)
        const filterDate = new Date(year, month, day);
        setFilter({ type: 'date', id: filterDate.getTime() });
    };

    const renderDays = () => {
        const days = [];
        const today = new Date();

        // Empty slots for days before first of month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
            const hasNotes = daysWithNotes.has(day);

            // Check if selected
            let isSelected = false;
            if (filter.type === 'date') {
                const filterDate = new Date(filter.id);
                if (filterDate.getDate() === day && filterDate.getMonth() === month && filterDate.getFullYear() === year) {
                    isSelected = true;
                }
            }

            days.push(
                <div
                    key={day}
                    className={`calendar-day ${isToday ? 'today' : ''} ${hasNotes ? 'has-notes' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleDayClick(day)}
                >
                    {day}
                </div>
            );
        }
        return days;
    };

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <div className="calendar-widget">
            <div className="calendar-header">
                <button className="calendar-nav-btn" onClick={handlePrevMonth}><ChevronLeft size={16} /></button>
                <div className="calendar-title" onClick={() => setFilter({ type: 'all', id: null })}>
                    {monthNames[month]} {year}
                </div>
                <button className="calendar-nav-btn" onClick={handleNextMonth}><ChevronRight size={16} /></button>
            </div>
            <div className="calendar-grid">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <div key={i} className="calendar-day-header">{d}</div>
                ))}
                {renderDays()}
            </div>
        </div>
    );
};

export default CalendarWidget;
