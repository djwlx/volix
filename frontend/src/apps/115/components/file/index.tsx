import { get115FileInfo, get115FileList } from '@/services/115';
import { Avatar, Breadcrumb, Button, Card, GetProp, Space, Table, TableProps, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import type { SorterResult } from 'antd/es/table/interface';
import { downloadFileByUrl, formatFileSize } from '@/utils';

interface FilePath {
  name: string;
  cid: string;
}
type TablePaginationConfig = Exclude<GetProp<TableProps, 'pagination'>, boolean>;
interface TableParams {
  pagination?: TablePaginationConfig;
  sortField?: SorterResult<any>['field'];
  sortOrder?: SorterResult<any>['order'];
  filters?: Parameters<GetProp<TableProps, 'onChange'>>[1];
}
const { Paragraph } = Typography;
function FileList() {
  const [tableParams, setTableParams] = useState<TableParams>({
    pagination: {
      current: 1,
      pageSize: 10,
      showTotal: total => `共 ${total} 条`,
    },
  });
  const [filePath, setFilePath] = useState<FilePath[]>([
    {
      name: '根目录',
      cid: '0',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  const downloadFile = async (pc: string) => {
    const result = await get115FileInfo(pc);
    const info: any = Object.values(result.data?.data)[0];
    const url = info?.url?.url;
    if (url) {
      downloadFileByUrl(url);
    }
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'n',
      render: (value: string, record: any) => {
        if (record?.fid) {
          return (
            <Space>
              {record?.u && <Avatar shape="square" size={24} src={record?.u} />}
              <span onClick={() => downloadFile(record?.pc)} style={{ cursor: 'pointer' }}>
                {value}
              </span>
            </Space>
          );
        }
        return (
          <Button
            type="link"
            onClick={() => {
              setFilePath([
                ...filePath,
                {
                  name: value,
                  cid: record.cid,
                },
              ]);

              setTableParams({
                ...tableParams,
                pagination: {
                  ...tableParams.pagination,
                  current: 1,
                },
              });
            }}
          >
            {value}
          </Button>
        );
      },
    },
    {
      title: '大小',
      dataIndex: 's',
      render: (value: number, record: any) => {
        if (record?.fid) {
          return formatFileSize(value);
        }
        return '-';
      },
    },
    {
      title: 'pc',
      dataIndex: 'pc',
      render: (value: string) => {
        return <Paragraph copyable>{value}</Paragraph>;
      },
    },
    {
      title: 'cid',
      dataIndex: 'cid',
      render: (value: string) => {
        return <Paragraph copyable>{value}</Paragraph>;
      },
    },
  ];

  const fetchData = () => {
    setLoading(true);
    const size = tableParams.pagination?.pageSize || 10;
    const page = tableParams.pagination?.current || 1;
    const offeset = (page - 1) * size;
    const cid = filePath[filePath.length - 1].cid;
    get115FileList({
      offset: offeset,
      pageSize: tableParams.pagination?.pageSize || 10,
      cid,
    })
      .then(res => {
        const result = res.data?.data?.data;
        setData(result);
        setTableParams({
          ...tableParams,
          pagination: {
            ...tableParams.pagination,
            total: res.data?.data?.count,
          },
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleTableChange: TableProps['onChange'] = (pagination, filters, sorter) => {
    const hasChangePageSize = pagination.pageSize !== tableParams.pagination?.pageSize;
    setTableParams({
      pagination: {
        ...pagination,
        current: hasChangePageSize ? 1 : pagination.current,
        showTotal: total => `共 ${total} 条`,
      },
      filters,
      sortOrder: Array.isArray(sorter) ? undefined : sorter.order,
      sortField: Array.isArray(sorter) ? undefined : sorter.field,
    });
  };

  const breadItems = useMemo(() => {
    return filePath.map((pathItem, index) => {
      return {
        title: <a onClick={e => e.preventDefault()}>{pathItem.name}</a>,
        onClick: () => {
          if (index === filePath.length - 1) {
            return;
          }
          setFilePath(filePath.slice(0, index + 1));
          setTableParams({
            ...tableParams,
            pagination: {
              ...tableParams.pagination,
              current: 1,
            },
          });
        },
      };
    });
  }, [filePath, tableParams]);

  useEffect(() => {
    fetchData();
  }, [tableParams.pagination?.current, tableParams.pagination?.pageSize, filePath]);

  return (
    <Card title="文件列表">
      <Breadcrumb style={{ marginBottom: 16 }} items={breadItems} />
      <Table
        onChange={handleTableChange}
        loading={loading}
        rowKey="pc"
        pagination={tableParams.pagination}
        columns={columns}
        dataSource={data}
      />
    </Card>
  );
}
export default FileList;
