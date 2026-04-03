const pad = (value: number, size = 2) => String(value).padStart(size, '0');

// 统一输出北京时间（UTC+8）字符串，格式：2026-04-03T18:30:12+08:00
export const toBeijingISOString = (input?: Date | string | number | null) => {
  if (!input) {
    return undefined;
  }
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  const beijingTimestamp = date.getTime() + 8 * 60 * 60 * 1000;
  const beijingDate = new Date(beijingTimestamp);

  const year = beijingDate.getUTCFullYear();
  const month = pad(beijingDate.getUTCMonth() + 1);
  const day = pad(beijingDate.getUTCDate());
  const hours = pad(beijingDate.getUTCHours());
  const minutes = pad(beijingDate.getUTCMinutes());
  const seconds = pad(beijingDate.getUTCSeconds());

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+08:00`;
};
