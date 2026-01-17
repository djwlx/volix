import { Image } from '@douyinfe/semi-ui';
import styles from './index.module.scss';

function PicApp() {
  return (
    <div className={styles.full}>
      <Image src={'/api/115/pic?mode=direct'} />
    </div>
  );
}
export default PicApp;
