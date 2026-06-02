export const APP_NAME = 'Ministerio de Alabanza';
export const APP_SHORT_NAME = 'Alabanza';

export const ROUTES = {
  DASHBOARD:  '/',
  SONGS:      '/songs',
  EVENTS:     '/events',
  DIRECTORS:  '/directors',
  REQUESTS:   '/requests',
  HISTORY:    '/history',
  SETTINGS:   '/settings',
  ANALYTICS:  '/analytics',
  PLANNER:    '/planner',
  LOGIN:      '/login',
  UNAUTHORIZED: '/unauthorized',
};

export const EVENT_STATUS = {
  UPCOMING: 'upcoming',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const EVENT_STATUS_LABELS = {
  upcoming: 'Próximo',
  in_progress: 'En curso',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

export const USER_ROLES = {
  ADMIN: 'admin',
  LIDER_DIRECTORES: 'lider_directores',
  DIRECTOR: 'director',
  MUSICO: 'musico',
};

export const SONG_GENRES = [
  'Himno',
  'Contemporáneo',
  'Balada',
  'Coro',
  'Especial',
];

export const MUSICAL_KEYS = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb',
  'E', 'F', 'F#', 'Gb', 'G', 'G#',
  'Ab', 'A', 'A#', 'Bb', 'B',
];

export const BREAKPOINTS = {
  SM: 480,
  MD: 768,
  LG: 1024,
  XL: 1280,
};

export const MOCK_CURRENT_USER = null;

export const SONG_FILE_FORMATS = {
  LYRICS: 'lyrics',
  CHORDS: 'chords',
  SHEET_MUSIC: 'sheet_music',
  IMAGE: 'image',
  UNKNOWN: 'unknown',
};

export const SONG_FORMAT_LABELS = {
  lyrics: 'Letra',
  chords: 'Acordes',
  sheet_music: 'Partitura',
  image: 'Imagen',
  unknown: 'Desconocido',
};

export const SUPPORTED_FILE_EXTENSIONS = ['pdf', 'docx', 'txt', 'png', 'jpg', 'jpeg'];

export const ONEDRIVE_SYNC_STATUS = {
  IDLE: 'idle',
  SCANNING: 'scanning',
  PARSING: 'parsing',
  DEDUPLICATING: 'deduplicating',
  COMPLETE: 'complete',
  ERROR: 'error',
};

export const WORSHIP_TAG_IDS = [
  'adoracion', 'alabanza', 'comunion', 'navidad', 'pentecostes',
  'avivamiento', 'oracion', 'jovenes', 'ofrenda', 'clasico',
  'contemporaneo', 'himno', 'coro', 'espiritu', 'gloria',
  'poder', 'sanidad', 'esperanza',
];
