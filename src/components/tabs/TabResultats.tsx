import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercentage, getMarginColor, calculateSensitivityMatrix, calculateLaborCost } from "@/utils/calculations";
import type { PLLine, KPIData, GlobalSettings, SimulationState, TimeScale } from "@/types/simulation";
import { DUREE_CONTRAT_MOIS, getTimeScaleMultiplier, getTimeScaleSuffix } from "@/types/simulation";
import { TrendingUp, AlertTriangle, Target, BarChart3, Zap } from "lucide-react";

interface TabResultatsProps {
  plLines: PLLine[];
  kpis: KPIData;
  settings: GlobalSettings;
  state: SimulationState;
  timeScale: TimeScale;
}

export function TabResultats({ plLines, kpis, settings, state, timeScale }: TabResultatsProps) {
  const dureeMois = DUREE_CONTRAT_MOIS[state.prospect.dureeContrat] || 12;
  const mult = getTimeScaleMultiplier(timeScale, dureeMois);
  const suffix = getTimeScaleSuffix(timeScale);

  const variations = [-20, -15, -10, -5, 0, 5, 10, 15, 20];
  const baseCoutMO = calculateLaborCost(state.interventions.techniciens, settings.chargesSocialesPatronales);
  const matrix = calculateSensitivityMatrix(kpis.margeNettePct, baseCoutMO + kpis.coutTotalMensuel - kpis.caNetMensuel + kpis.caNetMensuel - kpis.margeNetteMensuel, kpis.caNetMensuel, variations);
  const worstCase = kpis.coutTotalMensuel * dureeMois - kpis.caNetMensuel * 0.7 * dureeMois;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold">Résultats & Simulation</h2>
        <p className="text-sm text-muted-foreground mt-1">Analyse complète de la rentabilité prévisionnelle du prospect.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard title="Seuil de rentabilité" value={formatCurrency(kpis.seuilRentabilite)} icon={Target} subtitle={`${kpis.pointMortMois} mois`} />
        <KpiCard title="Point mort" value={`${kpis.pointMortMois} mois`} icon={TrendingUp} subtitle="Début de rentabilité" />
        <KpiCard title="ROI contrat" value={formatPercentage(kpis.roiPct)} icon={Zap} subtitle={`Sur ${dureeMois} mois`} accent />
        <KpiCard title="Valeur attendue" value={formatCurrency(kpis.valeurAttendue)} icon={Target} subtitle={`Proba: ${state.prospect.probabiliteSignature}%`} />
        <KpiCard title="Risque financier" value={formatCurrency(Math.max(0, worstCase))} icon={AlertTriangle} subtitle="Pire scénario (70% CA)" warning />
      </div>

      {/* P&L Table */}
      <Card className="glass-card overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Compte de résultat prévisionnel
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-hidden rounded-b-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-primary-950 text-primary-foreground">
                  <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider">Ligne</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-xs uppercase tracking-wider">{suffix === "/mois" ? "Mensuel" : suffix === "/an" ? "Annuel" : `Sur ${dureeMois} mois`}</th>
                </tr>
              </thead>
              <tbody>
                {plLines.map((line, i) => {
                  let colorClass = "";
                  if (line.label.includes("Marge") && line.isBold) {
                    const val = line.isPercentage ? line.mensuel : (kpis.caNetMensuel > 0 ? (line.mensuel / kpis.caNetMensuel) * 100 : 0);
                    colorClass = getMarginColor(val, settings.margeNetteCible, settings.seuilAlerteMargeNette);
                  }
                  return (
                    <tr key={i} className={`border-t transition-colors ${line.isBold ? "bg-muted/60" : "hover:bg-muted/30"}`}>
                      <td className={`px-4 py-2 ${line.indent ? "pl-8 text-muted-foreground" : ""} ${line.isBold ? "font-semibold" : ""} ${colorClass}`}>
                        {line.label}
                      </td>
                      <td className={`text-right px-4 py-2 font-mono ${line.isBold ? "font-semibold" : ""} ${colorClass}`}>
                        {line.isPercentage ? formatPercentage(line.mensuel) : formatCurrency(line.mensuel * mult)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Sensitivity Matrix */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Analyse de sensibilité — Marge nette (%)
          </CardTitle>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Lignes: variation coût total | Colonnes: variation CA</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="text-xs border-collapse w-full">
              <thead>
                <tr>
                  <th className="px-2 py-1.5 border bg-primary-950 text-primary-foreground text-[10px] uppercase tracking-wider rounded-tl">Coût \ CA</th>
                  {variations.map((v) => (
                    <th key={v} className={`px-2 py-1.5 border text-center font-mono text-[10px] ${v === 0 ? "bg-primary-900 text-primary-foreground font-bold" : "bg-primary-950 text-primary-foreground"}`}>
                      {v > 0 ? `+${v}%` : `${v}%`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.map((row, ri) => (
                  <tr key={ri}>
                    <td className={`px-2 py-1.5 border font-mono text-center text-[10px] font-medium ${variations[ri] === 0 ? "bg-primary-900 text-primary-foreground font-bold" : "bg-primary-950 text-primary-foreground"}`}>
                      {variations[ri] > 0 ? `+${variations[ri]}%` : `${variations[ri]}%`}
                    </td>
                    {row.map((val, ci) => {
                      const bg = val >= settings.margeNetteCible
                        ? "bg-profit-muted"
                        : val >= settings.seuilAlerteMargeNette
                        ? "bg-warning-muted"
                        : "bg-loss-muted";
                      const isCenter = variations[ri] === 0 && variations[ci] === 0;
                      return (
                        <td key={ci} className={`px-2 py-1.5 border text-center font-mono ${bg} ${isCenter ? "ring-2 ring-primary font-bold" : ""}`}>
                          {val.toFixed(1)}%
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ title, value, subtitle, icon: Icon, warning, accent }: {
  title: string; value: string; subtitle: string; icon: React.ElementType; warning?: boolean; accent?: boolean;
}) {
  return (
    <Card className={`${accent ? "glow-border" : "glass-card"}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${warning ? "bg-loss-muted" : accent ? "bg-primary-100" : "bg-muted"}`}>
            <Icon className={`h-3.5 w-3.5 ${warning ? "text-destructive" : accent ? "text-primary" : "text-muted-foreground"}`} />
          </div>
        </div>
        <div className={`text-lg font-bold font-mono ${accent ? "gradient-text" : ""}`}>{value}</div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{title}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</div>
      </CardContent>
    </Card>
  );
}
