export const serviceUrl = import.meta.env.PROD ? '' : 'http://localhost:3000';
export const uploadUrl = import.meta.env.PROD ? '/api/file/upload' : 'http://localhost:3000/api/file/upload';
