# Release 22 calculation QA

All scenarios below were checked against known-answer arithmetic and the calculation paths used by the suite. The full regression run completed with all 19 test files passing.

## Income scenarios

| Scenario | Inputs | Verified result |
|---|---|---:|
| Salaried | $120,000 annual | $10,000.00/month |
| Hourly | $35 × 40 hours × 52 ÷ 12 | $6,066.67/month |
| Biweekly | $2,800 × 26 ÷ 12 | $6,066.67/month |
| Schedule C, stable | Adjusted years $101,400 and $94,000 | $8,141.67/month, two-year average |
| Schedule C, declining | Recent $72,000; prior $96,000 | $6,000.00/month, recent year used |
| Lease rental | $3,000 × 75%, less $1,700 PITIA | $2,250.00 gross / $550.00 net |
| Schedule E | Adjusted gross $21,400/year, less $2,100 PITIA | $1,783.33 gross / −$316.67 net |
| DTI | $10,000 income, $3,000 housing, $1,000 debts | 30.00% front / 40.00% back |

## Loan-suite scenarios

| Scenario | Inputs | Verified result |
|---|---|---:|
| FHA 203(k), master case | $500,000 price/value, $115,963.75 rehab, $650,000 ARV, 3.5% down | C3 $615,963.75; base $594,405.02; UFMIP $10,402.09; total $604,807.11 |
| FHA 203(k), low ARV | $500,000 price/value, $100,000 rehab, $500,000 ARV | C3 capped at $550,000; base $530,750.00; total $540,038.13 |
| HomeStyle | $500,000 price, $100,000 rehab, $600,000 ARV, 5% down | $570,000.00 base loan at 95% as-completed cap |
| Conventional | $500,000 price/value, 20% down | $400,000.00 loan |
| PMI | $450,000 base loan, 0.50% annual PMI | $187.50/month |
| Amortization | $400,000 at 6.50% for 30 years | $2,528.27 P&I; $2,166.67 first interest; $0 ending balance |
| Escrow | $12,000 taxes + $2,400 insurance | $1,200.00 monthly deposit; $2,400.00 two-month cushion |

## Input and regression checks

- `$500k` normalizes to `500000`.
- Invalid number text fails validation instead of silently becoming a loan value.
- Loan Estimate A–J totals, freeform dates, credit-report rules, scenario comparison, themes, P&L, document actions, and prior release functionality remain covered by the complete regression run.

