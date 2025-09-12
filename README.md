# DataShield 接入层

## 简介
基于 Vue 开发的敏感数据数据脱敏管理平台前端项目。可构建基于 Nginx 的 Docker 镜像。提供网关 + 前端的服务。

## 快速开始

```sh
npm install
npm run dev
```

## 打包为 Docker 镜像

```sh
npm run build
docker build -t datashield/frontend .
```

## 生产环境部署

```sh
docker run --name frontend -d \
	--add-host=host.docker.internal:host-gateway \
	-p 80:80 datashield/frontend
```