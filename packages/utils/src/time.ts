const SECONDS_TIMESTAMP_THRESHOLD = 1e12;

const pad = (value: number) => String(value).padStart(2, '0');

const render = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
  `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

const fromTimestamp = (value: number): Date | null => {
  const ms = value < SECONDS_TIMESTAMP_THRESHOLD ? value * 1000 : value;
  const date = new Date(ms);
  return Number.isNaN(date.getTime()) ? null : date;
};

const parseInput = (input: Date | string | number | null): Date | null => {
  if (input === null || input === '') {
    return null;
  }
  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : input;
  }
  if (typeof input === 'number') {
    return fromTimestamp(input);
  }
  const text = input.trim();
  if (!text) {
    return null;
  }
  if (/^\d+$/.test(text)) {
    return fromTimestamp(Number(text));
  }
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatTime = (input?: Date | string | number | null): string => {
  if (input === undefined) {
    return render(new Date());
  }
  const date = parseInput(input);
  return date ? render(date) : '-';
};

export const formatDate = (input?: Date | string | number | null): string => {
  const formatted = input === undefined ? formatTime() : formatTime(input);
  return formatted === '-' ? formatted : formatted.slice(0, 10);
};
