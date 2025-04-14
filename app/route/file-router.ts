import Router from 'koa-router';
import FileController from '../controller/file';

const router = new Router({
  prefix: '/file',
});

router
  .post('/upload', FileController.upload)
  .get('/download/:fileId', FileController.download)
  .post('/pdf-to-img', FileController.pdfToImg)
  .post('/unlock-pdf', FileController.unlockPdf);

export default router;
