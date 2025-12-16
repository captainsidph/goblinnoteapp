/**
 * Export Utilities
 * Helper functions for exporting notes in various formats
 */

/**
 * Export a single note as Markdown file
 */
export const exportNoteAsMarkdown = (note) => {
    const content = `# ${note.title}\n\n${note.content || ''}`;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sanitizeFilename(note.title)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

/**
 * Export all notes as a ZIP archive of Markdown files
 */
export const exportAllNotesAsZip = async (notes, folders) => {
    const JSZip = (await import('jszip')).default;
    const { saveAs } = await import('file-saver');

    const zip = new JSZip();

    // Create folder structure
    const folderMap = {};
    folders.forEach(folder => {
        folderMap[folder.id] = folder.name;
    });

    // Add notes to ZIP
    notes.forEach(note => {
        if (note.isTrashed) return; // Skip trashed notes

        const content = `# ${note.title}\n\n${note.content || ''}`;
        const folderName = note.folderId && folderMap[note.folderId]
            ? sanitizeFilename(folderMap[note.folderId])
            : 'Unfiled';
        const fileName = `${sanitizeFilename(note.title)}.md`;

        // Add to folder in ZIP
        zip.folder(folderName).file(fileName, content);
    });

    // Generate and download ZIP
    const blob = await zip.generateAsync({ type: 'blob' });
    const timestamp = new Date().toISOString().slice(0, 10);
    saveAs(blob, `notes-export-${timestamp}.zip`);
};

/**
 * Import Markdown files
 */
export const importMarkdownFiles = async (files, addNote, currentFolderId) => {
    const imported = [];

    for (const file of files) {
        if (!file.name.endsWith('.md')) continue;

        const content = await file.text();
        const title = file.name.replace('.md', '');

        // Parse title from first H1 if exists
        const h1Match = content.match(/^#\s+(.+)$/m);
        const parsedTitle = h1Match ? h1Match[1] : title;

        // Remove title from content if it was an H1
        const cleanContent = h1Match
            ? content.replace(/^#\s+.+\n\n?/, '')
            : content;

        const newNote = {
            id: Date.now() + imported.length,
            title: parsedTitle,
            content: cleanContent,
            preview: cleanContent.slice(0, 100) + (cleanContent.length > 100 ? '...' : ''),
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            tags: [],
            folderId: currentFolderId || 1,
            isTrashed: false,
            isPinned: false
        };

        imported.push(newNote);
    }

    return imported;
};

/**
 * Import ZIP archive of Markdown files
 */
export const importZipArchive = async (file, addNote, folders) => {
    const JSZip = (await import('jszip')).default;

    const zip = await JSZip.loadAsync(file);
    const imported = [];
    let importIndex = 0;

    // Process each file in ZIP
    for (const [path, zipEntry] of Object.entries(zip.files)) {
        if (zipEntry.dir || !path.endsWith('.md')) continue;

        const content = await zipEntry.async('text');
        const pathParts = path.split('/');
        const fileName = pathParts[pathParts.length - 1];
        const folderName = pathParts.length > 1 ? pathParts[0] : null;

        // Find or create folder
        let folderId = 1;
        if (folderName) {
            const existingFolder = folders.find(f => f.name === folderName);
            folderId = existingFolder ? existingFolder.id : 1;
        }

        // Parse title
        const title = fileName.replace('.md', '');
        const h1Match = content.match(/^#\s+(.+)$/m);
        const parsedTitle = h1Match ? h1Match[1] : title;

        // Remove title from content if it was an H1
        const cleanContent = h1Match
            ? content.replace(/^#\s+.+\n\n?/, '')
            : content;

        const newNote = {
            id: Date.now() + importIndex++,
            title: parsedTitle,
            content: cleanContent,
            preview: cleanContent.slice(0, 100) + (cleanContent.length > 100 ? '...' : ''),
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            tags: [],
            folderId,
            isTrashed: false,
            isPinned: false
        };

        imported.push(newNote);
    }

    return imported;
};

/**
 * Trigger print dialog for PDF export
 */
export const exportNoteToPDF = () => {
    window.print();
};

/**
 * Sanitize filename for safe file system usage
 */
const sanitizeFilename = (filename) => {
    return filename
        .replace(/[/\\?%*:|"<>]/g, '-')
        .replace(/\s+/g, '_')
        .slice(0, 200); // Limit length
};
