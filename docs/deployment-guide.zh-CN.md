# PRD2Prototype 部署指南（Linux / PM2 / Nginx）

> 目标：把项目稳定部署到 Linux 服务器，让团队成员通过浏览器访问原型站点。

本文基于 **Node.js + pnpm + Next.js + PM2**。如果你是第一次部署，按文档顺序执行即可。

---

## 1. 部署模式概览

推荐生产架构：

1. `pnpm pipeline` 在服务器生成运行产物（`runs/<runId>/...`）。
2. `web-preview` 作为长期进程运行（默认 3000 端口）。
3. Nginx 反向代理到 `127.0.0.1:3000`，对外提供 80/443。
4. （可选）使用 HTTPS 证书（例如 Let's Encrypt）。

---

## 2. 前置条件

请提前准备：

- Linux 服务器（推荐 Ubuntu 22.04/24.04）
- 可登录账户（sudo 权限）
- Git 已安装
- 已开放网络端口：
  - 22（SSH）
  - 80/443（Nginx）
  - 3000（仅在你直连 Next.js 时需要）

项目版本建议：

- Node.js 20+
- pnpm 10+（仓库使用 `pnpm@10.7.1`）

---

## 3. 服务器初始化

### 3.1 安装 Node.js（nvm 推荐）

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

### 3.3 拉取仓库并安装依赖

```bash
git clone <你的仓库地址> PRD2Prototype
cd PRD2Prototype
pnpm install
```

---

## 4. 首次部署（最小可运行）

### 4.1 先生成一次产物（可选但推荐）

```bash
pnpm pipeline
```

用于确认 `runs/<runId>/` 产物和 `output/latest-run.json` 正常生成。

### 4.2 构建前端预览应用

```bash
pnpm --filter web-preview build
```

### 4.3 临时启动验证

```bash
pnpm --filter web-preview start
```

默认访问地址：

```text
http://服务器IP:3000
```

自定义端口示例：

```bash
pnpm --filter web-preview start -- -p 3100
```

---

## 5. PM2 常驻运行（推荐）

### 5.1 安装 PM2

```bash
npm install -g pm2
```

### 5.2 启动服务

```bash
cd /path/to/PRD2Prototype
pm2 start "pnpm --filter web-preview start" --name prd2prototype-web
```

### 5.3 开机自启

```bash
pm2 save
pm2 startup
```

执行 `pm2 startup` 输出的 `sudo ...` 命令后，再执行一次 `pm2 save`。

### 5.4 常用 PM2 运维命令

```bash
pm2 ls
pm2 logs prd2prototype-web
pm2 restart prd2prototype-web
pm2 stop prd2prototype-web
pm2 delete prd2prototype-web
```

---

## 6. Nginx 反向代理（推荐）

### 6.1 安装 Nginx

```bash
sudo apt update
sudo apt install -y nginx
```

### 6.2 配置站点

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
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用并重载：

```bash
sudo ln -sf /etc/nginx/sites-available/prd2prototype /etc/nginx/sites-enabled/prd2prototype
sudo nginx -t
sudo systemctl reload nginx
```

---

## 7. 更新发布流程（建议）

每次上线建议按以下顺序：

```bash
cd /path/to/PRD2Prototype
git pull
pnpm install --frozen-lockfile
pnpm --filter web-preview build
pm2 restart prd2prototype-web
```

如果本次包含 PRD 变更并要刷新原型：

```bash
pnpm pipeline
```

可选：清理历史运行目录避免磁盘增长：

```bash
pnpm runs:prune -- --keep 20 --days 7
```

---

## 8. systemd 替代方案（不用 PM2 时）

如果你更偏好 systemd，可创建服务文件：

```bash
sudo vim /etc/systemd/system/prd2prototype-web.service
```

示例：

```ini
[Unit]
Description=PRD2Prototype Web Preview
After=network.target

[Service]
Type=simple
WorkingDirectory=/path/to/PRD2Prototype
ExecStart=/usr/bin/env pnpm --filter web-preview start
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

加载并启动：

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now prd2prototype-web
sudo systemctl status prd2prototype-web
```

---

## 9. 故障排查

### 9.1 `pnpm: command not found`

```bash
source ~/.bashrc
pnpm -v
```

如仍失败，重新安装 pnpm 并确认 PATH。

### 9.2 端口占用（`EADDRINUSE`）

```bash
lsof -i :3000
```

结束旧进程或改端口。

### 9.3 页面能打开但数据未更新

确认是否执行过：

```bash
pnpm pipeline
```

并检查 `output/latest-run.json` 的时间是否更新。

### 9.4 PM2 进程存在但站点异常

```bash
pm2 logs prd2prototype-web --lines 200
```

重点排查：Node 版本、构建是否成功、依赖是否完整。

### 9.5 Nginx 502

常见原因：

- `web-preview` 未启动
- 反代目标端口不一致
- 本机防火墙限制

建议顺序：先本机 `curl 127.0.0.1:3000`，再查 Nginx 日志。

---

## 10. 生产部署检查清单（Checklist）

- [ ] `node -v` 为 20+
- [ ] `pnpm -v` 为 10+
- [ ] `pnpm install --frozen-lockfile` 成功
- [ ] `pnpm --filter web-preview build` 成功
- [ ] `pnpm --filter web-preview start` 本机可访问
- [ ] PM2 或 systemd 常驻配置完成
- [ ] Nginx 反向代理配置并 `nginx -t` 通过
- [ ] （可选）HTTPS 证书配置完成
- [ ] `pnpm pipeline` 后 `output/latest-run.json` 已更新

完成以上步骤后，服务可稳定对外提供预览能力。
