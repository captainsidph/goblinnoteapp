import React, { useEffect, useRef, useState } from 'react';
import {
    Heading1, Heading2, Heading3,
    List, ListOrdered, CheckSquare,
    Code, Quote, Image, Minus, X, Link
} from 'lucide-react';
import './SlashMenu.css';

const COMMANDS = [
    {
        id: 'heading1',
        title: 'Heading 1',
        description: 'Big section heading',
        icon: <Heading1 size={18} />,
        syntax: '# '
    },
    {
        id: 'heading2',
        title: 'Heading 2',
        description: 'Medium section heading',
        icon: <Heading2 size={18} />,
        syntax: '## '
    },
    {
        id: 'heading3',
        title: 'Heading 3',
        description: 'Small sub-heading',
        icon: <Heading3 size={18} />,
        syntax: '### '
    },
    {
        id: 'bullet-list',
        title: 'Bullet List',
        description: 'Create a simple bulleted list',
        icon: <List size={18} />,
        syntax: '- '
    },
    {
        id: 'numbered-list',
        title: 'Numbered List',
        description: 'Create a list with numbering',
        icon: <ListOrdered size={18} />,
        syntax: '1. '
    },
    {
        id: 'checkbox',
        title: 'To-Do List',
        description: 'Track tasks with a to-do list',
        icon: <CheckSquare size={18} />,
        syntax: '- [ ] '
    },
    {
        id: 'blockquote',
        title: 'Quote',
        description: 'Capture a quote',
        icon: <Quote size={18} />,
        syntax: '> '
    },
    {
        id: 'code-block',
        title: 'Code Block',
        description: 'Capture a code snippet',
        icon: <Code size={18} />,
        syntax: '```\n\n```',
        cursorOffset: 4 // Move cursor inside the block
    },
    {
        id: 'divider',
        title: 'Divider',
        description: 'Visually divide blocks',
        icon: <Minus size={18} />,
        syntax: '---\n'
    },
    {
        id: 'link-note',
        title: 'Link Note',
        description: 'Link to another note',
        icon: <Link size={18} />,
        syntax: '' // Special handling in parent
    }
    // Images might need special handling depending on implementation (upload vs markdown link)
];

const SlashMenu = ({ position, onSelect, onClose, query = '' }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const menuRef = useRef(null);

    const filteredCommands = COMMANDS.filter(cmd =>
        cmd.title.toLowerCase().includes(query.toLowerCase()) ||
        cmd.description.toLowerCase().includes(query.toLowerCase())
    );

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (filteredCommands.length === 0) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                if (filteredCommands[selectedIndex]) {
                    onSelect(filteredCommands[selectedIndex]);
                }
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [filteredCommands, selectedIndex, onSelect, onClose]);

    // Position is now handled by CSS (Fixed Center)

    if (filteredCommands.length === 0) {
        return (
            <div className="slash-menu" ref={menuRef}>
                <div className="slash-menu-empty">No commands match '{query}'</div>
            </div>
        );
    }

    return (
        <div className="slash-menu" ref={menuRef}>
            <div className="slash-menu-header">
                <span>COMMANDS</span>
                <button className="slash-menu-close-btn" onClick={onClose}>
                    <X size={14} />
                </button>
            </div>
            {filteredCommands.map((cmd, index) => (
                <div
                    key={cmd.id}
                    className={`slash-menu-item ${index === selectedIndex ? 'active' : ''}`}
                    onClick={() => onSelect(cmd)}
                    onMouseEnter={() => setSelectedIndex(index)}
                >
                    <div className="slash-menu-item-icon">
                        {cmd.icon}
                    </div>
                    <div className="slash-menu-item-content">
                        <span className="slash-menu-item-title">{cmd.title}</span>
                        <span className="slash-menu-item-description">{cmd.description}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SlashMenu;
