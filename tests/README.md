# RecoverAI Tests

The test suite validates the most important deterministic components
of the RecoverAI system.

## Current Test Areas

### Data Contract

Validates:

- demo transaction structure
- required transaction fields
- valid payment methods
- valid transaction states
- positive transaction amounts

### Feature Engineering

Validates:

- feature generation
- expected feature columns
- numerical output
- payment-method encoding
- failure-reason signals
- amount transformation

### Recovery Model

Validates:

- model training
- probability generation
- probability bounds
- classification output
- feature importance
- evaluation metrics

## Running Tests

From the repository root:

```powershell
pytest
