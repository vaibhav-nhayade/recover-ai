# RecoverAI Frontend

Merchant-facing web application for monitoring revenue at risk, investigating recovery cases, operating the autonomous recovery agent, and reviewing recovery analytics and audit history.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Recharts
- Lucide React

## Routes

```text
/
├── login
├── register
└── authenticated
    ├── dashboard
    ├── recovery
    │   └── [caseId]
    ├── transactions
    ├── agent
    ├── analytics
    ├── audit
    ├── reports
    └── settings
