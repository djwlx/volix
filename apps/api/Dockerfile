FROM node:18.20-slim

WORKDIR /app

COPY --chown=0:0 . .

# 安装依赖
RUN npm install -g pnpm@8.15.9 \
    && pnpm install 
   

# 暴露应用的端口（如 3000）
EXPOSE 3000

# 启动命令
CMD ["sh", "-c", "npm run init && npm start"]
