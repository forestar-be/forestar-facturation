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
  matchType: "EXACT_REF" | "EXACT_AMOUNT" | "FUZZY_NAME" | "COMBINED" | "NONE";
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
