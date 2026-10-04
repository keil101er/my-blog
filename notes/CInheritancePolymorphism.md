---
title: C 语言中的继承布局与多态调用
description: 用结构体嵌套表达基类布局，用函数指针选择实现，理解 C 语言继承与多态的边界。
---

# C 语言中的继承布局与多态调用

C 没有 `class` 和虚函数。常见做法是把“基类”结构体放进派生结构体，再把操作函数保存为函数指针。这样可以复用公共数据，并通过统一接口调用不同实现。

## 结构体嵌套表达继承

继承在这里不是 C 语言的关键字，而是一种布局约定：派生结构体包含一份基类成员，再追加自己的字段。把基类放在派生结构体的第一个成员，派生对象的起始地址与基类成员地址相同，便于转换：

```c
typedef struct {
  const char *name;
  void (*speak)(void *self);
} Animal;

typedef struct {
  Animal base;       // 基类子对象 / Base subobject.
  int running_speed;
} Dog;
```

只有在布局和类型约定明确时，才能把 `Dog *` 当作 `Animal *` 使用。若基类不是第一个成员，或结构体布局不匹配，直接转换会得到错误地址。

这种“继承”只复用了数据布局，并不会自动生成构造函数、析构函数或类型检查。创建 `Dog` 时仍要手动填写 `base.name`、`base.speak` 等字段；销毁时也要按实际拥有的资源执行清理。

## 函数指针实现动态分派

多态的关键是把“调用哪个函数”从调用方移到对象内部。调用方只保存基类指针并调用统一接口，函数指针的当前值决定实际执行的实现：

```c
static void dog_speak(void *self)
{
  Dog *dog = self;
  printf("%s: 汪汪\n", dog->base.name);
}

static void cat_speak(void *self)
{
  Animal *cat = self;
  printf("%s: 喵喵\n", cat->name);
}

void animal_speak(Animal *animal)
{
  if (animal != NULL && animal->speak != NULL)
    animal->speak(animal);
}
```

调用方只依赖 `Animal` 接口；`speak` 指向哪个函数，由创建对象时的具体类型决定。同一个 `animal_speak` 可以处理 Dog、Cat 等对象，这就是 C 中常说的运行时多态。

函数指针不会自动传入对象。上例中 `animal` 是显式的 `self` 参数，函数内部再把它转换回具体类型。

函数指针类型必须兼容。不能把参数列表不同的函数强行转换后调用；这会破坏调用约定。函数指针为空时也不能调用，所以初始化和调用前都要检查接口是否完整。

## 函数表与接口约定

当操作较多时，可以把函数指针集中到只读函数表：

```c
typedef struct {
  void (*speak)(void *self);
  void (*move)(void *self);
} AnimalVTable;

typedef struct {
  const AnimalVTable *vtable;
  const char *name;
} AnimalObject;
```

这只是用数据结构模拟虚函数表，C 编译器不会替你检查“派生对象是否实现了所有接口”。创建对象时要初始化完整函数表，并约定哪些函数允许为空。

继承解决的是公共布局和接口复用，多态解决的是同一调用形式选择不同实现；两者可以一起使用，也可以单独使用。


[C 语言对象封装与接口多态](/notes/CObjectOriented) · [C 语言函数指针基础](/notes/CFunctionPointers) · [返回：C 语言学习](/notes/CLearningOverview)
