---
title: C 语言 extern 与 static：跨文件引用与变量保留
description: 用具体代码区分声明与定义，理解 extern 跨文件引用，以及 static 对局部变量、文件级变量和函数的作用。
---

# C 语言 extern 与 static：跨文件引用与变量保留

`extern` 和 `static` 经常出现在文件级变量前，但解决的问题不同：

- `extern`：告诉编译器，这个变量或函数的定义在别处，可以先在这里声明后使用。
- `static`：要看它修饰的对象。它可以让局部变量在函数返回后继续保留，也可以把文件级名字限制在当前源文件内使用。

## extern：声明在这里，定义在别处

假设 `counter.c` 中定义了一个计数器：

```c
// counter.c
#include "counter.h"

int count = 0;

void counter_reset(void)
{
  count = 0;
}
```

`app.c` 也需要修改它。如果另外写一个 `int count;`，表达的是另一个定义，不是“使用已有的 `count`”。正确做法是在头文件中声明：

```c
// counter.h
extern int count;
void counter_reset(void);
```

然后在使用方包含这个头文件：

```c
// app.c
#include "counter.h"

void app_step(void)
{
  ++count;
}
```

`extern int count;` 的意思是：`count` 是 `int` 类型，它的存储空间由别处的定义提供。编译 `app.c` 时知道这个声明就够了，链接时再找到 `counter.c` 中的定义。

这就是**声明与定义的区别**：声明描述名字和类型，定义为变量提供存储空间，或为函数给出函数体。只有声明却找不到所需定义，通常会在链接时报错。

文件级变量还有几种容易混淆的写法：

| 写法 | 含义 |
| --- | --- |
| `extern int count;` | 声明，不提供这里的定义 |
| `int count = 0;` | 定义并初始化 |
| `extern int count = 0;` | 有初始化器，仍是定义，不宜放进共享头文件 |
| `int count;` | 文件级定义形式，不应当作共享头文件中的纯声明 |

普通函数的对外声明通常可以省略 `extern`，所以 `counter_reset` 的写法与变量不同。

## 函数内的 static：函数返回后，变量仍然保留

普通局部变量在每次进入函数时重新建立。加上 `static` 后，变量只初始化一次，函数返回后它的值仍然保留：

```c
void count_calls(void)
{
  static int times = 0;

  ++times;
}
```

第一次调用后 `times` 为 1，第二次调用后变为 2。下一次调用不会重新执行成初始值 0。

但 `times` 仍然只能在 `count_calls()` 内使用。`static` 延长的是变量的存在时间，没有把变量名暴露给其他函数。多个线程同时修改它时，也仍需要同步。

## 文件级的 static：限制其他源文件直接引用

文件级变量本身就一直在程序运行期间存在。这里的 `static` 不是为了延长时间，而是限制名字的使用范围：

```c
// device.c
static int state;

static void update_state(void)
{
  state = 1;
}
```

`state` 和 `update_state` 都只能在 `device.c` 内通过名字直接使用。另一个 `.c` 文件即使写下同名的 `extern` 声明，也不能因此引用它们。

这种用法适合保存模块内部状态和辅助函数，避免其他文件绕过模块接口直接修改它们。如果模块主动把变量地址或函数指针传出去，其他文件仍可通过这些地址间接访问，所以 `static` 不是内存访问保护。

回顾时可以分开记：**局部 `static` 管变量保留多久，文件级 `static` 管其他源文件能否直接用这个名字。**

[下一篇：变量存在哪里](/notes/CVariableStorage) · [返回：C 语言学习](/notes/CLearningOverview)
