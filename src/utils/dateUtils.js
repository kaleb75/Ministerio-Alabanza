import dayjs from 'dayjs';
import 'dayjs/locale/es';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.locale('es');

export const formatDate = (date, format = 'D [de] MMMM [de] YYYY') =>
  dayjs(date).format(format);

export const formatShortDate = (date) =>
  dayjs(date).format('DD/MM/YYYY');

export const formatTime = (time) =>
  dayjs(`2000-01-01 ${time}`).format('h:mm A');

export const formatRelative = (date) =>
  dayjs(date).fromNow();

export const formatDayOfWeek = (date) =>
  dayjs(date).format('dddd');

export const formatMonthYear = (date) =>
  dayjs(date).format('MMMM YYYY');

export const isUpcoming = (date) =>
  dayjs(date).isAfter(dayjs());

export const isPast = (date) =>
  dayjs(date).isBefore(dayjs());

export const isToday = (date) =>
  dayjs(date).isSame(dayjs(), 'day');

export const daysUntil = (date) =>
  dayjs(date).diff(dayjs(), 'day');

export const today = () => dayjs().format('D [de] MMMM[,] YYYY');

export const currentYear = () => dayjs().year();

export default dayjs;
