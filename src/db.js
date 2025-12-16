import { openDB } from 'idb';

const DB_NAME = 'note-app-db';
const DB_VERSION = 3;

export const initDB = async () => {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains('notes')) {
                db.createObjectStore('notes', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('folders')) {
                db.createObjectStore('folders', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('tags')) {
                db.createObjectStore('tags', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('images')) {
                db.createObjectStore('images', { keyPath: 'id' });
            }
        },
    });
};

export const getAllNotes = async () => {
    const db = await initDB();
    return db.getAll('notes');
};

export const saveNote = async (note) => {
    const db = await initDB();
    return db.put('notes', note);
};

export const deleteNote = async (id) => {
    const db = await initDB();
    return db.delete('notes', id);
};

export const getAllFolders = async () => {
    const db = await initDB();
    return db.getAll('folders');
};

export const saveFolder = async (folder) => {
    const db = await initDB();
    return db.put('folders', folder);
};

export const deleteFolder = async (id) => {
    const db = await initDB();
    return db.delete('folders', id);
};

export const getAllTags = async () => {
    const db = await initDB();
    return db.getAll('tags');
};

export const saveTag = async (tag) => {
    const db = await initDB();
    return db.put('tags', tag);
};

export const deleteTag = async (id) => {
    const db = await initDB();
    return db.delete('tags', id);
};

export const saveImage = async (image) => {
    const db = await initDB();
    return db.put('images', image);
};

export const getImage = async (id) => {
    const db = await initDB();
    return db.get('images', id);
};
