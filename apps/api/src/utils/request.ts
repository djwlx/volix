import axios from 'axios';
import http from 'http';
import https from 'https';

export function getCookieValue(cookie: string, name: string) {
  return (
    cookie
      .split('; ')
      .find(row => row.startsWith(name + '='))
      ?.split('=')[1] || null
  );
}

const request = axios.create({
  httpAgent: new http.Agent({
    keepAlive: true,
    maxSockets: 64,
  }),
  httpsAgent: new https.Agent({
    keepAlive: true,
    maxSockets: 64,
    rejectUnauthorized: false,
  }),
});

export default request;
