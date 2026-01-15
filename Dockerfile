FROM node:18.20-slim

WORKDIR /app

# 复制 dist 文件夹的内容直接到 /app
COPY dist/ .

# 安装生产依赖
RUN npm install -g pnpm && pnpm install 

# 声明可挂载的数据卷
VOLUME ["/app/data"]

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]
