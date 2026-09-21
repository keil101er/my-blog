---
title: 从五连杆运动学到 VMC：为什么关节力矩等于 J 转置乘虚拟力
description: 从任务空间、运动学 Jacobian 与虚功原理出发，推导轮腿五连杆的 VMC 力矩映射，并说明坐标约定与奇异位形边界。
---

# 从五连杆运动学到 VMC：为什么关节力矩等于 J 转置乘虚拟力

LQR 可以算出轮子需要多少力矩，也可以给出虚拟腿应对机体施加的力矩；腿长控制器还能算出沿腿方向的支撑力。但真实五连杆上只有两个主动关节电机，并不存在一台名为“虚拟腿执行器”的电机。

VMC 要解决的正是这层翻译：控制器先在容易理解的任务空间里描述期望作用，再利用机构当前的几何关系，把它转换成真实关节力矩。

## 先固定两个空间和 Jacobian 的方向

对论文中的平面五连杆单腿，取两个主动关节角为：

$$
\boldsymbol{q}=
\begin{bmatrix}
\varphi_1\\
\varphi_4
\end{bmatrix}
$$

把五连杆等效成一条虚拟腿，任务空间坐标为：

$$
\boldsymbol{x}=
\begin{bmatrix}
L_0\\
\varphi_0
\end{bmatrix}
$$

$L_0$ 表示虚拟腿长度，$\varphi_0$ 表示虚拟腿方向。五连杆正运动学建立了非线性映射：

$$
\boldsymbol{x}=\boldsymbol{f}(\boldsymbol{q})
$$

对它求全微分：

$$
\delta\boldsymbol{x}
=\boldsymbol{J}(\boldsymbol{q})\delta\boldsymbol{q},
\qquad
\boldsymbol{J}
=\frac{\partial\boldsymbol{x}}{\partial\boldsymbol{q}}
$$

这里有一个必须纠正的常见记号混淆：既然定义的是 $\boldsymbol{x}=\boldsymbol{f}(\boldsymbol{q})$，那么 Jacobian 就是 $\partial\boldsymbol{x}/\partial\boldsymbol{q}$，不是 $\partial\boldsymbol{q}/\partial\boldsymbol{x}$。把方向写反后，后面的维度和转置关系都会失去依据。

## $\delta\boldsymbol{x}=\boldsymbol{J}\delta\boldsymbol{q}$ 算不算线性化

它确实来自当前姿态附近的一阶局部关系。对有限位移写成：

$$
\boldsymbol{x}(\boldsymbol{q}+\delta\boldsymbol{q})
\approx
\boldsymbol{x}(\boldsymbol{q})
+\boldsymbol{J}(\boldsymbol{q})\delta\boldsymbol{q}
$$

当 $\delta\boldsymbol{q}$ 很小时，忽略高阶项才是合理的。若一次跨过很大的关节角度，应该重新在新姿态计算 $\boldsymbol{J}$，而不是用旧矩阵预测整段位移。

速度形式则是对正运动学直接求时间导数：

$$
\dot{\boldsymbol{x}}
=\boldsymbol{J}(\boldsymbol{q})\dot{\boldsymbol{q}}
$$

只要机构约束光滑、坐标定义一致，这个式子描述的是当前时刻的瞬时速度关系。$\boldsymbol{J}$ 仍然会随关节姿态变化，因此控制循环中需要根据最新关节角更新。

## 从运动关系到力矩关系，关键是虚功相等

定义任务空间广义力：

$$
\boldsymbol{F}_v=
\begin{bmatrix}
F\\
T_p
\end{bmatrix}
$$

其中 $F$ 沿虚拟腿方向作用，单位为 N；$T_p$ 绕虚拟腿角坐标作用，单位为 N·m。真实关节力矩为：

$$
\boldsymbol{\tau}=
\begin{bmatrix}
T_1\\
T_2
\end{bmatrix}
$$

在忽略机构弹性、摩擦和传动损耗的理想情况下，同一个微小位移对应的关节侧虚功与任务空间虚功相等：

$$
\boldsymbol{\tau}^{\mathrm T}\delta\boldsymbol{q}
=\boldsymbol{F}_v^{\mathrm T}\delta\boldsymbol{x}
$$

代入 $\delta\boldsymbol{x}=\boldsymbol{J}\delta\boldsymbol{q}$：

$$
\boldsymbol{\tau}^{\mathrm T}\delta\boldsymbol{q}
=\boldsymbol{F}_v^{\mathrm T}\boldsymbol{J}\delta\boldsymbol{q}
$$

由于这个关系需要对任意允许的 $\delta\boldsymbol{q}$ 成立，因此：

$$
\boldsymbol{\tau}^{\mathrm T}
=\boldsymbol{F}_v^{\mathrm T}\boldsymbol{J}
$$

两侧转置就得到 VMC 中最常用的映射：

$$
\boxed{
\boldsymbol{\tau}
=\boldsymbol{J}^{\mathrm T}\boldsymbol{F}_v
}
$$

转置不是经验规则，而是由运动学微分关系和功的一致性共同决定的。

## 为什么 $F$ 和 $T_p$ 要放在同一个向量里

任务空间有两个坐标，就需要两个与之共轭的广义力：

- $L_0$ 对应轴向力 $F$，因为 $F\,\delta L_0$ 的单位是功；
- $\varphi_0$ 对应虚拟力矩 $T_p$，因为 $T_p\,\delta\varphi_0$ 的单位也是功。

$F$ 通常来自腿长控制、重力补偿和横滚差动，负责“顶住多少、腿多长”；$T_p$ 通常来自纵向 LQR，负责“虚拟腿怎样参与机体平衡”。VMC 不需要知道这些量由哪个控制器产生，只负责按照当前机构姿态分配给 $T_1$、$T_2$。

这种分层的价值是，控制器可以先假想存在一根带弹簧、阻尼和旋转执行器的虚拟腿，再让真实五连杆实现相同的瞬时广义作用。Virtual Model Control 的“虚拟”，指的正是这个并不存在于硬件中的任务空间模型。

## 为什么这里没有出现 $\boldsymbol{J}^{-1}$

已知期望任务空间广义力时，关节力矩直接由 $\boldsymbol{J}^{\mathrm T}\boldsymbol{F}_v$ 得到，不需要求 Jacobian 的逆。它与“已知末端速度，反求关节速度”的逆运动学问题不同：

$$
\dot{\boldsymbol{x}}=\boldsymbol{J}\dot{\boldsymbol{q}}
$$

若要从 $\dot{\boldsymbol{x}}$ 反求 $\dot{\boldsymbol{q}}$，才可能涉及逆矩阵或伪逆。

不过，“不求逆”不代表可以忽略奇异位形。当五连杆接近共线或其他退化姿态时，$\boldsymbol{J}$ 的秩和条件数会恶化，两个关节对任务空间方向的独立控制能力下降。此时可能出现：

- 某些虚拟腿运动方向很难由关节运动产生；
- 任务空间误差稍有变化，逆运动学或速度解算就会非常敏感；
- 期望广义力经过映射后受关节限矩、摩擦和结构约束影响，实际作用与理想值偏离；
- 数值噪声和角度误差更容易放大到闭环行为中。

因此更严谨的说法是：$\boldsymbol{\tau}=\boldsymbol{J}^{\mathrm T}\boldsymbol{F}_v$ 本身不会因为没有逆矩阵就数值发散，但奇异位形附近的任务空间可控性和模型有效性仍会退化。工程上需要限制腿长和关节角范围、监测 Jacobian 条件、限制关节力矩，并避免把目标轨迹推入退化区域。

## 落到控制循环时要核对什么

公式正确仍不足以保证实机方向正确。每个控制周期至少要保证以下约定一致：

1. 关节编码器零位与正方向和正运动学定义一致；
2. $\varphi_0$ 的正方向与 LQR 中 $T_p$ 的正方向一致；
3. $F$ 的正方向明确是压缩、伸长，还是机体指向轮轴；
4. 左右腿镜像安装后，不能直接默认两侧使用完全相同的符号；
5. 映射后的 $T_1$、$T_2$ 要经过电机限矩、故障状态和控制模式检查；
6. 用实际关节角实时更新 $\boldsymbol{J}(\boldsymbol{q})$，而不是固定使用初始姿态矩阵。

调试时可以先关闭 $T_p$，只给小幅轴向力，确认两关节合力确实让虚拟腿沿期望方向伸缩；再关闭 $F$，只给小幅虚拟力矩，确认虚拟腿角方向正确。两个通道分别验证后再接回 LQR 和腿长控制，比整车闭环后依靠“站没站住”判断符号更可靠。

VMC 最终需要记住的只有两条因果关系：正运动学决定当前姿态下关节微动怎样改变虚拟腿，虚功原理再把这条运动关系转置成力与力矩的映射。只背 $\boldsymbol{J}^{\mathrm T}$，却没有固定坐标定义和功的共轭关系，公式很容易在左右腿镜像或符号修改时用错。

## 参考资料

- 陈阳、王洪熙、张兰勇：《轮腿式平衡机器人控制》，2023，DOI：10.13976/j.cnki.xk.2023.2533。

[上一篇：从非线性倒立摆到腿长增益调度](/notes/WheelLeggedLQR)
