---
title: 无位置传感器 FOC：非线性磁链观测器与 PLL
description: 理解磁链观测器如何根据电压、电流估计磁链，以及 PLL 如何从磁链方向得到角度和速度。
---

# 无位置传感器 FOC：非线性磁链观测器与 PLL

**磁链观测器估计转子磁链，PLL 跟踪磁链方向，得到电角度和电角速度。** FOC 随后使用这个角度完成坐标变换。

这里讨论表贴式永磁同步电机（SPMSM），近似取 $L_d=L_q=L_s$。目前仅完成模型级复现，未验证完整无感启动和全速域运行。

## 从磁链得到角度

在静止的 $\alpha\beta$ 坐标系中：

$$
\boldsymbol{u}_{\alpha\beta}
=R_s\boldsymbol{i}_{\alpha\beta}
+\frac{d\boldsymbol{\psi}_{\alpha\beta}}{dt}
$$

其中 $R_s$ 是定子电阻，$\boldsymbol{u}$、$\boldsymbol{i}$ 分别是电压、电流向量，$\boldsymbol{\psi}$ 是定子总磁链。

总磁链由电感磁链和永磁体磁链组成：

$$
\boldsymbol{\psi}_{\alpha\beta}
=L_s\boldsymbol{i}_{\alpha\beta}
+\psi_f
\begin{bmatrix}
\cos\theta_e\\
\sin\theta_e
\end{bmatrix}
$$

$\psi_f$ 是永磁磁链幅值，$\theta_e$ 是转子电角度。估计出总磁链后，减去电感磁链，就得到永磁体磁链的估计值：

$$
\boldsymbol{\eta}
=\hat{\boldsymbol{\psi}}_{\alpha\beta}
-L_s\boldsymbol{i}_{\alpha\beta}
$$

帽子 $\hat{\ }$ 表示估计值。$\boldsymbol{\eta}$ 的方向就是估计的转子方向，可由 $\operatorname{atan2}(\eta_\beta,\eta_\alpha)$ 求出角度。

## 非线性校正：减少积分漂移

直接积分 $\boldsymbol{u}-R_s\boldsymbol{i}$ 可以估计磁链，但电压偏置、电流零漂等误差也会被不断累积。

一种非线性观测器加入磁链幅值校正：

$$
\dot{\hat{\boldsymbol{\psi}}}
=\boldsymbol{u}_{\alpha\beta}
-R_s\boldsymbol{i}_{\alpha\beta}
+\frac{\gamma}{2}\boldsymbol{\eta}
\left(\psi_f^2-\lVert\boldsymbol{\eta}\rVert^2\right)
$$

$\gamma>0$ 是观测器增益。校正项根据幅值误差调整估计值：$\lVert\boldsymbol{\eta}\rVert$ 偏小时向外修正，偏大时向内修正。幅值接近 $\psi_f$ 后，仍需检查方向是否正确。

## PLL：跟踪角度，同时估计速度

直接对角度做差分会放大噪声，还要处理 $-\pi$ 与 $\pi$ 之间的跳变。PLL（锁相环）用角度误差调节估计速度，再积分得到角度。

由磁链向量构造误差：

$$
e_\theta
=\eta_\beta\cos\hat{\theta}_e
-\eta_\alpha\sin\hat{\theta}_e
$$

理想情况下，$e_\theta=\psi_f\sin(\theta_e-\hat{\theta}_e)$。角度误差较小时，它近似与角度差成正比，因此可用 PI 调节：

$$
\begin{aligned}
\hat{\omega}_e &= K_p e_\theta+K_i\int e_\theta\,dt \\
\hat{\theta}_e &= \int\hat{\omega}_e\,dt
\end{aligned}
$$

$\hat{\omega}_e$ 为估计电角速度。PLL 带宽低，跟踪慢；带宽高，通常更容易受噪声影响。

## 检查哪些误差

| 检查项 | 关注点 |
| --- | --- |
| 磁链幅值与方向 | 幅值是否接近 $\psi_f$，角度是否与参考值一致；轨迹像圆不代表角度一定正确 |
| 电阻、电感和磁链参数 | 参数偏差会影响磁链估计，低速时电阻误差尤其明显 |
| 观测器输入电压 | 指令电压与实际电压可能因死区、压降和限幅而不同 |
| 电流偏置 | 同时影响 $R_s\boldsymbol{i}$ 和 $L_s\boldsymbol{i}$ |
| PLL 动态 | 加减速时是否滞后、振荡，稳速时噪声是否过大 |

**这类电压模型观测器在低速时更难准确估角。** 转速降低后，反电动势变小，采样误差和电阻压降的影响更突出。中高速跟踪正常，不代表能够从静止状态启动；启动和低速控制需要另行设计。

[上一篇：Simulink 代码生成与集成](/notes/SimulinkCodeGeneration) · [下一篇：LESO 速度环抗扰](/notes/LESOSpeedControl)
