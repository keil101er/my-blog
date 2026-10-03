---
title: 从三相电流到 PWM：FOC 控制链路
description: 回顾 SPMSM 的坐标变换、电流 PI 和 SVPWM，理解从电流采样到三相 PWM 的过程。
---

# 从三相电流到 PWM：FOC 控制链路

**FOC 把三相电流转换到随转子旋转的 dq 坐标系，再分别控制两轴电流。** 对表贴式永磁同步电机（SPMSM），常用 $i_d^*=0$，通过 $i_q$ 控制转矩。这里不展开弱磁和 MTPA。

## 各模块做什么

| 模块 | 输入 → 输出 | 作用 |
| --- | --- | --- |
| Clarke | 三相电流 → $i_\alpha,i_\beta$ | 将三相量转换到静止的两轴坐标系 |
| Park | $i_\alpha,i_\beta,\theta_e$ → $i_d,i_q$ | 转到随转子旋转的坐标系 |
| 电流 PI | 电流给定与反馈 → $u_d,u_q$ | 根据电流误差计算电压 |
| 反 Park | $u_d,u_q,\theta_e$ → $u_\alpha,u_\beta$ | 将电压指令转回静止坐标系 |
| SVPWM | $u_\alpha,u_\beta,U_{dc}$ → 三相占空比 | 用逆变器开关合成目标电压 |
| PWM 定时器 | 占空比 → CCR | 按比较值产生 PWM |

$\theta_e$ 是转子电角度，$U_{dc}$ 是母线电压；上标 $*$ 表示给定值。

## 坐标变换：把交流量变成便于控制的量

当 $i_a+i_b+i_c=0$ 时，采用幅值不变的 Clarke 变换：

$$
i_\alpha=i_a,\qquad i_\beta=\frac{i_a+2i_b}{\sqrt{3}}
$$

再做 Park 变换：

$$
\begin{aligned}
i_d &= i_\alpha\cos\theta_e+i_\beta\sin\theta_e \\
i_q &= -i_\alpha\sin\theta_e+i_\beta\cos\theta_e
\end{aligned}
$$

$d$ 轴沿转子永磁体磁链方向，$q$ 轴与它垂直。稳定运行且角度正确时，dq 电流近似为直流量，便于用 PI 调节。SPMSM 的 $L_d\approx L_q$，在 $i_d=0$ 时，转矩与 $i_q$ 近似成正比。

**相序、角度正方向和变换符号必须一致。** 机械角换算为电角度时，要考虑极对数和电角度零点偏移。

## 电流 PI：电流误差决定电压

两轴分别计算 $e_d=i_d^*-i_d$、$e_q=i_q^*-i_q$。PI 的连续形式为：

$$
u(s)=\left(K_p+\frac{K_i}{s}\right)e(s)
$$

除增益外，还要明确：

- **采样周期**：离散 PI 使用的周期应与实际调用周期一致。
- **电压限幅**：输出不能超过母线电压和调制方式允许的范围。
- **抗积分饱和**：输出已被限幅时，避免积分项继续累积，导致恢复过慢。

转速提高后，可加入交叉耦合和反电动势补偿：

$$
\begin{aligned}
u_d &= u_{d,PI}-\omega_e L_q i_q \\
u_q &= u_{q,PI}+\omega_e(L_d i_d+\psi_f)
\end{aligned}
$$

其中 $\omega_e$ 是电角速度，$L_d,L_q$ 是两轴电感，$\psi_f$ 是永磁磁链。调试时可先确认 PI 闭环方向正确，再加入补偿。

## SVPWM：把电压指令变成开关时间

先用反 Park 变换得到静止坐标系下的电压：

$$
\begin{aligned}
u_\alpha &= u_d\cos\theta_e-u_q\sin\theta_e \\
u_\beta &= u_d\sin\theta_e+u_q\cos\theta_e
\end{aligned}
$$

SVPWM 用相邻的有效电压矢量和零矢量，在一个 PWM 周期内合成目标平均电压：

**判断扇区 → 计算矢量作用时间 → 分配零矢量时间 → 得到三相占空比。**

占空比应在 $[0,1]$ 内，电压指令过大时需要限幅。占空比到 CCR 的换算取决于定时器计数模式及 PWM 模式；中心对齐不能简单理解为把 CCR 乘 2。

## 按顺序验证

1. **坐标变换**：输入已知正弦电流和角度，检查 dq 值及反变换结果。
2. **电流环**：给两轴小幅阶跃，观察跟踪、超调和饱和恢复。
3. **SVPWM**：让电压矢量缓慢旋转，检查扇区切换和占空比是否连续。
4. **MCU 接口**：核对电流偏置、角度单位、母线电压比例和 CCR 范围。

模型正确后，仍需核对采样和 PWM 更新时序，见[Simulink 代码生成与集成](/notes/SimulinkCodeGeneration)。

[返回：电机控制学习](/notes/MotorControlAlgorithm)
