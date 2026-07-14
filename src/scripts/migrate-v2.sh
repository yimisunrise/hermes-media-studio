#!/bin/bash
# ───────────────────────────────────────────────────────
# Hermes Media Studio — v2 Workspace Migration
# Creates .system/ and .database/ skeleton directories
# under <workspace>/media-studio/
#
# Usage: ./migrate-v2.sh [workspace_root]
#   If omitted, reads HERMES_WORKSPACE env var
# ───────────────────────────────────────────────────────
set -euo pipefail

# ── Resolve workspace root ──────────────────────────
WORKSPACE="${1:-${HERMES_WORKSPACE:-}}"
if [ -z "$WORKSPACE" ]; then
  echo "Usage: $0 <workspace_root>"
  echo "  or set HERMES_WORKSPACE environment variable"
  exit 1
fi

MEDIA_STUDIO="${WORKSPACE}/media-studio"

# ── Create .system/ skeleton ────────────────────────
echo "Creating .system/ skeleton..."
mkdir -p "${MEDIA_STUDIO}/.system"

# Write initial boot.json
cat > "${MEDIA_STUDIO}/.system/boot.json" << 'BOOTEOF'
{
  "boot_id": "",
  "init_state": "pending",
  "created_at": "",
  "updated_at": "",
  "version": "2.0.0"
}
BOOTEOF
echo "  ✓ .system/boot.json created"

# ── Create .database/ skeleton ──────────────────────
echo "Creating .database/ skeleton..."
mkdir -p "${MEDIA_STUDIO}/.database"

# Write initial db.json (empty database registry)
cat > "${MEDIA_STUDIO}/.database/db.json" << 'DBEOF'
{
  "databases": []
}
DBEOF
echo "  ✓ .database/db.json created"

# ── Create system database + table ──────────────────
SYSTEM_DB="${MEDIA_STUDIO}/.database/system"
mkdir -p "${SYSTEM_DB}"

# system db.json
cat > "${SYSTEM_DB}/db.json" << 'SDBEOF'
{
  "id": "system",
  "label": "系统库",
  "created_at": ""
}
SDBEOF

# system.database table
mkdir -p "${SYSTEM_DB}/database"
cat > "${SYSTEM_DB}/database/schema.json" << 'SCHEMA1EOF'
{
  "id": "database",
  "label": "数据库注册表",
  "fields": [
    { "id": "id", "type": "string", "label": "标识", "required": true },
    { "id": "label", "type": "string", "label": "名称" },
    { "id": "createdAt", "type": "datetime", "label": "创建时间", "autoSet": "created" }
  ],
  "displayField": "label",
  "shard": { "type": "none" }
}
SCHEMA1EOF
echo "  ✓ system.database table schema created"

# system.database data.json (empty)
cat > "${SYSTEM_DB}/database/data.json" << 'DATA1EOF'
{
  "records": []
}
DATA1EOF

# system.table table
mkdir -p "${SYSTEM_DB}/table"
cat > "${SYSTEM_DB}/table/schema.json" << 'SCHEMA2EOF'
{
  "id": "table",
  "label": "表注册表",
  "fields": [
    { "id": "id", "type": "string", "label": "标识", "required": true },
    { "id": "database", "type": "string", "label": "所属库", "required": true },
    { "id": "label", "type": "string", "label": "名称" },
    { "id": "shardType", "type": "string", "label": "分片类型", "defaultValue": "none" },
    { "id": "createdAt", "type": "datetime", "label": "创建时间", "autoSet": "created" }
  ],
  "displayField": "label",
  "shard": { "type": "none" }
}
SCHEMA2EOF
echo "  ✓ system.table table schema created"

# system.table data.json (empty)
cat > "${SYSTEM_DB}/table/data.json" << 'DATA2EOF'
{
  "records": []
}
DATA2EOF

# ── Create .files/ skeleton (for FileScanner) ───────
mkdir -p "${MEDIA_STUDIO}/.files"
cat > "${MEDIA_STUDIO}/.files/manifest.json" << 'FILESEOF'
{
  "shards": [],
  "lastScan": null
}
FILESEOF
echo "  ✓ .files/ skeleton created"

# ── Create .agent/ skeleton (for AgentTaskPoller) ───
mkdir -p "${MEDIA_STUDIO}/.agent/tasks"
mkdir -p "${MEDIA_STUDIO}/.agent/processing"
mkdir -p "${MEDIA_STUDIO}/.agent/results"
echo "  ✓ .agent/ skeleton created"

# ── Summary ──────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════"
echo " v2 workspace migration complete!"
echo "   Location: ${MEDIA_STUDIO}"
echo "═══════════════════════════════════════════════"
echo ""
echo "Run the following to verify:"
echo "  find ${MEDIA_STUDIO}/.system -type f"
echo "  find ${MEDIA_STUDIO}/.database -type f"
echo "  find ${MEDIA_STUDIO}/.files -type f"
echo "  find ${MEDIA_STUDIO}/.agent -type d"
