FROM node:18.20-slim

WORKDIR /app

COPY --chown=0:0 . .

# 安装依赖
RUN npm install -g pnpm@8.15.9 \
    && pnpm install \
    && apt-get update  \
    && apt-get install -y docker.io docker-compose 
    # && apt-get clean \
    # && rm -rf /var/lib/apt/lists/*



# 暴露应用的端口（如 3000）
EXPOSE 3000

# 启动命令
CMD ["pnpm", "start"]
