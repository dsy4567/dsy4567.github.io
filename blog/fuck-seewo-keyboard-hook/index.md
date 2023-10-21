# （更新中）记一次解除希沃管家锁屏的键盘按键屏蔽，并绕过锁屏

> 注意：本文所述方法是笔者脑子一热想出来的新破解思路，可行性尚未在校验证。

## 写在前面

众所周知，越来越多的学校买了希沃一体机和集控，而其中某些学校设置的锁屏严重影响了学生课间劳逸结合。在同学们的强烈要求下，我开始走上了研究解锁方法这条不归路。

起初，我使用火绒的 访问控制 > 程序执行控制 阻止希沃管家主程序运行，但这样一体机会失去一部分实用的功能（好像也无所谓），且会大大增加网管提着大刀来找你的概率（笔者学校这方面管得似乎不严）。直到发现希沃管家利用键盘钩子屏蔽按键后，笔者脑子一热，想出来下面的新点子。

<!-- more -->

## 前期分析

在对希沃管家主程序一顿翻腾后，`C:\Program Files (x86)\Seewo\SeewoService\SeewoService_x.x.x.xxxx\SeewoServiceAssistant\resources\assets\dlls\KeyBoardHookFfi.dll` 这个文件引起了我的怀疑。从文件名可知，它应该与键盘钩子有关，可以用来屏蔽 win 等按键。

使用 Dependency Walker 查看入口函数名，以及解包 `app.asar` 并查看 `main.js` 后得知，这个 dll 文件拥有两个返回值类型为 `bool` 的入口函数：`SetKeyboardHook` 和 `UnHookKeyBoard`。在得知以上信息后，就可以尝试编写用来掉包的 dll 文件。

![使用 DevTools 格式化 main.js，并找到键盘钩子相关代码](/blog/fuck-seewo-keyboard-hook/img/devtools.webp)
![使用 Dependency Walker 打开 KeyBoardHookFfi.dll](/blog/fuck-seewo-keyboard-hook/img/dw.webp)

## 安装 mingw，写代码

> 如无特别说明，本节所有操作均在 GitHub Codespaces 上进行，谁叫笔者用的电脑垃圾呢。

在终端执行以下命令，安装 mingw。

```bash
sudo apt install g++-mingw-w64-i686 -y
```

新建一个 `KeyBoardHookFfi.c` 文件，粘贴以下代码。

```cpp
// 代码修改自 https://github.com/node-ffi/node-ffi/blob/master/example/factorial/factorial.c
#include <stdbool.h>

#if defined(WIN32) || defined(_WIN32)
#define EXPORT __declspec(dllexport)
#else
#define EXPORT
#endif

// 两个什么都不干的函数
EXPORT bool SetKeyboardHook() {
  return true;
}
EXPORT bool UnHookKeyBoard() {
  return true;
}
```

编译 dll 文件，然后右键下载。

```bash
i686-w64-mingw32-gcc ./KeyBoardHookFfi.c -o ./KeyBoardHookFfi.dll -shared -fPIC
```

## 调包

找到 `C:\Program Files (x86)\Seewo\SeewoService\SeewoService_x.x.x.xxxx\SeewoServiceAssistant\resources\assets\dlls\KeyBoardHookFfi.dll` 这个文件后，备份并使用“文件粉碎机”或在 WinRE 下删除此文件，然后将上面的 dll 文件复制粘贴到 dll 所在文件夹（是先 **删除** 再 **复制粘贴**）。如果提示“你需要提供管理员权限才能复制到此文件夹”，直接点击“继续”即可。

![dlls 文件夹](/blog/fuck-seewo-keyboard-hook/img/dlls-dictionary.webp)

使用任务管理器杀死希沃管家进程，并重新启动管家，也可以重启电脑/注销并重新登录。

如果希沃管家启动时报错，请参照下方[踩坑](#踩坑)部分解决问题。如果无法解决，请参考上述步骤删除已经调包的 dll 文件，并还原。

## 解除窗口置顶

咕~

## 更多骚操作

> 以下操作亦会大大增加网管提着大刀来找你的概率，请三思而后行。

- 将以下程序加入火绒的 访问控制 > 程序执行控制：
 - `C:\Program Files (x86)\Seewo\SeewoService\SeewoService_x.x.x.xxxx\SeewoCore\toolbox\screenCapture\screenCapture.exe` - 截屏录屏
 - `C:\Program Files (x86)\Seewo\SeewoService\SeewoService_x.x.x.xxxx\SeewoCore\toolbox\media_capture\media_capture.exe` - 摄像头
 - `C:\Program Files (x86)\Seewo\SeewoService\SeewoService_x.x.x.xxxx\SeewoCore\toolbox\rtcRemoteDesktop\rtcRemoteDesktop.exe` - 远程控制
- 将[这里面](https://help.seewo.com/hugo/ANlS310tQJ)提到的域名写到 hosts 文件里，解析到无法访问的 IP。


## 踩坑

希沃管家启动时报错：`Uncaught Exception: Dynamic Linking Error: Win32 error 126/193`：

-   原因 1: 入口函数名拼写有误；
-   原因 2: dll 文件应为 32 位，而不是 64 位。

## 附件&笔者的希沃管家信息

- 希沃管家版本号：v1.4.0.3393
- 用来调包的 dll：[KeyBoardHookFfi.dll](https://qwq.dsy4567.cf/files-2/KeyBoardHookFfi.dll)
- 调包前的 dll 备份：[KeyBoardHookFfi-backed-up.dll](https://qwq.dsy4567.cf/files-2/KeyBoardHookFfi-backed-up.dll)
