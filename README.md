# beszel-ui

哪吒（Nezha）风格的服务器监控前端，作为 [Beszel](https://github.com/henrygd/beszel) 的补充 UI。

- 后端：直连 Beszel 内置 PocketBase（`VITE_BESZEL_URL`），无需任何额外服务。
- 前端：Vite 8 + React 19 + TypeScript + Tailwind v4，自绘 SVG 图表，无重型图表库。
- 部署：Komodo 一体化 Build + Deploy（见下文），目标主机 corp172-dev。

## 部署（Komodo）

本仓库由 [homelab-infra](https://github.com/coolxll/homelab-infra) 仓库中的
`hosts/corp172-dev/stacks/beszel-ui/` stack 引用。Komodo Stack 的
`linked_repo` 指向本仓库，`run_build=true`，push 到 `main` 即触发
corp172-dev 上的 rebuild + redeploy。

详见 `homelab-infra/hosts/corp172-dev/stacks/beszel-ui/README.md`。

## 本地开发

```bash
cp .env.example .env
# 编辑 .env，把 VITE_BESZEL_URL 指向你的 Beszel 中心（例如 http://100.85.194.78:8090）
pnpm install
pnpm dev
```

打开 <http://127.0.0.1:5173>，用 Beszel 上的 PocketBase 用户邮箱+密码登录。

## CORS

浏览器直连 Beszel，因此 Beszel 中心必须允许来自本 UI 的源。在 Beszel 服务端
（例如 `rn-direct` 的 `homelab-beszel` stack）的 env 中加入：

```
BESZEL_CORS_ORIGINS=http://100.93.132.98:8091,http://127.0.0.1:5173
```

然后重启 Beszel。源必须包含部署后的访问源（这里是 corp172-dev 的 Tailscale
地址 `100.93.132.98:8091`）和本地 dev 源。

> 如果暂时无法修改 Beszel 配置，可以切换到"反代模式"：在 `nginx.conf` 中
> 添加 `location /api/ { proxy_pass http://beszel:8090; }` 并把
> `VITE_BESZEL_URL` 改为相对路径 `/`。

## 构建

```bash
pnpm build       # 输出到 dist/
pnpm preview     # 本地预览构建产物
```

## Docker 构建

```bash
docker build \
  --build-arg VITE_BESZEL_URL=http://100.85.194.78:8090 \
  -t beszel-ui:local .
docker run --rm -p 127.0.0.1:8091:80 beszel-ui:local
```

## 功能

- **总览**：所有系统卡片，状态点、CPU/内存/磁盘进度条、上下行速率。
- **详情**：单系统最近 60 分钟 CPU/内存/磁盘/网络趋势图 + 该系统容器列表。
- **容器**：跨主机 Docker 容器表格。
- **报警**：当前告警规则与触发状态。

实时性：`systems` 走 PocketBase realtime 订阅；`system_stats` / `containers` /
`alerts` 每 15–30s 轮询一次（足够低基数场景）。

## 不做的事

- 只读。不在 UI 中创建/修改告警、不接管 agent 注册、不管理用户。
- 不替换 Beszel 官方 UI，只是补充一种哪吒风格的视图。
