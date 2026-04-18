import Router from '@koa/router';
import authenticate from '../../middleware/authenticate';
import { http } from '../shared/http-handler';
import {
  createSqliteAdminRowAction,
  deleteSqliteAdminRowAction,
  getSqliteAdminTableDetailAction,
  listSqliteAdminTablesAction,
  updateSqliteAdminRowAction,
} from './controller/sqlite-admin.controller';

const router = new Router({
  prefix: '/sqlite-admin',
});

router.use(authenticate());
router.get('/tables', http(listSqliteAdminTablesAction));
router.get('/tables/:tableName', http(getSqliteAdminTableDetailAction));
router.post('/tables/:tableName/rows', http(createSqliteAdminRowAction));
router.put('/tables/:tableName/rows', http(updateSqliteAdminRowAction));
router.delete('/tables/:tableName/rows', http(deleteSqliteAdminRowAction));

export default router;
