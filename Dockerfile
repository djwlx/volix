FROM node:20-slim

WORKDIR /app

# 时区，可在运行容器时通过 -e TZ=Region/City 覆盖
ENV TZ=Asia/Shanghai

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg tzdata \
  && ln -snf /usr/share/zoneinfo/$TZ /etc/localtime \
  && echo $TZ > /etc/timezone \
  && rm -rf /var/lib/apt/lists/*

# 复制 dist 文件夹的内容直接到 /app
COPY dist/ .

# 安装生产依赖
RUN npm install -g pnpm@8.15.9 && pnpm install 

# 声明可挂载的数据卷
VOLUME ["/app/data"]

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]
