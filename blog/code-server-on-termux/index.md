# 记一次在 Termux 上搭建 code-server 环境

店里的电脑装着 Windows7，许多开发工具不能安装，因此有了远程开发的需求。说起远程开发，我第一个想到的肯定是 GitHub Codespaces。但这玩意服务器在国外，而且店里的宽带运营商是<spoiler>世界加钱可及的</spoiler>某信，裸连 GitHub Codespaces 时访问速度高达几十 kb/s。正好最近买了一台新手机，我准备在它上面借助 Termux 搭建 code-server 环境。

<!-- more -->

## 要求

-   会使用 Linux
-   有一个域名（没有的话可以尝试折腾 hosts 文件）
-   有一部可以完美运行 Termux 的安卓手机
-   有一台安装了 ssh 工具（Git 已经内置）和浏览器的电脑

## 安装 Termux

点击下面的链接，在 Assets 里下载合适的安装包。大多数安卓/哄蒙机应该选择文件名含 `arm64` 的安装包。

<https://github.com/termux/termux-app/releases/latest>

> 附：对于已开启纯净模式的哄蒙系统，安装时可能需要断网。

## 安装开发工具

### 更换清华 Termux 镜像（可选）

启动 Termux，初始化完成后执行以下命令：

```bash
termux-change-repo
```

![s:540x1194 选择仓库](/blog/code-server-on-termux/img/repo.webp)![s:540x1194 选择镜像](/blog/code-server-on-termux/img/mirror.webp)

确保 `Main repository` 被选中，然后按下回车，再使用上下键将光标移至清华镜像后按下空格和回车。

### 安装和配置开发工具

依次执行以下命令：

```bash
#一股脑把需要的全装上
pkg install git nodejs-lts nginx python3 openssl-tool wget openssh vim screen -y
pkg up

#在这里查 code-server 的最新版本号，然后替换下面的版本号
#https://github.com/search?q=repo%3Atermux-user-repository%2Fdists%20dists%2Ftur-packages%2Ftur%2Fbinary-aarch64%2FPackages%20code-server&type=code
wget https://ghproxy.com/https://github.com/termux-user-repository/dists/releases/download/0.1/code-server_4.17.1_aarch64.deb -O code-server.deb
apt-get --fix-broken install ./code-server.deb -y
#网快的也可以用这个
pkg install tur-repo -y
pkg install code-server -y

#更换淘宝源
npm config set registry https://registry.npmmirror.com
#将邮箱和用户名分别替换为 GitHub 绑定的邮箱和 GitHub 用户名
git config --global user.email "username@example.com"
git config --global user.name "username"
```

> 注意：安装时看见 `The default action is to keep your current version.` 这句话可直接按回车
>
> ![s:1080x394 The default action is to keep your current version.](/blog/code-server-on-termux/img/confirm.webp)

## 为手机设置固定内网 IP

打开 WLAN 设置，按住已连接的网络，点击 “修改网络”。

![s:540x344 修改网络](/blog/code-server-on-termux/img/wlan.webp)

点击“IP”，将“DHCP”改为“静态”。

![s:540x717 网络设置](/blog/code-server-on-termux/img/dhcp.webp)

然后 _**参考**_ 以下设置，修改后保存。

-   IP 地址：`192.168.1.xx`
-   网关：`192.168.1.1`
-   网络前缀长度：`24`
-   域名 1：`192.168.1.1`
-   域名 2：`114.114.114.114`

![s:455.5x960 网络设置](/blog/code-server-on-termux/img/ip.webp)

## 配置域名

为域名添加以下记录：

| 类型 | 名称      | 值              |
| ---- | --------- | --------------- |
| A    | vscode    | \<手机内网 IP\> |
| A    | \*.vscode | \<手机内网 IP\> |

如果没有域名，可以在 hosts 文件里添加以下内容

```properties
#将 example.com 替换为你自己的域名
手机内网IP vscode.example.com
手机内网IP <需要转发的端口1>.vscode.example.com
手机内网IP <需要转发的端口2>.vscode.example.com
手机内网IP <需要转发的端口3>.vscode.example.com
...
```

## 配置自签名证书

> 注意：必须妥善保管证书文件，泄露给他人有安全风险。

执行以下命令：

```bash
cd ~
mkdir ssl
cd ssl
vim ./csr.conf
```

按 <kbd>i</kbd> 进入编辑模式，粘贴以下内容：

```properties
[req]
default_bits = 2048
prompt = no
default_md = sha256
req_extensions = req_ext
distinguished_name = dn

[dn]
C = CN
CN = foo
O = bar

[req_ext]
subjectAltName = @alt_names

[alt_names]
#将 example.com 替换为你自己的域名
DNS.1 = vscode.example.com
DNS.2 = *.vscode.example.com
DNS.3 = localhost
IP.1 = <手机内网IP>
IP.2 = 127.0.0.1
```

按 <kbd>Esc</kbd>，输入 `:wq` 并按回车后执行命令 `vim ./cert.conf`，再按 <kbd>i</kbd> 进入编辑模式，粘贴以下内容：

```properties
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names

[alt_names]
#将 example.com 替换为你自己的域名
DNS.1 = vscode.example.com
DNS.2 = *.vscode.example.com
DNS.3 = localhost
IP.1 = <手机内网IP>
IP.2 = 127.0.0.1
```

按 <kbd>Esc</kbd>，输入 `:wq` 并按回车后，依次执行以下命令：

```bash
openssl req -x509 -sha256 -days 3560 -nodes -newkey rsa:2048 -subj "/CN=foo/C=CN/O=bar" -keyout rootCA.key -out rootCA.crt
openssl genrsa -out server.key 2048
openssl req -new -key server.key -out server.csr -config csr.conf
openssl x509 -req -in server.csr -CA rootCA.crt -CAkey rootCA.key -CAcreateserial -out server.crt -days 365 -sha256 -extfile cert.conf
cd ~
```

## 配置 ssh 服务

依次执行以下命令：

```bash
#设置密码，密码不会显示出来，输完后请自信按下回车
passwd

sshd
#显示内网 IP 地址
ifconfig
```

现在可以在同一局域网内另一台安装了 ssh 客户端的机器上执行以下命令，然后输入密码：

```bash
ssh -p 8022 手机内网IP
```

如果显示下面的文字，输入 `yes` 并按回车

```text
ED25519 key fingerprint is SHA256:balabala.
This key is not known by any other names
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```

## 安装根证书

以 Windows 系统为例，在同一局域网内另一台安装了 ssh 客户端的机器上执行以下命令，然后输入密码：

```bash
scp -P 8022 username@手机内网IP:~/ssl/rootCA.crt .
```

双击打开证书文件，点击“安装证书”，将证书添加到“受信任的根证书颁发机构”。

![s:748x787 安装 CA 证书](/blog/code-server-on-termux/img/ca.webp)

## 配置 Nginx

执行命令 `vim ~/../usr/etc/nginx/nginx.conf`，再按 <kbd>i</kbd> 进入编辑模式，删除已有内容，然后粘贴以下内容：

```nginx
worker_processes 1;

events {
    worker_connections 1024;
}

http {
    sendfile on;
    keepalive_timeout 65;
    gzip on;
    #如果显示“could not build server_names_hash, you should increase server_names_hash_bucket_size”，可以将下面的数字改为更大的 32 的倍数
    server_names_hash_bucket_size 64;

    server {
        listen 7443 ssl;
        #将 example.com 替换为你自己的域名
        server_name *.vscode.example.com;

        ssl_certificate /data/data/com.termux/files/home/ssl/server.crt;
        ssl_certificate_key /data/data/com.termux/files/home/ssl/server.key;

        ssl_session_cache shared:SSL:1m;
        ssl_session_timeout 5m;

        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        location / {
            set $forward_port -1;
            if ($host ~ ^([0-9]+)\. ) {
                set $forward_port $1;
            }
            if ($forward_port = -1) {
                return 400;
            }
            proxy_pass http://127.0.0.1:$forward_port;
            proxy_set_header Host $proxy_host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }
}
```

按 <kbd>Esc</kbd>，输入 `:wq` 并按回车。

## 编写启动脚本

执行命令 `vim ~/android-as-linux.js`，再按 <kbd>i</kbd> 进入编辑模式，删除已有内容，粘贴以下内容：

```js
Object.defineProperty(process, "platform", {
	get() {
		return "linux";
	},
});
```

按 <kbd>Esc</kbd>，输入 `:wq` 并按回车，然后执行命令 `vim ~/code-server.sh`，再按 <kbd>i</kbd> 进入编辑模式，删除已有内容，粘贴以下内容：

```bash
#!/data/data/com.termux/files/usr/bin/bash
sshd
nginx -s quit
nginx
cat ~/.config/code-server/config.yaml
#见下方注意事项
export NODE_OPTIONS="--require /data/data/com.termux/files/home/android-as-linux.js"
#将 example.com 替换为你自己的域名
code-server --host 0.0.0.0 --port 8443 --cert ~/ssl/server.crt --cert-key ~/ssl/server.key --proxy-domain vscode.example.com:7443
```

按 <kbd>Esc</kbd>，输入 `:wq` 并按回车，然后依次执行以下命令：

```bash
chmod 777 ~/code-server.sh
~/code-server.sh
```

> 退出按 <kbd>Ctrl</kbd> + <kbd>C</kbd> 并执行 `nginx -s quit`

至此，完整的开发环境已经准备好。在同一局域网内另一台机器上打开浏览器，在地址栏输入 `vscode.example.com`（将 example.com 替换为你自己的域名）并输入密码，就可以愉快地敲代码了。

![s:1680x1010 code-server](/blog/code-server-on-termux/img/code-server.webp)

## 注意事项

### 扩展

这里贴上官网的[警告](https://coder.com/docs/code-server/latest/termux#many-extensions-including-language-packs-fail-to-install)

> Note that Android and Linux are not 100% compatible, so use these workarounds at your own risk. Extensions that have native dependencies ther than Node or that directly interact with the OS might cause issues.

这句话的意思是：上面强制让 code-server 认为它现在在 Linux 平台上跑的行为可能会出惹出一些问题：直接调用操作系统接口/包含二进制可执行文件的扩展可能无法正常运行，因为 Android 和 Linux 不完全兼容，出了问题你负责。

还有，code-server 的扩展由 [Open VSX Registry](https://open-vsx.org/) 提供，但是一些扩展在这并没有上架，这时可以在 [Visual Studio Marketplace](https://marketplace.visualstudio.com/) 上面找到需要的扩展，然后点击右侧的“Download Extension”。下载后将扩展文件拽到右侧的资源管理器，再点击右键 > 安装扩展 VSIX。

顺便推荐一些我正在用的扩展：

-   <spoiler><del>厚着脸皮给自己打广告</del> 4399 on VSCode：在 VSCode 上玩 4399 小游戏</spoiler>
-   Code Spell Checker：检查代码里的拼写错误，并给出修改建议
-   Comment Translate：翻译代码里的注释，支持替换需要翻译的文字
-   ESLint：规范代码风格
-   Gitmoji：快速在 Git 提交信息里插入 Emoji 表情
-   Path Intellisense：快速补全路径
-   Prettier：更漂亮的代码格式化工具
