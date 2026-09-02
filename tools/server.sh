#!/bin/bash
set -e

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ssl_dir="$repo_root/.ssl"
port=443
cert="$ssl_dir/server.crt"
key="$ssl_dir/server.key"

# 检查命令
missing=()
for cmd in authbind http-server openssl; do
    command -v "$cmd" >/dev/null 2>&1 || missing+=("$cmd")
done
if ((${#missing[@]})); then
    echo "错误：缺少以下命令，请先安装：" >&2
    for cmd in "${missing[@]}"; do
        case $cmd in
        http-server) echo "  $cmd  （npm install -g http-server）" >&2 ;;
        *) echo "  $cmd  （请通过你的包管理器安装）" >&2 ;;
        esac
    done
    exit 1
fi

# authbind 配置（Linux 特有）
current_user="$(id -un)"
port_file="/etc/authbind/byport/$port"

if [[ ! -e $port_file ]]; then
    echo "authbind 未配置 $port 端口，正在创建 $port_file ..."
    sudo mkdir -p /etc/authbind/byport
    sudo touch "$port_file"
fi

# 获取文件属主（兼容 GNU 和 BSD）
if stat -c '%U' /dev/null >/dev/null 2>&1; then
    owner="$(stat -c '%U' "$port_file")"
else
    owner="$(stat -f '%Su' "$port_file")"
fi

if [[ $owner != "$current_user" || ! -x $port_file ]]; then
    echo "修正 $port_file 的属主与权限 ..."
    sudo chown "$current_user" "$port_file"
    sudo chmod 700 "$port_file"   # 更安全的权限
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

# 启动服务器（仅监听本地回环地址）
cd "$repo_root"
authbind --deep http-server -a 127.0.0.1 -p "$port" -c-1 -S -C "$cert" -K "$key"
