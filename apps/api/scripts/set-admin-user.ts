import { UserRole } from '@volix/types';
import { UserModel } from '../src/modules/user/model/user.model';

async function setAdminUserById(userId: number) {
  try {
    const user = await UserModel.findByPk(userId);

    if (!user) {
      console.error(`未找到 id=${userId} 的用户`);
      process.exitCode = 1;
      return;
    }

    if (user.dataValues.role === UserRole.ADMIN) {
      console.log(`id=${userId} 的用户已经是管理员`);
      process.exitCode = 0;
      return;
    }

    await UserModel.update(
      { role: UserRole.ADMIN },
      {
        where: {
          id: userId,
        },
      }
    );

    console.log(`已将 id=${userId} 的用户设置为管理员`);
    process.exitCode = 0;
  } catch (error) {
    console.error('更新用户角色失败:', error);
    process.exitCode = 1;
  }
}

setAdminUserById(1);
