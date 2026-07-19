## ADDED Requirements

### Requirement: 日历月视图

系统 SHALL 提供发布排期的日历月视图。
系统 SHALL 按月展示排期，默认展示当前月。
用户 SHALL 能切换上一个月和下一个月的视图。
日历 SHALL 使用预定义的 `.ms-calendar-*` CSS 样式。

#### Scenario: 查看本月排期

- **WHEN** 用户进入 PublishCalendar 视图
- **THEN** 系统展示当前月份的日历，包含所有已排期的发布条目

#### Scenario: 切换月份

- **WHEN** 用户点击日历导航的上月或下月按钮
- **THEN** 系统加载并展示对应月份的排期数据

### Requirement: 日历排期条目展示

系统 SHALL 在日历的每个日期单元格中展示当天的排期条目。
每个排期条目 SHALL 显示发布包标题和平台名称。
不同状态（pending / completed / failed）的条目 SHALL 有不同的视觉样式。

#### Scenario: 日期中有排期

- **WHEN** 某日期有一个或多个排期
- **THEN** 日历单元格展示排期条目列表
- **THEN** 待发布的条目显示为"待发布"样式
- **THEN** 已完成的条目显示为"已完成"样式
- **THEN** 失败的条目显示为"失败"样式

### Requirement: 从日历进入发布详情

用户 SHALL 能点击日历中的排期条目跳转到对应的发布包详情。

#### Scenario: 点击排期条目

- **WHEN** 用户点击日历中的某个排期条目
- **THEN** 系统跳转到 PublishManager 视图并定位到对应的发布包
