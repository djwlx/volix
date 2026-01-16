import { Image } from '@douyinfe/semi-ui';
import styles from './index.module.scss';

function PicApp() {
  return <Image className={styles.full} src={'/api/115/pic?mode=direct'} />;
}
export default PicApp;
