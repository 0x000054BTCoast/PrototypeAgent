# Parser Evaluation Report

Generated at: 2026-04-08T08:47:39.838Z

## Summary

| Scope | Precision | Recall | F1 | TP | FP | FN |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Micro | 1.0000 | 0.2941 | 0.4545 | 5 | 0 | 12 |
| Macro | 1.0000 | 0.3167 | 0.4733 | - | - | - |

## Per-sample Metrics

| Sample | Precision | Recall | F1 | Expected | Predicted | TP | FP | FN |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| sample-01-dashboard | 1.0000 | 0.2500 | 0.4000 | 4 | 1 | 1 | 0 | 3 |
| sample-02-login | 1.0000 | 0.2500 | 0.4000 | 4 | 1 | 1 | 0 | 3 |
| sample-03-profile | 1.0000 | 0.2500 | 0.4000 | 4 | 1 | 1 | 0 | 3 |
| sample-04-table | 1.0000 | 0.5000 | 0.6667 | 2 | 1 | 1 | 0 | 1 |
| sample-05-settings | 1.0000 | 0.3333 | 0.5000 | 3 | 1 | 1 | 0 | 2 |

## Confusion Matrix (Expected × Predicted)

Labels: __missing__, button, card, chart, image, input, pagination, switch, table, text

| Expected \ Predicted | __missing__ | button | card | chart | image | input | pagination | switch | table | text |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| __missing__ | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| button | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| card | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| chart | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| image | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| input | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| pagination | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| switch | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| table | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 |
| text | 3 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |

> Notes: `__missing__` means expected component not produced; `__spurious__` means extra predicted component.
