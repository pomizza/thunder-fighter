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
git push origin feat/your-feature

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
