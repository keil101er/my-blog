---
title: C 语言函数指针基础
description: 回顾函数指针的声明、赋值与调用，区分函数指针和返回指针的函数，并理解结构体中的函数指针成员。
---

# C 语言函数指针基础

**函数指针保存的是函数的调用入口。** 同一个函数指针变量可以指向不同的兼容函数，因此调用方可以保持同一种调用形式，由指针当前的值决定执行哪个实现。

## 先读懂声明中的括号

基本形式是 `返回类型 (*指针名)(参数类型)`：

```c
int (*operation)(int, int);
```

`operation` 是指针，它指向的函数接收两个 `int`，返回一个 `int`。

| 声明 | 含义 |
| --- | --- |
| `int (*operation)(int, int);` | 指向函数的指针 |
| `int *operation(int, int);` | 返回 `int *` 的函数 |
| `void (*callback)(void);` | 指向无参数、无返回值函数的指针 |

`(*operation)` 的括号不能省略。无参数时宜明确写出 `(void)`；在 C17 及更早版本中，声明里的空括号 `()` 不表示明确的无参数原型。

## 赋值选择实现，调用执行实现

```c
int add(int left, int right)
{
  return left + right;
}

int multiply(int left, int right)
{
  return left * right;
}

int main(void)
{
  int (*operation)(int, int) = add;
  int sum = operation(3, 5);

  // 改变调用目标 / Change the call target.
  operation = multiply;
  int product = operation(3, 5);

  return (sum == 8 && product == 15) ? 0 : 1;
}
```

赋值时 `operation = add` 与 `operation = &add` 都可以；调用时 `operation(3, 5)` 与 `(*operation)(3, 5)` 等价。改变指针的值只是在选择另一个函数，不会复制函数代码。

调用前必须给指针赋予有效的函数地址，返回类型和参数类型也必须兼容。空指针、未初始化的指针都不能调用；强制类型转换也不能让不兼容的函数调用变得安全。

## 放进结构体后，仍然是函数指针

```c
struct Calculator {
  int (*calculate)(int, int);
};
```

假设 `calculator` 是该类型的对象，且 `add` 已声明，可以先执行 `calculator.calculate = add`，再调用 `calculator.calculate(3, 5)`。如果持有的是结构体指针，则用 `->` 访问这个成员。

结构体里存储的是指针，函数体仍在结构体外单独定义。多个结构体对象可以保存相同的函数指针，共享同一份函数代码。

还有一个关键限制：`calculator.calculate(3, 5)` 不会自动把 `calculator` 传给函数。函数如果需要访问对象状态，必须通过明确的参数等途径获得它。这个区别在[对象封装与接口多态](/notes/CObjectOriented)中继续展开。

[返回：C 语言学习](/notes/CLearningOverview)
