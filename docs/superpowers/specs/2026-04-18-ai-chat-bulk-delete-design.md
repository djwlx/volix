
# AI 会话多选删除设计

## 目标

在 AI 会话列表中新增“多选删除”能力，同时保留现有单条删除入口。

本次设计的目标是：

1. 用户可以进入批量管理模式，对多个会话进行勾选。
2. 用户可以一次性删除多个已选会话。
3. 当前单条删除能力继续保留，避免影响日常轻量操作。
4. 尽量复用现有前端状态和后端单删接口，降低改动风险。

## 已确认决策

- 保留每条会话上的单条删除入口。
- 新增顶部“批量管理”入口，而不是默认常驻勾选框。
- 进入批量模式后，列表项左侧显示勾选框。
- 批量删除先复用现有单条删除接口，不新增后端批量删除 API。
- 删除前弹一次总确认。
- “全选”只作用于当前搜索结果中的可见会话。

## 当前实现

当前 AI 会话页的会话列表渲染和删除逻辑主要在 [apps/web-pc/src/apps/ai-chat/index.tsx](/Users/bendong/Code/volix/apps/web-pc/src/apps/ai-chat/index.tsx:1)。

现状如下：

- 列表项右上角已有单条删除按钮。
- 前端通过 `onDeleteConversation` 执行删除，并在本地更新 `conversations`、`activeConversationId`、`messages`、`toolCalls` 等状态。
- 后端目前只提供 `DELETE /ai/conversations/:id` 单删接口，前端通过 [apps/web-pc/src/services/ai.ts](/Users/bendong/Code/volix/apps/web-pc/src/services/ai.ts:1) 中的 `deleteAiConversation` 调用。

这意味着本次功能更适合在前端增加“选择态”和“批量调度层”，而不是直接改造后端协议。

## 方案对比

### 方案 A：顶部入口进入批量模式

做法：

- 在会话列表顶部增加“批量管理”按钮。
- 进入批量模式后才显示勾选框和批量操作栏。
- 批量模式下点击会话卡片主要用于切换选中状态。

优点：

- 与当前 UI 兼容最好。
- 平时列表保持轻量，不增加视觉噪音。
- 删除入口职责更清晰，误触概率低。

缺点：

- 多一步进入操作。

### 方案 B：勾选框常驻显示

做法：

- 每条会话左侧始终显示勾选框。

优点：

- 实现直接。
- 选择入口始终可见。

缺点：

- 日常浏览状态变重。
- 容易与“切换会话”的主交互争抢点击区域。

### 方案 C：长按或隐式进入多选

做法：

- 通过长按、右键或特殊手势进入多选模式。

优点：

- 表面 UI 更干净。

缺点：

- 可发现性差。
- 桌面端不如显式入口稳定。

## 采用方案

采用方案 A：顶部入口进入批量模式。

这是对现有结构侵入最小、交互也最直观的方案。

## 交互设计

### 默认状态

- 维持当前会话列表展示方式。
- 每条会话继续保留右上角单条删除按钮。
- 点击列表项继续切换当前会话。

### 进入批量模式后

- 会话列表顶部操作区切换为批量模式工具栏。
- 每条会话左侧显示勾选框。
- 单条删除按钮在批量模式下隐藏，避免入口冲突。
- 点击列表项本体时，不再切换会话，而是切换该项选中状态。

### 批量模式工具栏

工具栏至少包含：

- `已选 N 项`
- `全选`
- `取消全选`
- `删除所选`
- `退出批量模式`

当没有可见会话时：

- 不显示“全选”和“删除所选”的可执行态。

当没有选中项时：

- `删除所选` 为禁用态。

### 删除确认

用户点击 `删除所选` 后，弹出一次总确认，文案明确提示：

- 会同时删除所选会话的消息、工具调用记录和运行记录。
- 操作不可恢复。

## 数据与状态设计

前端新增最小状态：

```ts
const [bulkMode, setBulkMode] = useState(false);
const [selectedConversationIds, setSelectedConversationIds] = useState<string[]>([]);
const [bulkDeleting, setBulkDeleting] = useState(false);
```

约束：

- `selectedConversationIds` 只存储当前用户明确选中的会话 ID。
- 退出批量模式时清空选中集合。
- 搜索词变化后，已选集合保留，但“全选/取消全选”只针对当前 `filteredConversations`。

推荐衍生状态：

```ts
const visibleConversationIds = filteredConversations.map(item => item.id);
const selectedVisibleCount = visibleConversationIds.filter(id => selectedConversationIds.includes(id)).length;
const allVisibleSelected = visibleConversationIds.length > 0 && selectedVisibleCount === visibleConversationIds.length;
```

## 删除执行流程

### 单条删除

维持现有逻辑不变。

### 批量删除

批量删除流程如下：

1. 获取当前选中的会话 ID 列表。
2. 将批量操作区置为 loading / disabled。
3. 按选中顺序逐条调用 `deleteAiConversation(id)`。
4. 每删除成功一条，就从本地 `conversations` 中移除。
5. 如果被删项中包含当前激活会话，则在全部删除结束后，根据剩余可见列表选择 fallback 会话。
6. 删除完成后清空选中集合。
7. 如果列表已空，则退出批量模式并清空详情区。
8. 根据结果展示汇总提示。

之所以采用逐条删除而不是并发删除：

- 可以最大限度复用现有单删后的本地状态收敛逻辑。
- 更容易处理“当前激活会话被删除”的回退逻辑。
- 失败时更容易给出成功/失败汇总。

## 错误处理

### 全部成功

- 提示“已删除 N 条会话”。

### 部分成功

- 提示“成功删除 X 条，失败 Y 条”。
- 保留失败项在列表中。
- 清除已成功删除项的选中状态。

### 全部失败

- 提示“批量删除失败”。
- 保留当前选中状态，便于用户重试或取消。

## 边界条件

### 当前激活会话被批量删除

- 删除完成后，从剩余可见会话中优先选择相邻项。
- 如果不存在剩余会话，则清空 `messages`、`toolCalls`，中止 SSE，并重置连接状态。

### 搜索过滤场景

- “全选”仅选择当前过滤结果中的会话。
- 用户清空搜索词后，之前已选但暂不可见的会话仍应保持选中状态。

### 删除进行中

- 禁用“全选/取消全选/删除所选/退出批量模式”。
- 禁止重复提交。

### 列表为空

- 自动退出批量模式。
- 清空选中状态。

## 实现拆分

### 前端页面

主要修改 [apps/web-pc/src/apps/ai-chat/index.tsx](/Users/bendong/Code/volix/apps/web-pc/src/apps/ai-chat/index.tsx:1)：

- 增加批量模式状态。
- 增加会话勾选逻辑。
- 增加批量模式工具栏。
- 抽出或补充删除后的本地状态收敛逻辑，避免单删和批删重复分叉。

### 样式

主要修改 [apps/web-pc/src/apps/ai-chat/index.module.scss](/Users/bendong/Code/volix/apps/web-pc/src/apps/ai-chat/index.module.scss:1)：

- 增加勾选框布局样式。
- 增加批量模式工具栏样式。
- 调整列表项在批量模式下的点击和视觉反馈。

### 服务层

本次不新增后端接口。

现有 [apps/web-pc/src/services/ai.ts](/Users/bendong/Code/volix/apps/web-pc/src/services/ai.ts:1) 中的 `deleteAiConversation` 继续复用。

## 测试策略

本次优先验证以下行为：

1. 默认模式下单条删除保持可用。
2. 进入批量模式后，可以单独勾选和取消勾选会话。
3. “全选/取消全选”只作用于当前过滤结果。
4. 批量删除后，本地列表与当前激活会话状态正确收敛。
5. 当前激活会话被删除时，详情区能正确切换或清空。
6. 部分删除失败时，成功项移除，失败项保留并给出汇总提示。

如果现有前端自动化测试基础不足，可以先通过构建和手动回归验证本次功能，再视需要补测试基建。

## 非目标

本次不包含以下内容：

- 后端批量删除 API
- 跨页或跨服务端分页的批量选择
- 批量重命名、批量归档等其他批量管理动作
- 会话恢复站或软删除机制
