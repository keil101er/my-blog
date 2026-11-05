---
title: STM32 启动与烧录：从 Boot 选择到程序运行
description: 回顾 STM32 常见启动存储区、复位后的入口获取过程，以及调试器借助 Flash Loader 烧录程序的步骤。
---

# STM32 启动与烧录：从 Boot 选择到程序运行

## Boot 选择决定从哪里启动

常见 STM32 器件通常提供以下启动区域：

- 主 Flash：运行正常烧录的应用程序。
- SRAM：把程序放入 RAM 后运行，常用于特定调试场景。
- 系统存储器：运行厂商预置的 bootloader，可通过串口、USB 等接口烧录，具体接口取决于器件。

启动区域由 Boot 引脚、选项字节或相关寄存器共同决定，不同 STM32 系列的配置方式并不相同。芯片通常还会把所选区域映射到固定的启动地址，不能只凭“BOOT0 接高或接低”概括所有型号。

## 复位后怎样取得程序入口

以常见 Cortex-M 为例，复位后硬件先从当前向量表位置读取两项：

1. 第一个字写入 MSP，建立初始主栈。
2. 第二个字作为复位异常入口，装入 PC，开始执行复位处理函数。

后续启动代码再完成数据段初始化、时钟配置等工作，最后进入 `main()`。因此，让芯片从程序开始运行，不只是修改 PC，还要保证栈顶和向量表有效。

## 调试器怎样烧录 Flash

调试器通常借助运行在 RAM 中的 Flash Loader 完成写入。典型流程如下：

1. 通过 SWJ-DP 访问调试系统并暂停 CPU。
2. 把 Flash Loader 和必要参数写入 RAM。
3. 设置好栈、入口等运行环境，让 CPU 执行 Flash Loader。
4. 调试器分块传入应用数据，Flash Loader 校验数据并调用 Flash 擦除、编程操作。Loader 自身保留在 RAM，不依赖正在改写的应用 Flash 继续执行。
5. 全部数据写入并校验后，恢复目标程序所需的启动状态，再复位芯片。芯片按 Boot 配置重新读取栈顶和向量表，从目标程序启动。

不同调试器可能调整数据分块、校验和复位细节，但基本分工相同：调试器负责传输与控制，Flash Loader 负责执行芯片要求的 Flash 操作。

[上一篇：Cortex-M 调试](/notes/CortexMDebugTrace) · [下一篇：HardFault 定位](/notes/HardFaultStackAnalysis) · [返回：嵌入式学习](/notes/EmbeddedLearningOverview)
