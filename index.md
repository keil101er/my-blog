---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "个人技术分享"
  text: "学习沉淀与项目笔记"
  tagline: 记录嵌入式开发、机器人控制与比赛调试中的问题和经验
  actions:
    - theme: brand
      text: 查看学习记录
      link: /notes/embedded/EmbeddedLearningOverview
    - theme: alt
      text: GitHub 主页 ↗
      link: https://github.com/keil101er

features:
  - title: 嵌入式开发
    details: CAN/EtherCAT 通信、工程分层、FreeRTOS 与 Cortex-M 调试启动。
    link: /notes/embedded/EmbeddedLearningOverview
  - title: C 语言
    details: 常用关键字、函数指针、对象封装与资源管理。
    link: /notes/c/CLearningOverview
  - title: 电机控制
    details: FOC、Simulink 代码生成、无感观测与速度环抗扰。
    link: /notes/motor-control/MotorControlAlgorithm
  - title: 轮腿机器人项目
    details: LQR、VMC、运动学、实时控制与整机调试。
    link: /notes/projects/WheelLeggedControlOverview
  - title: RoboMaster 比赛复盘
    details: 个人职责、真实故障、排查过程与项目结果。
    link: /notes/competition/RoboMasterReview
---
