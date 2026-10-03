---
title: C 语言对象封装与接口多态
description: 用结构体保存对象数据，用 self 指定操作对象，用函数指针选择实现，用不透明指针隐藏字段。
---

# C 语言对象封装与接口多态

C 中可以用结构体和函数组织对象：**结构体保存数据，函数操作数据，函数指针用于选择不同的实现。**

## 1. 对象：把相关数据放在一起

例如，一个 UART 对象保存串口编号、波特率等信息。每个串口各有一份配置，发送时把对应对象传给函数：

```c
uart_send(uart1, data, len);
uart_send(uart2, data, len);
```

**同一个发送函数，传入哪个串口对象，就操作哪个串口。** 这已经能复用代码，不需要为每个串口重写发送函数，也不必使用函数指针。

## 2. self：告诉函数操作哪个对象

如果在结构体中加入函数指针，调用可以写成：

```c
uart1->send(uart1, data, len);
```

这里有两件事：

| 部分 | 决定什么 |
| --- | --- |
| `uart1->send` | 调用哪个函数 |
| 参数 `uart1` | 操作哪个对象 |

假设 `uart1->send` 指向 `uart_send_impl`，这次调用就相当于：

```c
uart_send_impl(uart1, data, len);
```

**“成员方法”本质上仍是普通函数。** `self` 只是接收对象指针的参数名，必须显式传入，C 不会自动绑定对象。

因此，`uart1->send(uart2, data, len)` 表示“用 uart1 保存的函数操作 uart2”。语法允许这样写，但 uart2 必须满足该函数的使用要求。

## 3. 多态：同一个接口，选择不同实现

例如，把轮询发送和 DMA 发送都作为 `send` 操作。以下是接口示意，两个实现的函数类型必须兼容：

```c
uart1->send = uart_send_polling;
uart2->send = uart_send_dma;

uart1->send(uart1, data, len);
uart2->send(uart2, data, len);
```

调用形式相同，实际执行的函数不同，这就是这里的**多态**。也可以在创建对象时，根据传入的模式选择对应函数。

- **只有一种实现**：普通函数加对象指针通常就够了。
- **需要切换实现**：可以使用函数指针，把不同实现统一到一个接口下。

注意：轮询可能等待发送完成，DMA 可能启动后就返回。统一接口时，要约定完成时机和缓冲区何时可以修改。

## 4. 封装：通过接口访问内部数据

把结构体放进头文件，外部仍能直接修改字段。要隐藏字段，可以在 `.h` 中只公开类型名和函数声明：

```c
typedef struct BankAccount BankAccount;

void account_deposit(BankAccount *account, double amount);
double account_get_balance(BankAccount *account);
```

完整的结构体定义放在 `.c` 中。这种方式称为**不透明指针**：

- 外部可以持有、传递 `BankAccount *`，但不能直接访问 `account->balance`。
- 存款和查询通过公开函数完成，余额检查与更新集中在模块内部。

**封装不要求使用函数指针。** 不透明指针解决“外部能否直接访问字段”，函数指针解决“调用哪个实现”。

[函数指针基础](/notes/CFunctionPointers) · [对象生命周期](/notes/CObjectLifecycle) · [返回：C 语言学习](/notes/CLearningOverview)
