#!/bin/bash
# Hermes Media Studio - 安装脚本
# 在 Hermes WebUI Workspace 中创建必要的目录结构

set -e

echo "=== Hermes Media Studio 安装 ==="
echo ""

WORKSPACE_ROOT="${HERMES_WORKSPACE:-./media-studio}"

# 创建目录结构
echo "创建 Workspace 目录结构..."
mkdir -p "$WORKSPACE_ROOT"/{themes,platforms,workflows}

# 创建 .gitkeep 文件
find "$WORKSPACE_ROOT" -type d -empty -exec touch {}/.gitkeep \;

echo "✓ 目录结构已创建: $WORKSPACE_ROOT"
echo ""

# 环境变量提示
echo "=== 环境变量配置 ==="
echo ""
echo "请将以下环境变量添加到您的 Hermes WebUI 配置中:"
echo ""
echo "  export HERMES_WORKSPACE=\"$WORKSPACE_ROOT\""
echo ""
echo "或者将 Media Studio 扩展添加到 WebUI 的扩展配置中:"
echo ""
echo "  # 在 webui 配置中设置扩展目录"
echo ""
echo "=== 安装完成 ==="
echo ""
echo "启动 Hermes WebUI 后，通过 hash 路由访问:"
echo "  #kanban  - 看板视图"
echo "  #review  - 审核视图"
echo "  #calendar - 日历视图"
echo "  #dashboard - 数据看板"
echo "  #package-editor - 发布包编辑器"
