# 控制算法与笔记示例

这是一篇测试文章，用来验证图片和 LaTeX 公式渲染。

## 1. 数学公式

行内公式示例：状态转移方程为 $x_{k+1} = A x_k + B u_k$。

独立块级公式：

$$
J = \int_0^\infty (x^T Q x + u^T R u) \, dt
$$

## 2. 插入本地图片

将图片文件放到项目根目录的 `public/images/` 目录下（例如 `public/images/test.png`），在 Markdown 中直接使用相对根目录路径引用：

![架构示意图](/images/code.png)