import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RotateCcw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import type { GlobalSettings } from "@/types/simulation";
import { DEFAULT_SETTINGS } from "@/types/simulation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface GlobalSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: GlobalSettings;
  onUpdate: (settings: GlobalSettings) => void;
}

function SettingField({
  label,
  value,
  unit,
  tooltip,
  defaultValue,
  onChange,
  onReset,
}: {
  label: string;
  value: number;
  unit: string;
  tooltip: string;
  defaultValue: number;
  onChange: (v: number) => void;
  onReset: () => void;
}) {
  return (
    <div className="flex items-center gap-2 py-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Label className="flex-1 text-xs cursor-help font-medium">{label}</Label>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-[200px] text-xs">{tooltip}</TooltipContent>
      </Tooltip>
      <div className="relative w-28">
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="pr-10 text-right text-sm h-9"
        />
        <span className="input-unit text-[10px]">{unit}</span>
      </div>
      {value !== defaultValue && (
        <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={onReset}>
          <RotateCcw className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

export function GlobalSettingsSheet({ open, onOpenChange, settings, onUpdate }: GlobalSettingsSheetProps) {
  const set = (key: keyof GlobalSettings) => (v: number) => onUpdate({ ...settings, [key]: v });
  const reset = (key: keyof GlobalSettings) => () => onUpdate({ ...settings, [key]: DEFAULT_SETTINGS[key] });

  const sections = [
    {
      title: "Coûts main-d'œuvre",
      fields: [
        { key: "tauxHoraireMOStandard" as const, label: "Taux horaire standard", unit: "€/h", tooltip: "Coût horaire d'un technicien standard" },
        { key: "tauxHoraireMOSenior" as const, label: "Taux horaire senior", unit: "€/h", tooltip: "Coût horaire d'un technicien senior" },
        { key: "tauxHoraireChefChantier" as const, label: "Taux chef de chantier", unit: "€/h", tooltip: "Coût horaire d'un chef de chantier" },
        { key: "chargesSocialesPatronales" as const, label: "Charges sociales", unit: "%", tooltip: "Taux de charges ajouté au coût horaire brut" },
        { key: "majorationAstreinte" as const, label: "Majoration astreinte", unit: "%", tooltip: "Pourcentage de majoration des heures d'astreinte" },
        { key: "majorationHeuresSup" as const, label: "Majoration heures sup", unit: "%", tooltip: "Pourcentage de majoration des heures supplémentaires" },
      ],
    },
    {
      title: "Déplacements",
      fields: [
        { key: "tauxKilometrique" as const, label: "Taux kilométrique", unit: "€/km", tooltip: "Indemnité par kilomètre parcouru" },
        { key: "indemniteDeplacement" as const, label: "Indemnité/jour", unit: "€", tooltip: "Indemnité forfaitaire journalière" },
        { key: "coutVehiculeMois" as const, label: "Véhicule/mois", unit: "€", tooltip: "Leasing ou amortissement mensuel" },
      ],
    },
    {
      title: "Structure & Financier",
      fields: [
        { key: "tauxFraisStructure" as const, label: "Frais structure", unit: "% CA", tooltip: "Part du CA pour frais généraux" },
        { key: "fraisFixesMensuels" as const, label: "Frais fixes/mois", unit: "€", tooltip: "Frais fixes additionnels" },
        { key: "tauxFinancementAnnuel" as const, label: "Taux financement", unit: "%", tooltip: "Taux d'intérêt pour le portage" },
        { key: "coutImmobilisationStock" as const, label: "Immobilisation stock", unit: "% /an", tooltip: "Coût d'immobilisation du capital" },
      ],
    },
    {
      title: "Articles",
      fields: [
        { key: "tauxMargeArticles" as const, label: "Marge articles", unit: "%", tooltip: "Marge par défaut sur articles" },
        { key: "seuilAlerteMargeArticle" as const, label: "Seuil alerte", unit: "%", tooltip: "Alerte si marge inférieure" },
      ],
    },
  ];

  const objectifsGeneraux = [
    { key: "margeBruteCible" as const, label: "Marge brute cible", unit: "%", tooltip: "Objectif marge brute minimum" },
    { key: "margeNetteCible" as const, label: "Marge nette cible", unit: "%", tooltip: "Objectif marge nette minimum" },
    { key: "seuilAlerteMargeNette" as const, label: "Seuil alerte nette", unit: "%", tooltip: "Alerte si marge nette sous ce seuil" },
  ];

  const objectifsDetailles = [
    { key: "margeCibleMO" as const, label: "Marge cible MO", unit: "%", tooltip: "Objectif marge sur main-d'oeuvre" },
    { key: "margeCibleArticles" as const, label: "Marge cible articles", unit: "%", tooltip: "Objectif marge sur articles/fournitures" },
    { key: "margeCibleSousTraitance" as const, label: "Marge cible sous-traitance", unit: "%", tooltip: "Objectif marge sur sous-traitance" },
    { key: "margeCibleMatiere" as const, label: "Marge cible matiere", unit: "%", tooltip: "Objectif marge sur matiere premiere" },
    { key: "margeNetteCible" as const, label: "Marge nette cible", unit: "%", tooltip: "Objectif marge nette minimum" },
    { key: "seuilAlerteMargeNette" as const, label: "Seuil alerte nette", unit: "%", tooltip: "Alerte si marge nette sous ce seuil" },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:max-w-[400px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg">Paramètres globaux</SheetTitle>
          <SheetDescription className="text-xs">Valeurs par défaut pour les simulations</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-5">
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-2">{section.title}</h3>
              <div className="space-y-0">
                {section.fields.map((f) => (
                  <SettingField
                    key={f.key}
                    label={f.label}
                    value={settings[f.key]}
                    unit={f.unit}
                    tooltip={f.tooltip}
                    defaultValue={DEFAULT_SETTINGS[f.key]}
                    onChange={set(f.key)}
                    onReset={reset(f.key)}
                  />
                ))}
              </div>
              <Separator className="mt-3" />
            </div>
          ))}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Objectifs de marge</h3>
            <div className="flex items-center justify-between py-2 mb-2">
              <Label className="text-xs font-medium">Marge detaillee par categorie</Label>
              <Switch
                checked={settings.margeDetaillee}
                onCheckedChange={(checked) => onUpdate({ ...settings, margeDetaillee: checked })}
              />
            </div>
            <div className="space-y-0">
              {(settings.margeDetaillee ? objectifsDetailles : objectifsGeneraux).map((f) => (
                <SettingField
                  key={f.key}
                  label={f.label}
                  value={settings[f.key]}
                  unit={f.unit}
                  tooltip={f.tooltip}
                  defaultValue={DEFAULT_SETTINGS[f.key]}
                  onChange={set(f.key)}
                  onReset={reset(f.key)}
                />
              ))}
            </div>
            <Separator className="mt-3" />
          </div>
          <Button variant="outline" className="w-full" onClick={() => onUpdate(DEFAULT_SETTINGS)}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Tout réinitialiser
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
