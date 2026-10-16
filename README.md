# 个人技术博客

记录学习过程、比赛复盘与项目实践，把嵌入式开发和机器人控制中学到的知识、遇到的问题整理成便于回顾的文章。

**[在线阅读](https://keil101er.github.io/my-blog/)** · **[内容导航](#内容导航)** · **[GitHub 主页](https://github.com/keil101er)**

## 内容导航

| 专题 | 内容 | 阅读入口 |
| --- | --- | --- |
| 比赛回顾 | RoboMaster 备赛、机器人调试、整机联调与赛场复盘 | [RoboMaster 比赛回顾](./notes/RoboMasterReview.md) |
| 电机控制 | FOC 控制链路、Simulink 代码生成、磁链观测器与 PLL、LESO 速度环抗扰 | [电机控制学习](./notes/MotorControlAlgorithm.md) |
| 嵌入式开发 | 工程分层、FreeRTOS 任务与调度、时间管理、队列通信和中断接口 | [嵌入式学习](./notes/EmbeddedLearningOverview.md) |
| C 语言 | 函数指针、类型别名、存储与作用域、对象封装、生命周期和多态 | [C 语言学习](./notes/CLearningOverview.md) |
| 轮腿机器人 | 轮腿平衡控制、LQR 建模与增益调度、五连杆运动学与 VMC | [轮腿机器人控制项目总览](./notes/WheelLeggedControlOverview.md) |

想了解项目经历，可以从比赛回顾读起；查阅知识点，可以直接进入对应专题索引。包含公式、图片和视频的文章建议在博客站点阅读。

## 本地运行

站点基于 VitePress 1.x 构建，支持 LaTeX 数学公式、本地全文搜索和深浅色主题。使用 Node.js 20（与部署工作流保持一致）及 npm。

```bash
git clone https://github.com/keil101er/my-blog.git
cd my-blog
npm ci
npm run docs:dev
```

打开终端输出的本地地址即可预览，修改 Markdown 后页面会自动更新。

构建并预览生产版本：

```bash
npm run docs:build
npm run docs:preview
```

当前 `npm test` 为占位脚本；提交前请使用生产构建检查内容，并在预览页面确认链接、公式和媒体正常显示。

## 仓库结构

```text
.
├── index.md                 # 博客首页
├── notes/                   # 文章与专题索引
├── images/                  # 文章图片
├── video/                   # 文章视频
├── .vitepress/
│   ├── config.mts           # 站点配置、导航与侧边栏
│   └── theme/               # 主题扩展与样式
├── .github/workflows/
│   └── deploy.yml           # GitHub Pages 构建与部署
└── package.json             # 依赖与本地命令
```

## 写作与部署

文章放在 `notes/`，在文件顶部填写 `title` 和 `description`，并在对应专题索引及 `.vitepress/config.mts` 中补充入口。图片和视频分别放在 `images/` 与 `video/`，媒体引用需兼容站点的 `/my-blog/` 基础路径。

推送到 `main` 后，GitHub Actions 会安装依赖、构建站点，并将 `.vitepress/dist/` 部署到 GitHub Pages。构建产物无需手动修改或提交。

## 交流

欢迎通过 [Issues](https://github.com/keil101er/my-blog/issues) 指出文章中的错误、补充参考资料，或交流相关的学习与实践经验。
