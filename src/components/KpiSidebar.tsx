import { formatCurrency, formatPercentage, getMarginColor } from "@/utils/calculations";
import type { KPIData, GlobalSettings, TimeScale } from "@/types/simulation";
import { getTimeScaleMultiplier, getTimeScaleSuffix } from "@/types/simulation";
import { TrendingUp, TrendingDown, Target, DollarSign, BarChart3, Percent, Zap, Wrench, Package, Users, Layers } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface KpiSidebarProps {
  kpis: KPIData;
  settings: GlobalSettings;
  timeScale: TimeScale;
  dureeMois: number;
}

function KpiItem({ label, value, icon: Icon, tooltip, colorClass, accent }: {
  label: string;
  value: string;
  icon: React.ElementType;
  tooltip: string;
  colorClass?: string;
  accent?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`px-4 py-3.5 border-b border-sidebar-border transition-colors hover:bg-sidebar-accent/50 ${accent ? "bg-sidebar-accent/30" : ""}`}>
          <div className="flex items-center gap-2 mb-1.5">
            <div className={`h-5 w-5 rounded flex items-center justify-center ${accent ? "bg-primary/20" : "bg-sidebar-accent"}`}>
              <Icon className={`h-3 w-3 ${accent ? "text-primary-300" : "text-sidebar-muted"}`} />
            </div>
            <span className="kpi-label text-sidebar-muted">{label}</span>
          </div>
          <div className={`kpi-value text-sidebar-primary number-animate ${colorClass || ""}`}>{value}</div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-[220px] text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

export function KpiSidebar({ kpis, settings, timeScale, dureeMois }: KpiSidebarProps) {
  const marginBruteColor = getMarginColor(kpis.margeBrutePct, settings.margeBruteCible, settings.seuilAlerteMargeNette);
  const marginNetteColor = getMarginColor(kpis.margeNettePct, settings.margeNetteCible, settings.seuilAlerteMargeNette);
  const mult = getTimeScaleMultiplier(timeScale, dureeMois);
  const suffix = getTimeScaleSuffix(timeScale);

  return (
    <aside className="w-[220px] sidebar-gradient flex-shrink-0 flex flex-col sticky top-0 h-screen overflow-y-auto">
      {/* Logo area */}
      <div className="px-4 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <h2 className="text-xs font-semibold text-sidebar-foreground tracking-widest uppercase">Live KPIs</h2>
        </div>
      </div>

      <KpiItem
        label={`CA Net ${suffix}`}
        value={formatCurrency(kpis.caNetMensuel * mult)}
        icon={DollarSign}
        tooltip={`Chiffre d'affaires net ${suffix} après remises`}
        accent
      />
      <KpiItem
        label={`Coûts ${suffix}`}
        value={formatCurrency(kpis.coutTotalMensuel * mult)}
        icon={TrendingDown}
        tooltip={`Somme des coûts directs et indirects ${suffix}`}
      />
      <KpiItem
        label="Marge brute"
        value={formatPercentage(kpis.margeBrutePct)}
        icon={BarChart3}
        tooltip={`CA Net - Coûts directs / CA Net. Cible: ${settings.margeBruteCible}%`}
        colorClass={marginBruteColor}
      />
      <KpiItem
        label="Marge nette"
        value={formatPercentage(kpis.margeNettePct)}
        icon={Percent}
        tooltip={`Marge brute - Frais indirects / CA Net. Cible: ${settings.margeNetteCible}%`}
        colorClass={marginNetteColor}
        accent
      />
      <KpiItem
        label={`Marge nette ${suffix}`}
        value={formatCurrency(kpis.margeNetteMensuel * mult)}
        icon={DollarSign}
        tooltip={`Marge nette en euros ${suffix}`}
        colorClass={marginNetteColor}
      />
      <KpiItem
        label="Valeur attendue"
        value={formatCurrency(kpis.valeurAttendue)}
        icon={Target}
        tooltip="CA total x probabilité de signature"
      />
      <KpiItem
        label="Point mort"
        value={`${kpis.pointMortMois} mois`}
        icon={TrendingUp}
        tooltip="Nombre de mois avant que le client devienne rentable"
      />
      <KpiItem
        label="ROI contrat"
        value={formatPercentage(kpis.roiPct)}
        icon={Zap}
        tooltip="Retour sur investissement sur la durée du contrat"
      />

      {settings.margeDetaillee && (
        <>
          <div className="px-4 py-2 border-b border-sidebar-border">
            <div className="text-[9px] text-sidebar-muted uppercase tracking-widest">Marges par categorie</div>
          </div>
          <KpiItem
            label="Marge MO"
            value={formatPercentage(kpis.margeMOPct)}
            icon={Users}
            tooltip={`Marge sur main-d'oeuvre. Cible: ${settings.margeCibleMO}%`}
            colorClass={getMarginColor(kpis.margeMOPct, settings.margeCibleMO, settings.margeCibleMO * 0.5)}
          />
          <KpiItem
            label="Marge articles"
            value={formatPercentage(kpis.margeArticlesPct)}
            icon={Package}
            tooltip={`Marge sur articles/fournitures. Cible: ${settings.margeCibleArticles}%`}
            colorClass={getMarginColor(kpis.margeArticlesPct, settings.margeCibleArticles, settings.margeCibleArticles * 0.5)}
          />
          <KpiItem
            label="Marge sous-traitance"
            value={formatPercentage(kpis.margeSousTraitancePct)}
            icon={Wrench}
            tooltip={`Part sous-traitance / CA net. Cible: ${settings.margeCibleSousTraitance}%`}
            colorClass={getMarginColor(-kpis.margeSousTraitancePct, -settings.margeCibleSousTraitance, -settings.margeCibleSousTraitance * 2)}
          />
          <KpiItem
            label="Marge matiere"
            value={formatPercentage(kpis.margeMatierePct)}
            icon={Layers}
            tooltip={`Marge sur matiere premiere. Cible: ${settings.margeCibleMatiere}%`}
            colorClass={getMarginColor(kpis.margeMatierePct, settings.margeCibleMatiere, settings.margeCibleMatiere * 0.5)}
          />
        </>
      )}

      {/* Bottom decorative element */}
      <div className="mt-auto px-4 py-4 border-t border-sidebar-border">
        <div className="text-[9px] text-sidebar-muted uppercase tracking-widest">Mis à jour en temps réel</div>
      </div>
    </aside>
  );
}
