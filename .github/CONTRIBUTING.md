# 贡献指南

感谢你有兴趣为雷霆战机做贡献！🎮

## 🐛 报告 Bug

发现 bug？请用 [Bug 报告模板](../../issues/new?template=bug_report.md) 创建一个 issue。

**好的 bug 报告应包含**：
- 清晰的问题描述
- 复现步骤
- 期望 vs 实际行为
- 浏览器/操作系统/设备信息
- 截图/视频（如果适用）

## 💡 提议功能

想要新功能？用 [功能建议模板](../../issues/new?template=feature_request.md) 创建 issue。

**好的功能建议应包含**：
- 功能描述
- 使用场景
- 替代方案
- 原型/mockup（可选）

## 🔧 提交代码

### 工作流程

```bash
# 1. Fork 仓库
# 2. Clone 你的 fork
git clone https://github.com/你的用户名/thunder-fighter.git
cd thunder-fighter/thunder_shooter

# 3. 创建分支
git checkout -b feat/your-feature

# 4. 改代码 + 加测试

# 5. 跑测试（必须 100% 通过）
npm test

# 6. Commit
git add .
git commit -m "feat: 你的功能描述"

# 7. Push 到 fork
git push origin feat/your-feature```

### 📝 Commit Message 格式（必读）

本项目 commit message 格式：**Conventional Commits + 中文正文**

**标题格式**（**英文**前缀）：
```
<type>(<scope>): <description>

类型 (type):
  feat     - 新功能
  fix      - Bug 修复
  docs     - 仅文档变更
  style    - 代码格式（不影响功能）
  refactor - 重构
  perf     - 性能优化
  test     - 测试相关
  chore    - 杂项（构建/CI/依赖等）

示例:
  feat: 添加玩家道具系统
  fix: 修复神风机飞出屏外
  docs: 更新 README 操作说明
  chore: 升级 actions/checkout 到 v7
```

**正文格式**（**全中文**，建议用 emoji 分类）：

```
【分类1】
- 详细改动 1
- 详细改动 2

【分类2】
- 详细改动 1

【统计】
- 测试: 80/80 → 118/118 (+38 项)
- 文件: 5
- 0 破坏性变更
```

**完整示例**：
```
feat: 添加玩家道具系统

【核心功能】
- PowerUp 类：heal/weapon/bomb/shield 4 种
- 拾取检测 + applyPowerUp() 统一接口
- 道具自动下落 + 玩家碰撞响应

【新文件】
- js/player.js - 加 PowerUp 拾取逻辑
- tests/test-powerup.cjs - 5 项单元测试

【统计】
- 5 文件
- 测试: 80/80 → 88/88 (+8 项)
- 0 破坏性变更
```

**为什么标题用英文**：
- ✅ Conventional Commits 标准（行业最佳实践）
- ✅ 工具集成：自动 changelog、semver 推断
- ✅ 国际开发者能读
- ✅ git log --oneline 简洁清晰

**为什么正文用中文**：
- ✅ 项目是中文面向用户
- ✅ 详细改动中文描述更清晰
- ✅ 未来维护者能直接读

**完整示例见**：git log --format=%B HEAD~5..HEAD~4

# 8. 创建 Pull Request
```

### PR 规范

- ✅ 跑 `npm test`（必须 34/34 通过）
- ✅ 遵循现有代码风格
- ✅ 提交前清理 console.log
- ✅ 更新 CHANGELOG.md（Unreleased section）
- ✅ 使用 PR 模板
- ❌ 不要直接 push 到 master

### 代码风格

- 2 空格缩进
- 单引号字符串
- 分号结尾
- 中文 UI 字符串
- 关键逻辑加注释

### 测试规范

- 测试文件命名：`test-{module}.cjs`
- 放在 `tests/` 目录
- 至少 3-5 个 `it()` 测试
- 用 `describe()` 分组
- 跑 `npm test` 验证

## 🏗️ 项目结构

```
thunder_shooter/
├── js/         # 17 模块（详见 index.html 注释）
├── tests/      # 持久化测试套件
├── index.html  # 入口
├── README.md   # 项目说明
├── CHANGELOG.md
├── LICENSE     # MIT
├── package.json
└── .github/    # 本目录（CI / Issue 模板）
```

## 📚 文档

- 添加新模块：在 `index.html` 注释中说明
- 添加新测试：在 `tests/README.md` 中说明
- 添加新功能：在 `CHANGELOG.md` Unreleased section 记录
- 改 UI：在 `README.md` 操作章节更新

## 🤝 行为准则

- 尊重所有贡献者
- 建设性反馈
- 接受批评
- 关注对项目最有利的事

## 📜 许可

贡献的代码将按 [MIT License](../LICENSE) 开源。
