#!/bin/bash
# Hermes Media Studio - 卸载脚本

set -e

echo "=== Hermes Media Studio 卸载 ==="
echo ""

WORKSPACE_ROOT="${HERMES_WORKSPACE:-./media-studio}"

if [ -d "$WORKSPACE_ROOT" ]; then
    echo "警告: 这将删除 Workspace 目录: $WORKSPACE_ROOT"
    echo "所有素材数据将被永久删除!"
    read -p "确定继续? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$WORKSPACE_ROOT"
        echo "✓ Workspace 已删除"
    else
        echo "取消卸载"
        exit 0
    fi
else
    echo "Workspace 目录不存在"
fi

echo "✓ 卸载完成"
echo ""
echo "请手动移除 Hermes WebUI 中的扩展配置。"
