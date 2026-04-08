# PRD2Prototype 部署指南

> 目标：把仓库部署到一台 Linux 服务器，让团队成员可以通过浏览器访问原型工作台，并在服务器上持续生成新的 run。

本文默认采用：

- Node.js 20
- pnpm 10
- Next.js 独立运行
- PM2 常驻
- Nginx 反向代理（可选）

## 1. 部署后你会得到什么

部署完成后，服务器会提供两类能力：

1. 运行 `pipeline`，把 PRD 生成到 `runs/<runId>/...`
2. 启动 `apps/web-preview`，通过浏览器查看生成器工作台和最新原型

`web-preview` 现在不是单纯展示页，而是一个原型工作台：

- 首页可输入 PRD 文本
- 可直接触发 `/api/run`
- 可查看运行日志和历史记录
- 可把最新 `structure.json` 渲染成完整产品原型

## 2. 前置条件

请准备：

- 一台 Linux 服务器，推荐 Ubuntu 22.04 或 24.04
- 一个有 `sudo` 权限的账号
- 已安装 Git
- 开放端口：
  - `3000`，如果直接暴露 Next.js
  - `80/443`，如果使用 Nginx

推荐版本：

- Node.js 20+
- pnpm 10.7.1

## 3. 服务器初始化

### 3.1 安装 Node.js

推荐使用 `nvm`：

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
node -v
```

### 3.2 安装 pnpm

推荐使用 `corepack`，这样和仓库声明版本更一致：

```bash
corepack enable
corepack prepare pnpm@10.7.1 --activate
pnpm -v
```

### 3.3 拉取代码

```bash
git clone <你的仓库地址> PrototypeAgent
cd PrototypeAgent
```

### 3.4 安装依赖

```bash
pnpm install
```

## 4. 首次生成运行产物

部署完依赖后，建议先跑一次 pipeline，确认服务器端也能生成输出：

```bash
pnpm pipeline
```

成功后会生成：

- `runs/<runId>/artifacts/structure.json`
- `runs/<runId>/output/preview.html`
- `runs/<runId>/output/prototype.svg`
- `runs/<runId>/logs/pipeline-log.json`
- `output/latest-run.json`

如果你希望服务器始终展示一份已有结果，这一步不要跳过。

## 5. 生产构建与启动

### 5.1 构建 `web-preview`

在仓库根目录执行：

```bash
pnpm --filter web-preview build
```

### 5.2 临时启动

```bash
pnpm --filter web-preview start
```

默认监听 `3000` 端口，访问：

```text
http://服务器IP:3000
```

如果要改端口：

```bash
pnpm --filter web-preview start -- -p 3100
```

## 6. 使用 PM2 常驻运行

### 6.1 安装 PM2

```bash
npm install -g pm2
```

### 6.2 启动应用

```bash
cd /path/to/PrototypeAgent
pm2 start "pnpm --filter web-preview start" --name prototype-agent-web
```

### 6.3 设置开机自启

```bash
pm2 save
pm2 startup
```

终端会打印一条 `sudo` 命令，复制执行即可。

### 6.4 常用 PM2 命令

```bash
pm2 ls
pm2 logs prototype-agent-web
pm2 restart prototype-agent-web
pm2 stop prototype-agent-web
```

## 7. Nginx 反向代理（可选）

如果你希望通过域名访问并后续接入 HTTPS，建议把 Nginx 代理到本地 `3000`。

### 7.1 安装 Nginx

```bash
sudo apt update
sudo apt install -y nginx
```

### 7.2 新建站点配置

```bash
sudo vim /etc/nginx/sites-available/prototype-agent
```

示例配置：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用并重载：

```bash
sudo ln -s /etc/nginx/sites-available/prototype-agent /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 8. 持久化与目录建议

这个项目和普通静态站点不一样，`runs/` 和 `output/` 是运行时数据目录。

建议：

- 不要把 `runs/` 当作临时缓存随意清理
- 如果使用 Docker 或云主机快照，记得把 `runs/`、`output/` 纳入持久化策略
- 如果你会频繁生成原型，定期执行清理命令

例如：

```bash
pnpm runs:prune -- --keep 20 --days 7
```

## 9. 日常更新流程

代码更新时，推荐流程：

```bash
cd /path/to/PrototypeAgent
git pull
pnpm install
pnpm --filter web-preview build
pm2 restart prototype-agent-web
```

如果你还更新了 PRD 或希望刷新最新原型，再执行：

```bash
pnpm pipeline
```

如果你的首页要展示最新结果，建议在 `pnpm pipeline` 之后再刷新服务。

## 10. 常见问题

### Q1：`pnpm: command not found`

通常是 `corepack` 未启用或 shell 环境未刷新。

```bash
corepack enable
corepack prepare pnpm@10.7.1 --activate
pnpm -v
```

### Q2：页面能打开，但还是旧数据

优先确认：

```bash
pnpm pipeline
```

然后检查：

- `output/latest-run.json` 是否更新
- `runs/` 下是否生成了新的 run 目录

### Q3：端口被占用

```bash
lsof -i :3000
```

结束旧进程，或改端口启动。

### Q4：PM2 重启后服务没起来

优先看日志：

```bash
pm2 logs prototype-agent-web
```

常见原因：

- 依赖没装完整
- `web-preview build` 失败
- Node 版本不匹配
- 当前目录不对

### Q5：服务器能访问首页，但点击生成失败

这通常不是 Next.js 页面本身的问题，而是后端 pipeline 没跑通。优先检查：

- `input/prd.md` 是否存在
- `packages/planner` 依赖是否完整
- 最新 `runs/<runId>/logs/pipeline-log.json` 是否报错

## 11. 最小部署检查清单

- [ ] Node.js 20+ 已安装
- [ ] pnpm 10.7.1 可用
- [ ] `pnpm install` 成功
- [ ] `pnpm pipeline` 成功
- [ ] `pnpm --filter web-preview build` 成功
- [ ] `pnpm --filter web-preview start` 可访问
- [ ] PM2 常驻配置完成
- [ ] `runs/` 与 `output/` 已纳入持久化考虑
- [ ] （可选）Nginx 域名访问与 HTTPS 配置完成

完成以上步骤后，这个原型工作台就可以稳定对内提供服务。
