export const APP_NAME = 'Ministerio de Alabanza';
export const APP_SHORT_NAME = 'Alabanza';

export const ROUTES = {
  DASHBOARD:    '/',
  SONGS:        '/songs',
  EVENTS:       '/events',
  USUARIOS:     '/usuarios',
  REQUESTS:     '/requests',
  HISTORY:      '/history',
  SETTINGS:     '/settings',
  ANALYTICS:    '/analytics',
  PLANNER:      '/planner',
  LOGIN:        '/login',
  UNAUTHORIZED: '/unauthorized',
};

export const EVENT_STATUS = {
  UPCOMING:    'upcoming',
  IN_PROGRESS: 'in_progress',
  COMPLETED:   'completed',
  CANCELLED:   'cancelled',
};

export const EVENT_STATUS_LABELS = {
  upcoming:    'Próximo',
  in_progress: 'En curso',
  completed:   'Completado',
  cancelled:   'Cancelado',
};

export const USER_ROLES = {
  ADMIN:            'admin',
  LIDER_DIRECTORES: 'lider_directores',
  DIRECTOR:         'director',
  PREDICADOR:       'predicador',
  PROYECCION:       'proyeccion',
  STREAMING:        'streaming',
  MUSICO:           'musico',
  SOLO_LECTURA:     'solo_lectura',
};

export const ROLE_LABELS = {
  admin:            'Administrador',
  lider_directores: 'Líder de Directores',
  director:         'Director',
  predicador:       'Predicador',
  proyeccion:       'Proyección',
  streaming:        'Streaming',
  musico:           'Músico',
  solo_lectura:     'Solo Lectura',
};

export const ROLE_COLORS = {
  admin:            '#FF9500',
  lider_directores: '#0A84FF',
  director:         '#32D74B',
  predicador:       '#FF6B35',
  proyeccion:       '#BF5AF2',
  streaming:        '#5AC8FA',
  musico:           '#FFD60A',
  solo_lectura:     '#8E8E93',
};

export const RESPONSIBILITY_TYPES = {
  DIRECTOR_PRINCIPAL:  'director_principal',
  DIRECTOR_SECUNDARIO: 'director_secundario',
  PROYECCION:          'proyeccion',
  STREAMING:           'streaming',
  PREDICADOR:          'predicador',
};

export const RESPONSIBILITY_LABELS = {
  director_principal:  'Director Principal',
  director_secundario: 'Director Secundario',
  proyeccion:          'Proyección',
  streaming:           'Streaming',
  predicador:          'Predicador',
};

export const RESPONSIBILITY_COMPATIBLE_ROLES = {
  director_principal:  ['director', 'lider_directores', 'admin'],
  director_secundario: ['director', 'lider_directores', 'admin'],
  proyeccion:          ['proyeccion', 'admin'],
  streaming:           ['streaming', 'admin'],
  predicador:          ['predicador', 'admin', 'director', 'lider_directores'],
};

export const BIBLE_BOOKS = [
  'Génesis','Éxodo','Levítico','Números','Deuteronomio','Josué','Jueces','Rut',
  '1 Samuel','2 Samuel','1 Reyes','2 Reyes','1 Crónicas','2 Crónicas','Esdras',
  'Nehemías','Ester','Job','Salmos','Proverbios','Eclesiastés','Cantares','Isaías',
  'Jeremías','Lamentaciones','Ezequiel','Daniel','Oseas','Joel','Amós','Abdías',
  'Jonás','Miqueas','Nahúm','Habacuc','Sofonías','Hageo','Zacarías','Malaquías',
  'Mateo','Marcos','Lucas','Juan','Hechos','Romanos','1 Corintios','2 Corintios',
  'Gálatas','Efesios','Filipenses','Colosenses','1 Tesalonicenses','2 Tesalonicenses',
  '1 Timoteo','2 Timoteo','Tito','Filemón','Hebreos','Santiago','1 Pedro','2 Pedro',
  '1 Juan','2 Juan','3 Juan','Judas','Apocalipsis',
];

export const SONG_GENRES = ['Himno', 'Contemporáneo', 'Balada', 'Coro', 'Especial'];

export const MUSICAL_KEYS = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb',
  'E', 'F', 'F#', 'Gb', 'G', 'G#',
  'Ab', 'A', 'A#', 'Bb', 'B',
];

export const BREAKPOINTS = { SM: 480, MD: 768, LG: 1024, XL: 1280 };

export const MOCK_CURRENT_USER = null;

export const SONG_FILE_FORMATS = {
  LYRICS:      'lyrics',
  CHORDS:      'chords',
  SHEET_MUSIC: 'sheet_music',
  IMAGE:       'image',
  UNKNOWN:     'unknown',
};

export const SONG_FORMAT_LABELS = {
  lyrics:      'Letra',
  chords:      'Acordes',
  sheet_music: 'Partitura',
  image:       'Imagen',
  unknown:     'Desconocido',
};

export const SUPPORTED_FILE_EXTENSIONS = ['pdf', 'docx', 'txt', 'png', 'jpg', 'jpeg'];

export const ONEDRIVE_SYNC_STATUS = {
  IDLE:          'idle',
  SCANNING:      'scanning',
  PARSING:       'parsing',
  DEDUPLICATING: 'deduplicating',
  COMPLETE:      'complete',
  ERROR:         'error',
};

export const WORSHIP_TAG_IDS = [
  'adoracion', 'alabanza', 'comunion', 'navidad', 'pentecostes',
  'avivamiento', 'oracion', 'jovenes', 'ofrenda', 'clasico',
  'contemporaneo', 'himno', 'coro', 'espiritu', 'gloria',
  'poder', 'sanidad', 'esperanza',
];
