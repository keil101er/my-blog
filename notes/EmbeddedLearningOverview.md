---
title: 嵌入式学习
description: 按 MCU 外设、工程组织、实时任务与调试分类整理学习文章，快速查找各篇的核心知识点。
---

# 嵌入式学习

这里整理 MCU 软件开发相关的知识，按主题建立索引，方便快速查找文章和回顾核心观点。

## 学习框架

| 方向 | 主要内容 |
| --- | --- |
| MCU 与设备 | GPIO、定时器、ADC、UART、I²C、SPI、CAN，以及板上器件的使用 |
| 工程组织 | 代码分层、模块职责、接口设计与硬件移植 |
| 实时任务 | 裸机与 RTOS、任务和中断、数据传递与同步 |
| 调试与验证 | 断点、日志、波形，以及通信、时序和异常问题定位 |

## 文章索引

### 工程组织

| 文章 | 核心观点 |
| --- | --- |
| [嵌入式项目代码架构与分层](/notes/EmbeddedCodeArchitecture) | Drivers 提供芯片基础库，Core 配置当前 MCU，BSP 封装板上设备，APP 实现业务逻辑。 |

### 实时任务

| 文章 | 核心观点 |
| --- | --- |
| [FreeRTOS 任务：创建、状态与删除](/notes/FreeRTOSTask) | 任务是独立执行实例；等待条件满足后先就绪，再由调度器选中运行。 |
| [FreeRTOS 优先级：通用查找与位图优化](/notes/FreeRTOSPrioritySelection) | 两种方法都用于查找最高就绪优先级，不改变抢占和时间片的规则。 |
| [FreeRTOS 调度：抢占、时间片与空闲任务](/notes/FreeRTOSScheduling) | 高优先级就绪任务可抢占，同级时间片轮换不保证执行时间均分。 |
| [FreeRTOS 时间：tick 换算与延时精度](/notes/FreeRTOSTiming) | 延时按 tick 计数到期；解除阻塞与再次获得 CPU 是两个时刻。 |
| [FreeRTOS 队列：任务通信与队列集](/notes/FreeRTOSQueue) | 队列按固定大小复制数据；结合阻塞等待、来源标识和队列集组织任务通信，传指针时明确数据所有权。 |
| [FreeRTOS 普通接口与 FromISR 接口](/notes/FreeRTOSFromISR) | 按任务或中断上下文选择接口，区分阻塞、唤醒与切换请求，并遵守中断优先级限制。 |
