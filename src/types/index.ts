// Types pour la réconciliation bancaire

export interface Invoice {
  ref: string;
  refClient: string;
  type: string;
  dateFacturation: string;
  dateEcheance: string;
  tiers: string;
  ville: string;
  codePostal: string;
  modeReglement: string;
  montantHT: number;
  montantTTC: number;
  etat: string;
  originalRow?: number;
}

export interface BankTransaction {
  numeroCompte: string;
  nomCompte: string;
  compteContrepartie: string;
  numeroMouvement: string;
  dateComptable: string;
  dateValeur: string;
  montant: number;
  devise: string;
  libelles: string;
  detailsMouvement: string;
  message: string;
  originalRow?: number;
}

export interface ReconciliationMatch {
  invoice: Invoice;
  bankTransaction: BankTransaction | null;
  matchType:
    | "EXACT_REF"
    | "EXACT_AMOUNT"
    | "REFINED_AMOUNT"
    | "FUZZY_NAME"
    | "COMBINED"
    | "NONE";
  confidence: number; // 0-100
  score: number;
  notes: string[];
  isManualMatch?: boolean;
  alternatives?: {
    transaction: BankTransaction;
    matchType: string;
    confidence: number;
    score: number;
  }[];
}

export interface ReconciliationResult {
  matches?: ReconciliationMatch[];
  statistics?: {
    totalInvoices: number;
    totalTransactions: number;
    exactMatches: number;
    fuzzyMatches: number;
    noMatches: number;
    multipleMatches?: number;
    totalMatchedAmount: number;
    totalUnmatchedAmount: number;
  };
  unmatchedTransactions?: BankTransaction[];
  // Nouvelles propriétés pour le backend simplifié
  summary?: {
    totalInvoices: number;
    totalTransactions: number;
    exactMatches: number;
    fuzzyMatches: number;
    noMatches: number;
    totalMatchedAmount: number;
    totalUnmatchedAmount: number;
    reconciliationRate: number;
  };
  downloadUrl?: string;
  fileName?: string;
  reconciliationId?: string;
}

export interface FileUploadData {
  invoices: Invoice[];
  transactions: BankTransaction[];
  errors: string[];
}

export type MatchConfidence = "HIGH" | "MEDIUM" | "LOW";

export interface ReconciliationSettings {
  amountTolerance: number; // Tolérance sur les montants (ex: 0.01)
  fuzzySearchThreshold: number; // Seuil pour la recherche floue (0-1)
  enableFuzzyMatching: boolean;
  enableAmountMatching: boolean;
  enableReferenceMatching: boolean;
  enableCombinedMatching: boolean;
}

// Nouveaux types pour le système de gestion des réconciliations

export interface ReconciliationSummary {
  id: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "ERROR";
  title?: string;
  startTime: string;
  endTime?: string;
  invoicesFileName: string;
  transactionsFileName: string;
  totalInvoices: number;
  totalTransactions: number;
  exactMatches: number;
  fuzzyMatches: number;
  noMatches: number;
  totalMatchedAmount: number;
  totalUnmatchedAmount: number;
  reconciliationRate: number;
  errorMessage?: string;
  createdAt: string;
}

export interface ReconciliationDetails {
  id: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "ERROR";
  title?: string;
  startTime: string;
  endTime?: string;
  invoicesFileName: string;
  transactionsFileName: string;
  totalInvoices: number;
  totalTransactions: number;
  exactMatches: number;
  fuzzyMatches: number;
  noMatches: number;
  totalMatchedAmount: number;
  totalUnmatchedAmount: number;
  reconciliationRate: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  invoices: DetailedInvoice[];
  transactions: DetailedBankTransaction[];
  matches: DetailedReconciliationMatch[];
}

export interface DetailedInvoice {
  id: string;
  ref?: string;
  refClient?: string;
  type?: string;
  dateFacturation?: string;
  dateEcheance?: string;
  tiers?: string;
  ville?: string;
  codePostal?: string;
  modeReglement?: string;
  montantHT: number;
  montantTTC: number;
  etat?: string;
  originalRow?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DetailedBankTransaction {
  id: string;
  numeroCompte?: string;
  nomCompte?: string;
  compteContrepartie?: string;
  numeroMouvement?: string;
  dateComptable?: string;
  dateValeur?: string;
  montant: number;
  devise?: string;
  libelles?: string;
  detailsMouvement?: string;
  message?: string;
  originalRow?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DetailedReconciliationMatch {
  id: string;
  invoiceId: string;
  transactionId?: string;
  matchType:
    | "EXACT_REF"
    | "EXACT_AMOUNT"
    | "REFINED_AMOUNT"
    | "SIMPLE_NAME"
    | "FUZZY_NAME"
    | "COMBINED"
    | "NONE";
  confidence: number;
  score: number;
  notes: string[];
  isManualMatch: boolean;
  validationStatus: "PENDING" | "VALIDATED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
}

// === NOUVELLES API POUR MODIFICATION DES CORRESPONDANCES ===

export interface MatchSuggestion {
  transaction: DetailedBankTransaction;
  matchType:
    | "EXACT_REF"
    | "EXACT_AMOUNT"
    | "REFINED_AMOUNT"
    | "SIMPLE_NAME"
    | "FUZZY_NAME"
    | "COMBINED"
    | "NONE";
  confidence: number;
  score: number;
}

export interface MatchResolution {
  matchId: string;
  transactionId?: string;
  action: "keep" | "remove";
}

export interface MatchUpdateRequest {
  transactionId?: string;
  notes?: string[];
  isManualMatch?: boolean;
  validationStatus?: "PENDING" | "VALIDATED" | "REJECTED";
}

export interface MatchValidationRequest {
  action: "validate" | "reject";
  notes?: string[];
}

export interface MatchCreateRequest {
  invoiceId: string;
  transactionId?: string;
  matchType?:
    | "EXACT_REF"
    | "EXACT_AMOUNT"
    | "REFINED_AMOUNT"
    | "SIMPLE_NAME"
    | "FUZZY_NAME"
    | "COMBINED"
    | "NONE";
  notes?: string[];
}

export interface MultipleResolutionRequest {
  resolutions: MatchResolution[];
}

export interface APIResponse<T> {
  success?: boolean;
  message?: string;
  data?: T;
}

export interface MatchModificationResult {
  success: boolean;
  match?: DetailedReconciliationMatch;
  action?: string;
  matchId?: string;
  error?: string;
}
