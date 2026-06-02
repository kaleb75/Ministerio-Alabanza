import mockFiles from '../data/mockOneDriveFiles.json';

export const ONEDRIVE_CONFIG = {
  GRAPH_ENDPOINT: 'https://graph.microsoft.com/v1.0',
  SHARED_FOLDER_URL: 'https://1drv.ms/f/s!AqRVWwFcDH4Usy0l8FJ_AwU_B4Yu?e=yi74R2',
  SCOPES: ['Files.Read', 'Files.Read.All'],
  API_VERSION: 'v1.0',
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getFolderContents(path) {
  await delay(150);
  if (!path) return mockFiles;
  return mockFiles.filter((f) => f.path === path);
}

export async function scanRecursiveFolders() {
  await delay(300);
  const folderMap = new Map();
  mockFiles.forEach((f) => {
    if (!folderMap.has(f.path)) folderMap.set(f.path, []);
    folderMap.get(f.path).push(f);
  });
  return Array.from(folderMap.entries()).map(([path, files]) => ({ path, files }));
}

export async function fetchFileMetadata(fileId) {
  await delay(100);
  return mockFiles.find((f) => f.id === fileId) || null;
}

export async function parseSharedFolder() {
  await delay(500);
  const folders = [...new Set(mockFiles.map((f) => f.path))];
  return {
    files: mockFiles,
    folders,
    totalFiles: mockFiles.length,
    scannedAt: new Date().toISOString(),
  };
}

export async function downloadFile(fileId) {
  throw new Error(
    'Download not available in mock mode — Microsoft Graph API OAuth configuration required'
  );
}

export function isAuthenticated() {
  return false;
}

export function getAuthUrl() {
  return '#graph-auth-not-configured';
}
