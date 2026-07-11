#!/bin/bash
# Hermes Media Studio - 更新脚本

set -e

echo "=== Hermes Media Studio 更新 ==="
echo ""

EXTENSION_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [ -d "$EXTENSION_DIR/.git" ]; then
    echo "从 git 更新..."
    git -C "$EXTENSION_DIR" pull
    echo "✓ 更新完成"
else
    echo "不是 git 仓库，请手动更新扩展文件。"
fi

echo ""
echo "更新后请刷新 Hermes WebUI 页面。"
