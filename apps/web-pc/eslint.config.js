import tseslint from 'typescript-eslint';
import rootConfig from '../../packages/config/eslint/base'; // 根目录配置

export default tseslint.config({ ignores: ['dist'] }, rootConfig);
