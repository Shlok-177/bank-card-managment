export type FormulaContext = {
  payout96: number;
  given: number;
  bank?: string;
  cardType?: string;
};

export function calculateDifference(context: FormulaContext, formula?: { expression?: string }) {
  const expression = formula?.expression ?? "payout96 - given";

  if (expression === "payout96 - given") {
    return roundMoney(context.payout96 - context.given);
  }

  if (expression === "given - payout96") {
    return roundMoney(context.given - context.payout96);
  }

  // Keep formula support intentionally constrained to avoid arbitrary code execution.
  const percentageMatch = expression.match(/^payout96\s*\*\s*(0?\.\d+)\s*-\s*given$/);
  if (percentageMatch) {
    return roundMoney(context.payout96 * Number(percentageMatch[1]) - context.given);
  }

  return roundMoney(context.payout96 - context.given);
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
