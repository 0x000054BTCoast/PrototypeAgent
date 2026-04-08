# Data Model Draft（基于 PRD：Analytics Workspace）

> 目标：从 PRD 中提取实体字段、表单字段、表格列、指标口径，形成可用于后续建模与实现的草案。

## 0) 来源与说明
- PRD 来源：`input/prd.md`
- 目前 PRD 信息较简略，以下草案包含：
  - **直接提取**（PRD 明确出现）
  - **合理推断**（为满足页面能力所需的最小字段）
- 每个字段均提供：**类型**与**来源注释（source）**。

---

## 1) 实体字段（Entities）

### 1.1 `kpi_snapshot`（KPI 汇总快照）
用于 Header 区域的 KPI summary 卡片。

| 字段名 | 类型 | 来源注释（source） |
|---|---|---|
| `id` | `string` | 推断：快照主键，工程实现必需（PRD 未显式） |
| `workspace_id` | `string` | 推断：Analytics Workspace 作用域标识 |
| `snapshot_time` | `datetime` | 直接提取：Footer 提到“Last synced timestamp”，KPI 常与同步时点绑定 |
| `kpi_name` | `string` | 直接提取：Header 中“Card: KPI summary” |
| `kpi_value` | `number` | 直接提取：KPI summary 需展示数值 |
| `kpi_unit` | `string` | 推断：金额/百分比/个数等单位 |
| `kpi_trend` | `number` | 推断：KPI summary 常含环比/同比变化值 |
| `kpi_trend_period` | `enum<'MoM'|'YoY'|'WoW'|'custom'>` | 推断：变化值口径周期 |
| `updated_at` | `datetime` | 推断：审计字段 |

### 1.2 `report`（报表）
用于“Create report”操作后的报表对象。

| 字段名 | 类型 | 来源注释（source） |
|---|---|---|
| `report_id` | `string` | 直接提取 + 推断：“Button: Create report”触发创建实体 |
| `workspace_id` | `string` | 推断：报表属于某个 workspace |
| `report_name` | `string` | 推断：创建报表最小必要字段 |
| `description` | `string?` | 推断：可选描述 |
| `owner_user_id` | `string` | 推断：报表归属 |
| `created_at` | `datetime` | 推断：创建时间 |
| `updated_at` | `datetime` | 推断：更新时间 |
| `status` | `enum<'draft'|'published'|'archived'>` | 推断：常见报表生命周期 |

### 1.3 `revenue_monthly`（月度营收）
用于 Main Dashboard 的“Revenue by month”图表。

| 字段名 | 类型 | 来源注释（source） |
|---|---|---|
| `id` | `string` | 推断：记录主键 |
| `workspace_id` | `string` | 推断：数据作用域 |
| `month` | `date` | 直接提取：Chart: Revenue by month |
| `revenue_amount` | `decimal(18,2)` | 直接提取：Revenue 数值 |
| `currency` | `string` | 推断：营收通常需币种 |
| `recognized_rule` | `string?` | 推断：营收确认规则备注（口径追踪） |
| `ingested_at` | `datetime` | 推断：数据入仓时间 |

### 1.4 `customer`（客户主数据）
为“Top customers”表提供客户维度。

| 字段名 | 类型 | 来源注释（source） |
|---|---|---|
| `customer_id` | `string` | 直接提取 + 推断：Top customers 需客户标识 |
| `customer_name` | `string` | 直接提取 + 推断：表格展示核心字段 |
| `segment` | `string?` | 推断：客户分层常见维度 |
| `region` | `string?` | 推断：地域分析常见维度 |
| `created_at` | `datetime` | 推断：审计字段 |

### 1.5 `customer_revenue_agg`（客户营收聚合）
服务“Top customers”排序与贡献度计算。

| 字段名 | 类型 | 来源注释（source） |
|---|---|---|
| `id` | `string` | 推断：聚合记录主键 |
| `workspace_id` | `string` | 推断：数据作用域 |
| `customer_id` | `string` | 直接提取 + 推断：关联 customer |
| `period_start` | `date` | 推断：Top customers 需统计周期 |
| `period_end` | `date` | 推断：Top customers 需统计周期 |
| `revenue_amount` | `decimal(18,2)` | 直接提取：Top customers 与 Revenue 场景强相关 |
| `order_count` | `int` | 推断：客户价值辅助指标 |
| `revenue_rank` | `int` | 直接提取 + 推断：Top customers “Top”需要排名 |
| `revenue_share_pct` | `decimal(5,2)` | 推断：贡献占比常用于 Top 客户表 |
| `calculated_at` | `datetime` | 推断：聚合计算时间 |

### 1.6 `alert_event`（告警事件）
用于 Main Dashboard 的 Alerts 卡片。

| 字段名 | 类型 | 来源注释（source） |
|---|---|---|
| `alert_id` | `string` | 直接提取 + 推断：Card: Alerts |
| `workspace_id` | `string` | 推断：作用域 |
| `alert_type` | `enum<'threshold_breach'|'anomaly'|'sync_failure'|'system'>` | 推断：常见告警类型 |
| `severity` | `enum<'low'|'medium'|'high'|'critical'>` | 推断：告警等级 |
| `title` | `string` | 推断：卡片可读标题 |
| `message` | `string` | 推断：告警详情 |
| `status` | `enum<'open'|'acknowledged'|'resolved'>` | 推断：处理状态 |
| `triggered_at` | `datetime` | 直接提取关联：与“Last synced timestamp”共同构成时序展示 |
| `resolved_at` | `datetime?` | 推断：关闭时间 |

### 1.7 `sync_status`（同步状态）
用于 Footer 的“Last synced timestamp”。

| 字段名 | 类型 | 来源注释（source） |
|---|---|---|
| `workspace_id` | `string` | 推断：每个 workspace 一条当前同步状态 |
| `last_synced_at` | `datetime` | 直接提取：Footer - Last synced timestamp |
| `sync_state` | `enum<'success'|'running'|'failed'>` | 推断：同步状态展示 |
| `source_system` | `string?` | 推断：数据来源系统标识 |
| `updated_at` | `datetime` | 推断：审计字段 |

---

## 2) 表单字段（Form Fields）

> PRD 未显式给出完整表单，仅出现 “Create report” 按钮。以下为创建报表的最小表单草案。

### 2.1 `create_report_form`

| 字段名 | 类型 | 必填 | 来源注释（source） |
|---|---|---|---|
| `report_name` | `string` | 是 | 直接提取 + 推断：Create report 的最小输入 |
| `description` | `string` | 否 | 推断：可选说明 |
| `time_range_start` | `date` | 是 | 推断：报表通常需统计时间范围 |
| `time_range_end` | `date` | 是 | 推断：报表通常需统计时间范围 |
| `metric_ids` | `string[]` | 是 | 推断：报表需选择指标 |
| `group_by` | `enum[]` | 否 | 推断：报表维度下钻（如 month/customer/region） |
| `filters` | `json` | 否 | 推断：通用过滤条件 |
| `visibility` | `enum<'private'|'team'|'org'>` | 否 | 推断：报表权限常见字段 |

---

## 3) 表格列（Table Columns）

### 3.1 `top_customers_table`
对应 PRD：Main Dashboard - Table: Top customers。

| 列名 | 字段映射 | 类型 | 来源注释（source） |
|---|---|---|---|
| `Rank` | `customer_revenue_agg.revenue_rank` | `int` | 直接提取 + 推断：Top 语义对应排名 |
| `Customer` | `customer.customer_name` | `string` | 直接提取：Top customers |
| `Revenue` | `customer_revenue_agg.revenue_amount` | `decimal(18,2)` | 直接提取：与 Revenue 场景一致 |
| `Share %` | `customer_revenue_agg.revenue_share_pct` | `decimal(5,2)` | 推断：Top 客户贡献度常见列 |
| `Orders` | `customer_revenue_agg.order_count` | `int` | 推断：常见业务补充指标 |
| `Segment` | `customer.segment` | `string?` | 推断：分析维度 |
| `Region` | `customer.region` | `string?` | 推断：分析维度 |

---

## 4) 指标口径（Metric Definitions）

### 4.1 `monthly_revenue`
- **指标名**：月度营收（Revenue by month）
- **类型**：`decimal(18,2)`
- **粒度**：month
- **口径公式**：`SUM(revenue_amount)`（按 `month` 聚合）
- **维度**：`month`, `currency`, `workspace_id`
- **来源注释（source）**：直接提取自 PRD “Chart: Revenue by month”

### 4.2 `top_customers_revenue`
- **指标名**：Top 客户营收
- **类型**：`decimal(18,2)`
- **粒度**：customer × period
- **口径公式**：统计周期内 `SUM(revenue_amount)`，并按降序计算 `revenue_rank`
- **维度**：`customer_id`, `period_start`, `period_end`, `workspace_id`
- **来源注释（source）**：直接提取自 PRD “Table: Top customers”

### 4.3 `top_customers_revenue_share_pct`
- **指标名**：Top 客户营收占比
- **类型**：`decimal(5,2)`
- **粒度**：customer × period
- **口径公式**：`customer_revenue_amount / SUM(customer_revenue_amount in period) * 100`
- **维度**：`customer_id`, `period_start`, `period_end`, `workspace_id`
- **来源注释（source）**：由 Top customers 展示需求推断

### 4.4 `open_alert_count`
- **指标名**：未关闭告警数
- **类型**：`int`
- **粒度**：workspace
- **口径公式**：`COUNT(alert_id WHERE status IN ('open','acknowledged'))`
- **维度**：`severity`, `alert_type`, `workspace_id`
- **来源注释（source）**：直接提取自 PRD “Card: Alerts”

### 4.5 `last_synced_latency_min`
- **指标名**：距离最近同步分钟数
- **类型**：`int`
- **粒度**：workspace
- **口径公式**：`TIMESTAMP_DIFF(now, last_synced_at, MINUTE)`
- **维度**：`workspace_id`
- **来源注释（source）**：直接提取自 PRD “Last synced timestamp”

---

## 5) 关系草图（ER 简版）
- `workspace` 1 - n `kpi_snapshot`
- `workspace` 1 - n `report`
- `workspace` 1 - n `revenue_monthly`
- `workspace` 1 - n `alert_event`
- `workspace` 1 - 1 `sync_status`
- `customer` 1 - n `customer_revenue_agg`
- `workspace` 1 - n `customer_revenue_agg`

---

## 6) 待产品确认（建议）
1. KPI summary 具体包含哪些 KPI（营收、增速、客单价等）？
2. Top customers 的统计周期（本月/近30天/自定义）与 Top N（5/10/20）默认值。
3. Revenue 的币种是否单币种，是否需要汇率换算。
4. Alerts 卡片是否仅展示计数，还是要展示最近告警列表。
5. Create report 是否需要保存筛选器模板与权限控制。
