---
title: 从非线性倒立摆到腿长增益调度：轮腿机器人的 LQR 建模
description: 解释轮腿倒立摆如何在工作点附近线性化，LQR 的状态与权重怎样理解，以及腿长为何需要参与增益调度。
---

# 从非线性倒立摆到腿长增益调度：轮腿机器人的 LQR 建模

轮腿机器人使用 LQR 时，一个常见疑问是：位置、速度和姿态一直在变化，为什么可以放进固定的状态空间模型，而腿长变化却常常要重新计算反馈增益？

问题不在于某个量“会不会变”，而在于它的变化只是系统在同一模型中运动，还是已经显著改变了模型本身。理解这一点，才能把局部线性化、LQR 和增益调度连成一条完整逻辑。

## 简化模型不是为了描述所有动作

真实轮腿机器人包含轮子、五连杆、机体和多个转动关节。论文研究纵向平衡时，先固定或缓慢处理腿长变化，把单侧机构等效为“轮子—摆杆—机体”的轮腿倒立摆。

选取状态和输入：

$$
\boldsymbol{x}=
\begin{bmatrix}
\theta & \dot{\theta} & x_b & \dot{x}_b & \varphi & \dot{\varphi}
\end{bmatrix}^{\mathrm T},
\qquad
\boldsymbol{u}=
\begin{bmatrix}
T & T_p
\end{bmatrix}^{\mathrm T}
$$

其中 $T$ 是轮力矩，$T_p$ 是虚拟腿作用于机体的力矩。通过牛顿—欧拉方程可以得到包含 $\sin\theta$、$\cos\theta$ 和速度乘积项的非线性模型：

$$
\dot{\boldsymbol{x}}=
\boldsymbol{f}(\boldsymbol{x},\boldsymbol{u};L_0)
$$

这个模型原则上可以描述更大范围的运动，但直接基于它设计实时反馈控制器并不简单。平衡任务真正关心的是机器人直立工作点附近的小范围运动，因此论文在该工作点附近进行一阶线性化。

## 线性化是在工作点附近保留一阶影响

设平衡工作点为 $(\boldsymbol{x}_0,\boldsymbol{u}_0)$，定义小偏差：

$$
\delta\boldsymbol{x}=\boldsymbol{x}-\boldsymbol{x}_0,
\qquad
\delta\boldsymbol{u}=\boldsymbol{u}-\boldsymbol{u}_0
$$

对非线性函数做一阶 Taylor 展开：

$$
\delta\dot{\boldsymbol{x}}
\approx
\boldsymbol{A}\delta\boldsymbol{x}
+\boldsymbol{B}\delta\boldsymbol{u}
$$

其中：

$$
\boldsymbol{A}
=\left.\frac{\partial\boldsymbol{f}}{\partial\boldsymbol{x}}\right|_{(\boldsymbol{x}_0,\boldsymbol{u}_0)},
\qquad
\boldsymbol{B}
=\left.\frac{\partial\boldsymbol{f}}{\partial\boldsymbol{u}}\right|_{(\boldsymbol{x}_0,\boldsymbol{u}_0)}
$$

这里的近似有明确边界：姿态偏差较小、轮子保持接触、机构参数接近建模值。机器人倾倒很大、轮子打滑或离地后，原工作点附近的 $\boldsymbol{A}$、$\boldsymbol{B}$ 不再足以描述实际动力学。

论文还检查了线性模型的可控性。只有状态能够通过 $T$ 和 $T_p$ 被有效影响，后续求出的 LQR 反馈才有物理意义。

## LQR 优化的是误差与控制代价之间的权衡

对线性模型，LQR 使用代价函数：

$$
J=\int_0^\infty
\left(
\delta\boldsymbol{x}^{\mathrm T}\boldsymbol{Q}\delta\boldsymbol{x}
+\delta\boldsymbol{u}^{\mathrm T}\boldsymbol{R}\delta\boldsymbol{u}
\right)dt
$$

$\boldsymbol{Q}$ 表示对各状态误差的重视程度，$\boldsymbol{R}$ 表示对控制输出的约束程度。解代数 Riccati 方程后得到反馈矩阵 $\boldsymbol{K}$，在线控制可以写成：

$$
\delta\boldsymbol{u}=-\boldsymbol{K}\delta\boldsymbol{x}
$$

如果直接使用目标状态与当前状态之差，也常写成：

$$
\boldsymbol{u}=\boldsymbol{K}(\boldsymbol{x}_d-\boldsymbol{x})
$$

两种写法的正负号来自误差定义不同，不应脱离代码中的坐标方向死记。

调 $\boldsymbol{Q}$、$\boldsymbol{R}$ 时还要注意量纲。角度、位置和速度的数值范围可能相差几个数量级，直接比较对角元素大小并不能完全代表“更重视谁”。更稳妥的起点是先按各状态允许的最大偏差和执行器允许输出做归一化，再通过仿真与实机响应调整相对权重。

## “状态变化”与“模型变化”不是一回事

机器人从 $x_b=1\ \mathrm{m}$ 走到 $x_b=2\ \mathrm{m}$，位置状态改变了，但在平坦、均匀地面假设下，动力学参数通常不会仅因为绝对位置改变。速度和小范围姿态也可以在当前局部模型中演化。

腿长 $L_0$ 的影响不同。腿长变化会同时改变：

- 机体与轮轴之间的几何关系；
- 质心位置和等效力臂；
- 与转动惯量相关的项；
- 相同轮力矩或腿部力矩对状态加速度的作用。

因此更合适的表达是：

$$
\boldsymbol{A}=\boldsymbol{A}(L_0),
\qquad
\boldsymbol{B}=\boldsymbol{B}(L_0)
$$

腿长当然也可以放入更完整的非线性状态向量。问题不是它“不能成为状态”，而是当它在较大范围内变化时，围绕单一腿长线性化得到的固定模型会更快失效。

## 论文怎样把腿长引入增益调度

论文没有让一组固定的 $\boldsymbol{K}$ 覆盖全部腿长，而是在腿长范围内按 10 mm 间隔重复以下离线过程：

1. 固定一个腿长工作点 $L_0$；
2. 重新计算该工作点的 $\boldsymbol{A}(L_0)$、$\boldsymbol{B}(L_0)$；
3. 在相同设计目标下求解 LQR 增益 $\boldsymbol{K}(L_0)$；
4. 对矩阵中每个增益元素随腿长的变化进行三次多项式拟合。

单个元素可以表示为：

$$
K_{ij}(L_0)
=p_{0,ij}+p_{1,ij}L_0+p_{2,ij}L_0^2+p_{3,ij}L_0^3
$$

运行时根据当前腿长计算整组反馈增益，再完成状态反馈。这是一种典型的 gain scheduling：多个局部线性控制器由调度变量连接起来。

这部分必须与我的项目事实分开。现有简历和项目记录能够证明我完成过轮腿运动学、VMC、LQR/PID 平衡与变高度控制，但不足以证明实机采用了论文完全相同的“10 mm 采样加三次拟合”方案，因此本文只把它作为论文方法介绍。

## 增益调度仍然有自己的边界

把 $\boldsymbol{K}$ 写成 $L_0$ 的函数，并不会自动保证任意动作都稳定。实现时至少要检查：

- 拟合误差：多项式曲线是否在全部采样点附近保持足够精度；
- 插值范围：腿长超出离线设计区间后，不能继续无约束外推；
- 调度速度：腿长快速变化时，系统不再只是若干准静态工作点的平滑切换；
- 执行器约束：不同腿长下相同状态误差可能需要不同峰值力矩；
- 模型切换：跳跃离地后，接触条件改变，单靠更新 $\boldsymbol{K}(L_0)$ 不能恢复地面模型的有效性。

验证也不应只看一条腿长曲线。至少需要在多个离线采样点、采样点之间以及腿长变化过程中检查闭环极点、控制量饱和、姿态恢复和模型误差敏感性。

最终应该记住的不是“腿长必须用三次多项式”，而是判断逻辑：如果一个可测变量的变化会持续改变被控对象动力学，就需要明确处理这种参数依赖；增益调度只是其中一种工程上容易部署的方法。

## 参考资料

- 陈阳、王洪熙、张兰勇：《轮腿式平衡机器人控制》，2023，DOI：10.13976/j.cnki.xk.2023.2533。

[上一篇：轮腿平衡机器人控制链路](/notes/WheelLeggedControlOverview) · [下一篇：从五连杆运动学到 VMC](/notes/WheelLeggedVMC)
