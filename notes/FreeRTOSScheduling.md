---
title: FreeRTOS 调度：抢占、时间片与空闲任务
description: 对比三种调度配置，理解高优先级抢占、同优先级轮换、主动让出，以及空闲任务的调度和钩子限制。
---

# FreeRTOS 调度：抢占、时间片与空闲任务

**优先级决定先选谁，抢占决定能否自动替换当前任务，时间片让同优先级任务在 tick 边界轮换。**

以下讨论单核、正常周期 tick、未暂停调度器的情况。临界区和中断会推迟实际切换。

## 三种配置怎样选任务

两个宏都在 `FreeRTOSConfig.h` 中配置：

| 配置 | `configUSE_PREEMPTION` | `configUSE_TIME_SLICING` | 主要行为 |
| --- | --- | --- | --- |
| 抢占并使用时间片 | 1 | 1 | 更高优先级任务可抢占；同级任务按 tick 轮换 |
| 抢占但不使用时间片 | 1 | 0 | 保留优先级抢占，取消 tick 引起的同级自动轮换 |
| 协作式调度 | 0 | 任意 | 任务主动阻塞、让出等产生调度机会 |

协作式调度下，高优先级任务就绪后，也要等当前任务让出 CPU。普通中断仍能打断任务，但“执行 ISR”和“切换任务”是两件事。配置含义见 [FreeRTOS 官方任务管理章节](https://github.com/FreeRTOS/FreeRTOS-Kernel-Book/blob/main/ch04.md#4122-selecting-the-scheduling-algorithm)。

## 任务调度与tick中断

### 与tick中断有关的任务

1. 主动延时或等待超时的高优先级任务： 每次 Tick 中断触发时，内核会检查延时阻塞列表，发现任务延时或等待超时结束后，就会将其转为就绪态。例如调用vTaskDelay() 或 vTaskDelayUntil() 进行周期性休眠。

2. 执行同优先级时间片轮转：tick中断时，内核会检查当前正在运行的任务所在的优先级下，就绪列表里是否还有其他同优先级的任务，如果有就会进行任务切换。

### 与tick中断无关的中断

 **由外部或软件“事件”唤醒的高优先级抢占不需要 Tick 中断**，任务 API 或 ISR 都可能使高优先级任务就绪

假设 H 的优先级为 3，L 为 1，启用抢占：
1. H 阻塞等待消息，L 运行。
2. 消息到达，H 进入就绪态。
3. 调度条件允许时，H可以直接抢占L，而不需要等待tick中断。



## 空闲任务为什么会和应用任务轮流执行

空闲任务的优先级为 0。应用任务也可以设为 0，因此两者可能共享 CPU；有更高优先级任务就绪时，抢占式调度会优先执行它。

在抢占式调度下，`configIDLE_SHOULD_YIELD` 控制空闲任务是否主动让给同级就绪任务：

- `0`：不因这个配置主动让出；开启时间片时，仍可在 tick 边界轮换。
- `1`：空闲循环发现其他优先级 0 的就绪任务时，主动让出。

让出不会重新开始一个完整 tick 周期，后面的任务可能只运行到下一个 tick，就再次遇到轮换。

启用 `configUSE_IDLE_HOOK` 后，空闲任务调用 `vApplicationIdleHook(void)`。钩子不能阻塞或挂起空闲任务，也应及时返回，让任务自删后的资源清理得以继续。实现见 [官方空闲任务代码](https://github.com/FreeRTOS/FreeRTOS-Kernel/blob/main/tasks.c)。

[下一篇：tick 换算与延时精度](/notes/FreeRTOSTiming) · [返回：嵌入式学习](/notes/EmbeddedLearningOverview)
