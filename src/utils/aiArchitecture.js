// Future AI integration architecture — Sprint N (not yet implemented).
// These interfaces are stable contracts. Swap the stub return values for real
// AI responses when the integration sprint begins.

export const AI_CAPABILITIES = {
  AUTO_TAGGING: 'auto_tagging',
  LYRIC_ANALYSIS: 'lyric_analysis',
  MOOD_DETECTION: 'mood_detection',
  WORSHIP_RECOMMENDATIONS: 'worship_recommendations',
};

export const AI_STATUS = {
  NOT_CONFIGURED: 'not_configured',
  AVAILABLE: 'available',
  PROCESSING: 'processing',
};

// Returns current AI service status. Always NOT_CONFIGURED until Sprint N.
export function getAIServiceStatus() {
  return { status: AI_STATUS.NOT_CONFIGURED, capabilities: [] };
}

// Future: call Claude API with song title/lyrics, return inferred tag IDs.
export async function inferTagsWithAI(songTitle, lyrics) {
  return { tags: [], confidence: 0, status: AI_STATUS.NOT_CONFIGURED };
}

// Future: NLP analysis of lyrics + tempo to return mood/energy profile.
export async function analyzeSongMood(song) {
  return { mood: null, energy: null, worshipIntensity: null, status: AI_STATUS.NOT_CONFIGURED };
}

// Future: given a current worship set and context, recommend complementary songs.
export async function getWorshipRecommendations(currentSet, context) {
  return { recommendations: [], reasoning: null, status: AI_STATUS.NOT_CONFIGURED };
}

// Future: OCR + NLP to extract text from PDF/image file entries.
export async function extractLyricsFromFile(fileEntry) {
  return { lyrics: null, confidence: 0, status: AI_STATUS.NOT_CONFIGURED };
}

// Schema extension for AI-enhanced song catalog entries.
export const AI_SONG_SCHEMA_EXTENSION = {
  aiTags: [],
  mood: null,
  energy: null,
  worshipIntensity: null,
  lyricsExtracted: false,
  aiLastProcessed: null,
};
