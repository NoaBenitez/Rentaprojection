// ===== TIME SCALE =====
export type TimeScale = "mois" | "annee" | "contrat";

export const TIME_SCALE_LABELS: Record<TimeScale, string> = {
  mois: "Mois",
  annee: "Année",
  contrat: "Durée contrat",
};

export function getTimeScaleMultiplier(scale: TimeScale, dureeMois: number): number {
  switch (scale) {
    case "mois": return 1;
    case "annee": return 12;
    case "contrat": return dureeMois;
  }
}

export function getTimeScaleSuffix(scale: TimeScale): string {
  switch (scale) {
    case "mois": return "/mois";
    case "annee": return "/an";
    case "contrat": return " total";
  }
}

// ===== GLOBAL SETTINGS =====
export interface GlobalSettings {
  tauxHoraireMOStandard: number;
  tauxHoraireMOSenior: number;
  tauxHoraireChefChantier: number;
  chargesSocialesPatronales: number;
  majorationAstreinte: number;
  majorationHeuresSup: number;
  tauxKilometrique: number;
  indemniteDeplacement: number;
  coutVehiculeMois: number;
  tauxFraisStructure: number;
  fraisFixesMensuels: number;
  tauxFinancementAnnuel: number;
  coutImmobilisationStock: number;
  tauxMargeArticles: number;
  seuilAlerteMargeArticle: number;
  margeBruteCible: number;
  margeNetteCible: number;
  seuilAlerteMargeNette: number;
  margeDetaillee: boolean;
  margeCibleMO: number;
  margeCibleArticles: number;
  margeCibleSousTraitance: number;
  margeCibleMatiere: number;
}

// ===== TAB 1: PROSPECT =====
export interface ProspectData {
  nom: string;
  secteur: string;
  localisation: string;
  dureeContrat: string;
  typeContrat: string;
  margeCible: number;
  probabiliteSignature: number;
  notes: string;
}

// ===== TAB 2: INTERVENTIONS =====
export interface TechnicianProfile {
  id: string;
  role: string;
  nombreRessources: number;
  tauxHoraire: number;
  heuresMois: number;
}

export interface DeplacementsData {
  nombreDeplacementsMois: number;
  distanceMoyenne: number;
  tauxKilometrique: number;
  coutVehiculeFixe: number;
}

export interface AstreintesData {
  heuresAstreinteMois: number;
  majorationAstreinte: number;
  heuresSupMois: number;
  majorationHeuresSup: number;
}

export interface FormationData {
  heuresFormation: number;
  tauxHoraireFormation: number;
}

export interface InterventionsData {
  techniciens: TechnicianProfile[];
  deplacements: DeplacementsData;
  astreintes: AstreintesData;
  formation: FormationData;
}

// ===== TAB 3: FACTURATION =====
export interface BillingLine {
  id: string;
  designation: string;
  type: string;
  quantiteMois: number;
  prixUnitaireHT: number;
  frequence: string;
}

export interface ConditionsCommerciales {
  remiseGlobale: number;
  delaiPaiement: string;
  penalitesRetard: number;
}

export interface IndexationData {
  clauseRevision: boolean;
  indiceRevision: string;
  tauxRevisionAnnuel: number;
}

export interface FacturationData {
  lignes: BillingLine[];
  conditions: ConditionsCommerciales;
  indexation: IndexationData;
}

// ===== EXCEL IMPORT =====
export type ColumnRole = "site" | "produit" | "date" | "ignorer";

export interface ExcelColumnConfig {
  index: number;
  name: string;
  role: ColumnRole;
  // Only when role === "produit"
  prixUnitaire: number;
  pourcentageParc: number; // % du parc a chiffrer (default 100)
  // Only when role === "date"
  seuilAnnees: number; // si date > X annees, +1 au produit lie
  produitAssocieIndex: number | null; // index de la colonne produit liee
}

export interface ExcelImportResult {
  produits: {
    designation: string;
    quantiteTotal: number;
    quantiteChiffree: number;
    prixUnitaire: number;
    coutTotal: number;
  }[];
  totalGeneral: number;
}

// ===== TAB 4: ACHATS =====
export interface ArticleAchat {
  id: string;
  reference: string;
  designation: string;
  famille: string;
  quantiteMois: number;
  prixAchatHT: number;
  prixReventeHT: number;
  frequence: string;
}

export interface SousTraitanceLine {
  id: string;
  prestataire: string;
  typePrestation: string;
  coutMensuel: number;
}

export interface StockData {
  valeurStockSecurite: number;
  coutImmobilisationPct: number;
}

export interface AchatsData {
  articles: ArticleAchat[];
  sousTraitance: SousTraitanceLine[];
  stock: StockData;
  tauxMargeDefaut: number;
  alerteMargeActive: boolean;
  seuilAlerteMarge: number;
}

// ===== TAB 5: RESULTS =====
export interface PLLine {
  label: string;
  mensuel: number;
  total: number;
  isBold?: boolean;
  isPercentage?: boolean;
  indent?: boolean;
}

export interface Scenario {
  id: string;
  name: string;
  parameters: Partial<SimulationState>;
}

// ===== FULL STATE =====
export interface SimulationState {
  prospect: ProspectData;
  interventions: InterventionsData;
  facturation: FacturationData;
  achats: AchatsData;
}

export interface KPIData {
  caNetMensuel: number;
  coutTotalMensuel: number;
  margeBrutePct: number;
  margeNettePct: number;
  margeBruteMensuel: number;
  margeNetteMensuel: number;
  valeurAttendue: number;
  seuilRentabilite: number;
  pointMortMois: number;
  roiPct: number;
  margeMOPct: number;
  margeArticlesPct: number;
  margeSousTraitancePct: number;
  margeMatierePct: number;
}

export const DUREE_CONTRAT_MOIS: Record<string, number> = {
  "1 mois": 1,
  "3 mois": 3,
  "6 mois": 6,
  "1 an": 12,
  "2 ans": 24,
  "3 ans+": 36,
};

export const DEFAULT_SETTINGS: GlobalSettings = {
  tauxHoraireMOStandard: 45,
  tauxHoraireMOSenior: 60,
  tauxHoraireChefChantier: 75,
  chargesSocialesPatronales: 45,
  majorationAstreinte: 25,
  majorationHeuresSup: 25,
  tauxKilometrique: 0.45,
  indemniteDeplacement: 15,
  coutVehiculeMois: 600,
  tauxFraisStructure: 12,
  fraisFixesMensuels: 0,
  tauxFinancementAnnuel: 4,
  coutImmobilisationStock: 3,
  tauxMargeArticles: 30,
  seuilAlerteMargeArticle: 10,
  margeBruteCible: 40,
  margeNetteCible: 15,
  seuilAlerteMargeNette: 8,
  margeDetaillee: false,
  margeCibleMO: 40,
  margeCibleArticles: 30,
  margeCibleSousTraitance: 15,
  margeCibleMatiere: 25,
};
