import { AccountConfigPlatform } from '@volix/types';
import AccountConfigForm from './account-config-form';

function SettingConfigQbittorrentApp() {
  return <AccountConfigForm platform={AccountConfigPlatform.QBITTORRENT} title="qBittorrent" />;
}

export default SettingConfigQbittorrentApp;
