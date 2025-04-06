#!/bin/bash

# 前端构建脚本
# 用法: ./build-frontend.sh

echo "开始构建前端..."

# 进入前端目录
cd frontend || { echo "无法进入frontend目录"; exit 1; }

# 安装pnpm
echo "安装pnpm..."
npm install -g pnpm@8.15.9 || { echo "pnpm安装失败"; exit 1; }

# 安装依赖
echo "安装依赖..."
pnpm install || { echo "依赖安装失败"; exit 1; }

# 构建项目
echo "构建项目..."
pnpm run build || { echo "构建失败"; exit 1; }

# 返回上级目录
cd ..

# 处理构建输出
echo "处理构建输出..."
rm -rf public
mv -f frontend/dist public || { echo "移动构建输出失败"; exit 1; }

echo "前端构建完成!"