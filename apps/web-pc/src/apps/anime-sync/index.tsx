import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Empty, Modal, Nav, Popconfirm, Select, Space, TabPane, Table, Tabs, Tag, Toast, Typography } from '@douyinfe/semi-ui';
import { IconHome, IconRefresh, IconVideo } from '@douyinfe/semi-icons';
import { useNavigate } from 'react-router';
import { AppForm, Loading } from '@/components';
import {
  createAnimeSyncSubscription,
  deleteAnimeSyncSubscription,
  getAnimeSyncJobs,
  getAnimeSyncOverview,
  getAnimeSyncSubscriptions,
  retryAnimeSyncJob,
  runAnimeSync,
  runAnimeSyncBySubscription,
  skipAnimeSyncJob,
  toggleAnimeSyncSubscription,
  updateAnimeSyncSubscription,
} from '@/services/anime-sync';
import { getCurrentUser } from '@/services/user';
import { clearAuthToken, getHttpErrorMessage, isAuthError } from '@/utils';
import { AppFeature, AnimeSyncJobStatus, UserRole } from '@volix/types';
import type {
  AnimeSyncEpisodeJob,
  AnimeSyncOverview,
  AnimeSyncSubscription,
  CreateAnimeSyncSubscriptionPayload,
  UserInfoResponse,
} from '@volix/types';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form';

interface SubscriptionFormValues extends CreateAnimeSyncSubscriptionPayload {
  pollIntervalSec: number;
}

const defaultOverview: AnimeSyncOverview = {
  subscriptionCount: 0,
  enabledSubscriptionCount: 0,
  discoveredJobCount: 0,
  failedJobCount: 0,
};

const defaultFormValues: SubscriptionFormValues = {
  name: '',
  rssUrl: '',
  targetOpenlistPath: '',
  qbitCategory: '',
  pollIntervalSec: 300,
  enabled: true,
};

const jobStatusColorMap: Record<AnimeSyncJobStatus, 'blue' | 'red' | 'green' | 'grey'> = {
  [AnimeSyncJobStatus.DISCOVERED]: 'blue',
  [AnimeSyncJobStatus.QUEUED]: 'blue',
  [AnimeSyncJobStatus.DOWNLOADING]: 'blue',
  [AnimeSyncJobStatus.DOWNLOADED]: 'green',
  [AnimeSyncJobStatus.DEDUP_DONE]: 'green',
  [AnimeSyncJobStatus.COPIED]: 'green',
  [AnimeSyncJobStatus.CLEANED]: 'green',
  [AnimeSyncJobStatus.FAILED]: 'red',
  [AnimeSyncJobStatus.SKIPPED]: 'grey',
};

const jobStatusLabelMap: Record<AnimeSyncJobStatus, string> = {
  [AnimeSyncJobStatus.DISCOVERED]: '待处理',
  [AnimeSyncJobStatus.QUEUED]: '已入队',
  [AnimeSyncJobStatus.DOWNLOADING]: '下载中',
  [AnimeSyncJobStatus.DOWNLOADED]: '已下载',
  [AnimeSyncJobStatus.DEDUP_DONE]: '已去重',
  [AnimeSyncJobStatus.COPIED]: '已复制',
  [AnimeSyncJobStatus.CLEANED]: '已清理',
  [AnimeSyncJobStatus.FAILED]: '失败',
  [AnimeSyncJobStatus.SKIPPED]: '已跳过',
};

function AnimeSyncApp() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserInfoResponse>();
  const [loading, setLoading] = useState(true);
  const [runningAll, setRunningAll] = useState(false);
  const [saving, setSaving] = useState(false);
  const [subscriptions, setSubscriptions] = useState<AnimeSyncSubscription[]>([]);
  const [jobs, setJobs] = useState<AnimeSyncEpisodeJob[]>([]);
  const [overview, setOverview] = useState<AnimeSyncOverview>(defaultOverview);
  const [subscriptionFilter, setSubscriptionFilter] = useState<number>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<AnimeSyncSubscription | null>(null);
  const [formApi, setFormApi] = useState<FormApi<Record<string, unknown>>>();

  const isAdmin = user?.role === UserRole.ADMIN;
  const canAccess = Boolean(user?.featurePermissions?.includes(AppFeature.ANIME_SYNC) || isAdmin);

  const onLogout = useCallback(() => {
    clearAuthToken();
    navigate('/auth', { replace: true });
  }, [navigate]);

  const loadOverview = useCallback(async () => {
    const res = await getAnimeSyncOverview();
    setOverview(res.data);
  }, []);

  const loadSubscriptions = useCallback(async () => {
    const res = await getAnimeSyncSubscriptions();
    setSubscriptions(res.data);
  }, []);

  const loadJobs = useCallback(
    async (subscriptionId?: number) => {
      const res = await getAnimeSyncJobs(subscriptionId);
      setJobs(res.data);
    },
    []
  );

  const loadAllData = useCallback(
    async (subscriptionId?: number) => {
      await Promise.all([loadOverview(), loadSubscriptions(), loadJobs(subscriptionId)]);
    },
    [loadJobs, loadOverview, loadSubscriptions]
  );

  useEffect(() => {
    setLoading(true);
    getCurrentUser()
      .then(res => {
        setUser(res.data);
        return loadAllData();
      })
      .catch(error => {
        if (isAuthError(error)) {
          onLogout();
          return;
        }
        Toast.error(getHttpErrorMessage(error, '加载番剧同步信息失败'));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [loadAllData, onLogout]);

  const subscriptionOptions = useMemo(
    () =>
      subscriptions.map(item => ({
        label: item.name,
        value: item.id,
      })),
    [subscriptions]
  );

  const openAddModal = () => {
    setEditingSubscription(null);
    setModalVisible(true);
  };

  const openEditModal = (item: AnimeSyncSubscription) => {
    setEditingSubscription(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingSubscription(null);
  };

  const handleSave = async (values: unknown) => {
    const payload = values as SubscriptionFormValues;
    try {
      setSaving(true);
      if (editingSubscription) {
        await updateAnimeSyncSubscription(editingSubscription.id, payload);
        Toast.success('订阅已更新');
      } else {
        await createAnimeSyncSubscription(payload);
        Toast.success('订阅已创建');
      }
      closeModal();
      await loadAllData(subscriptionFilter);
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, editingSubscription ? '更新失败' : '创建失败'));
    } finally {
      setSaving(false);
    }
  };

  const handleRunAll = async () => {
    try {
      setRunningAll(true);
      const res = await runAnimeSync();
      Toast.success(`轮询完成：扫描 ${res.data.scannedSubscriptionCount} 个订阅，发现 ${res.data.discoveredJobCount} 条任务`);
      await loadAllData(subscriptionFilter);
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, '手动轮询失败'));
    } finally {
      setRunningAll(false);
    }
  };

  const handleRunSubscription = async (id: number) => {
    try {
      const res = await runAnimeSyncBySubscription(id);
      Toast.success(`执行完成：发现 ${res.data.discoveredJobCount} 条任务`);
      await loadAllData(subscriptionFilter);
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, '执行失败'));
    }
  };

  const handleToggleSubscription = async (id: number) => {
    try {
      await toggleAnimeSyncSubscription(id);
      Toast.success('订阅状态已更新');
      await loadAllData(subscriptionFilter);
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, '切换失败'));
    }
  };

  const handleDeleteSubscription = async (id: number) => {
    try {
      await deleteAnimeSyncSubscription(id);
      Toast.success('订阅已删除');
      if (subscriptionFilter === id) {
        setSubscriptionFilter(undefined);
      }
      await loadAllData(subscriptionFilter === id ? undefined : subscriptionFilter);
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, '删除失败'));
    }
  };

  const handleRetryJob = async (id: number) => {
    try {
      await retryAnimeSyncJob(id);
      Toast.success('任务已重试');
      await loadAllData(subscriptionFilter);
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, '重试失败'));
    }
  };

  const handleSkipJob = async (id: number) => {
    try {
      await skipAnimeSyncJob(id);
      Toast.success('任务已跳过');
      await loadAllData(subscriptionFilter);
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, '跳过失败'));
    }
  };

  if (loading) {
    return <Loading type="page" text="正在加载番剧同步..." />;
  }

  if (!canAccess) {
    return (
      <div style={{ padding: 24 }}>
        <Empty
          title="当前角色未开通番剧同步功能"
          description="请联系管理员在角色管理里开启 animeSync 功能权限。"
          imageStyle={{ height: 120 }}
        >
          <Button icon={<IconHome />} onClick={() => navigate('/')}>
            返回首页
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <Nav
        mode="horizontal"
        header={{
          logo: (
            <div
              onClick={() => navigate('/')}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #F97316 0%, #EF4444 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <IconVideo style={{ fontSize: 20, color: '#fff' }} />
            </div>
          ),
          text: '番剧同步',
        }}
      />

      <div style={{ padding: 16 }}>
        <Space style={{ width: '100%' }} wrap>
          <Card style={{ width: 240 }} title="订阅总数">
            <Typography.Title heading={3}>{overview.subscriptionCount}</Typography.Title>
          </Card>
          <Card style={{ width: 240 }} title="启用订阅">
            <Typography.Title heading={3}>{overview.enabledSubscriptionCount}</Typography.Title>
          </Card>
          <Card style={{ width: 240 }} title="待处理任务">
            <Typography.Title heading={3}>{overview.discoveredJobCount}</Typography.Title>
          </Card>
          <Card style={{ width: 240 }} title="失败任务">
            <Typography.Title heading={3}>{overview.failedJobCount}</Typography.Title>
          </Card>
        </Space>

        <div style={{ marginTop: 16 }}>
          <Tabs type="line">
            <TabPane tab="订阅配置" itemKey="subscriptions">
              <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 12 }} wrap>
                <Space>
                  <Button icon={<IconRefresh />} onClick={() => loadAllData(subscriptionFilter)}>
                    刷新
                  </Button>
                  {isAdmin ? (
                    <Button theme="solid" type="primary" loading={runningAll} onClick={handleRunAll}>
                      立即轮询全部
                    </Button>
                  ) : null}
                </Space>
                {isAdmin ? (
                  <Button theme="solid" type="tertiary" onClick={openAddModal}>
                    新建订阅
                  </Button>
                ) : null}
              </Space>
              <Table
                rowKey="id"
                pagination={{ pageSize: 10 }}
                dataSource={subscriptions}
                columns={[
                  { title: '名称', dataIndex: 'name' },
                  {
                    title: 'RSS',
                    dataIndex: 'rssUrl',
                    render: value => (
                      <Typography.Text ellipsis style={{ maxWidth: 320 }}>
                        {String(value || '-')}
                      </Typography.Text>
                    ),
                  },
                  {
                    title: '目标目录',
                    dataIndex: 'targetOpenlistPath',
                    render: value => (
                      <Typography.Text ellipsis style={{ maxWidth: 220 }}>
                        {String(value || '-')}
                      </Typography.Text>
                    ),
                  },
                  { title: '轮询间隔(s)', dataIndex: 'pollIntervalSec', width: 120 },
                  {
                    title: '状态',
                    dataIndex: 'enabled',
                    width: 100,
                    render: value => <Tag color={value ? 'green' : 'grey'}>{value ? '启用' : '停用'}</Tag>,
                  },
                  {
                    title: '操作',
                    width: 320,
                    render: (_, record) => {
                      const item = record as AnimeSyncSubscription;
                      if (!isAdmin) {
                        return '-';
                      }
                      return (
                        <Space>
                          <Button size="small" onClick={() => handleRunSubscription(item.id)}>
                            执行
                          </Button>
                          <Button size="small" onClick={() => openEditModal(item)}>
                            编辑
                          </Button>
                          <Button size="small" type={item.enabled ? 'warning' : 'primary'} onClick={() => handleToggleSubscription(item.id)}>
                            {item.enabled ? '停用' : '启用'}
                          </Button>
                          <Popconfirm title="确认删除该订阅吗？" onConfirm={() => handleDeleteSubscription(item.id)}>
                            <Button size="small" type="danger">
                              删除
                            </Button>
                          </Popconfirm>
                        </Space>
                      );
                    },
                  },
                ]}
              />
            </TabPane>
            <TabPane tab="任务状态" itemKey="jobs">
              <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 12 }} wrap>
                <Select
                  placeholder="全部订阅"
                  value={subscriptionFilter}
                  onChange={value => {
                    const nextValue = Number(value) || undefined;
                    setSubscriptionFilter(nextValue);
                    void loadJobs(nextValue);
                  }}
                  optionList={[{ label: '全部订阅', value: 0 }, ...subscriptionOptions]}
                  style={{ width: 280 }}
                />
                <Button icon={<IconRefresh />} onClick={() => loadAllData(subscriptionFilter)}>
                  刷新
                </Button>
              </Space>
              <Table
                rowKey="id"
                pagination={{ pageSize: 10 }}
                dataSource={jobs}
                columns={[
                  { title: 'ID', dataIndex: 'id', width: 80 },
                  {
                    title: '标题',
                    dataIndex: 'title',
                    render: value => (
                      <Typography.Text ellipsis style={{ maxWidth: 360 }}>
                        {String(value || '-')}
                      </Typography.Text>
                    ),
                  },
                  {
                    title: '状态',
                    dataIndex: 'status',
                    width: 120,
                    render: value => (
                      <Tag color={jobStatusColorMap[value as AnimeSyncJobStatus] || 'grey'}>
                        {jobStatusLabelMap[value as AnimeSyncJobStatus] || String(value || '-')}
                      </Tag>
                    ),
                  },
                  { title: '重试次数', dataIndex: 'retryCount', width: 100 },
                  {
                    title: '错误信息',
                    dataIndex: 'lastError',
                    render: value => (
                      <Typography.Text type="danger" ellipsis style={{ maxWidth: 260 }}>
                        {String(value || '-')}
                      </Typography.Text>
                    ),
                  },
                  {
                    title: '更新时间',
                    dataIndex: 'updatedAt',
                    width: 180,
                    render: value => (value ? new Date(value).toLocaleString() : '-'),
                  },
                  {
                    title: '操作',
                    width: 180,
                    render: (_, record) => {
                      const item = record as AnimeSyncEpisodeJob;
                      if (!isAdmin) {
                        return '-';
                      }
                      return (
                        <Space>
                          <Button size="small" onClick={() => handleRetryJob(item.id)}>
                            重试
                          </Button>
                          <Button size="small" type="warning" onClick={() => handleSkipJob(item.id)}>
                            跳过
                          </Button>
                        </Space>
                      );
                    },
                  },
                ]}
              />
            </TabPane>
          </Tabs>
        </div>
      </div>

      <Modal
        title={editingSubscription ? '编辑订阅' : '新建订阅'}
        visible={modalVisible}
        confirmLoading={saving}
        onCancel={closeModal}
        onOk={() => formApi?.submitForm()}
      >
        <AppForm
          key={editingSubscription ? `edit-${editingSubscription.id}` : 'add'}
          labelPosition="top"
          initValues={
            editingSubscription
              ? {
                  name: editingSubscription.name,
                  rssUrl: editingSubscription.rssUrl,
                  targetOpenlistPath: editingSubscription.targetOpenlistPath,
                  qbitCategory: editingSubscription.qbitCategory || '',
                  pollIntervalSec: editingSubscription.pollIntervalSec,
                  enabled: editingSubscription.enabled,
                }
              : defaultFormValues
          }
          getFormApi={setFormApi}
          onSubmit={handleSave}
        >
          <AppForm.Input field="name" label="订阅名称" placeholder="例如：海贼王" />
          <AppForm.Input field="rssUrl" label="RSS 地址" placeholder="https://mikanani.me/RSS/Bangumi?bangumiId=xxx" />
          <AppForm.Input field="targetOpenlistPath" label="目标目录" placeholder="/动漫/海贼王" />
          <AppForm.Input field="qbitCategory" label="qB 分类（可选）" placeholder="anime" />
          <AppForm.Input field="pollIntervalSec" label="轮询间隔（秒）" type="number" placeholder="300" />
          <AppForm.RadioGroup field="enabled" label="是否启用">
            <AppForm.Radio value>启用</AppForm.Radio>
            <AppForm.Radio value={false}>停用</AppForm.Radio>
          </AppForm.RadioGroup>
        </AppForm>
      </Modal>
    </div>
  );
}

export default AnimeSyncApp;
