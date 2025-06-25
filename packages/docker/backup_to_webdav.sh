#!/bin/zsh

# 加载环境变量
source .env.local

# 定义环境变量

WEBDAV_URL=http://localhost:5244/dav/%E6%9C%AC%E6%9C%BA
WEBDAV_USER=admin
WEBDAV_PASSWORD=160295
ZIP_NAME=docker-data-$(date +%Y%m%d-%H%M%S).tar.gz
ZIP_PATH=$(dirname $DATA_PATH)/$ZIP_NAME
FATHER_PATH=$(dirname $DATA_PATH)
COMPOSE_PATH=$FATHER_PATH/Code/volix/packages/docker


# 暂停docker compose
# cd $COMPOSE_PATH & docker compose stop

# 打包docker数据
cd $FATHER_PATH
tar -czf $ZIP_PATH $(basename $DATA_PATH)


# 上传压缩包到webdav
curl -u $WEBDAV_USER:$WEBDAV_PASSWORD -T $ZIP_PATH $WEBDAV_URL/$ZIP_NAME

# 恢复容器
# cd $COMPOSE_PATH & docker compose start



