# RecoverAI Frontend — Ready-to-Implement Foundation

This package replaces the current Gemini-generated frontend foundation with a typed, internally consistent mock-data architecture.

## Install / verify

From `recover-ai/frontend`:

```powershell
npm.cmd install
npm.cmd run dev
```

If Recharts/Lucide are not installed:

```powershell
npm.cmd install recharts lucide-react
```

Then verify:

```powershell
npm.cmd run lint
npm.cmd run build
```

## Files

Copy the contents of this package into the corresponding `frontend/` paths.

This package intentionally does NOT implement FastAPI, PostgreSQL, Razorpay, or real AI calls.

## Important

Do not commit until the app has been run and lint/build pass.
