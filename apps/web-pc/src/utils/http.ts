import axios from 'axios';
import { serviceUrl } from '@/utils';

const http = axios.create({
  baseURL: `${serviceUrl}/api`,
});

export { http };
