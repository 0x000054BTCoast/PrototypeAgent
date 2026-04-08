# PRD2Prototype 部署指南（小白友好版）

> 目标：把项目部署到一台 Linux 服务器，让团队成员可通过浏览器访问。

本文采用 **Node.js + pnpm + Next.js 独立运行模式**，适合入门与中小团队。

---

## 1. 你将得到什么

部署完成后，你可以：

1. 在服务器上执行 pipeline 生成原型数据。
2. 让 `apps/web-preview` 在服务器常驻运行。
3. 通过 `http://你的服务器IP:3000`（或绑定域名后 HTTPS）访问页面。

---

## 2. 前置条件

请准备：

- 一台 Linux 服务器（Ubuntu 22.04/24.04 均可）
- 能登录服务器的账号（有 sudo 权限）
- 安装 Git
- 开放端口：
  - 3000（若直接暴露 Next.js）
  - 80/443（若走 Nginx 反向代理）

本项目建议版本：

- Node.js 20+
- pnpm 10+

---

## 3. 服务器初始化

### 3.1 安装 Node.js（推荐 nvm）

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
node -v
```

### 3.2 安装 pnpm

```bash
npm install -g pnpm@10.7.1
pnpm -v
```

### 3.3 拉取代码

```bash
git clone <你的仓库地址> PRD2Prototype
cd PRD2Prototype
```

### 3.4 安装依赖

```bash
pnpm install
```

---

## 4. 生产构建与运行

### 4.1 构建 web-preview

```bash
pnpm --filter web-preview build
```

### 4.2 启动服务（临时）

```bash
pnpm --filter web-preview start
```

默认监听 `3000` 端口。打开：

```text
http://服务器IP:3000
```

> 如果你需要自定义端口，可用：
> `pnpm --filter web-preview start -- -p 3100`

---

## 5. 使用 PM2 常驻运行（推荐）

### 5.1 安装 PM2

```bash
npm install -g pm2
```

### 5.2 启动应用

```bash
cd /path/to/PRD2Prototype
pm2 start "pnpm --filter web-preview start" --name prd2prototype-web
```

### 5.3 设置开机自启

```bash
pm2 save
pm2 startup
```

按终端提示复制并执行那条 `sudo` 命令即可。

### 5.4 常用 PM2 命令

```bash
pm2 ls
pm2 logs prd2prototype-web
pm2 restart prd2prototype-web
pm2 stop prd2prototype-web
```

---

## 6. （可选）配置 Nginx 反向代理

如果你希望通过域名访问并启用 HTTPS，建议 Nginx 转发到本地 `3000`。

### 6.1 安装 Nginx

```bash
sudo apt update
sudo apt install -y nginx
```

### 6.2 新建站点配置

```bash
sudo vim /etc/nginx/sites-available/prd2prototype
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
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用站点并重载：

```bash
sudo ln -s /etc/nginx/sites-available/prd2prototype /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 7. 部署后的日常更新流程

每次代码更新可按以下步骤：

```bash
cd /path/to/PRD2Prototype
git pull
pnpm install
pnpm --filter web-preview build
pm2 restart prd2prototype-web
```

如果你修改了 PRD 并需要重新生成输出：

```bash
pnpm pipeline
```

---

## 8. 常见问题排查

### Q1：`pnpm: command not found`

说明 pnpm 未安装或 PATH 未生效。重新安装后执行：

```bash
source ~/.bashrc
pnpm -v
```

### Q2：端口占用（`EADDRINUSE`）

查看端口占用：

```bash
lsof -i :3000
```

结束旧进程或改端口启动。

### Q3：页面能打开但数据未更新

请确认是否执行过：

```bash
pnpm pipeline
```

并检查 `output/` 下文件时间戳是否刷新。

### Q4：PM2 重启后服务没起来

优先检查：

```bash
pm2 logs prd2prototype-web
```

常见原因是依赖未安装、构建失败或 Node 版本不匹配。

---

## 9. 最小可执行部署清单（Checklist）

- [ ] Node.js 20+ 已安装
- [ ] pnpm 10+ 已安装
- [ ] `pnpm install` 成功
- [ ] `pnpm --filter web-preview build` 成功
- [ ] `pnpm --filter web-preview start` 可访问
- [ ] PM2 常驻配置完成
- [ ] （可选）Nginx 域名访问与 HTTPS 完成

完成以上步骤，即可稳定提供预览服务。
