#!/bin/bash
set -e

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ssl_dir="$repo_root/.ssl"
port=443
cert="$ssl_dir/server.crt"
key="$ssl_dir/server.key"

# 检查命令
missing=()
for cmd in caddy openssl setcap getcap; do
    command -v "$cmd" >/dev/null 2>&1 || missing+=("$cmd")
done
if ((${#missing[@]})); then
    echo "错误：缺少以下命令，请先安装：" >&2
    for cmd in "${missing[@]}"; do
        case $cmd in
        caddy) echo "  $cmd  （sudo apt install caddy）" >&2 ;;
        setcap | getcap) echo "  $cmd  （sudo apt install libcap2-bin）" >&2 ;;
        *) echo "  $cmd  （请通过你的包管理器安装）" >&2 ;;
        esac
    done
    exit 1
fi

# 生成证书（检查是否存在且非空）
if [[ ! -s $cert || ! -s $key ]]; then
    echo "生成自签名证书 ..."
    mkdir -p "$ssl_dir"
    openssl req -x509 -nodes -newkey rsa:2048 -days 3650 \
        -keyout "$key" -out "$cert" \
        -subj "/C=CN/ST=Local/L=Local/O=Dev/CN=localhost" \
        -addext "subjectAltName=DNS:localhost,DNS:dev.dsy4567.icu,IP:127.0.0.1"
fi

# caddy 是 Go 程序, 不做 libc 的 socket 封装, authbind 的 LD_PRELOAD 对它无效,
# 只能给二进制授予 CAP_NET_BIND_SERVICE, 才能以普通用户身份监听 $port
caddy_real="$(readlink -f "$(command -v caddy)")"
if ! getcap "$caddy_real" 2>/dev/null | grep -q cap_net_bind_service; then
    echo "为 $caddy_real 授予绑定 $port 端口的权限 ..."
    sudo setcap cap_net_bind_service=+ep "$caddy_real"
fi

export SITE_ROOT="$repo_root"
export SSL_CERT_FILE="$cert"
export SSL_KEY_FILE="$key"

# 启动服务器
cd "$repo_root"
exec caddy run --config tools/Caddyfile --adapter caddyfile
