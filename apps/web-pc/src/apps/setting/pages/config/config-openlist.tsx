import { AccountConfigPlatform } from '@volix/types';
import AccountConfigForm from './account-config-form';

function SettingConfigOpenlistApp() {
  return <AccountConfigForm platform={AccountConfigPlatform.OPENLIST} title="OpenList" />;
}

export default SettingConfigOpenlistApp;
