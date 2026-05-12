import { useEffect, useState } from 'react';
import { Button, Card, Empty, Image, Toast } from '@douyinfe/semi-ui';
import { useNavigate } from 'react-router';
import type { Liked115PicItem } from '@volix/types';
import { get115LikedPics, like115Pic } from '@/services/115';
import { Loading } from '@/components';
import { getHttpErrorMessage } from '@/utils/error';
import styles from './index.module.scss';

interface LikedPicCard extends Liked115PicItem {}

function PicLikedApp() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<LikedPicCard[]>([]);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await get115LikedPics({
        offset: 0,
        pageSize: 100,
      });
      const likedList = res.data.data || [];

      setList(likedList as LikedPicCard[]);
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, '加载我的喜欢失败'));
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  const onUnlike = async (pc: string) => {
    try {
      await like115Pic({
        pc,
        liked: false,
      });
      setList(prev => prev.filter(item => item.pc !== pc));
      Toast.success('已取消喜欢');
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, '取消喜欢失败'));
    }
  };

  useEffect(() => {
    refresh().catch(() => undefined);
  }, []);

  if (loading) {
    return <Loading type="page" />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div className={styles.title}>我的喜欢</div>
        <Button theme="light" onClick={() => refresh()}>
          刷新
        </Button>
      </div>

      {list.length === 0 ? (
        <Empty title="还没有喜欢的图片" description="在随机图片页点击喜欢后，会出现在这里。" />
      ) : (
        <div className={styles.grid}>
          {list.map(item => (
            <Card key={item.pc} shadows="hover">
              <div className={styles.cardImageWrap}>
                {item.url ? (
                  <Image
                    setDownloadName={() => {
                      return Date.now().toString();
                    }}
                    className={styles.cardImage}
                    src={item.url}
                    preview={{
                      onDownload: () => {
                        const downloadLink = document.createElement('a');
                        downloadLink.href = item.url;
                        downloadLink.download = item.fileName || `${Date.now()}.png`;
                        downloadLink.style.display = 'none';
                        document.body.appendChild(downloadLink);
                        downloadLink.click();
                        document.body.removeChild(downloadLink);
                      },
                    }}
                  />
                ) : null}
              </div>
              <div className={styles.path}>{item.path || item.fileName || item.pc}</div>
              <div className={styles.actions}>
                <Button
                  size="small"
                  onClick={() => {
                    navigate('/pic');
                  }}
                >
                  去随机页
                </Button>
                <Button size="small" type="danger" onClick={() => onUnlike(item.pc)}>
                  取消喜欢
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default PicLikedApp;
