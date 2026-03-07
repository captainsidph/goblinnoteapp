import React from 'react';

const FluentEmoji = ({ name, size = 20, className = "" }) => {
    // Using LobeHub's Fluent Emoji CDN which provides high-quality 3D WebP renders
    const url = `https://fastly.jsdelivr.net/gh/microsoft/fluentui-emoji@latest/assets/${name}/3D/${name.toLowerCase()}_3d.png`;

    // Fallback names mapping if needed
    const nameMap = {
        'Star': 'Star',
        'Memo': 'Memo',
        'Calendar': 'Calendar',
        'Folder': 'Open file folder',
        'Tag': 'Label',
        'Trash': 'Wastebasket',
        'Check': 'Check mark button',
        'Gear': 'Gear',
        'Plus': 'Plus',
        'Sun': 'Sun',
        'Moon': 'Moon',
        'Search': 'Magnifying glass tilted left',
        'Sort': 'Downwards button',
        'ChevronDown': 'Down arrow',
        'ChevronRight': 'Right arrow',
        'Layout': 'Framed picture',
        'Columns': 'Input numbers',
        'Maximize': 'Full screen',
        'Monitor': 'Desktop computer',
        'Text': 'Memo',
        'Type': 'Input latin letters',
        'Link': 'Link',
        'Footer': 'Slot machine',
        'Eye': 'Eye',
        'EyeOff': 'Eye with alter symbol',
        'Rotate': 'Counterclockwise arrows button',
        'Download': 'Inbox tray',
        'Clear': 'Multiply',
        'H1': 'Keycap digit one',
        'H2': 'Keycap digit two',
        'H3': 'Keycap digit three',
        'List': 'Input symbols',
        'OrderedList': 'Input numbers',
        'Quote': 'Speech balloon',
        'Code': 'Input symbols',
        'Minus': 'Horizontal bar',
        'ChevronLeft': 'Left arrow',
        'Terminal': 'Keyboard',
        'FileText': 'Memo',
        'Square': 'White large square',
        'CheckCircle': 'Check mark button',
        'ArrowRight': 'Right arrow',
        'Save': 'Floppy disk',
        'Copy': 'Clipboard',
        'Alert': 'Warning',
        'Cloud': 'Cloud',
        'Archive': 'Archive box'
    };

    const assetName = nameMap[name] || name;
    const formattedName = assetName.replace(/ /g, '_');
    const finalUrl = `https://fastly.jsdelivr.net/gh/microsoft/fluentui-emoji@latest/assets/${assetName.replace(/ /g, '%20')}/3D/${formattedName.toLowerCase()}_3d.png`;

    return (
        <div
            className={`fluent-emoji-wrapper ${className}`}
            style={{
                width: size,
                height: size,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
                transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
        >
            <img
                src={finalUrl}
                alt={name}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={(e) => {
                    e.target.style.display = 'none';
                }}
            />
        </div>
    );
};

export default FluentEmoji;
