# v1.0.1 Release Notes（模板）

> **使用说明**：本文件是 v1.0.1 tag 的 **tag 注释 / GitHub Release 描述模板**。
> 在执行 `git tag -a v1.0.1 -m "..."` 时，tag message 应包含本文的核心段落（简版）；
> 在 GitHub Releases 页面发布时，应包含本文的完整版本。

---

## 🏷️ Tag 注释（简版，用于 `git tag -a` 命令）

```text
v1.0.1 - 维护性更新（2026-XX-XX）

基于 v1.0.0 修复配置文件 + 完善 CHANGELOG，本身不引入新功能。

🔧 修复：
- CI: 删除 3 个失败 workflow（codeql-analysis / scorecards / pages-deploy）
- CI: 补全 dependabot.yml 4 重 ignore
- CI: 补全 release-drafter + ghaction-github-labeler 关键配置
- Meta: 补全 6 个空 metadata（description / homepage / keywords / bugs / security / funding）
- Meta: 补全仓库 description + 5 个 topics
- Meta: LICENSE 头年份 2024 → 2026

📝 文档：
- CHANGELOG 完善：Keep a Changelog 2.1.0 标准 6 分类模板
- 新增 v1.0.1 章节
- SVG 截图命名统一（screenshot-*.svg）

详细变更：https://github.com/pomizza/thunder-fighter/blob/v1.0.1/CHANGELOG.md
Compare：https://github.com/pomizza/thunder-fighter/compare/v1.0.0...v1.0.1
```

---

## 📋 GitHub Release 描述（完整版）

### 🎯 变更概览

| 维度 | 详情 |
|------|------|
| **类型** | 维护性更新（Patch） |
| **基础版本** | v1.0.0（2026-07-05） |
| **变更范围** | 仅 CI / Meta / 文档，无功能变更 |
| **破坏性变更** | 无（pure maintenance） |
| **依赖变更** | 无（zero external dependencies） |

### 🔧 修复（5 个 CI 修复 + 3 个 Meta 修复）

#### CI 修复
1. **删除 3 个失败 workflow**
   - `codeql-analysis.yml` - 无 trigger 配置，运行失败
   - `scorecards.yml` - 私有仓库限制，公开仓库自动失败
   - `pages-deploy.yml` - 404 找不到 main 分支
2. **补全 dependabot.yml 4 重 ignore**
   - actions / workflow / config / labels 路径，避免循环依赖
3. **补全 release-drafter 关键配置**
   - 添加 `name: Release Drafter`
4. **补全 ghaction-github-labeler 关键配置**
   - 添加 `repo-token: ${{ secrets.GITHUB_TOKEN }}`
5. **保持 4 个 dependabot PR 关闭**
   - 避免重新打开后 CI 破坏

#### Meta 修复
1. **补全 6 个空 metadata**
   - `package.json` 的 `description` / `homepage` / `keywords` 数组 / `bugs.url` / `security`
   - `.github/FUNDING.yml`
2. **补全仓库设置**
   - `description`（仓库主页显示）
   - 5 个 `topics`（搜索优化）
3. **LICENSE 头年份**
   - 2024 → 2026

### 📝 文档（3 项）

1. **CHANGELOG 完善**
   - 采用 [Keep a Changelog 2.1.0](https://keepachangelog.com/zh-CN/2.1.0/) 标准
   - 6 分类模板（Added / Changed / Fixed / Removed / Security / Build/CI）
   - 新增 v1.0.1 章节
2. **SVG 截图命名统一**
   - `screenshot-menu.svg` / `screenshot-gameplay.svg` / `screenshot-boss.svg` / `screenshot-levels.svg`
3. **README 引用更新**
   - 截图表格同步新命名

### 📊 数据

| 指标 | v1.0.0 | v1.0.1 | 变化 |
|------|--------|--------|------|
| 失败 workflow | 3 | 0 | -3 ✅ |
| 空 metadata | 6 | 0 | -6 ✅ |
| CHANGELOG 规范 | 简单列表 | Keep a Changelog 2.1.0 | 升级 ⬆️ |
| 测试通过率 | 100% | 100% | 不变 |
| 外部依赖 | 0 | 0 | 不变 |
| JS 模块 | 18 | 18 | 不变 |
| 总代码行 | 9,701 | 9,701 | 不变 |

### 🔗 相关链接

- **完整 diff**：https://github.com/pomizza/thunder-fighter/compare/v1.0.0...v1.0.1
- **CHANGELOG**：https://github.com/pomizza/thunder-fighter/blob/v1.0.1/CHANGELOG.md
- **5 个关联 commits**：
  1. `ci: 删除失败 workflow + 创建 release-drafter.yml + 创建 ghaction-github-labeler.yml`
  2. `docs: 删除 6 个 metadata 噪音文件 + 补全标签名 + 修复日期`
  3. `ci: 强化 dependabot.yml 4 重 ignore（actions / config / workflow / labels）`
  4. `docs: 重命名 SVG 截图 + 新增 screenshot-levels.svg + README 引用更新`
  5. `docs: 完善 CHANGELOG 6 分类模板 + 插入 v1.0.1 章节 + link 引用补全`

### ⚠️ 升级说明

- **从 v1.0.0 升级到 v1.0.1**：无破坏性变更
- **运行要求**：不变（Node 14+ / npm 9+ / 任意现代浏览器）
- **配置迁移**：无（仅仓库 metadata 变更）
- **数据迁移**：无（无持久化 schema 变更）

---

## 🚀 创建 v1.0.1 tag 的命令

```bash
# 在工作区根目录（thunder_shooter/）下执行
cd /Users/liyichen/.openclaw/workspace/Lingshu/v4/data/workspaces/default/thunder_shooter

# 1. 确认所有变更已提交
git status  # 应该是 clean
git log --oneline -5  # 应该有 5 个 v1.0.1 commits

# 2. 创建 annotated tag
git tag -a v1.0.1 -F docs/RELEASE_NOTES_v1.0.1.md

# 3. 推送到远程
git push origin v1.0.1

# 4. 在 GitHub Web 上：
#    - 进入 https://github.com/pomizza/thunder-fighter/releases
#    - 点击 "Draft a new release"
#    - 选择 tag v1.0.1
#    - 标题：v1.0.1 - 维护性更新
#    - 描述：复制上面"GitHub Release 描述（完整版）"部分
#    - 点击 "Publish release"
```

---

## 📅 关联 5 个 commits（按时间顺序）

```
1. ci: 删除失败 workflow + 创建 release-drafter.yml + 创建 ghaction-github-labeler.yml
2. docs: 删除 6 个 metadata 噪音文件 + 补全标签名 + 修复日期
3. ci: 强化 dependabot.yml 4 重 ignore（actions / config / workflow / labels）
4. docs: 重命名 SVG 截图 + 新增 screenshot-levels.svg + README 引用更新
5. docs: 完善 CHANGELOG 6 分类模板 + 插入 v1.0.1 章节 + link 引用补全
```

---

## 🆚 v1.0.0 vs v1.0.1 对比

| 维度 | v1.0.0 | v1.0.1 |
|------|--------|--------|
| **定位** | 首个正式发布 | 维护性更新 |
| **CI 状态** | 3 个失败 workflow | 0 个失败 ✅ |
| **仓库 metadata** | 6 项缺失 | 全部补全 ✅ |
| **CHANGELOG** | 简单列表 | Keep a Changelog 2.1.0 ✅ |
| **截图命名** | 不规范 | screenshot-* 统一 ✅ |
| **新功能** | - | 无（pure maintenance） |
| **破坏性变更** | - | 无 |
| **依赖变更** | - | 无 |
