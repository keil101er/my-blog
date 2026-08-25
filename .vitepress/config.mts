import { defineConfig } from 'vitepress'
import mathjax3 from 'markdown-it-mathjax3'

export default defineConfig({
  title: "个人技术博客",
  description: "记录学习过程与项目沉淀",
  
  // 开启 LaTeX 数学公式支持
  markdown: {
    config: (md) => {
      md.use(mathjax3)
    }
  },

  themeConfig: {
    // 顶部导航栏
    nav: [
      { text: '首页', link: '/' },
      { text: '技术笔记', link: '/notes/demo.md' }
    ],

    // 左侧目录侧边栏
    sidebar: {
      '/notes/': [
        {
          text: '学习记录',
          items: [
            { text: '开始记录', link: '/notes/getting-started' },
            { text: '公式与图文测试', link: '/notes/demo' }
          ]
        }
      ]
    },

    // 右上角 GitHub 图标链接
    socialLinks: [
      { icon: 'github', link: 'https://github.com/keil101er' }
    ]
  }
})