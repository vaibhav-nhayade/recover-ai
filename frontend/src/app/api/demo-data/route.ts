import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (char === "," && !quoted) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function parseCsv<T extends Record<string, string>>(text: string): T[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) return [];

  const headers = parseCsvLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return headers.reduce((row, header, index) => {
      row[header] = values[index] ?? "";
      return row;
    }, {} as T);
  });
}

async function readDataFile(fileName: string): Promise<string> {
  const candidates = [
    path.resolve(process.cwd(), "..", "data", fileName),
    path.resolve(process.cwd(), "data", fileName),
    path.resolve(process.cwd(), "..", "..", "data", fileName),
  ];

  for (const candidate of candidates) {
    try {
      return await fs.readFile(candidate, "utf8");
    } catch {
      // Try the next project-root candidate.
    }
  }

  throw new Error(`Demo data file not found: ${fileName}`);
}

export async function GET() {
  try {
    const [transactionsText, scenariosText] = await Promise.all([
      readDataFile("demo_transactions.csv"),
      readDataFile("demo_recovery_scenarios.csv"),
    ]);

    const transactions = parseCsv(transactionsText).map((row) => ({
      transaction_reference: row.transaction_reference,
      customer_id: row.customer_id,
      customer_name: row.customer_name,
      customer_email: row.customer_email,
      amount: Number(row.amount),
      currency: row.currency,
      payment_method: row.payment_method,
      status: row.status,
      failure_reason: row.failure_reason,
      transaction_attempts: Number(row.transaction_attempts),
      customer_successful_transactions: Number(
        row.customer_successful_transactions,
      ),
      customer_failed_transactions: Number(
        row.customer_failed_transactions,
      ),
      occurred_at: row.occurred_at,
    }));

    const scenarios = parseCsv(scenariosText).map((row) => ({
      case_id: row.case_id,
      transaction_reference: row.transaction_reference,
      recovery_type: row.recovery_type,
      priority: row.priority,
      amount_at_risk: Number(row.amount_at_risk),
      recovery_probability: Number(row.recovery_probability),
      recommended_strategy: row.recommended_strategy,
      expected_recovery: Number(row.expected_recovery),
      escalation_required: row.escalation_required.toLowerCase() === "true",
      scenario: row.scenario,
    }));

    return NextResponse.json(
      { transactions, scenarios },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        transactions: [],
        scenarios: [],
        error: error instanceof Error ? error.message : "Unable to load demo data",
      },
      { status: 500 },
    );
  }
}
