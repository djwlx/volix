FROM node:20-slim

WORKDIR /app

# 时区，可在运行容器时通过 -e TZ=Region/City 覆盖
ENV TZ=Asia/Shanghai

# 限制 glibc malloc arena 与 libuv 线程池，缓解 sharp/libvips 原生内存碎片
ENV MALLOC_ARENA_MAX=2
ENV UV_THREADPOOL_SIZE=4

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg tzdata \
  && ln -snf /usr/share/zoneinfo/$TZ /etc/localtime \
  && echo $TZ > /etc/timezone \
  && rm -rf /var/lib/apt/lists/*

# 安装与仓库一致的 pnpm 版本
RUN npm install -g pnpm@8.15.9

# 复制打包产物（与裸机 node 部署使用同一份 dist）
COPY dist/ .

# 安装生产依赖（含 file: vendored 的 workspace 包）
RUN pnpm install --prod

# 声明可挂载的数据卷
VOLUME ["/app/data"]

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]
