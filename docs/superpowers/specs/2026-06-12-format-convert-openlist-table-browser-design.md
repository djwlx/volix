# 格式转换 OpenList 表格浏览器重构设计

## 目标

- 用统一的表格浏览器替换现有 OpenList 树形文件选择器
- 同时覆盖云源文件选择与云目标目录选择，两处复用同一套浏览能力
- 后端接口改为真分页，前端表格直接消费分页结果
- 保留云源文件跨目录多选与右侧已选文件篮子能力
- 保留云目标目录单选确认能力

## 非目标

- 不改动格式转换任务创建协议
- 不新增搜索、排序、批量目录操作
- 不调整已选文件篮子与转换参数表单的业务规则

## 现状问题

- `CloudSourceTree` 依赖 `Tree` 懒加载目录，天然不适合分页
- `OpenlistBrowser` 的目录模式是树，文件模式是表格，两套交互和状态分裂
- `/format-convert/openlist/fs` 当前固定读取 `page=1, perPage=500`，前端无法获得真实分页能力
- `openlist-tree.ts` 以树节点模型承载表格与树两种场景，结构已经偏离实际需求

## 方案概览

- 引入共享组件 `OpenlistTableBrowser`
- 浏览器以“当前路径 + 当前页 + 分页大小”驱动数据加载
- 文件模式支持多选文件并将选中结果同步到外层全局映射
- 目录模式支持进入目录、选中当前目录并确认返回
- 删除树节点模型，统一改用贴近接口返回的表格行模型

## 组件设计

### `OpenlistTableBrowser`

职责：

- 展示当前路径下的 OpenList 列表数据
- 提供路径切换、返回上一级、刷新、分页
- 根据模式控制文件多选或目录单选
- 对外暴露当前路径、当前目录信息和选择事件

核心入参：

- `selectMode: 'file' | 'dir'`
- `selectionMode: 'single' | 'multiple'`
- `selectedPaths?: string[]`
- `selectedDirPath?: string`
- `disabled?: boolean`
- `onFileSelectionChange?`
- `onDirSelectionChange?`

核心行为：

- 目录行点击后进入对应路径
- 文件模式下目录行不参与勾选，只负责导航
- 文件模式下文件行通过表格多选框勾选
- 目录模式下表格只展示目录行，当前路径可被确认选中

### `CloudSourceTree`

- 保留组件名作为业务包装层，避免一次性扩大调用面
- 内部改为渲染 `OpenlistTableBrowser`
- 负责把浏览器返回的文件选中结果同步到 `selected` 映射
- 继续承接右侧已选文件篮子现有契约

### `OpenlistBrowser`

- 保留弹窗壳与现有调用接口
- 内部统一改为渲染 `OpenlistTableBrowser`
- `selectMode='dir'` 时提供确认按钮
- 不再使用 `Tree`

## 数据模型

新增表格行模型：

- `OpenlistBrowserRow`
  - `name`
  - `path`
  - `isDir`
  - `size`
  - `modified`

保留接口返回中的路径与文件元信息，不再派生树节点字段：

- 删除 `key`、`value`、`label`、`children`、`loaded`、`isLeaf` 一类仅树场景需要的字段

## 接口设计

### 请求参数

`GET /format-convert/openlist/fs`

- `path`: 当前目录路径，默认 `/`
- `page`: 页码，默认 `1`
- `perPage`: 每页条数，默认 `20`

### 返回结构

- `path`
- `page`
- `perPage`
- `total`
- `content`

### 后端实现调整

- `listOpenlistFsForFormatConvert` 从 query 中解析 `path`、`page`、`perPage`
- `listFormatConvertOpenlistFs` 透传分页参数到 OpenList SDK
- 不再写死 `page=1, perPage=500`
- 返回值按前端需要补齐 `page` 与 `perPage`

### 前端服务调整

- `browseFormatConvertOpenlist` 改为支持 `{ path, page, perPage }`
- 所有 OpenList 选择器统一通过该服务读取分页数据

## 交互规则

### 文件模式

- 顶部显示当前路径与刷新操作
- 表格展示目录与文件
- 点击目录名称进入目录
- 文件行显示多选框
- 选中状态以 `path` 为唯一键，由外层全局映射维护
- 切换目录或分页后，当前页根据全局映射自动回填选中态
- 允许跨目录累计选择文件

### 目录模式

- 表格只展示目录
- 点击目录名称进入目录
- 当前浏览路径始终视为可选目标目录
- 用户点击确认时返回当前路径，而不是某个表格文件项
- 根目录 `/` 继续禁止作为云转换目标提交

### 分页行为

- 翻页只影响当前路径下的数据视图
- 已选文件不因翻页丢失
- 切换目录时页码重置为 `1`
- 刷新保持当前路径与当前页

## 页面文案调整

现有与“树”强绑定的文案需要改为表格/浏览器语义，并全部进入 i18n：

- `formatConvert.cloud.multiSelectDescription`
- `formatConvert.cloud.sourceTreeTitle`
- `formatConvert.cloud.sourceTreeHint`
- `formatConvert.cloud.sourceTreeLoading`
- `formatConvert.cloud.sourceTreeEmpty`
- `formatConvert.cloud.sourceTreeNodeLoading`
- `formatConvert.cloud.sourceTreeSelectedHint`
- `formatConvert.browser.treeLoading`
- `formatConvert.browser.treeEmpty`

新增文案按需补充：

- 上一级
- 当前页分页信息
- 当前目录选择提示

## 样式调整

- `workbench.module.scss` 中树相关样式收敛为表格浏览器样式
- 保留面板容器、工具栏、加载态等可复用样式
- 删除仅服务于 `Tree` 节点渲染的样式
- 弹窗内与工作台内优先复用同一套浏览器面板样式

## 测试策略

前端测试：

- 共享浏览器在目录模式下渲染表格而不是树
- 文件模式支持目录导航
- 文件模式支持跨目录多选回填
- 分页切换不会丢失已选文件
- 目录模式确认返回当前路径

后端/类型测试：

- OpenList 浏览接口透传 `page` 与 `perPage`
- 返回结构包含 `page`、`perPage`、`total`
- 前端类型与服务层分页参数保持一致

迁移处理：

- 删除 `openlist-tree.ts` 与对应测试
- 更新 `openlist-browser.test.ts`
- 为共享浏览器新增独立测试

## 实施顺序

1. 扩展 OpenList 浏览接口与类型定义
2. 新增共享 `OpenlistTableBrowser`
3. 用共享浏览器替换 `CloudSourceTree`
4. 用共享浏览器替换 `OpenlistBrowser`
5. 清理树模型、旧测试和旧样式
6. 补齐 i18n 与验证测试
