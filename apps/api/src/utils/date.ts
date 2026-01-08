export const getNowTimeStrinng = (paramData?: Date) => {
  const date = paramData ?? new Date();
  const formattedDate =
    date.getFullYear() +
    '-' +
    ('0' + (date.getMonth() + 1)).slice(-2) +
    '-' +
    ('0' + date.getDate()).slice(-2) +
    ' ' +
    ('0' + date.getHours()).slice(-2) +
    ':' +
    ('0' + date.getMinutes()).slice(-2) +
    ':' +
    ('0' + date.getSeconds()).slice(-2);

  return formattedDate;
};

export const calculateTimeDifference = (start: number, end: number) => {
  const difference = end - start; // 差值（以毫秒为单位）

  // 计算时、分、秒和毫秒
  const hours = Math.floor(difference / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((difference % (1000 * 60)) / 1000);
  const milliseconds = difference % 1000;
  // 条件拼接非0的部分
  const parts: string[] = [];
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (seconds) parts.push(`${seconds}s`);
  if (milliseconds) parts.push(`${milliseconds}ms`);

  return parts.join(' ');
};
export const waitTime = (time: number) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve('');
    }, time);
  });
};

export const getUnixTime = (date?: Date) => {
  return Math.floor(date?.getTime() ?? Date.now() / 1000);
};
