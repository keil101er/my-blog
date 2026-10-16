---
title: FreeRTOS 普通接口与 FromISR 接口
description: 对比任务与中断上下文中的 FreeRTOS 接口，重点理解阻塞等待、任务唤醒、切换请求和中断优先级限制。
---

# FreeRTOS 普通接口与 FromISR 接口

**任务中使用普通接口，中断中使用对应的 `FromISR` 接口，并确认中断优先级允许调用 FreeRTOS。** 两套接口的核心区别是执行上下文、能否阻塞，以及怎样请求任务切换。

## ISR 与普通函数是什么关系

ISR（Interrupt Service Routine）是**中断服务程序**，由中断机制进入；普通函数通常由代码调用。

**普通函数被 ISR 调用后，仍在中断上下文中执行。** 因此，判断能不能调用某个接口，要看当前执行上下文，不能只看函数名。中断里的 HAL 回调也遵守这一点。

ISR 可以调用满足中断使用要求的普通 C 函数，例如简单计算；这里对比的是 **FreeRTOS 普通 API 与中断专用 API**。

## 以队列发送为例

| 对比项 | `xQueueSendToBack()` | `xQueueSendToBackFromISR()` |
| --- | --- | --- |
| 使用场景 | 任务上下文 | 允许调用内核 API 的中断上下文 |
| 参数不同 | `xTicksToWait`：最长等待时间 | 没有等待时间 |
| 队列满时 | 可阻塞等待，或超时失败 | **不阻塞，立即返回失败** |
| 唤醒任务 | 可使等待数据的任务就绪 | 同样可使等待数据的任务就绪 |
| 任务切换 | 抢占调度下，唤醒更高优先级任务时可在接口内切换 | 会唤醒但不会立即调度 |

两者都按队列项大小复制数据，成功返回 `pdPASS`。`FromISR` 表示适合中断上下文，**不代表操作一定成功或不需要检查返回值**。接口定义见 [官方 `queue.h`](https://github.com/FreeRTOS/FreeRTOS-Kernel/blob/main/include/queue.h)。

## 为什么中断不能阻塞

**阻塞是任务状态，ISR 不是任务，不能挂起自己等待队列空位。** 队列满时，ISR 应快速处理失败，把耗时工作留给任务。

即使把普通接口的等待时间设为 `0`，也不能在 ISR 中用它代替 `FromISR` 版本：两者使用的内核保护和调度方式也不同。

**同一次 ISR 中，多次调用可以共用这个标志，只在第一次调用前初始化为 `pdFALSE`，最后统一请求切换。** 切换宏及调用方式以实际移植端口为准。

以常见 Cortex-M 端口为例，切换请求通过 PendSV 处理，等当前 ISR 及需要先处理的中断退出后，才运行任务。若不请求切换，已唤醒的任务仍是就绪态，但可能要等到下一次调度机会。详见 [FreeRTOS 中断管理](https://github.com/FreeRTOS/FreeRTOS-Kernel-Book/blob/main/ch07.md)。

## 哪些中断可以调用

**不是所有中断都能调用 `FromISR` 接口。** 以使用 `configMAX_SYSCALL_INTERRUPT_PRIORITY` 的 Cortex-M 端口为例，调用内核 API 的中断，其紧急程度不能高于该阈值。

- **NVIC 数值越小，中断紧急程度越高**，与 FreeRTOS 任务优先级的数值方向不同。
- 配置时区分 `configMAX_SYSCALL_INTERRUPT_PRIORITY` 的移位值和 `configLIBRARY_MAX_SYSCALL_INTERRUPT_PRIORITY` 的未移位值，不能直接混用。
- 高于允许阈值的中断，连 `FromISR` 接口也不能调用。

具体范围按芯片和 FreeRTOS 移植端口配置，参见 [官方 Cortex-M 优先级说明](https://www.freertos.org/Documentation/02-Kernel/03-Supported-devices/04-Demos/ARM-Cortex/RTOS-Cortex-M3-M4)。

[队列：任务通信与队列集](/notes/FreeRTOSQueue) · [返回：嵌入式学习](/notes/EmbeddedLearningOverview)
