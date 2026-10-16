---
title: FreeRTOS 时间：tick 换算与延时精度
description: 理解 pdMS_TO_TICKS、vTaskDelay 的实际阻塞时间，以及周期任务使用 xTaskDelayUntil 的原因。
---

# FreeRTOS 时间：tick 换算与延时精度

**`vTaskDelay()` 接收 tick 数，不是毫秒数；延时到期只让任务就绪，不保证它立即运行。**

## 毫秒怎样换成 tick

`configTICK_RATE_HZ` 表示每秒的 tick 数。正常周期 tick 下，一个 tick 周期为：

**一个 tick 的毫秒数 = 1000 ÷ `configTICK_RATE_HZ`。**

`pdMS_TO_TICKS(ms)` 按配置将毫秒转换为 tick 数。默认整数换算会截去小数：

| tick 频率 | 一个 tick | `pdMS_TO_TICKS(200)` |
| --- | --- | --- |
| 100 Hz | 10 ms | 20 |
| 500 Hz | 2 ms | 100 |
| 1000 Hz | 1 ms | 200 |

```c
vTaskDelay(pdMS_TO_TICKS(200));
```

这样代码始终表达约 200 ms 的延时意图。若直接写 `vTaskDelay(20)`，从 100 Hz 改为 1000 Hz 后，对应时间就从约 200 ms 变成约 20 ms。

在 100 Hz 下，`pdMS_TO_TICKS(5)` 得到 **0**；传入 `vTaskDelay()` 不会形成 5 ms 阻塞，只会请求重新调度。

旧资料中“频率高于 1000 Hz 就不能用这个宏”的说法不适用于当前默认实现。核对时的官方 `main` 分支使用 64 位中间乘法，没有该频率限制；项目仍应以自己的版本和宏覆盖为准，结果须能由 `TickType_t` 表示。见 [官方 `projdefs.h`](https://github.com/FreeRTOS/FreeRTOS-Kernel/blob/main/include/projdefs.h)。

## 两个 tick 中间调用，等半个还是一个半

假设 tick 周期为 10 ms，在 0、10、20 ms 更新计数。任务于 5 ms 调用延时，忽略中断延迟和 API 开销：

| 调用 | 到期时刻 | 到期前经过的时间 |
| --- | --- | --- |
| `vTaskDelay(1)` | 10 ms | 5 ms，即半个 tick 周期 |
| `vTaskDelay(2)` | 20 ms | 15 ms，即一个半 tick 周期 |

原因是内核把目标 tick 设为 **当前 tick 计数 + 参数 n**，不会从调用瞬间重新启动一个完整周期的计时器。实现见 [官方 `vTaskDelay` 源码](https://github.com/FreeRTOS/FreeRTOS-Kernel/blob/main/tasks.c)。

对于正整数 n，在正常周期 tick、没有提前解除延时，并忽略上述开销时：

**阻塞时长 ≈ 到下个 tick 的剩余时间 + (n − 1) × tick 周期。**

所以，“到期前的阻塞时长通常不足 n 个完整周期”是这个理想模型下的结论。**从调用到再次执行的总时间还包括就绪等待，可能超过 n 个周期。** 它不能用于保证精确的最短物理延时。

## 固定周期用哪个接口

循环末尾调用 `vTaskDelay()`，每轮工作耗时也会累积到周期里。周期任务可使用 `xTaskDelayUntil()`，按上一次计划时间推进下一次目标：

```c
TickType_t last_wake = xTaskGetTickCount();
const TickType_t period = pdMS_TO_TICKS(20);
configASSERT(period > 0);

for (;;) {
  // 执行本轮工作。
  xTaskDelayUntil(&last_wake, period);
}
```

它减少工作耗时造成的累计漂移，但不消除调度延迟。目标时间已过时，接口可不再阻塞；它不能保证超时任务仍准点执行。旧名 `vTaskDelayUntil()` 不返回状态，现代接口的返回值可判断本次是否实际延时。接口说明见 [官方周期延时文档](https://www.freertos.org/Documentation/02-Kernel/04-API-references/02-Task-control/03-xTaskDelayUntil)。

正常使用这些延时 API 时，内核会处理 tick 计数回绕；自行比较绝对计数时，不能简单用大小关系判断先后。

[返回：嵌入式学习](/notes/EmbeddedLearningOverview)
