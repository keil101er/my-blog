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

### 工业通信

| 文章 | 核心观点 |
| --- | --- |
| [CAN 通信：仲裁、错误处理与位时序](/notes/CAN) | 显性与隐性电平支撑仲裁和错误报告，位时序决定波特率与采样点。 |
| [EtherCAT：从报文寻址到周期通信](/notes/EtherCAT) | ESC 按映射交换字节，CoE 定义数据含义，状态机组织启动配置。 |

### 工程组织

| 文章 | 核心观点 |
| --- | --- |
| [嵌入式项目代码架构与分层](/notes/EmbeddedCodeArchitecture) | Drivers 提供芯片基础库，Core 配置当前 MCU，BSP 封装板上设备，APP 实现业务逻辑。 |

### FreeRTOS

| 文章 | 核心观点 |
| --- | --- |
| [FreeRTOS 任务：创建、状态与删除](/notes/FreeRTOSTask) | 等待条件满足后任务先就绪，再由调度器选中运行。 |
| [FreeRTOS 调度：抢占、时间片与空闲任务](/notes/FreeRTOSScheduling) | 高优先级就绪任务可抢占，同级时间片轮换不保证执行时间均分。 |
| [FreeRTOS 时间：tick 换算与延时精度](/notes/FreeRTOSTiming) | 延时按 tick 计数到期；解除阻塞与再次获得 CPU 是两个时刻。 |
| [FreeRTOS 队列：任务通信与队列集](/notes/FreeRTOSQueue) | 队列复制固定大小的数据，并可结合阻塞等待和队列集组织通信。 |
| [FreeRTOS 普通接口与 FromISR 接口](/notes/FreeRTOSFromISR) | 按执行上下文选择接口，并遵守中断优先级限制。 |
| [Cortex-M 中断：从 NVIC 到任务切换](/notes/CortexMInterrupts) | NVIC 管理请求，硬件保存现场，PendSV 完成任务切换。 |
| [FreeRTOS 优先级：通用查找与位图优化](/notes/FreeRTOSPrioritySelection) | 通用查找与位图优化用于寻找最高就绪优先级。 |

### Cortex-M 与调试

| 文章 | 核心观点 |
| --- | --- |
| [Cortex-M 的 MSP 与 PSP：任务切换时怎样找到栈顶](/notes/CortexMStackPointers) | 每个任务的当前栈顶保存在 TCB 中，切换时保存旧 PSP、恢复新 PSP。 |
| [Cortex-M 函数调用：栈里保存了什么](/notes/CortexMFunctionStack) | 编译器按返回地址、寄存器、局部变量和参数需求组织函数栈帧。 |
| [Cortex-M 调试：断点、观察点与跟踪](/notes/CortexMDebugTrace) | 断点会改变执行时序，ITM 与 ETM 分别用于软件和指令跟踪。 |
| [STM32 启动与烧录：从 Boot 选择到程序运行](/notes/STM32BootAndFlashing) | 启动需要有效栈顶和向量表，Flash Loader 在 RAM 中完成烧录。 |
| [HardFault 定位：从堆栈找到出错指令](/notes/HardFaultStackAnalysis) | 先确定现场所用栈，再从异常栈帧读取 PC。 |
| [代码从哪里运行：NOR、NAND 与 XIP](/notes/CodeStorageAndXIP) | XIP 直接取指并减少 RAM 占用，速度取决于具体硬件。 |
