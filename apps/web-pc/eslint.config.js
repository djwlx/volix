import tseslint from 'typescript-eslint';
import rootConfig from '../../packages/config/eslint/base'; // 根目录配置
import { globalIgnores } from 'eslint/config';

export default tseslint.config({ ignores: ['dist'] }, rootConfig);
