---
title: C 语言对象存储：单例、深浅拷贝与内存对齐
description: 从存储期限、指针所有权和成员布局三个角度，理解 C 语言对象的复制与访问。
---

# C 语言对象存储：单例、深浅拷贝与内存对齐

这三个问题都在问同一件事：对象的数据到底存在哪里、由谁拥有，以及访问时要遵守什么布局规则。

## 用函数内 static 保存唯一实例

函数内的 `static` 对象只初始化一次，并在整个程序运行期间存在：

```c
typedef struct {
  int port;
  int page_count;
} Printer;

Printer *printer_instance(void)
{
  static Printer instance = { .port = 0x378, .page_count = 0 };
  return &instance;
}
```

每次调用都返回同一个地址，因此可以实现单例式访问。它不等于线程安全；多个线程同时修改字段时仍需要同步。调用方也不能 `free` 这个地址，因为对象并非由调用方动态分配。

## 浅拷贝与深拷贝

**浅拷贝（shallow copy）只复制对象本身的成员值。** 如果成员是指针，复制的是地址，所以源对象和目标对象仍然指向同一份数据。

**深拷贝（deep copy）会复制对象及其拥有的外部数据。** 对指针成员，目标对象要重新申请空间，再把源对象指向的内容复制过去。这样两个对象的数据彼此独立。

例如，`Person` 中的 `name` 指向堆内存：

```c
typedef struct {
  char *name;
  int age;
} Person;

Person shallow_copy(const Person *source)
{
  return *source; // name 指针仍指向同一块内存
}

Person deep_copy(const Person *source)
{
  Person copy = { .name = NULL, .age = source->age };
  size_t length = strlen(source->name) + 1;
  copy.name = malloc(length);
  if (copy.name != NULL) memcpy(copy.name, source->name, length);
  return copy;
}
```

假设 `source->name` 位于地址 `0x1000`：浅拷贝后，两个 `name` 都是 `0x1000`；深拷贝后，目标 `name` 可能是新地址 `0x2000`。修改 `source->name` 指向的字符串时，浅拷贝对象看到的内容也会改变，深拷贝对象不会改变。

浅拷贝的主要危害是**共享所有权不清楚**：

- 一个对象释放内存后，另一个对象的指针就变成悬空指针，继续访问会产生未定义行为。
- 如果两个对象都认为自己负责释放这块内存，销毁时会发生 double free。
- 一个对象修改数据，另一个对象会被悄悄影响，难以定位问题。

复制和销毁必须成对设计：深拷贝得到的 `copy.name` 由 `copy` 的销毁函数释放，浅拷贝得到的指针则不能擅自释放。

## 对齐决定成员间的空隙

编译器会按照每种类型的对齐要求在成员之间插入填充字节，并让整个结构体大小满足最大对齐要求。因此，`sizeof(struct)` 不一定等于各成员 `sizeof` 之和，也不能假定不同编译器的布局完全相同。

![结构体成员与填充字节示意图](/images/CStructLayout.png)

访问跨越边界的数据时，处理器可能需要分成多次读取；图中的两次读取示意了这种情况。协议或硬件寄存器布局不能直接依赖 C 结构体的默认填充，应使用明确的字节解析、静态断言和目标平台文档验证。

![一次数据访问被拆成两次读取的示意图](/images/CMemoryReadAlignment.png)

不要为了“省空间”随意使用未对齐指针或强制类型转换。某些处理器会产生异常，某些处理器虽然允许访问，也可能有性能代价。

[C 语言对象生命周期与资源管理](/notes/CObjectLifecycle) · [返回：C 语言学习](/notes/CLearningOverview)
