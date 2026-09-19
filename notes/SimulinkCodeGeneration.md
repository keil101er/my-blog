---
title: 从 Simulink 模型到 STM32G4：一次代码生成与集成记录
description: 记录 FOC 模型生成 C 代码并接入 10 kHz STM32G4 控制周期时需要处理的接口、类型与时序问题。
---

# 从 Simulink 模型到 STM32G4：一次代码生成与集成记录

Simulink 模型能正常仿真，并不意味着点击一次“生成代码”就可以在 MCU 上运行。代码生成真正有价值的地方，是把已经验证过的控制结构稳定地带入嵌入式工程；而它最麻烦的地方，也正是模型与硬件之间那层接口。

在这次实践中，我使用 Simulink Coder 生成 FOC 控制代码，并集成到已有 STM32G4 框架。控制周期为 10 kHz，输入包括三相电流、编码器角度和母线电压，输出为三相 PWM CCR。

## 先把模型看成一个普通函数

抛开 Simulink 界面，生成后的控制模型本质上可以理解为下面这个接口：

```c
typedef struct {
  float phase_current_a;
  float phase_current_b;
  float phase_current_c;
  float electrical_angle;
  float dc_bus_voltage;
  float iq_reference;
} FocInput;

typedef struct {
  uint32_t pwm_ccr_a;
  uint32_t pwm_ccr_b;
  uint32_t pwm_ccr_c;
} FocOutput;

void FocControlStep(const FocInput *input, FocOutput *output);
```

实际生成代码的结构体和函数名会由配置决定，这段代码只是用于说明接口。只要这个函数的输入、调用时刻和输出去向不清楚，模型内部搭得再完整也无法可靠运行。

## 第一步：冻结数据约定

我在集成前先把每个输入输出的约定写清楚：

| 信号 | 需要确认的内容 |
| --- | --- |
| 三相电流 | 单位是 A 还是 ADC 计数值；正方向如何定义；偏置在哪里去除 |
| 电角度 | 单位是 rad、degree 还是归一化周期；方向与零点如何定义 |
| 母线电压 | 单位与采样比例；异常值如何处理 |
| 电流给定 | 单位、限幅和变化率限制 |
| PWM 输出 | 输出占空比还是 CCR；定时器周期和计数模式是什么 |

这一步没有复杂算法，却直接决定生成代码能不能与底层驱动对上。比如模型期望的是 $[0,2\pi)$ 电角度，而底层传入机械角；即使数据在数值上连续，Park 变换也不会得到正确结果。

## 第二步：让模型适合生成代码

为了让生成代码更可控，我主要处理了以下几类问题。

### 数据类型统一

PC 仿真习惯使用 `double`，STM32G4 上的控制计算则通常使用 `float`。如果模型内部混用两种类型，生成代码会出现大量隐式转换，既影响可读性，也可能增加运行时间。

我的做法是在模型边界明确输入输出类型，并检查关键中间量。角度、三角函数、PI 状态和 SVPWM 计算必须保持一致，不能只在输入端转一次类型就不再检查。

### 固定离散采样时间

10 kHz 控制周期对应：

$$
T_s=100\ \mu s
$$

电流 PI、积分器、滤波器和延时模块都要使用与该周期一致的离散实现。模型中如果残留连续模块或继承到错误采样时间，仿真可能还能运行，生成代码后的状态更新频率却会偏离预期。

### 限制动态行为

嵌入式生成代码更适合固定尺寸数组、明确的数据类型和确定的执行路径。对控制周期内运行的模型，我会避免不必要的动态内存、可变尺寸信号和不可预测循环。

### 划清模型与底层驱动

ADC 触发、DMA、编码器读取、PWM 寄存器更新属于硬件层；坐标变换、PI 和 SVPWM 属于控制模型。把两者分开后，模型可以继续在 PC 上验证，底层也可以单独检查采样和输出。

## 第三步：确定 10 kHz 调用时序

控制函数“每 100 微秒调用一次”还不够，还要知道它相对 PWM 和 ADC 在什么位置执行。一条更完整的数据链是：

```text
PWM 定时器事件
    │
    ├─► 触发 ADC，在合适的开关时刻采样相电流
    │
    ├─► ADC/DMA 数据就绪
    │
    ├─► 电流偏置与比例换算
    │
    ├─► 读取编码器角度、母线电压和给定值
    │
    ├─► 调用一次 FOC 生成代码
    │
    └─► 更新三相 CCR，在下一个 PWM 周期生效
```

如果 ADC 采样点随意漂移，测到的可能是开关噪声而不是稳定相电流；如果 CCR 立即更新而没有预装载，三相比较值也可能在同一周期内不同步生效。代码生成不会自动替我们解决这些硬件时序问题。

一个简化的调度框架可以写成：

```c
void MotorControlIsr(void)
{
  FocInput input = {0};
  FocOutput output = {0};

  // 采样值转换为物理量 / Convert samples to physical units.
  input.phase_current_a = CurrentSense_GetPhaseA();
  input.phase_current_b = CurrentSense_GetPhaseB();
  input.phase_current_c = CurrentSense_GetPhaseC();
  input.electrical_angle = Encoder_GetElectricalAngle();
  input.dc_bus_voltage = BusVoltage_Get();
  input.iq_reference = TorqueCommand_Get();

  FocControlStep(&input, &output);

  // 同步更新三相比较值 / Update all three compare values together.
  Pwm_SetCompare(output.pwm_ccr_a,
                 output.pwm_ccr_b,
                 output.pwm_ccr_c);
}
```

这里最需要警惕的是执行时间。10 kHz 只给出 100 微秒预算，ADC 处理、角度获取、模型计算和其他中断都会占用这段时间。生成代码能编译通过，并不能证明它满足实时性。

## 检查生成代码时的注意事项

自动生成不等于不需要阅读。我会重点检查：

- 初始化函数是否在控制中断开始前只调用一次；
- `step` 函数内部有没有意外的大数组、除零风险或不必要类型转换；
- PI 状态、上一拍延时等持久数据是否正确保存；
- 输入输出结构体是否在中断与其他任务之间发生并发读写；
- PWM 输出在异常角度、母线欠压或传感器离线时如何处理；
- 编译优化后，单次执行时间是否仍在周期预算内。

我也会在模型侧保留若干中间观测量，例如 $i_d$、$i_q$、PI 输出、扇区和占空比。它们不一定全部进入最终版本，但在对比模型与 MCU 行为时很有用。

## 模型验证与实机验证不是一回事

这次工作完成了模型搭建、代码生成和现有 STM32G4 框架中的数据流梳理。模型级验证能说明坐标变换、闭环方向和调制逻辑在设定条件下成立，却不能替代以下检查：

- ADC 零漂与采样噪声；
- 死区和器件压降造成的电压误差；
- 电机参数随温度和频率变化；
- 编码器安装偏角与相序；
- 中断抖动和计算超时；
- 过流、欠压和失速保护。

教程中还提到了 SIL、PIL 等验证方式，但我没有把没有完整走过的流程包装成项目成果。对我来说，下一步更有意义的是保存同一组测试输入，建立模型输出、生成 C 代码输出和 MCU 记录数据之间的可重复对比。

[上一篇：FOC 控制链路](/notes/MotorControlFOC) · [下一篇：非线性磁链观测器与 PLL](/notes/SensorlessFOCObserver)
