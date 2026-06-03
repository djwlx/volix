# 115 云端图片代理配置设计

## 背景

当前 `115` 图片相关接口在本地缓存命中时会返回站内 `/api/...` 地址，在本地缓存未命中时会直接把 115 云端下载直链返回给前端。

已经存在一个独立仓库 `cloudflare-proxy`，提供 `GET /proxy?url=<encoded-url>` 的图片代理能力。本次目标是在 `volix` 中新增一个配置项，用来控制这些 115 云端图片直链是否要经过该代理转发。

这次改动需要满足：

- 只代理返回给前端的 `115` 云端直链。
- 本地缓存命中的场景保持原样，不走代理。
- 云端兜底后的异步本地缓存回填流程保持原样。
- 随机图片、同目录随机、缓存缺失兜底等所有暴露 115 云端直链的入口统一遵守同一套规则。

## 目标行为

### 配置行为

在现有随机图片配置中新增一个字符串字段：

- `cloudProxyUrl`

约定如下：

- 空字符串表示关闭代理。
- 非空字符串表示启用代理。
- 配置值必须是合法的 `http` 或 `https` URL。
- 该值由用户填写完整代理入口，例如 `https://your-worker.example.com/proxy`。

本次不额外拆分为布尔开关加地址两个字段，避免配置冗余。

### URL 返回规则

对所有图片返回值，统一执行以下规则：

- 如果返回的是本地缓存 URL，例如 `/api/115/pic/cache/:pc` 或 `/api/115/pic/random-cache/:fileName`，保持不变。
- 如果返回的是 115 云端直链且 `cloudProxyUrl` 为空，保持原始 URL。
- 如果返回的是 115 云端直链且 `cloudProxyUrl` 非空，则返回：
  `cloudProxyUrl + '?url=' + encodeURIComponent(originUrl)`。

本次不追加新的查询参数，也不改动 `cloudflare-proxy` 的协议。

## 影响范围

### 需要接入代理包装的后端路径

以下场景在本地缓存缺失时会返回 115 云端直链，需要统一接入：

- 全局随机图片接口
- 同目录随机图片接口
- `/api/115/pic/random-cache/:fileName` 在本地随机缓存缺失时的兜底
- `/api/115/pic/cache/:pc` 在本地图片缓存缺失时的兜底

### 不需要改动的场景

以下场景不直接返回 115 云端直链，因此不需要改变行为：

- 点赞接口本身的返回值
- 喜欢图片列表接口
- 纯路径信息接口
- 本地缓存文件读取与格式转换逻辑

## 后端设计

### 配置模型扩展

扩展以下类型与配置归一化逻辑：

- `packages/types/src/api/115.ts`
- `apps/api/src/modules/115/types/115.types.ts`
- `apps/api/src/modules/115/service/picture/picture-cache-random-core.ts`

`parseRandomCacheConfig` 与 `normalizeRandomCacheConfig` 需要补充 `cloudProxyUrl` 的读取、归一化和默认值处理。

归一化规则：

- 非字符串输入按空字符串处理。
- 保存前去掉首尾空白。
- 仅接受 `http` 和 `https` 协议。
- 非法值在保存接口处直接报错，不静默落库。

本次继续复用已有配置键 `picture_115_random_weights`，不新增新的配置键。

### 代理 URL helper

在 `115` 图片服务目录下新增一个小型 helper，职责仅包括：

- 读取并规范化代理配置
- 判断是否需要包装当前 URL
- 根据配置生成最终返回给前端的 URL

建议提供两个明确能力：

- `buildCloudProxyUrl(originUrl, proxyUrl)`
- `resolve115CloudImageUrl(originUrl)`

其中 `resolve115CloudImageUrl` 从当前配置读取 `cloudProxyUrl` 并返回最终 URL。

这样可以避免在各个接口中重复拼接逻辑，也能降低后续新增入口时漏接代理规则的风险。

### 云端返回点接入

接入原则是“只在最终返回给前端前包装 URL”，不提前改动下载和缓存链路。

具体做法：

- `buildRandomPicMetaFromFile` 在未命中本地随机缓存时，对 115 云端直链做代理包装。
- `buildRemotePicSourceFromFile` 在返回远程图片源时，对 115 云端直链做代理包装。

这样可以覆盖：

- 全局随机图片
- 同目录随机图片
- 随机缓存缺失兜底
- 图片缓存缺失兜底

### 缓存回填保持不变

现有这些流程必须保持：

- 随机图片命中云端后，继续调用 `ensureRandomLocalPicCacheByFileAsync(...)`
- 点赞缓存或图片缓存缺失时，继续调用 `ensureLocalPicCacheByFileAsync(...)`
- 这些异步缓存任务下载图片时仍然使用原始 115 直链，不走前端代理包装逻辑

也就是说，本次只改变“返回给前端的云端 URL”，不改变服务端内部的下载地址来源。

## 前端设计

### 类型与请求

扩展随机图片配置相关类型，使前端可读写 `cloudProxyUrl`。

涉及：

- `packages/types/src/api/115.ts`
- `apps/web-pc/src/services/115.ts`

接口路径保持不变，仍使用现有随机图片配置保存接口。

### 设置页

在 `apps/web-pc/src/apps/115/pic-setting.tsx` 的随机图片配置表单中增加一个输入框，用于填写代理入口地址。

交互要求：

- 空值表示关闭代理
- 非空时原样保存，但会先做 trim
- 保存失败时沿用现有错误提示机制

文案必须补到 i18n 资源中，不新增硬编码文本。

建议新增这些文案键：

- `pic115.form.cloudProxyUrl`
- `pic115.form.cloudProxyUrlHint`

## 测试设计

### 配置测试

补充配置解析与保存测试，覆盖：

- 默认值包含空 `cloudProxyUrl`
- 合法 URL 可被保留
- 空白字符串被归一化为空
- 非法 URL 在保存时被拒绝

### 服务测试

补充后端测试，覆盖：

- 随机图片未命中本地缓存且开启代理时，返回代理 URL
- 同目录随机图片未命中本地缓存且开启代理时，返回代理 URL
- 本地缓存命中时，返回本地 URL，不受代理配置影响
- `get115RandomPicCacheFileData` 兜底到云端时，返回代理 URL
- `get115PicCacheFileByPcData` 兜底到云端时，返回代理 URL
- 以上云端兜底场景仍会触发原有异步缓存预热调用

### 回归关注点

重点确认以下行为没有回退：

- 本地缓存读图行为不变
- 随机图片去重与来源权重逻辑不变
- 图片格式转换逻辑不变
- 喜欢图片列表返回结构不变

## 风险与控制

- 如果代理配置写成非 `/proxy` 路径，请求仍会按填写值直接拼接；这是预期行为，避免把部署细节写死在代码里。
- 如果后续还有新的 115 云端图片返回入口，必须复用同一个 helper，避免规则分叉。
- 由于当前工作区已有相关未提交修改，实现时需要谨慎合并，避免覆盖已有进行中的改动。

## 验收标准

- 设置页可配置 `cloudProxyUrl`
- 为空时所有现有图片行为与现在一致
- 非空时所有返回给前端的 115 云端图片直链都会被包装为代理 URL
- 本地缓存命中时 URL 不变
- 云端兜底后的异步本地缓存回填仍然正常工作
