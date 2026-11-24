import { defineConfig } from 'vitepress'
import mathjax3 from 'markdown-it-mathjax3'

export default defineConfig({
  base: '/my-blog/',
  lang: 'zh-CN',
  title: "个人技术博客",
  description: "记录学习过程与项目沉淀",
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/my-blog/favicon.svg' }]
  ],
  srcExclude: ['AGENTS.md', 'README.md', 'drafts/**'],
  
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
      { text: '嵌入式', link: '/notes/embedded/EmbeddedLearningOverview' },
      { text: 'C 语言', link: '/notes/c/CLearningOverview' },
      { text: '电机控制', link: '/notes/motor-control/MotorControlAlgorithm' },
      { text: '项目实践', link: '/notes/projects/WheelLeggedControlOverview' },
      { text: '比赛回顾', link: '/notes/competition/RoboMasterReview' }
    ],

    // 左侧目录侧边栏
    sidebar: {
      '/notes/': [
        {
          text: '比赛回顾',
          items: [
            { text: 'RoboMaster 比赛回顾', link: '/notes/competition/RoboMasterReview' }
          ]
        },
        {
          text: '学习记录',
          items: [
            {
              text: '电机控制学习',
              link: '/notes/motor-control/MotorControlAlgorithm',
              collapsed: true,
              items: [
                { text: 'FOC 控制链路', link: '/notes/motor-control/MotorControlFOC' },
                { text: 'Simulink 代码生成', link: '/notes/motor-control/SimulinkCodeGeneration' },
                { text: '磁链观测器与 PLL', link: '/notes/motor-control/SensorlessFOCObserver' },
                { text: 'LESO 速度环抗扰', link: '/notes/motor-control/LESOSpeedControl' }
              ]
            },
            {
              text: '嵌入式学习',
              link: '/notes/embedded/EmbeddedLearningOverview',
              collapsed: true,
              items: [
                {
                  text: '工业通信',
                  items: [
                    { text: 'CAN 仲裁、错误处理与位时序', link: '/notes/embedded/communication/CAN' },
                    { text: 'EtherCAT 原理与工作流程', link: '/notes/embedded/communication/EtherCAT' }
                  ]
                },
                {
                  text: '工程组织',
                  items: [
                    { text: '代码架构与分层', link: '/notes/embedded/EmbeddedCodeArchitecture' }
                  ]
                },
                {
                  text: 'FreeRTOS',
                  items: [
                    { text: '任务与状态', link: '/notes/embedded/freertos/FreeRTOSTask' },
                    { text: '抢占、时间片与空闲任务', link: '/notes/embedded/freertos/FreeRTOSScheduling' },
                    { text: 'tick 换算与延时精度', link: '/notes/embedded/freertos/FreeRTOSTiming' },
                    { text: '队列与队列集', link: '/notes/embedded/freertos/FreeRTOSQueue' },
                    { text: '普通接口与 FromISR 接口', link: '/notes/embedded/freertos/FreeRTOSFromISR' },
                    { text: 'Cortex-M 中断与任务切换', link: '/notes/embedded/cortex-m/CortexMInterrupts' },
                    { text: '优先级查找与位图优化', link: '/notes/embedded/freertos/FreeRTOSPrioritySelection' }
                  ]
                },
                {
                  text: 'Cortex-M 与调试',
                  items: [
                    { text: 'MSP、PSP 与任务栈', link: '/notes/embedded/cortex-m/CortexMStackPointers' },
                    { text: '函数调用与栈帧', link: '/notes/embedded/cortex-m/CortexMFunctionStack' },
                    { text: 'Cortex-M 调试与跟踪', link: '/notes/embedded/cortex-m/CortexMDebugTrace' },
                    { text: 'STM32 启动与烧录', link: '/notes/embedded/cortex-m/STM32BootAndFlashing' },
                    { text: 'HardFault 栈帧定位', link: '/notes/embedded/cortex-m/HardFaultStackAnalysis' },
                    { text: '代码存储与 XIP', link: '/notes/embedded/cortex-m/CodeStorageAndXIP' }
                  ]
                }
              ]
            },
            {
              text: 'C 语言学习',
              link: '/notes/c/CLearningOverview',
              collapsed: true,
              items: [
                { text: '函数指针基础', link: '/notes/c/CFunctionPointers' },
                { text: 'typedef 与类型别名', link: '/notes/c/CTypedef' },
                { text: 'extern 与 static', link: '/notes/c/CExternStatic' },
                { text: '变量存储位置与指针有效期', link: '/notes/c/CVariableStorage' },
                { text: 'volatile 的作用与边界', link: '/notes/c/CVolatile' },
                { text: '对象封装与接口多态', link: '/notes/c/CObjectOriented' },
                { text: '对象生命周期与资源管理', link: '/notes/c/CObjectLifecycle' },
                { text: '静态对象数组与对象池', link: '/notes/c/CStaticObjectsAndPool' },
                { text: '继承布局与多态调用', link: '/notes/c/CInheritancePolymorphism' },
                { text: '单例、深浅拷贝与内存对齐', link: '/notes/c/CObjectStorage' }
              ]
            }
          ]
        },
        {
          text: '项目实践',
          items: [
            {
              text: '轮腿机器人控制',
              link: '/notes/projects/WheelLeggedControlOverview',
              collapsed: true,
              items: [
                { text: 'LQR 建模与增益调度', link: '/notes/projects/WheelLeggedLQR' },
                { text: '五连杆运动学与 VMC', link: '/notes/projects/WheelLeggedVMC' }
              ]
            }
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

    outline: {
      level: [2, 3],
      label: '本页目录'
    },

    docFooter: {
      prev: '上一篇',
      next: '下一篇'
    },

    darkModeSwitchLabel: '外观',
    lightModeSwitchTitle: '切换到浅色主题',
    darkModeSwitchTitle: '切换到深色主题',
    sidebarMenuLabel: '文章目录',
    returnToTopLabel: '返回顶部',
    langMenuLabel: '切换语言',
    skipToContentLabel: '跳转到正文',

    search: {
      provider: 'local',
      options: {
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
    },

    // 右上角 GitHub 图标链接
    socialLinks: [
      { icon: 'github', link: 'https://github.com/keil101er' }
    ]
  }
})
