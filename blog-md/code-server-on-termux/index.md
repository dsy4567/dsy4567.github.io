# 记一次在 Termux 上搭建 code-server 环境

我经常来店里帮大人看店，但是店里的电脑装着 Windows7，许多开发工具不能跑，因此有了远程开发的需求。说起远程开发，我第一个想到的肯定是 GitHub Codespaces。但这玩意服务器在国外，而且店里的宽带运营商是<spoiler>世界加钱可及的</spoiler>电信，裸连时访问速度在几十 kb/s。正好最近买了一台新手机，我准备在它上面借助 Termux 搭建 code-server 环境。

<!-- more -->

## 准备工作

- 一个域名（没有的话可以尝试折腾 hosts 文件）
- 一部可以完美运行 Termux 的安卓手机

## 安装 Termux

点击下面的链接，在 Assets 里下载合适的安装包。大多数安卓机应该选择文件名含 `arm64` 的安装包。

<https://github.com/termux/termux-app/releases/latest>

> 附：对于已开启纯净模式的哄蒙系统，安装时可能需要断网。

## 安装开发工具

### 更换清华 Termux 镜像

启动 Termux，初始化完成后执行以下命令：

```bash
termux-change-repo
```

![s:540x1194](/blog-md/code-server-on-termux/img/repo.jpg)![s:540x1194](/blog-md/code-server-on-termux/img/mirror.jpg)

确保 `Main repository` 被选中，然后按下回车，再使用上下键将光标移至清华镜像后按下空格和回车。

### 安装软件

依次执行以下命令：

```bash
pkg up
pkg install git nodejs openssh nginx python3 build-essential binutils pkg-config openssl-tool -y
npm config set registry https://registry.npmmirror.com #更换淘宝源
```

> 注意：安装时看见 `The default action is to keep your current version.` 这句话可直接按回车


