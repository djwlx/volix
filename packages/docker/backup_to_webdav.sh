#!/bin/zsh

# 加载环境变量
source .env
# source .env.local

# 定义环境变量

WEBDAV_URL=http://localhost:5244/dav/115网盘/其他/docker备份
# WEBDAV_URL=http://localhost:5244/dav/本机
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

echo -e "\n 备份完成 $(du -h $ZIP_PATH)"
# 删除备份数据
rm -rf $ZIP_PATH

# 恢复容器
# cd $COMPOSE_PATH & docker compose start



