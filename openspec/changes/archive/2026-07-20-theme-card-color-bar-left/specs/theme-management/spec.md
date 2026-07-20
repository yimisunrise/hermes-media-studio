## MODIFIED Requirements

### Requirement: User can view all themes

The system SHALL display all themes in a list/card view, sorted by creation time descending.
Each theme card SHALL show name, description, tags, color swatch（左侧垂直色条）, and created time.

**变更说明**: 主题色标识从卡片顶部水平色条改为左侧垂直边框（`border-left`），与看板卡片视觉模式一致。功能不变，仅视觉呈现位置调整。

#### Scenario: View theme list with data
- **WHEN** user navigates to ThemeStrategy view and there are existing themes
- **THEN** the system displays all themes as cards showing name, description, tags, color（左侧垂直色条）, createdAt

#### Scenario: View theme list with no data
- **WHEN** user navigates to ThemeStrategy view and there are no themes
- **THEN** the system shows an empty state message and a button to create the first theme
