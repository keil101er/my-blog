---
title: 嵌入式项目代码架构与分层
description: 快速回顾 Core、Drivers、BSP 等模块的职责，以及模块归属和接口调用的常见问题。
---

# 嵌入式项目代码架构与分层

**分层的目的：把硬件操作和业务逻辑分开，减少修改一处代码时对其他模块的影响。** 以下以 STM32 常见的工程结构为例；不同工程的目录名称可能不同，重点是各模块负责什么。

## 各层分别负责什么

| 模块 | 主要职责 | 典型内容 |
| --- | --- | --- |
| Drivers | 厂商提供的芯片基础支持库 | HAL/LL、CMSIS-Core、器件头文件 |
| Core | 配置当前 MCU，组织程序入口 | `main.c`、时钟、GPIO/I²C/SPI 初始化、中断入口 |
| BSP | 板级支持包（Board Support Package），封装板上设备的操作 | LED、按键、MPU6050 等设备接口 |
| Middlewares | 可复用的软件功能 | LVGL、文件系统、协议栈、数学库 |
| OS | 任务调度、同步和通信 | FreeRTOS 等操作系统 |
| SYSTEM | 整个系统共用的配置 | 系统级宏、功能开关、公共配置 |
| APP | 实现具体应用逻辑 | 应用任务、状态机、控制策略 |

### Core、Drivers 与 BSP 的区别

- **Drivers：提供工具。** 厂商写好的库，提供配置 GPIO、收发 I²C 数据等基础能力。
- **Core：配置工具。** 当前工程决定使用哪些片上外设、怎样配置，例如把某个 GPIO 设为输出，初始化 I²C。
- **BSP：用工具操作设备。** 根据板子的连接和器件特性，封装“打开 LED”“读取 MPU6050”等操作。

以 LED 为例：**Drivers 提供 GPIO 操作函数 → Core 初始化引脚 → BSP 封装亮灭及有效电平 → APP 决定什么时候亮。**

![嵌入式软件分层参考图：APP、中间件、操作系统、BSP、Core 与 Drivers](/images/EmbeddedSoftwareArchitecture.png)

*图中的 OS 和中间件各有职责，不代表每次调用都必须依次经过所有层。*

## “避免跨层”怎么理解

上层通过模块提供的接口使用硬件，尽量不要直接修改底层寄存器或访问驱动内部变量。例如，APP 调用 BSP 的“打开 LED”接口，换引脚时就主要修改底层。

**APP 调用 BSP 的公开接口是可以的；需要避免的是绕过接口操作内部细节。** 分层减少连带修改，但不保证更换硬件后上层完全不用改。

## 常见问题

### 按键的短按、长按属于 BSP 还是业务逻辑？

读取电平、消抖和识别长短按可以放在按键组件中；“长按后切换模式”属于 APP。前者判断按键发生了什么，后者决定要做什么。

### FreeRTOS 为什么放在 Middlewares 中？

FreeRTOS 是操作系统，厂商也可以把它放在 Middlewares 目录中交付。目录名称不改变它的作用，见 [ST 软件包说明](https://github.com/STMicroelectronics/STM32CubeF4)。

### CMSIS 都属于驱动层吗？

常见的 CMSIS-Core 提供内核访问支持，但 CMSIS 还包括 RTOS 接口和 DSP 计算库。因此，要看具体组件，不能把整个 CMSIS 都归为驱动。工程的 `Core/` 目录也不等于 CMSIS-Core，见 [Arm 组件说明](https://arm-software.github.io/CMSIS_6/latest/General/index.html)。

### PID、通信协议应该放在 BSP 吗？

PID 等算法可以作为独立组件，由 APP 调用；协议解析也可以与 UART、CAN 等传输操作分开。最终会控制硬件，不代表算法本身属于硬件驱动。

### 每个设备都要创建一个任务吗？

不需要。任务按执行周期、响应要求和是否会阻塞来划分，多个设备可以共用一个任务。模块划分和任务划分不是一回事。

### 小项目或 Flash 很小，也需要完整分层吗？

不必照搬全部目录，可以合并简单模块，但仍应区分硬件操作和业务逻辑。多建目录本身不占 Flash，新增代码和数据才会带来开销。

[返回：嵌入式学习](/notes/EmbeddedLearningOverview)
