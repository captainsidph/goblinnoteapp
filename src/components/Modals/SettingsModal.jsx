import React, { useRef, useState, useEffect } from 'react';
import { useNotes } from '../../context/NoteContext';
import { X, Download, Upload, AlertTriangle, CloudUpload, Moon, Sun, Type, FileArchive, FileText } from 'lucide-react';
import './CreateModal.css'; // Reusing modal base styles
import './SettingsModal.css';
import ConflictResolutionModal from './ConflictResolutionModal';
import { exportAllNotesAsZip, importMarkdownFiles, importZipArchive } from '../../utils/exportUtils';

const SettingsModal = ({ isOpen, onClose }) => {
    const {
        exportData,
        importData,
        disconnectDropbox,
        isDropboxConnected,
        uploadBackup,
        listCloudBackups,
        restoreFromCloud,
        loginWithDropbox,
        checkForRedirect,
        theme,
        setTheme,
        fontSize,
        setFontSize,
        notes,
        folders,
        filter,
        addNote,
        updateNote
    } = useNotes();
    const [importFile, setImportFile] = useState(null);
    const [conflicts, setConflicts] = useState([]);
    const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');

    // Cloud State
    const [appKey, setAppKey] = useState('z957yu82yrqpr39'); // Pre-fill with user's key
    const [cloudBackups, setCloudBackups] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isLoadingList, setIsLoadingList] = useState(false);

    const fileInputRef = useRef(null);
    const markdownInputRef = useRef(null);
    const zipInputRef = useRef(null);

    // Check for redirect on mount
    useEffect(() => {
        if (checkForRedirect()) {
            setStatusMsg("Successfully connected to Dropbox!");
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    const handleLoginDropbox = async () => {
        try {
            const authUrl = await loginWithDropbox(appKey);
            window.location.href = authUrl;
        } catch (e) {
            setStatusMsg("Error: " + e.message);
        }
    };

    const handleUploadBackup = async () => {
        setIsUploading(true);
        setStatusMsg("Uploading...");
        const result = await uploadBackup();
        setIsUploading(false);
        if (result.success) {
            setStatusMsg("Backup uploaded successfully!");
            refreshCloudList();
        } else {
            setStatusMsg("Error uploading: " + result.error);
        }
    };

    const refreshCloudList = async () => {
        setIsLoadingList(true);
        const list = await listCloudBackups();
        setCloudBackups(list);
        setIsLoadingList(false);
    };

    const handleRestoreCloud = async (path) => {
        setStatusMsg("Restoring from cloud...");
        const result = await restoreFromCloud(path);
        if (result.success) {
            if (result.conflicts && result.conflicts.length > 0) {
                setConflicts(result.conflicts);
                setIsConflictModalOpen(true);
            } else {
                setStatusMsg('Import successful! Data restored from Cloud.');
            }
        } else {
            setStatusMsg("Error restoring: " + result.error);
        }
    };

    if (!isOpen) return null;

    const handleExport = () => {
        exportData();
        setStatusMsg('Backup downloaded successfully.');
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setImportFile(e.target.files[0]);
            setStatusMsg('');
        }
    };

    const handleImport = async () => {
        if (!importFile) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const json = e.target.result;
            const result = await importData(json);

            if (result.success) {
                if (result.conflicts && result.conflicts.length > 0) {
                    setConflicts(result.conflicts);
                    setIsConflictModalOpen(true);
                } else {
                    setStatusMsg('Import successful! Data restored.');
                    setTimeout(onClose, 1500);
                }
            } else {
                setStatusMsg(`Error: ${result.error}`);
            }
        };
        reader.readAsText(importFile);
    };

    const handleExportMarkdownZip = async () => {
        try {
            await exportAllNotesAsZip(notes, folders);
            setStatusMsg('Markdown ZIP exported successfully!');
        } catch (error) {
            setStatusMsg(`Error: ${error.message}`);
        }
    };

    const handleImportMarkdown = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        try {
            const imported = await importMarkdownFiles(
                Array.from(files),
                addNote,
                filter.type === 'folder' ? filter.id : folders[0]?.id
            );

            // Save all imported notes
            for (const note of imported) {
                await updateNote(note.id, note);
            }

            setStatusMsg(`Successfully imported ${imported.length} note(s)!`);
            markdownInputRef.current.value = ''; // Reset input
        } catch (error) {
            setStatusMsg(`Error importing Markdown: ${error.message}`);
        }
    };

    const handleImportZip = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const imported = await importZipArchive(file, addNote, folders);

            // Save all imported notes
            for (const note of imported) {
                await updateNote(note.id, note);
            }

            setStatusMsg(`Successfully imported ${imported.length} note(s) from ZIP!`);
            zipInputRef.current.value = ''; // Reset input
        } catch (error) {
            setStatusMsg(`Error importing ZIP: ${error.message}`);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '85vh', overflowY: 'auto' }}>
                <div className="modal-header">
                    <h2>Settings</h2>
                    <button className="close-btn" onClick={onClose}><X size={18} /></button>
                </div>

                <div className="modal-body">
                    {/* Consolidated Export Section */}
                    <div className="settings-section">
                        <h3 className="settings-section-header">Export</h3>
                        <p className="backup-info">Download your notes in various formats.</p>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                                className="modal-btn"
                                onClick={handleExport}
                                style={{ flex: '1', minWidth: '140px', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <Download size={16} /> JSON Backup
                            </button>
                            <button
                                className="modal-btn"
                                onClick={handleExportMarkdownZip}
                                style={{ flex: '1', minWidth: '140px', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <FileArchive size={16} /> Markdown ZIP
                            </button>
                        </div>
                    </div>

                    {/* Consolidated Import Section */}
                    <div className="settings-section">
                        <h3 className="settings-section-header">Import</h3>
                        <p className="backup-info">Restore or import notes from various sources.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                                    JSON Backup
                                </label>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={handleFileChange}
                                        className="file-input"
                                        ref={fileInputRef}
                                        style={{ flex: 1 }}
                                    />
                                    <button
                                        className="modal-btn primary"
                                        onClick={handleImport}
                                        disabled={!importFile}
                                        style={{ minWidth: '100px', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        <Upload size={16} /> Import
                                    </button>
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                                    Markdown Files (.md)
                                </label>
                                <input
                                    type="file"
                                    accept=".md"
                                    multiple
                                    onChange={handleImportMarkdown}
                                    className="file-input"
                                    ref={markdownInputRef}
                                />
                            </div>

                            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                                    Markdown ZIP Archive
                                </label>
                                <input
                                    type="file"
                                    accept=".zip"
                                    onChange={handleImportZip}
                                    className="file-input"
                                    ref={zipInputRef}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="settings-section">
                        <h3 className="settings-section-header">Cloud Backup (Dropbox)</h3>
                        <p className="backup-info">Sync your backups to Dropbox (App Folder).</p>

                        {!isDropboxConnected() ? (
                            <div className="backup-controls">
                                <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>App Key</label>
                                <input
                                    type="text"
                                    placeholder="Dropbox App Key"
                                    value={appKey}
                                    onChange={(e) => setAppKey(e.target.value)}
                                    className="file-input"
                                />
                                <button
                                    className="modal-btn primary"
                                    onClick={handleLoginDropbox}
                                    disabled={!appKey}
                                    style={{ width: '100%', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    Log in with Dropbox
                                </button>
                                <p className="backup-info" style={{ marginTop: '4px' }}>
                                    You will be redirected to Dropbox to authorize.
                                </p>
                            </div>
                        ) : (
                            <div className="backup-controls">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '13px', color: 'green' }}>✓ Connected</span>
                                    <button className="modal-btn secondary" onClick={() => {
                                        disconnectDropbox();
                                        setCloudBackups([]);
                                    }} style={{ fontSize: '12px', padding: '4px 8px' }}>Disconnect</button>
                                </div>

                                <button
                                    className="modal-btn"
                                    onClick={handleUploadBackup}
                                    disabled={isUploading}
                                    style={{ width: '100%', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}
                                >
                                    <CloudUpload size={16} /> {isUploading ? 'Uploading...' : 'Upload New Backup'}
                                </button>

                                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: '600' }}>Cloud Backups</span>
                                        <button className="modal-btn secondary" onClick={refreshCloudList} style={{ fontSize: '12px', padding: '4px 8px' }}>Refresh</button>
                                    </div>

                                    {isLoadingList ? (
                                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Loading list...</div>
                                    ) : (
                                        <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            {cloudBackups.length === 0 ? (
                                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No backups found.</div>
                                            ) : (
                                                cloudBackups.map(file => (
                                                    <div key={file.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '13px' }}>
                                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>{file.name}</span>
                                                        <button
                                                            className="modal-btn primary"
                                                            onClick={() => handleRestoreCloud(file.path_lower)}
                                                            style={{ fontSize: '11px', padding: '4px 8px' }}
                                                        >
                                                            Restore
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {statusMsg && (
                        <div style={{ marginTop: '10px', padding: '10px', borderRadius: '6px', backgroundColor: statusMsg.startsWith('Error') ? '#fee2e2' : '#dcfce7', color: statusMsg.startsWith('Error') ? '#dc2626' : '#16a34a', fontSize: '13px' }}>
                            {statusMsg}
                        </div>
                    )}
                </div>
            </div>

            <ConflictResolutionModal
                isOpen={isConflictModalOpen}
                conflicts={conflicts}
                onClose={() => {
                    setIsConflictModalOpen(false);
                    setStatusMsg('Conflict resolution complete.');
                    setConflicts([]);
                }}
            />
        </div>
    );
};

export default SettingsModal;
