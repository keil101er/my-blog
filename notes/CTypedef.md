---
title: C 语言 typedef：从变量声明到类型别名
description: 理解 typedef，掌握函数指针别名的位置，并区分类型别名与变量、函数定义。
---

# C 语言 typedef：从变量声明到类型别名

**`typedef` 为已有类型起别名，不创建变量，也不会让别名成为一种独立的新类型。** 理解复杂写法时，先写普通声明，再把名字放到同一个位置。

## 先声明变量，再改成类型名

| 普通声明 | 加上 `typedef` | 别名代表的类型 |
| --- | --- | --- |
| `int number;` | `typedef int Number;` | `int` |
| `int *pointer;` | `typedef int *IntPtr;` | `int *` |
| `int values[4];` | `typedef int IntArray[4];` | 含 4 个 `int` 的数组 |
| `void (*entry)(void *);` | `typedef void (*ThreadEntry)(void *);` | 参数为 `void *`、返回 `void` 的函数指针 |

**别名占据原本变量名的位置，不一定写在整个类型表达式的最后。** `typedef int Number;` 只是最简单的声明形式。


## 为什么不能把别名放到最后

typdef并非是 typedef 原类型名 新类型名，而是定义时变量，在前面加上typedef，将变量名转换为类型名。

例如:
```c
// 错误：typedef void (*)(void *) osThreadFunc_t;
```

`void (*)(void *)` 是省略名字后的**类型名写法**，可以出现在需要类型名的位置，但不能直接在后面追加一个名字来完成这条 `typedef` 声明。

正确方法是：**先写 `void (*entry)(void *);`，把 `entry` 换成别名，再在前面加 `typedef`。** 这里的声明器是 `(*名字)(参数)`，名字必须放在其中。

## 别名怎样使用

```c
void StartTask(void *argument); // 声明一个类型兼容的函数。
osThreadFunc_t entry = StartTask;
```

第二行才定义了指针变量 `entry`，并让它指向 `StartTask`。最初的 `typedef` 本身既没有创建线程，也没有定义 `StartTask`。

CMSIS-RTOS2 的 `osThreadNew()` 用这个类型接收线程入口，见 [Arm 线程接口文档](https://arm-software.github.io/CMSIS_6/main/RTOS2/group__CMSIS__RTOS__ThreadMgmt.html)。函数指针的赋值与调用见 [函数指针基础](/notes/CFunctionPointers)。

[返回：C 语言学习](/notes/CLearningOverview)
