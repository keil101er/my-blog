---
title: C 语言 typedef：从变量声明到类型别名
description: 通过函数指针示例理解 typedef 的名字位置，并区分类型别名、变量定义和函数定义。
---

# C 语言 typedef：从变量声明到类型别名

`typedef` 给已有类型起一个别名。它不会创建变量，也不会定义函数。

理解复杂写法时，可以先写出普通的变量声明，再把变量名换成类型别名。

## 从一个函数指针变量开始

下面的声明定义了变量 `entry`：

```c
void (*entry)(void *);
```

`entry` 是一个函数指针，指向“接收 `void *` 参数、返回 `void`”的函数。

现在不给这个变量取名 `entry`，而是给它的类型取名 `ThreadEntry`，只需在声明前加上 `typedef`：

```c
typedef void (*ThreadEntry)(void *);
```

这里的 `ThreadEntry` 不再是变量，而是一种函数指针类型的别名。以后可以这样使用：

```c
void StartTask(void *argument)
{
  /* 任务入口 */
}

ThreadEntry entry = StartTask;
```

最后一行才真正定义了指针变量 `entry`，并让它指向 `StartTask`。

整个过程可以记成：

```text
void (*entry)(void *);              // 定义变量 entry
typedef void (*ThreadEntry)(void *); // 为同样的类型定义别名 ThreadEntry
ThreadEntry entry = StartTask;      // 用别名定义变量
```

## 别名放在原变量名的位置

其他类型也遵循同样的规则：

| 普通变量声明 | 类型别名 | 别名代表的类型 |
| --- | --- | --- |
| `int number;` | `typedef int Number;` | `int` |
| `int *pointer;` | `typedef int *IntPtr;` | `int *` |
| `int values[4];` | `typedef int IntArray[4];` | 含 4 个 `int` 的数组 |

所以，`typedef` 不能一律理解成“原类型名后面接新类型名”。数组和函数指针的名字位于声明中间，别名也要放在对应位置。

下面的写法是错误的：

```c
typedef void (*)(void *) ThreadEntry; /* 错误 */
```

`void (*)(void *)` 已经是省略名字后的类型写法，不能再把 `ThreadEntry` 追加到末尾。正确写法仍然是：

```c
typedef void (*ThreadEntry)(void *);
```

## 别名不是新变量，也不是独立的新类型

`ThreadEntry` 和原来的函数指针类型表示同一种类型，只是名字更短。定义别名不会分配变量空间，也不会生成函数。

CMSIS-RTOS2 中的 `osThreadFunc_t` 就用于表示线程入口函数的类型。理解上面的 `ThreadEntry` 后，再看 `osThreadNew()` 使用这种类型接收线程入口，就不必把函数指针别名当成特殊语法。

函数指针怎样赋值和调用，见 [函数指针基础](/notes/CFunctionPointers)。

[返回：C 语言学习](/notes/CLearningOverview)
