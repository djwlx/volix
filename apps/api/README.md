# 个人 ALL IN ONE

## 开发规范

- ### 命名规则
  - 普通文件名：小写短横线 例： user-controller.js / auth-middleware.js
  - 普通文件夹名：小写短横线 例：user-service / utils / middlewares
  - 类名：大驼峰 例：UserService / AuthMiddleware
  - 函数名/变量：小驼峰 例：getUserInfo / checkAuth
  - 常量：大写短横线 例：MAX_USER_COUNT / DEFAULT_USER_NAME
  - 组件文件 大驼峰 例：UserCard.tsx
- ### 接口规范
  全部采用 restful 风格

#### docker 挂载路径

- /app/logs
- /app/uploads
- /app/app/database
