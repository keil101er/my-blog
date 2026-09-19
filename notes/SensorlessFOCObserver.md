---
title: 无位置传感器 FOC：非线性磁链观测器与 PLL
description: 从 SPMSM 的 αβ 电压方程出发，记录磁链观测、角度误差构造和 PLL 估速的模型级实现。
---

# 无位置传感器 FOC：非线性磁链观测器与 PLL

FOC 需要转子电角度。使用编码器时，角度来自传感器；无位置传感器控制则要根据电压、电流和电机模型反推转子磁链方向。

我这次复现的是 SPMSM 非线性磁链观测器加 PLL 的路线。它帮助我把“估角”和“估速”拆成两个问题：观测器先估计 $\alpha\beta$ 轴磁链，PLL 再跟踪磁链方向，输出连续的角度和电角速度。

本文只记录模型级实现与理解。无感启动、极低速运行和真实逆变器误差都还需要实机验证。

## 从 SPMSM 的 αβ 方程开始

对表贴式永磁同步电机，近似取 $L_d=L_q=L_s$。在 $\alpha\beta$ 坐标系中，定子电压可以写成：

$$
\boldsymbol{u}_{\alpha\beta}
=R_s\boldsymbol{i}_{\alpha\beta}
+\frac{d\boldsymbol{\psi}_{\alpha\beta}}{dt}
$$

总磁链由电感磁链和永磁体磁链构成：

$$
\boldsymbol{\psi}_{\alpha\beta}
=L_s\boldsymbol{i}_{\alpha\beta}
+\psi_f
\begin{bmatrix}
\cos\theta_e\\
\sin\theta_e
\end{bmatrix}
$$

如果能估计总磁链，再减去 $L_s\boldsymbol{i}_{\alpha\beta}$，剩下的向量就应指向转子永磁体磁链方向。定义：

$$
\boldsymbol{\eta}
=\hat{\boldsymbol{\psi}}_{\alpha\beta}
-L_s\boldsymbol{i}_{\alpha\beta}
$$

理想情况下：

$$
\boldsymbol{\eta}
=\psi_f
\begin{bmatrix}
\cos\theta_e\\
\sin\theta_e
\end{bmatrix}
$$

这样就能用 `atan2` 得到角度：

$$
\hat{\theta}_e=\operatorname{atan2}(\eta_\beta,\eta_\alpha)
$$

## 为什么不直接积分电压

从电压方程看，直接积分 $\boldsymbol{u}-R_s\boldsymbol{i}$ 就能得到磁链。但纯积分器会累积电压偏置、电流零漂和离散误差，最终出现明显漂移。

非线性磁链观测器在电压模型外加入一个校正项，让估计的永磁体磁链模长收敛到 $\psi_f$。一种常见表达为：

$$
\dot{\hat{\boldsymbol{\psi}}}
=\boldsymbol{u}_{\alpha\beta}
-R_s\boldsymbol{i}_{\alpha\beta}
+\frac{\gamma}{2}\boldsymbol{\eta}
\left(\psi_f^2-\lVert\boldsymbol{\eta}\rVert^2\right)
$$

其中 $\gamma$ 是观测器增益。括号中的误差反映当前磁链模长与目标模长的差异：估计模长过小时，校正项把它向外推；过大时则向内拉。

从实现角度看，每个控制周期需要完成：

1. 将三相电压、电流变换到 $\alpha\beta$ 轴；
2. 计算 $\boldsymbol{u}-R_s\boldsymbol{i}$；
3. 更新磁链观测器状态；
4. 减去 $L_s\boldsymbol{i}$ 得到 $\boldsymbol{\eta}$；
5. 由磁链方向构造角度误差；
6. 通过 PLL 得到角度和速度。

## 为什么还要加 PLL

直接对 `atan2` 输出做差分可以得到速度，但角度噪声会被微分放大，在 $-\pi$ 与 $\pi$ 跳变处还要额外处理。PLL 可以同时完成滤波和连续跟踪。

根据磁链向量与估计角度，可以构造相位误差：

$$
e_\theta
=\eta_\beta\cos\hat{\theta}_e
-\eta_\alpha\sin\hat{\theta}_e
$$

代入理想磁链后有：

$$
e_\theta
=\psi_f\sin(\theta_e-\hat{\theta}_e)
$$

当角度误差较小时，$\sin(\Delta\theta)\approx\Delta\theta$，于是可以用 PI 调节器输出估计电角速度，再积分得到估计角度：

$$
\begin{aligned}
\hat{\omega}_e &= K_p e_\theta+K_i\int e_\theta dt \\
\hat{\theta}_e &= \int\hat{\omega}_e dt
\end{aligned}
$$

相比直接 `atan2 + 差分`，PLL 输出通常更平滑，也更适合直接反馈给 Park 变换。不过它引入了新的带宽选择：太慢会产生相位滞后，太快又会把电流和电压噪声带进角度。

## 模型里最值得观察的信号

只看最终转速，很难判断观测器是否真的工作。我在模型里重点观察：

- $\eta_\alpha$、$\eta_\beta$ 的轨迹是否接近以原点为中心的圆；
- $\lVert\boldsymbol{\eta}\rVert$ 是否收敛到设定磁链幅值；
- 估计角度与参考角度的误差是否有固定偏差；
- 速度变化时，PLL 是否出现明显滞后或振荡；
- 参数扰动后，角度误差和磁链模长如何变化。

其中“轨迹看起来像圆”只能作为直观检查，不能替代角度误差统计。电流偏置、相序错误或电压方向错误都可能让轨迹偏心、旋转方向相反或出现畸变。

## 参数误差会从哪里进入

无感观测器依赖实际施加电压和电机参数，而模型里的量通常并不等于真实值。

### 定子电阻 $R_s$

低速时反电动势较小，$R_s i$ 在电压方程中的占比更高。温升导致电阻变化后，磁链估计误差会更明显。

### 电感 $L_s$ 与永磁磁链 $\psi_f$

$L_s$ 参与电感磁链扣除，$\psi_f$ 决定非线性校正的目标模长。参数不准会让估计向量的幅值和相位都发生偏差。

### 实际电压

模型通常把 SVPWM 指令换算为相电压，但死区、器件压降、母线波动和限幅都会让实际电压偏离指令。观测器使用错误电压时，相当于从源头引入积分误差。

### 电流偏置

电流传感器的零漂会同时进入 $R_s i$ 和 $L_s i$。由于观测器持续迭代，小偏置也可能慢慢表现成明显角度误差。

## 低速问题不能靠一句“调参”带过

当转速降低时，可用于观测的反电动势变小，信噪比下降。电阻压降、采样偏置和逆变器非线性反而变得更显著。因此，模型在中高速下能跟踪，并不能证明电机可以从静止状态无感启动。

实际方案往往还需要开环拖动、I/F 启动、高频注入或有感/无感切换。我的这次复现没有覆盖完整启动策略，所以更准确的说法是：我理解并搭建了从 $\alpha\beta$ 磁链估计到 PLL 估角、估速的信号链，而不是已经解决了全速域无感控制。

[上一篇：Simulink 代码生成与集成](/notes/SimulinkCodeGeneration) · [下一篇：LESO 速度环抗扰](/notes/LESOSpeedControl)
