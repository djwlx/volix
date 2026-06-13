export const FORMAT_CONVERT_UPLOAD_MAX_FILE_SIZE_BYTES = 1024 * 1024 * 1024;

export const getKoaBodyOptions = () => {
  return {
    multipart: true,
    formidable: {
      maxFileSize: FORMAT_CONVERT_UPLOAD_MAX_FILE_SIZE_BYTES,
    },
  };
};
