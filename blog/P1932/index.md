# P1932 题解

<!-- more -->

## 原题

> <https://www.luogu.com.cn/problem/P1932>

```plaintext
A+B  A-B  A*B  A/B A%B Problem

# 题目背景

这个题目很新颖吧！！！

# 题目描述

求A、B的和差积商余！

由于数据有修改，减法运算结果可能带负号！

# 输入格式

两个数两行

A
B

# 输出格式

五个数

和
差
积
商
余

# 样例 #1

样例输入 #1

1
1

样例输出 #1

2
0
1
1
0

# 提示

length(A),length(B)<=10^4

A,B>0
每个点3s。
```

---

## 代码

```python
a,b=int(input()),int(input())
print(a+b)
print(a-b)
print(a*b)
print(a//b)
print(a%b)
```

Python <abbr title="永远单身">YYDS!</abbr>

> <https://www.luogu.com.cn/record/107080406>
