# StudyOS

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS-lightgrey)
![Electron](https://img.shields.io/badge/Electron-Latest-blue)
![React](https://img.shields.io/badge/React-18-blue)

> **StudyOS** 是一个基于 **Electron** + **React** + **TypeScript** 构建的现代化学习辅助桌面应用。
> 
> 集成番茄钟、任务管理、笔记系统、成就系统等功能，打造沉浸式学习环境，帮助你高效专注地完成学习目标。

---

## ✨ 核心功能 (Features)

### 🍅 番茄工作法
- **智能计时器**：支持工作/短休息/长休息三种模式
- **强制锁定**：休息时间可选择锁定屏幕，强制休息
- **饮水提醒**：定时提醒补充水分，关注健康

### 📚 任务管理系统
- **任务分组**：创建多个学习任务，每个任务可添加多个学习链接
- **拖拽排序**：任务和链接支持拖拽调整顺序
- **内置浏览器**：点击链接直接在应用内打开，无需切换窗口
- **网页翻译**：集成 Bing 翻译，一键翻译英文网页

### 📝 笔记本系统
- **Markdown 支持**：实时预览 Markdown 格式笔记
- **多视图模式**：编辑模式、预览模式、分屏模式自由切换
- **笔记本分类**：创建多个笔记本，分类管理笔记
- **浮动窗口**：笔记窗口可拖动、调整大小、调节透明度
- **多窗口支持**：同时打开多个笔记页面，方便对照编辑

### 🏆 成就系统
- **Steam 风格**：仿 Steam 成就提示，带音效和动画
- **多样成就**：学习时长、连续天数、总时长等多种成就
- **荣誉殿堂**：查看已解锁的所有成就

### 📊 数据统计
- **学习记录**：自动记录每次学习时长和任务
- **可视化图表**：折线图、柱状图、饼图展示学习数据
- **学习日历**：热力图显示每日学习情况
- **连续天数**：追踪学习连续天数，保持学习习惯

### 🎨 个性化设置
- **主题切换**：白天模式/暗夜模式
- **自定义时长**：自由设置番茄钟工作和休息时长
- **提醒开关**：可选择开启/关闭各种提醒功能

---

## 📸 应用截图 (Screenshots)

<div align="center">

### 主界面 - 任务管理
<img width="2875" height="1691" alt="主界面" src="https://github.com/user-attachments/assets/b0d7c011-8991-4fbd-b754-0876d7e08b38" />

### 数据统计中心
<img width="2879" height="1695" alt="数据统计" src="https://github.com/user-attachments/assets/2e9b74f0-0f09-41c3-a7d3-5e007b94f09f" />

</div>

---

## 🛠️ 技术栈 (Tech Stack)

本项目基于以下技术构建：

| 技术 | 说明 |
|------|------|
| [Electron](https://www.electronjs.org/) | 跨平台桌面应用框架 |
| [React](https://react.dev/) | 前端 UI 框架 |
| [TypeScript](https://www.typescriptlang.org/) | 类型安全的 JavaScript 超集 |
| [Vite](https://vitejs.dev/) | 快速的前端构建工具 |
| [Electron-Vite](https://electron-vite.org/) | Electron 专用 Vite 配置 |
| [Electron Builder](https://www.electron.build/) | Electron 应用打包工具 |
| [Chart.js](https://www.chartjs.org/) | 数据可视化图表库 |
| [Marked](https://marked.js.org/) | Markdown 解析器 |
| [Lucide React](https://lucide.dev/) | 现代化图标库 |

---

## 💻 本地开发 (Development)

如果你想在本地运行或修改源代码，请按照以下步骤操作：

### 前置要求

- Node.js >= 16.x
- npm 或 yarn

### 1. 克隆项目

```bash
git clone https://github.com/leeon666/StudyOS.git
cd StudyOS
```

### 2. 安装依赖

```bash
npm install
# 或者使用 yarn
yarn install
```

### 3. 启动开发模式

```bash
npm run dev
```

此时将会同时启动 Electron 主进程和渲染进程，支持热更新。

---

## 📦 打包构建 (Build)

生成生产环境的可执行文件：

```bash
# 构建所有平台的应用
npm run build

# 仅构建 Windows 版本 (.exe)
npm run build:win

# 仅构建 macOS 版本 (.dmg)
npm run build:mac

# 仅构建 Linux 版本
npm run build:linux
```

构建产物将位于 `dist` 或 `dist_electron` 目录下。

---

## 📂 项目结构 (Project Structure)

```text
StudyOS/
├── src/
│   ├── main/                    # Electron 主进程
│   │   └── index.ts            # 主进程入口，窗口管理
│   ├── preload/                # 预加载脚本
│   │   └── index.ts            # Preload Script
│   └── renderer/               # React 渲染进程 (UI)
│       ├── index.html          # 主窗口 HTML
│       ├── note.html           # 笔记窗口 HTML
│       └── src/
│           ├── App.tsx         # 主应用组件
│           ├── note.tsx        # 笔记窗口组件
│           └── assets/
│               ├── main.css    # 全局样式
│               └── sounds/     # 音效文件
├── resources/                   # 应用图标等静态资源
├── electron.vite.config.ts     # Vite 配置文件
├── package.json                # 项目依赖与脚本
└── README.md                   # 项目说明文档
```

---

## 🎯 使用指南 (Usage Guide)

### 开始学习

1. **创建任务**：点击左侧 "+" 按钮创建学习任务
2. **添加链接**：为任务添加学习资料链接（视频、文档等）
3. **开始番茄钟**：点击播放按钮开始计时
4. **专注学习**：在内置浏览器中学习，避免分心

### 记录笔记

1. **创建笔记本**：在笔记管理页面创建笔记本
2. **新建笔记**：在笔记本中创建笔记页
3. **编辑笔记**：支持 Markdown 语法，实时预览
4. **浮动窗口**：笔记可以浮动在其他窗口上方，方便边学边记

### 查看数据

1. **学习统计**：查看每日、每周、每月学习时长
2. **任务分布**：了解各任务的学习时间占比
3. **成就系统**：解锁各种学习成就，保持动力

---

## 🤝 贡献 (Contributing)

欢迎提交 Issue 或 Pull Request 来改进 StudyOS！

### 贡献步骤

1. Fork 本仓库
2. 新建分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

### 开发规范

- 使用 TypeScript 编写代码
- 遵循 ESLint 代码规范
- 提交前确保代码可以正常编译
- PR 描述清楚改动内容和原因

---

## 📝 更新日志 (Changelog)

### v1.0.0 (2026-01-17)

**新功能**
- ✨ 完整的笔记本系统，支持 Markdown
- 🎵 Steam 风格成就音效
- 🌓 白天/暗夜主题切换
- 🔄 任务和链接拖拽排序

**优化改进**
- 🎨 优化 UI 布局和交互
- ⚡ 提升应用性能
- 🐛 修复多个已知 bug

---

## 💬 支持与反馈 (Support)

StudyOS 目前还在持续开发中，如果你觉得这个工具对你有帮助：

1. ⭐️ **请点击右上角的 Star 支持一下！** (这对我非常重要)
2. 🐞 如果遇到 Bug，欢迎提交 [Issue](https://github.com/leeon666/StudyOS/issues)
3. 💡 有新功能建议？也欢迎在 Issue 中讨论
4. 📧 联系作者：[在这里添加你的联系方式]

---

<div align="center">

**Enjoy your study time!** 🚀

Made with ❤️ by [leeon666](https://github.com/leeon666)

</div>
