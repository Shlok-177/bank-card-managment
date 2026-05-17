export type InternalField =
  | "month"
  | "dsa"
  | "applicationNo"
  | "customerName"
  | "cardType"
  | "bank"
  | "userName"
  | "dseName"
  | "payout96"
  | "given";

export type ColumnMappingDefinition = {
  internalField: InternalField;
  aliases: string[];
  required: boolean;
};

export type ParsedApplicationRow = {
  rowNumber: number;
  month: string;
  dsa?: string;
  applicationNo: string;
  customerName: string;
  cardType?: string;
  bank: string;
  userName?: string;
  dseName?: string;
  payout96: number;
  given: number;
  difference: number;
  rawData: Record<string, unknown>;
};

export type UploadValidationResult = {
  headers: string[];
  mapping: Record<InternalField, string | null>;
  totalRows: number;
  validRows: ParsedApplicationRow[];
  errors: Array<{ rowNumber: number; field?: string; message: string }>;
  duplicateApplicationNos: string[];
  existingMonth?: {
    month: string;
    activeRecords: number;
    nextVersion: number;
  };
};

export type ReportFilters = {
  month?: string;
  bank?: string;
  dseName?: string;
  cardType?: string;
  userName?: string;
};

export type ReportRow = {
  label: string;
  totalApplications: number;
  totalPayout: number;
  totalGiven: number;
  totalProfit: number;
  penaltyAmount: number;
  finalProfit: number;
  penaltyReasons?: string[];
};

export type UploadImportMode = "NEW" | "REPLACE" | "MERGE";

export type EditableApplicationInput = {
  dsa?: string;
  applicationNo?: string;
  customerName?: string;
  cardType?: string;
  bank?: string;
  userName?: string;
  dseName?: string;
  payout96?: number;
  given?: number;
};
