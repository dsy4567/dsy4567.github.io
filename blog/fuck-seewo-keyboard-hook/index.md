# （更新中）记一次解除希沃管家锁屏的键盘按键屏蔽

在对希沃管家主程序一顿翻腾后，`C:\Program Files (x86)\Seewo\SeewoService\SeewoService_x.x.x.xxxx\SeewoServiceAssistant\resources\assets\dlls\KeyBoardHookFfi.dll` 这个文件引起了我的怀疑。从文件名可知，它应该与键盘钩子有关，可以用来屏蔽 win 等按键。

使用 Dependency Walker 查看入口函数名，以及解包 `app.asar` 并查看 `main.js` 后得知，这个 dll 文件拥有两个返回值类型为 `bool` 的入口函数：`SetKeyboardHook` 和 `UnHookKeyBoard`。

![使用 DevTools 格式化 main.js，并找到键盘钩子相关代码](/blog/fuck-seewo-keyboard-hook/img/)
![使用 Dependency Walker 打开 KeyBoardHookFfi.dll](/blog/fuck-seewo-keyboard-hook/img/dw.webp)
