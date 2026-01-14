import axios from 'axios';

export function getCookieValue(cookie: string, name: string) {
  return (
    cookie
      .split('; ')
      .find(row => row.startsWith(name + '='))
      ?.split('=')[1] || null
  );
}

const request = axios.create({});

export default request;
