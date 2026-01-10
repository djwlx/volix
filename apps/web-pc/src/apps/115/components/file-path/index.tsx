import { Breadcrumb } from '@douyinfe/semi-ui';
import { useFileList } from '../../hooks/useFileList';

interface FilePathProps {
  dir: string;
}
export function FilePath(props: FilePathProps) {
  const { dir } = props;
  const { loading, rootPath } = useFileList(dir);

  if (loading) {
    return dir;
  }

  return <Breadcrumb routes={rootPath} />;
}
