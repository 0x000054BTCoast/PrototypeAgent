# Schema Task DAG

- Source: `fixtures/schema-references/sample-01-dashboard.json`
- Generated: 2026-04-08T08:54:17.887Z

```mermaid
flowchart LR
  stage_tokens([tokens]) --> stage_primitives([primitives]) --> stage_routes([routes]) --> stage_features([features]) --> stage_tests([tests])
  token_colorPrimary["token: colorPrimary"]
  stage_tokens --> token_colorPrimary
  token_radiusMd["token: radiusMd"]
  stage_tokens --> token_radiusMd
  token_spacingUnit["token: spacingUnit"]
  stage_tokens --> token_spacingUnit
  primitive_container["primitive: container"]
  stage_primitives --> primitive_container
  token_colorPrimary --> primitive_container
  token_radiusMd --> primitive_container
  token_spacingUnit --> primitive_container
  primitive_text["primitive: text"]
  stage_primitives --> primitive_text
  token_colorPrimary --> primitive_text
  token_radiusMd --> primitive_text
  token_spacingUnit --> primitive_text
  primitive_chart["primitive: chart"]
  stage_primitives --> primitive_chart
  token_colorPrimary --> primitive_chart
  token_radiusMd --> primitive_chart
  token_spacingUnit --> primitive_chart
  route_route_dashboard["route: dashboard (/dashboard)"]
  stage_routes --> route_route_dashboard
  feature_route_dashboard["feature: dashboard (/dashboard) feature"]
  stage_features --> feature_route_dashboard
  route_route_dashboard --> feature_route_dashboard
  primitive_container --> feature_route_dashboard
  primitive_chart --> feature_route_dashboard
  primitive_text --> feature_route_dashboard
  test_route_dashboard["test: e2e_route_dashboard (1 triggers)"]
  stage_tests --> test_route_dashboard
  feature_route_dashboard --> test_route_dashboard
```

## Summary

- tokens: 3
- primitives: 3
- routes: 1
- features: 1
- tests: 1
