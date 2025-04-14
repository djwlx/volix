import { BaseController } from './base-controller';

class UtilController extends BaseController {
  test = this.res(async (ctx, next) => {
    return {};
  });
}

const utilController = new UtilController();

export { utilController };
