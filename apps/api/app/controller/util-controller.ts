import { configService } from '../service';
import { BaseController } from './base-controller';

class UtilController extends BaseController {
  test = this.res(async (ctx, next) => {
    return {};
  });

  getTask = this.res(async (ctx, next) => {
    const { id } = ctx.params;
    const result = await configService.getConfig(id);
    return {
      id,
      enable: result?.[id] === 'true',
    };
  });

  setTask = this.res(async (ctx, next) => {
    const { id } = ctx.params;
    const { enable } = ctx.request.body;
    const result = await configService.setConfig(id, enable ? 'true' : 'false');
    return result;
  });
}

const utilController = new UtilController();

export { utilController };
