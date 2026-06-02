import dayjs from 'dayjs';
import { getLastUsedDate } from '../utils/songAnalytics';

/**
 * Repetition levels returned by checkRepetition.
 */
export const REPETITION_LEVEL = {
  OK: 'ok',
  WARN: 'warn',
  BLOCK: 'block',
};

/**
 * Checks whether a song was used too recently relative to a target date.
 *
 * Thresholds (in days since last use):
 *   - block : daysSince < settings.blockRepeatDays   (default 14)
 *   - warn  : daysSince < settings.repeatProtectionDays  (default 30)
 *   - ok    : daysSince >= settings.repeatProtectionDays
 *
 * @param {string|number} songId
 * @param {string|dayjs.Dayjs|Date|null} targetDate
 *   The event date to evaluate against. Defaults to today (dayjs()).
 * @param {Array}  history   - song history entries [{ songId, date, ... }]
 * @param {Object} [settings={}]
 *   - settings.repeatProtectionDays {number}  warn threshold (default 30)
 *   - settings.blockRepeatDays      {number}  block threshold (default 14)
 * @returns {{ level: string, message: string, lastUsed: string|null, daysSince: number|null }}
 */
export function checkRepetition(songId, targetDate, history, settings = {}) {
  const warnThreshold = settings.repeatProtectionDays ?? 30;
  const blockThreshold = settings.blockRepeatDays ?? 14;

  const target = targetDate ? dayjs(targetDate) : dayjs();

  const lastUsed = getLastUsedDate(songId, history);

  if (!lastUsed) {
    return {
      level: REPETITION_LEVEL.OK,
      message: 'La canción nunca ha sido usada.',
      lastUsed: null,
      daysSince: null,
    };
  }

  const daysSince = target.diff(dayjs(lastUsed), 'day');

  if (daysSince < blockThreshold) {
    return {
      level: REPETITION_LEVEL.BLOCK,
      message: `Canción usada hace solo ${daysSince} día${daysSince === 1 ? '' : 's'} (mínimo requerido: ${blockThreshold} días).`,
      lastUsed,
      daysSince,
    };
  }

  if (daysSince < warnThreshold) {
    return {
      level: REPETITION_LEVEL.WARN,
      message: `Canción usada hace ${daysSince} día${daysSince === 1 ? '' : 's'}. Se recomienda esperar ${warnThreshold} días entre usos.`,
      lastUsed,
      daysSince,
    };
  }

  return {
    level: REPETITION_LEVEL.OK,
    message: `Canción disponible (última vez usada hace ${daysSince} días).`,
    lastUsed,
    daysSince,
  };
}

/**
 * Validates a list of song ids for an event date and returns only the entries
 * that are NOT ok (i.e. warn or block).
 *
 * @param {Array<string|number>} songIds
 * @param {string|dayjs.Dayjs|Date|null} eventDate
 *   The date of the event. Defaults to today (dayjs()) if null/undefined.
 * @param {Array}  history
 * @param {Object} [settings={}]
 * @returns {Array<{ songId: string|number, level: string, message: string, lastUsed: string|null, daysSince: number|null }>}
 *   Only entries where level !== 'ok'.
 */
export function validateEventSongs(songIds, eventDate, history, settings = {}) {
  if (!Array.isArray(songIds)) return [];

  const target = eventDate ? dayjs(eventDate) : dayjs();

  return songIds
    .map((songId) => {
      const result = checkRepetition(songId, target, history, settings);
      return { songId, ...result };
    })
    .filter((result) => result.level !== REPETITION_LEVEL.OK);
}
