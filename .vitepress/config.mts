import { defineConfig } from 'vitepress'
import mathjax3 from 'markdown-it-mathjax3'

export default defineConfig({
  base: '/my-blog/',
  lang: 'zh-CN',
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
      { text: '比赛回顾', link: '/notes/RoboMasterReview' },
      { text: '学习记录', link: '/notes/MotorControlAlgorithm' },
      { text: '项目实践', link: '/notes/ZhenJiangInternship' }
    ],

    // 左侧目录侧边栏
    sidebar: {
      '/notes/': [
        {
          text: '比赛回顾',
          items: [
            { text: 'RoboMaster 比赛回顾', link: '/notes/RoboMasterReview' }
          ]
        },
        {
          text: '学习记录',
          items: [
            {
              text: '电机控制学习',
              link: '/notes/MotorControlAlgorithm',
              collapsed: true,
              items: [
                { text: 'FOC 控制链路', link: '/notes/MotorControlFOC' },
                { text: 'Simulink 代码生成', link: '/notes/SimulinkCodeGeneration' },
                { text: '磁链观测器与 PLL', link: '/notes/SensorlessFOCObserver' },
                { text: 'LESO 速度环抗扰', link: '/notes/LESOSpeedControl' }
              ]
            }
          ]
        },
        {
          text: '项目实践',
          items: [
            { text: '镇江星驰智行软件有限公司实习记录', link: '/notes/ZhenJiangInternship' }
          ]
        }
      ]
    },

    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'medium',
        timeStyle: 'short'
      }
    },

    editLink: {
      pattern: 'https://github.com/keil101er/my-blog/edit/main/:path',
      text: '在 GitHub 上编辑此页'
    },

    search: {
      provider: 'local',
      options: {
        locales: {
          zh: {
            translations: {
              button: {
                buttonText: '搜索',
                buttonAriaLabel: '搜索'
              },
              modal: {
                displayDetails: '显示详细列表',
                resetButtonTitle: '清除查询条件',
                backButtonTitle: '关闭搜索',
                noResultsText: '无法找到相关结果',
                footer: {
                  selectText: '选择',
                  selectKeyAriaLabel: '回车',
                  navigateText: '切换',
                  navigateUpKeyAriaLabel: '向上',
                  navigateDownKeyAriaLabel: '向下',
                  closeText: '关闭',
                  closeKeyAriaLabel: 'ESC'
                }
              }
            }
          }
        }
      }
    },

    // 右上角 GitHub 图标链接
    socialLinks: [
      { icon: 'github', link: 'https://github.com/keil101er' }
    ]
  }
})
