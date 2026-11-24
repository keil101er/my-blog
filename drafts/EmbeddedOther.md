# 撕裂读取

- 当使用32位cpu读取64位数据(且高频变化时)


```c
static uint64_t pdo_now_ticks(void)
{
    uint32_t high, low;
    do {
        high = (uint32_t)(mchtmr_get_count(HPM_MCHTMR) >> 32);
        low = (uint32_t)mchtmgei_get_count(HPM_MCHTMR);
    } while (high != (uint32_t)(mchtmr_get_count(HPM_MCHTMR) >> 32)); //通过比较高位是否相同来判断是否撕裂
    return ((uint64_t)high << 32) | low;
}
```
| 程序做的事 | 当时真实的计时器 | 程序拿到的值 |
|---|---|---|
| 第一次读高位 | `00000001_FFFFFFFF` | `high = 1` |
| 计时器走了一格 | `00000002_00000000` | |
| 读低位 | `00000002_00000000` | `low = 0` |

如果现在就拼接，得到的是 00000001_00000000

