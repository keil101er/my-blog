---
title: Cortex-M 中断：从 NVIC 到任务切换
description: 串起异常分类、软件触发、向量表、现场保存与恢复，以及 FreeRTOS 中断后的任务切换和延迟处理。
---

# Cortex-M 中断：从 NVIC 到任务切换

**NVIC 管理中断请求，内核通过向量表找到处理函数；FreeRTOS 再借助异常机制切换任务。** 以下以 Cortex-M3/M4、单核 FreeRTOS 常见端口为例。

## 中断属于异常，NVIC 负责管理请求

异常是 Cortex-M 打断当前执行流程的统一机制，包含系统异常和外部中断。

| 类型 | 例子 | 说明 |
| --- | --- | --- |
| 系统异常 | Reset、HardFault、SVC、PendSV、SysTick | 由内核或系统机制产生 |
| 外部中断 | USART、TIM、DMA、EXTI | “外部”相对内核而言，也包括片上外设 |

不能用“异常同步且更快、中断异步且更慢”区分两者：系统异常中也有异步来源。

NVIC（嵌套向量中断控制器）管理外部中断的使能、挂起和优先级。**挂起表示请求正在等待响应，不代表 ISR 已经执行。** 优先级和屏蔽条件允许时，内核才进入 ISR。接口见 [CMSIS NVIC 文档](https://arm-software.github.io/CMSIS_6/main/Core/group__NVIC__gr.html)。

## 软件触发

```c
NVIC_SetPendingIRQ(USART1_IRQn);
```

这会设置 USART1 的 NVIC 挂起位，但不会制造串口接收数据，也不会设置外设接收标志。因此，即使进入 ISR，HAL 检查外设标志后也不一定调用接收回调。

“软中断”需看语境：它可以指上述软件触发的外部中断，也可能泛指软件触发的异常。

| 机制 | 触发方式 | 常见用途 |
| --- | --- | --- |
| 外部 IRQ 软件挂起 | `NVIC_SetPendingIRQ()` | 请求对应 ISR |
| SVC 系统异常 | 执行 `SVC` 指令 | 请求系统服务；部分 FreeRTOS 端口启动首个任务 |
| PendSV 系统异常 | 设置 `PENDSVSET` | FreeRTOS 通常设为最低优先级，用于任务切换 |

SVC、PendSV 的移植实现可对照 [FreeRTOS Cortex-M4F 端口](https://github.com/FreeRTOS/FreeRTOS-Kernel/blob/main/portable/GCC/ARM_CM4F/port.c)。

## 向量表保存入口地址，VTOR 指定表的位置

向量表类似函数指针数组：**首项保存初始 MSP（主栈指针），后续项保存异常入口地址或保留值。** 外部中断从第 16 号表项开始，每项 4 字节：

```text
外部 IRQ 表项地址 = VTOR + (IRQn + 16) × 4
```

表项地址是“到哪里读”，表项内容是“读到哪个函数入口”。修改 `VTOR` 只改变查表位置，不会复制表，也不会搬动处理函数。

对 Cortex-M3，对齐至少为 128 字节；还要容纳包含初始 MSP、系统异常及保留项的完整表空间。例如 60 个外部 IRQ 对应 `(16 + 60) × 4 = 304` 字节，应按 512 字节对齐。**这是基地址的对齐要求，不是必须偏移 512 字节。** 具体以芯片手册为准。

## 保存现场与恢复现场

任务代码在 Thread Mode（线程模式）运行，ISR 在 Handler Mode（处理程序模式）运行。普通异常进入、未使用浮点扩展栈帧时：

1. **硬件保存基本现场**：将 R0～R3、R12、原 LR、PC、xPSR 压入当前使用的栈，由 MSP 或 PSP（进程栈指针）指向。
2. **进入处理函数**：通过向量表取得入口，进入 Handler Mode，使用 MSP；LR 被写入特殊值 `EXC_RETURN`。
3. **异常返回**：根据 `EXC_RETURN` 确定返回 Thread Mode 还是 Handler Mode、从哪个栈恢复现场。

`EXC_RETURN` 是返回规则，不是原程序的返回地址；原 PC 保存在栈帧中。任务切换还需由移植代码保存 R4～R11 等状态，不能认为硬件自动保存了全部任务上下文。向量表与异常返回细节见 [Arm Cortex-M3 用户指南 §2.3、§4.3.4](https://documentation-service.arm.com/static/5ea823e69931941038df1af5)。

## 中断结束后，如何直接切换任务

假设高优先级任务等待信号量，低优先级任务正在运行。ISR 中的关键调用为：

```c
BaseType_t xHigherPriorityTaskWoken = pdFALSE;
xSemaphoreGiveFromISR(xSemaphore, &xHigherPriorityTaskWoken);
portYIELD_FROM_ISR(xHigherPriorityTaskWoken);
```

信号量应提前创建，中断优先级须允许调用内核 API。示例省略外设清标志和释放失败的处理。

释放信号量若唤醒更高优先级任务，标志会变为 `pdTRUE`；切换宏据此挂起 PendSV。当前 ISR 及需要先处理的中断退出后，PendSV 保存旧任务、选择并恢复新任务，再返回任务上下文。

同一次 ISR 多次调用可共用该标志，只在开始初始化。允许传 `NULL` 的接口若省略此标志，仍可能唤醒任务，但不会由这组调用主动请求立即切换。接口与优先级限制见 [普通接口与 FromISR 接口](/notes/FreeRTOSFromISR)。

## 延迟中断处理

**延迟中断处理是让 ISR 记录数据、清除中断源并通知任务，把耗时工作交给任务。** 任务没有抢占 ISR，而是在中断退出后获得 CPU。

### 创建处理任务，由 ISR 唤醒

处理任务平时阻塞等待；ISR 发出事件后，任务就绪，再按优先级获得 CPU。可以根据是否需要保留次数、携带数据选择接口：

| 唤醒方式 | ISR 中做什么 | 任务中做什么 |
| --- | --- | --- |
| 二进制信号量 | `xSemaphoreGiveFromISR()` 发出处理信号 | `xSemaphoreTake()` 等待，再处理已有数据 |
| 计数信号量 | 同样调用 `xSemaphoreGiveFromISR()`，累加待处理次数 | 每次 `xSemaphoreTake()` 消耗一次计数 |
| 队列 | `xQueueSendFromISR()` 发送数据或缓冲区指针 | `xQueueReceive()` 接收，再处理数据 |
| 任务通知 | `vTaskNotifyGiveFromISR()` 通知指定任务 | `ulTaskNotifyTake()` 等待，可清零或逐次递减计数 |

以二进制信号量为例，在启用外设中断前创建 `xSemaphore = xSemaphoreCreateBinary()`，检查成功后创建处理任务。ISR 复用上一节的释放与切换代码，任务对应为：


### 把函数交给守护任务执行

ISR 调用 `xTimerPendFunctionCallFromISR()`，将函数及参数送入定时器命令队列，由 FreeRTOS 守护任务执行，无需另建处理任务。

这种方式适合简短工作，缺点：函数共享守护任务的优先级，执行时间受队列前方命令影响；函数不能阻塞，以免耽误其他回调。队列满时提交会失败。参见 [FreeRTOS 官方中断管理章节](https://github.com/FreeRTOS/FreeRTOS-Kernel-Book/blob/main/ch07.md)。

[任务调度：抢占与时间片](/notes/FreeRTOSScheduling) · [返回：嵌入式学习](/notes/EmbeddedLearningOverview)

## 优先级过高的中断无法调用FreeRTOS提供的api

以NVIC 使用 4 位中断优先级即优先级数值范围为 0～15为例
```c
#define configLIBRARY_MAX_SYSCALL_INTERRUPT_PRIORITY  5
```
那么0～4：不能调用 FreeRTOS API   5～15：可以调用允许在 ISR 中使用的 API

这样设计是为了保护临界区资源，优先级高于configLIBRARY_MAX_SYSCALL_INTERRUPT_PRIORITY的中断，可以在FreeRTOS 内核在修改任务链表、队列等重要数据结构时响应，而小于的则被屏蔽。同时因为防止这些高优先级中断访问这些临界资源导致出错，所以不能调用FreeRTOS的api。

总的来说：**界限之上的高优先级中断可以保持很快的响应，但不能调用 FreeRTOS API；界限及以下的中断可以调用指定的 FromISR API，但在 FreeRTOS 临界区期间可能被暂时屏蔽。**


