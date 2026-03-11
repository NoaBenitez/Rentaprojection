import {
  type GlobalSettings,
  type TechnicianProfile,
  type DeplacementsData,
  type AstreintesData,
  type FormationData,
  type BillingLine,
  type ArticleAchat,
  type SousTraitanceLine,
  type StockData,
  type SimulationState,
  type KPIData,
  type PLLine,
  DUREE_CONTRAT_MOIS,
} from "@/types/simulation";

/** Calculate monthly labor cost for all technician profiles */
export function calculateLaborCost(
  profiles: TechnicianProfile[],
  chargesSocialesPct: number
): number {
  const rawCost = profiles.reduce(
    (sum, p) => sum + p.nombreRessources * p.heuresMois * p.tauxHoraire,
    0
  );
  return rawCost * (1 + chargesSocialesPct / 100);
}

/** Calculate monthly travel cost */
export function calculateTravelCost(data: DeplacementsData): number {
  const kmCost = data.nombreDeplacementsMois * data.distanceMoyenne * data.tauxKilometrique;
  return kmCost + data.coutVehiculeFixe;
}

/** Calculate monthly on-call and overtime cost */
export function calculateAstreinteCost(
  data: AstreintesData,
  baseTauxHoraire: number
): number {
  const astreinte = data.heuresAstreinteMois * baseTauxHoraire * (1 + data.majorationAstreinte / 100);
  const heuresSup = data.heuresSupMois * baseTauxHoraire * (1 + data.majorationHeuresSup / 100);
  return astreinte + heuresSup;
}

/** Calculate monthly amortized training cost */
export function calculateTrainingCost(data: FormationData, dureeMois: number): number {
  if (dureeMois <= 0) return 0;
  const totalCost = data.heuresFormation * data.tauxHoraireFormation;
  return totalCost / dureeMois;
}

/** Convert frequency to monthly factor */
function frequencyToMonthly(freq: string): number {
  switch (freq) {
    case "Mensuel": return 1;
    case "Trimestriel": return 1 / 3;
    case "Annuel": return 1 / 12;
    case "Unique": return 0; // handled separately
    default: return 1;
  }
}

/** Calculate monthly revenue from billing lines */
export function calculateRevenue(lines: BillingLine[]): number {
  return lines.reduce((sum, l) => {
    if (l.frequence === "Unique") return sum; // one-time, not monthly
    return sum + l.quantiteMois * l.prixUnitaireHT * frequencyToMonthly(l.frequence);
  }, 0);
}

/** Calculate one-time revenue from billing lines */
export function calculateOneTimeRevenue(lines: BillingLine[]): number {
  return lines
    .filter((l) => l.frequence === "Unique")
    .reduce((sum, l) => sum + l.quantiteMois * l.prixUnitaireHT, 0);
}

/** Calculate revenue by type */
export function calculateRevenueByType(lines: BillingLine[]): Record<string, number> {
  const byType: Record<string, number> = {};
  lines.forEach((l) => {
    if (l.frequence === "Unique") return;
    const monthly = l.quantiteMois * l.prixUnitaireHT * frequencyToMonthly(l.frequence);
    byType[l.type] = (byType[l.type] || 0) + monthly;
  });
  return byType;
}

/** Calculate monthly purchase cost for articles */
export function calculateArticleCost(articles: ArticleAchat[]): number {
  return articles.reduce((sum, a) => {
    if (a.frequence === "Unique") return sum;
    return sum + a.quantiteMois * a.prixAchatHT * frequencyToMonthly(a.frequence);
  }, 0);
}

/** Calculate monthly resale revenue for articles */
export function calculateArticleRevenue(articles: ArticleAchat[]): number {
  return articles.reduce((sum, a) => {
    if (a.frequence === "Unique") return sum;
    return sum + a.quantiteMois * a.prixReventeHT * frequencyToMonthly(a.frequence);
  }, 0);
}

/** Calculate article margin */
export function calculateArticleMargin(articles: ArticleAchat[]): number {
  const cost = calculateArticleCost(articles);
  const revenue = calculateArticleRevenue(articles);
  return revenue - cost;
}

/** Calculate monthly subcontracting cost */
export function calculateSubcontractingCost(lines: SousTraitanceLine[]): number {
  return lines.reduce((sum, l) => sum + l.coutMensuel, 0);
}

/** Calculate monthly stock immobilization cost */
export function calculateStockCost(stock: StockData): number {
  return (stock.valeurStockSecurite * stock.coutImmobilisationPct) / 100 / 12;
}

/** Calculate monthly financing cost based on payment delay */
export function calculateFinancingCost(
  monthlyRevenue: number,
  delaiPaiement: string,
  tauxAnnuel: number
): number {
  const days = parseInt(delaiPaiement) || 30;
  return (monthlyRevenue * days * tauxAnnuel) / 100 / 365;
}

/** Calculate weighted expected value */
export function calculateWeightedValue(revenue: number, probability: number): number {
  return revenue * (probability / 100);
}

/** Calculate break-even in € */
export function calculateBreakEven(
  fixedCostsMensuel: number,
  variableMarginRate: number
): number {
  if (variableMarginRate <= 0) return Infinity;
  return fixedCostsMensuel / (variableMarginRate / 100);
}

/** Build full P&L from simulation state */
export function buildProfitAndLoss(
  state: SimulationState,
  settings: GlobalSettings
): { lines: PLLine[]; kpis: KPIData } {
  const dureeMois = DUREE_CONTRAT_MOIS[state.prospect.dureeContrat] || 12;

  // Revenue
  const revenueByType = calculateRevenueByType(state.facturation.lignes);
  const caMO = revenueByType["Main-d'œuvre"] || 0;
  const caFournitures = (revenueByType["Fourniture"] || 0) + calculateArticleRevenue(state.achats.articles);
  const caPrestations = (revenueByType["Prestation forfaitaire"] || 0) +
    (revenueByType["Location matériel"] || 0) +
    (revenueByType["Autre"] || 0);
  const totalCA = caMO + caFournitures + caPrestations;
  const remise = totalCA * (state.facturation.conditions.remiseGlobale / 100);
  const caNet = totalCA - remise;

  // Direct costs
  const coutMO = calculateLaborCost(state.interventions.techniciens, settings.chargesSocialesPatronales);
  const avgTaux = state.interventions.techniciens.length > 0
    ? state.interventions.techniciens.reduce((s, t) => s + t.tauxHoraire, 0) / state.interventions.techniciens.length
    : settings.tauxHoraireMOStandard;
  const coutAstreintes = calculateAstreinteCost(state.interventions.astreintes, avgTaux);
  const coutDeplacements = calculateTravelCost(state.interventions.deplacements);
  const coutAchats = calculateArticleCost(state.achats.articles);
  const coutSousTraitance = calculateSubcontractingCost(state.achats.sousTraitance);
  const totalCoutsDirects = coutMO + coutAstreintes + coutDeplacements + coutAchats + coutSousTraitance;

  const margeBrute = caNet - totalCoutsDirects;
  const margeBrutePct = caNet > 0 ? (margeBrute / caNet) * 100 : 0;

  // Indirect costs
  const fraisStructure = caNet * (settings.tauxFraisStructure / 100) + settings.fraisFixesMensuels;
  const fraisFinanciers = calculateFinancingCost(
    caNet,
    state.facturation.conditions.delaiPaiement,
    settings.tauxFinancementAnnuel
  );
  const coutStock = calculateStockCost(state.achats.stock);
  const amortFormation = calculateTrainingCost(state.interventions.formation, dureeMois);
  const totalFraisIndirects = fraisStructure + fraisFinanciers + coutStock + amortFormation;

  const margeNette = margeBrute - totalFraisIndirects;
  const margeNettePct = caNet > 0 ? (margeNette / caNet) * 100 : 0;

  const valeurAttendue = calculateWeightedValue(caNet * dureeMois, state.prospect.probabiliteSignature);

  // Break-even
  const fixedCosts = fraisStructure + coutStock + amortFormation;
  const variableMarginRate = caNet > 0 ? ((caNet - totalCoutsDirects - fraisFinanciers) / caNet) * 100 : 0;
  const seuilRentabilite = calculateBreakEven(fixedCosts, variableMarginRate);
  const pointMortMois = caNet > 0 ? Math.ceil(seuilRentabilite / caNet) : 0;

  // Per-category margins
  const margeMO = caMO - (coutMO + coutAstreintes);
  const margeMOPct = caMO > 0 ? (margeMO / caMO) * 100 : 0;

  const margeArticles = caFournitures - coutAchats;
  const margeArticlesPct = caFournitures > 0 ? (margeArticles / caFournitures) * 100 : 0;

  const margeSousTraitancePct = caNet > 0 ? (-coutSousTraitance / caNet) * 100 : 0;

  // Matiere = articles cost as % of their revenue (same as articles for now)
  const margeMatierePct = margeArticlesPct;

  const totalInvestissement = totalCoutsDirects * dureeMois + totalFraisIndirects * dureeMois;
  const roiPct = totalInvestissement > 0 ? ((margeNette * dureeMois) / totalInvestissement) * 100 : 0;

  const m = (v: number) => v;
  const t = (v: number) => v * dureeMois;

  const lines: PLLine[] = [
    { label: "CA Main-d'œuvre HT", mensuel: m(caMO), total: t(caMO) },
    { label: "CA Fournitures HT", mensuel: m(caFournitures), total: t(caFournitures) },
    { label: "CA Prestations HT", mensuel: m(caPrestations), total: t(caPrestations) },
    { label: "Total CA HT", mensuel: m(totalCA), total: t(totalCA), isBold: true },
    { label: "— Remise commerciale", mensuel: -m(remise), total: -t(remise), indent: true },
    { label: "CA Net HT", mensuel: m(caNet), total: t(caNet), isBold: true },
    { label: "Coût MO direct", mensuel: -m(coutMO + coutAstreintes), total: -t(coutMO + coutAstreintes), indent: true },
    { label: "Coût déplacements", mensuel: -m(coutDeplacements), total: -t(coutDeplacements), indent: true },
    { label: "Coût achats/fournitures", mensuel: -m(coutAchats), total: -t(coutAchats), indent: true },
    { label: "Coût sous-traitance", mensuel: -m(coutSousTraitance), total: -t(coutSousTraitance), indent: true },
    { label: "Total coûts directs", mensuel: -m(totalCoutsDirects), total: -t(totalCoutsDirects), isBold: true },
    { label: "Marge brute", mensuel: m(margeBrute), total: t(margeBrute), isBold: true },
    { label: "Marge brute %", mensuel: margeBrutePct, total: margeBrutePct, isBold: true, isPercentage: true },
    { label: `Frais de structure (${settings.tauxFraisStructure}%)`, mensuel: -m(fraisStructure), total: -t(fraisStructure), indent: true },
    { label: "Frais financiers (portage)", mensuel: -m(fraisFinanciers), total: -t(fraisFinanciers), indent: true },
    { label: "Coût immobilisation stock", mensuel: -m(coutStock), total: -t(coutStock), indent: true },
    { label: "Amortissement formation", mensuel: -m(amortFormation), total: -t(amortFormation), indent: true },
    { label: "Total frais indirects", mensuel: -m(totalFraisIndirects), total: -t(totalFraisIndirects), isBold: true },
    { label: "Marge nette", mensuel: m(margeNette), total: t(margeNette), isBold: true },
    { label: "Marge nette %", mensuel: margeNettePct, total: margeNettePct, isBold: true, isPercentage: true },
  ];

  const kpis: KPIData = {
    caNetMensuel: caNet,
    coutTotalMensuel: totalCoutsDirects + totalFraisIndirects,
    margeBrutePct,
    margeNettePct,
    margeBruteMensuel: margeBrute,
    margeNetteMensuel: margeNette,
    valeurAttendue,
    seuilRentabilite: seuilRentabilite === Infinity ? 0 : seuilRentabilite,
    pointMortMois,
    roiPct,
    margeMOPct,
    margeArticlesPct,
    margeSousTraitancePct,
    margeMatierePct,
  };

  return { lines, kpis };
}

/** Generate sensitivity matrix */
export function calculateSensitivityMatrix(
  baseMargeNettePct: number,
  baseCoutMO: number,
  baseCANet: number,
  variations: number[] // e.g. [-20, -15, -10, -5, 0, 5, 10, 15, 20]
): number[][] {
  // rows = taux horaire variation, cols = volume heures variation
  // Simplified: margin changes linearly with cost/revenue changes
  return variations.map((rowVar) => {
    return variations.map((colVar) => {
      const newCoutMO = baseCoutMO * (1 + rowVar / 100);
      const newCA = baseCANet * (1 + colVar / 100);
      const newMarge = newCA - newCoutMO;
      return newCA > 0 ? (newMarge / newCA) * 100 : 0;
    });
  });
}

/** Format number as currency */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Format number as percentage */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)} %`;
}

/** Get margin color class */
export function getMarginColor(value: number, target: number, alertThreshold: number): string {
  if (value >= target) return "profit-positive";
  if (value >= alertThreshold) return "profit-warning";
  return "profit-negative";
}
