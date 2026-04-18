import { useEffect, useState } from 'react';
import { Button, Card, Empty, Space, Table, Tag, Toast, Typography } from '@douyinfe/semi-ui';
import { useOutletContext } from 'react-router';
import type { ScheduledTaskResponse } from '@volix/types';
import type { SettingOutletContext } from '@/apps/setting/types';
import {
  getScheduledTaskDetail,
  getScheduledTaskList,
  runScheduledTaskNow,
  toggleScheduledTaskByAdmin,
} from '@/services/scheduled-task';

function SettingScheduledTaskApp() {
  const { isAdmin } = useOutletContext<SettingOutletContext>();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<ScheduledTaskResponse[]>([]);
  const [expandedRowKeys, setExpandedRowKeys] = useState<Array<string | number>>([]);
  const [detailMap, setDetailMap] = useState<
    Record<
      string,
      {
        logs?: string[];
        runs?: Array<{ id: string; status: string; startedAt?: string | null; summary?: string | null }>;
      }
    >
  >({});
  const [actionTaskId, setActionTaskId] = useState<string | number>();

  const loadData = async () => {
    const res = await getScheduledTaskList();
    setList(res.data);
  };

  useEffect(() => {
    if (!isAdmin) {
      return;
    }
    setLoading(true);
    loadData()
      .catch(() => {
        Toast.error('获取定时任务失败');
      })
      .finally(() => setLoading(false));
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <Card title="定时任务" shadows="hover" style={{ width: '100%' }}>
        <Empty title="暂无权限" description="仅管理员可查看定时任务" />
      </Card>
    );
  }

  return (
    <Card title="定时任务" shadows="hover" style={{ width: '100%' }}>
      <Table<ScheduledTaskResponse>
        rowKey="id"
        loading={loading}
        pagination={false}
        dataSource={list}
        expandedRowKeys={expandedRowKeys}
        onExpand={(expanded, record) => {
          setExpandedRowKeys(prev =>
            expanded ? Array.from(new Set([...prev, record.id])) : prev.filter(item => item !== record.id)
          );
          if (expanded && !detailMap[String(record.id)]) {
            getScheduledTaskDetail(record.id)
              .then(res => {
                setDetailMap(prev => ({
                  ...prev,
                  [String(record.id)]: {
                    logs: res.data.logs || [],
                    runs: (res.data.runs || []).map(item => ({
                      id: item.id,
                      status: item.status,
                      startedAt: item.startedAt,
                      summary: item.summary,
                    })),
                  },
                }));
              })
              .catch(() => Toast.error('获取任务详情失败'));
          }
        }}
        expandedRowRender={record => {
          const detail = detailMap[String(record.id)];
          return (
            <Space vertical spacing={12} style={{ width: '100%' }}>
              <Typography.Text type="secondary">
                {record.scriptContent || record.builtinHandler || record.description || '-'}
              </Typography.Text>
              <Card bodyStyle={{ padding: 12 }}>
                <Space vertical spacing={6} style={{ width: '100%' }}>
                  {(detail?.runs || []).length > 0 ? (
                    detail?.runs?.map(item => (
                      <Typography.Paragraph key={item.id} style={{ margin: 0 }}>
                        {`${item.status} ${item.startedAt || '-'} ${item.summary || ''}`}
                      </Typography.Paragraph>
                    ))
                  ) : (
                    <Empty title="暂无运行记录" description="还没有可展示的运行记录" />
                  )}
                </Space>
              </Card>
              <Card bodyStyle={{ padding: 12 }}>
                <Space vertical spacing={6} style={{ width: '100%' }}>
                  {(detail?.logs || []).length > 0 ? (
                    detail?.logs?.map((line, index) => (
                      <Typography.Paragraph
                        key={`${record.id}-${index}`}
                        style={{
                          margin: 0,
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all',
                        }}
                      >
                        {line}
                      </Typography.Paragraph>
                    ))
                  ) : (
                    <Empty title="暂无日志" description="还没有可展示的运行日志" />
                  )}
                </Space>
              </Card>
            </Space>
          );
        }}
        columns={[
          { title: '任务名', dataIndex: 'name', key: 'name', width: 180 },
          { title: '做什么事', dataIndex: 'description', key: 'description', width: 280 },
          { title: '类型', dataIndex: 'taskType', key: 'taskType', width: 100 },
          { title: '上次运行', dataIndex: 'lastRunAt', key: 'lastRunAt', width: 180, render: value => value || '-' },
          { title: '下次运行', dataIndex: 'nextRunAt', key: 'nextRunAt', width: 180, render: value => value || '-' },
          {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 110,
            render: value => <Tag>{String(value || '-')}</Tag>,
          },
          {
            title: '操作',
            key: 'action',
            width: 180,
            render: (_value, record) => (
              <Space>
                <Button
                  theme="borderless"
                  loading={actionTaskId === record.id}
                  onClick={async () => {
                    try {
                      setActionTaskId(record.id);
                      await runScheduledTaskNow(record.id);
                      Toast.success('任务已执行');
                      await loadData();
                    } catch (error) {
                      const message = (error as { response?: { data?: { message?: string } } })?.response?.data
                        ?.message;
                      Toast.error(message || '执行失败');
                    } finally {
                      setActionTaskId(undefined);
                    }
                  }}
                >
                  立即执行
                </Button>
                <Button
                  theme="borderless"
                  type={record.enabled ? 'danger' : 'tertiary'}
                  loading={actionTaskId === `${record.id}-toggle`}
                  onClick={async () => {
                    try {
                      setActionTaskId(`${record.id}-toggle`);
                      await toggleScheduledTaskByAdmin(record.id);
                      Toast.success(record.enabled ? '任务已停用' : '任务已启用');
                      await loadData();
                    } catch (error) {
                      const message = (error as { response?: { data?: { message?: string } } })?.response?.data
                        ?.message;
                      Toast.error(message || '切换状态失败');
                    } finally {
                      setActionTaskId(undefined);
                    }
                  }}
                >
                  {record.enabled ? '停用' : '启用'}
                </Button>
              </Space>
            ),
          },
        ]}
      />
    </Card>
  );
}

export default SettingScheduledTaskApp;
