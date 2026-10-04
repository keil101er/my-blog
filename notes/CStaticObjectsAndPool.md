---
title: C 语言静态对象数组与对象池
description: 根据对象数量和生命周期选择静态数组或对象池，理解连续存储、复用与释放边界。
---

# C 语言静态对象数组与对象池

对象数量固定时，静态数组最直接；数量在运行时确定、但需要反复申请和回收时，可以使用对象池。两者都把对象放在一段连续内存中，但管理方式不同。

## 静态对象数组

数组在定义时一次性分配空间，元素连续存放。数组名代表首元素地址，`gpio_config[i]` 通过下标定位第 `i` 个完整对象，不需要逐个 `malloc` 或 `free`：

```c
typedef struct {
  uint8_t port;
  uint8_t pin;
  uint8_t mode;
  uint8_t state;
} GpioPin;

static GpioPin gpio_config[8] = {
  {0, 0, 1, 0}, {0, 1, 1, 0}, {0, 2, 1, 0}, {0, 3, 0, 0},
  {1, 0, 1, 0}, {1, 1, 1, 0}, {1, 2, 0, 0}, {1, 3, 1, 1}
};
```

这种方式适合 GPIO、LED 等数量和配置在编译期已知的对象。代价是容量固定，即使暂时不用，数组占用的空间也不会减少。

“静态”在这里强调对象的存储期限和预先确定的容量，不等于所有对象都必须使用文件级 `static`。局部数组的生命周期由所在函数决定，文件级或函数内 `static` 对象则会一直存在；嵌入式系统通常选择文件级数组，让整个模块共享固定对象表。

## 对象池如何复用对象

对象池把“创建对象”和“取得一个可用对象”分开。初始化时预先分配一组同样大小的对象，用状态位标记空闲和占用；分配时找到空闲元素，回收时只改变状态，不把内存还给堆：

```c
typedef struct {
  int is_free;
  char data[256];
} Object;

typedef struct {
  Object *items;
  size_t capacity;
  size_t used;
} ObjectPool;

Object *pool_alloc(ObjectPool *pool)
{
  if (pool == NULL) return NULL;
  for (size_t i = 0; i < pool->capacity; ++i) {
    if (pool->items[i].is_free) {
      pool->items[i].is_free = 0;
      ++pool->used;
      return &pool->items[i];
    }
  }
  return NULL; // 池已满 / Pool exhausted.
}

void pool_free(ObjectPool *pool, Object *object)
{
  if (pool == NULL || object == NULL) return;
  if (object < pool->items || object >= pool->items + pool->capacity) return;
  if (!object->is_free) {
    object->is_free = 1;
    --pool->used;
  }
}
```

池本身通常只在初始化和销毁时申请、释放一次。`pool_free` 必须确认指针来自该池，并避免重复回收，否则 `used` 会失真。

对象池中的对象地址通常保持稳定，但对象被回收后，调用方仍持有的旧指针不能继续使用。再次分配可能让同一地址代表另一个对象；这类“旧句柄继续访问”的问题与普通 `free` 后使用相同。多线程或中断同时分配、回收时，还需要锁或临界区保护空闲标志和计数器。

## 怎么选

| 场景 | 更合适的方式 |
| --- | --- |
| 数量固定、追求确定性 | 静态对象数组 |
| 数量有上限、对象频繁复用 | 对象池 |
| 数量不可预测、生命周期差异大 | 动态分配，并明确所有权 |

对象池减少了频繁 `malloc/free` 带来的碎片和时延，但容量仍然有限；分配失败必须由调用方处理。

[C 语言对象生命周期与资源管理](/notes/CObjectLifecycle) · [返回：C 语言学习](/notes/CLearningOverview)
