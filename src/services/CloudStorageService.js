import { Dropbox } from 'dropbox';

const REDIRECT_URI = window.location.origin + '/';

class CloudStorageService {
    constructor() {
        this.dbx = null;
        this.accessToken = localStorage.getItem('dropbox_access_token');
        if (this.accessToken) {
            this.dbx = new Dropbox({ accessToken: this.accessToken });
        }
    }

    setAccessToken(token) {
        this.accessToken = token;
        localStorage.setItem('dropbox_access_token', token);
        this.dbx = new Dropbox({ accessToken: token });
    }

    logout() {
        this.accessToken = null;
        this.dbx = null;
        localStorage.removeItem('dropbox_access_token');
    }

    isConnected() {
        return !!this.accessToken;
    }

    // specific to Dropbox Auth
    getAuthUrl(clientId) {
        if (!clientId) throw new Error("Client ID (App Key) is required");
        const dbx = new Dropbox({ clientId });
        // Using 'token' response type (Implicit Grant) for simplicity in client-side only app.
        // Redirect URI must match exactly what is in Dropbox Console.
        return dbx.auth.getAuthenticationUrl(REDIRECT_URI, null, 'token', null, null, 'none', false);
    }

    handleRedirect() {
        // Check for access_token in hash (Implicit Grant)
        // Format: #access_token=...&token_type=...
        const hash = window.location.hash;
        if (!hash) return null;

        const params = new URLSearchParams(hash.substring(1)); // remove #
        const accessToken = params.get('access_token');

        if (accessToken) {
            this.setAccessToken(accessToken);
            // Clean URL
            window.history.replaceState(null, null, window.location.pathname);
            return accessToken;
        }
        return null;
    }

    async upload(fileName, jsonContent) {
        if (!this.dbx) throw new Error("Not connected to Dropbox");

        try {
            // Dropbox expects a Blob or string for contents.
            // For text files, string is fine.
            const response = await this.dbx.filesUpload({
                path: '/' + fileName,
                contents: jsonContent, // uploading raw JSON string
                mode: 'overwrite'
            });
            return response.result;
        } catch (error) {
            // Handle expired token specifically?
            if (error.status === 401) {
                console.error("Dropbox Token Expired");
                // Optional: this.logout();
            }
            throw error;
        }
    }

    async list() {
        if (!this.dbx) throw new Error("Not connected to Dropbox");

        try {
            const response = await this.dbx.filesListFolder({ path: '' });
            // Filter only JSON files
            return response.result.entries.filter(entry => entry['.tag'] === 'file' && entry.name.endsWith('.json'));
        } catch (error) {
            throw error;
        }
    }

    async download(path) {
        if (!this.dbx) throw new Error("Not connected to Dropbox");

        try {
            const response = await this.dbx.filesDownload({ path });
            // The SDK returns the file blob in `result.fileBlob` (browser) or just text if we read it?
            // Actually the SDK response usually contains the binary data.
            // Let's assume standard browser response behavior from the SDK.

            const blob = response.result.fileBlob;
            return await blob.text();
        } catch (error) {
            throw error;
        }
    }

    getRedirectUri() {
        return REDIRECT_URI;
    }
}

export const cloudService = new CloudStorageService();
