---
title: FreeRTOS 任务：创建、状态与删除
description: 理解任务函数与任务实例的区别，回顾创建参数、四种任务状态，以及删除任务和空闲任务的关系。
---

# FreeRTOS 任务：创建、状态与删除

**任务是由调度器管理的执行实例，任务函数只是它的入口。** 同一个函数可以创建多个任务，每个任务都有自己的栈和执行位置。

以下讨论单核 FreeRTOS；同一时刻最多有一个任务运行。

## 创建任务时传入什么

任务入口的形式是 `void TaskEntry(void *argument)`。通常在无限循环中处理工作；不再需要时调用 `vTaskDelete(NULL)`，不能直接从入口函数返回。

```c
BaseType_t result = xTaskCreate(
  TaskEntry,       // 入口函数
  "Worker",        // 调试名称
  256,             // 栈深度，单位为 StackType_t
  &worker_config,  // 传给入口函数的参数
  2,               // 初始优先级
  &worker_handle   // 保存任务句柄
);
```

这是调用片段：`worker_config`、`worker_handle` 和入口函数需事先定义。**检查 `result == pdPASS` 后，才把创建视为成功。**

- 原生 FreeRTOS 的栈空间为 `栈深度 × sizeof(StackType_t)`。若 `StackType_t` 为 4 字节，256 对应 1024 字节，不能与其他封装接口的字节单位混用。
- 参数传入的是指针值，不会自动复制它指向的配置。配置必须在任务访问期间有效，不能传入即将失效的局部变量地址。
- 句柄用于以后引用任务，例如查询优先级或删除任务。不需要时，最后一个参数可传 `NULL`。

`xTaskCreate()` 动态分配任务控制块和栈；`xTaskCreateStatic()` 使用调用方提供的存储。静态创建也需要调用 API，并不是编译完成就自动运行。参数定义见 [官方创建接口](https://www.freertos.org/Documentation/02-Kernel/04-API-references/01-Task-creation/01-xTaskCreate)。

同一入口创建多个任务时，普通局部变量各有一份；函数内 `static` 变量仍由这些任务共享。

## 没运行的任务在做什么

| 状态 | 含义 | 怎样离开 |
| --- | --- | --- |
| 运行 Running | CPU 正在执行它 | 被抢占、主动让出、阻塞等 |
| 就绪 Ready | 能运行，正在等 CPU | 被调度器选中 |
| 阻塞 Blocked | 等待时间或事件，不占 CPU 执行时间 | 延时到期、事件发生或等待超时 |
| 挂起 Suspended | 被显式暂停，不参与调度 | 调用恢复接口 |

最常见的过程是：**运行 → 调用等待接口进入阻塞 → 条件满足进入就绪 → 被选中后运行。**

“就绪”只代表可以运行。高优先级任务仍在运行时，低优先级任务即使解除阻塞，也要继续等待。

**忙等不会让任务进入阻塞。** 空循环延时期间任务仍在执行；`vTaskDelay()` 或带阻塞时间的队列等待，才会把 CPU 留给其他任务。队列的等待条件见 [任务通信与队列集](/notes/FreeRTOSQueue)。

## 删除之后谁清理

`vTaskDelete(NULL)` 删除当前任务，传入其他任务的有效句柄则删除对应任务。删除后，不能再使用旧句柄操作它。

任务自删时，内核动态分配的控制块和栈由**空闲任务后续回收**。应用代码自己申请的缓冲区等资源，要在删除前处理；静态提供的任务存储不会被内核当作堆内存释放。删除接口及资源说明见 [官方 `task.h`](https://github.com/FreeRTOS/FreeRTOS-Kernel/blob/main/include/task.h)。

因此，反复创建和自删任务的程序，必须让空闲任务有机会执行。空闲任务以优先级 0 自动创建，相关调度行为见 [抢占、时间片与空闲任务](/notes/FreeRTOSScheduling)。

[下一篇：最高就绪优先级的查找](/notes/FreeRTOSPrioritySelection) · [返回：嵌入式学习](/notes/EmbeddedLearningOverview)
