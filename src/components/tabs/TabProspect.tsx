import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/utils/calculations";
import type { ProspectData, KPIData } from "@/types/simulation";
import { DUREE_CONTRAT_MOIS } from "@/types/simulation";
import { Building2, Target, FileText, MapPin } from "lucide-react";

interface TabProspectProps {
  data: ProspectData;
  kpis: KPIData;
  onChange: (updates: Partial<ProspectData>) => void;
}

const SECTEURS = ["Industrie", "BTP", "Tertiaire", "Santé", "Distribution", "Autre"];
const DUREES = Object.keys(DUREE_CONTRAT_MOIS);
const TYPES_CONTRAT = ["Forfait", "Régie", "Mixte"];

export function TabProspect({ data, kpis, onChange }: TabProspectProps) {
  return (
    <div className="space-y-8">
      {/* Section header */}
      <div>
        <h2 className="text-xl font-bold">Prospect & Périmètre</h2>
        <p className="text-sm text-muted-foreground mt-1">Définissez les informations de base du prospect et le périmètre du contrat.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column - Form */}
        <div className="space-y-5">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Informations prospect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs font-medium">Nom du prospect</Label>
                <Input value={data.nom} onChange={(e) => onChange({ nom: e.target.value })} placeholder="Ex: Groupe Industriel ABC" className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium">Secteur</Label>
                  <Select value={data.secteur} onValueChange={(v) => onChange({ secteur: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                    <SelectContent>{SECTEURS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium">Localisation</Label>
                  <Input value={data.localisation} onChange={(e) => onChange({ localisation: e.target.value })} placeholder="Île-de-France" className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium">Durée du contrat</Label>
                  <Select value={data.dureeContrat} onValueChange={(v) => onChange({ dureeContrat: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{DUREES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium">Type de contrat</Label>
                  <Select value={data.typeContrat} onValueChange={(v) => onChange({ typeContrat: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{TYPES_CONTRAT.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Objectifs & Probabilité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs font-medium">Marge cible souhaitée</Label>
                  <span className="text-sm font-mono font-bold text-primary">{data.margeCible}%</span>
                </div>
                <Slider value={[data.margeCible]} onValueChange={([v]) => onChange({ margeCible: v })} min={0} max={60} step={1} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs font-medium">Probabilité de signature</Label>
                  <span className="text-sm font-mono font-bold text-primary">{data.probabiliteSignature}%</span>
                </div>
                <Slider value={[data.probabiliteSignature]} onValueChange={([v]) => onChange({ probabiliteSignature: v })} min={0} max={100} step={5} />
              </div>
            </CardContent>
          </Card>

          <div>
            <Label className="text-xs font-medium">Notes libres</Label>
            <Textarea
              value={data.notes}
              onChange={(e) => onChange({ notes: e.target.value })}
              placeholder="Informations complémentaires sur le prospect..."
              rows={4}
              className="mt-1"
            />
          </div>
        </div>

        {/* Right column - Summary */}
        <div className="space-y-5">
          <Card className="border-primary/20 bg-primary-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Résumé du périmètre
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <SummaryRow label="Prospect" value={data.nom || "—"} />
              <SummaryRow label="Secteur" value={data.secteur || "—"} />
              <SummaryRow label="Zone" value={data.localisation || "—"} />
              <SummaryRow label="Contrat" value={`${data.typeContrat} — ${data.dureeContrat}`} />
              <SummaryRow label="Marge cible" value={`${data.margeCible}%`} highlight />
              <SummaryRow label="Probabilité" value={`${data.probabiliteSignature}%`} highlight />
            </CardContent>
          </Card>

          <Card className="glow-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Valeur attendue pondérée
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <SummaryRow label="CA estimé total" value={formatCurrency(kpis.caNetMensuel * (DUREE_CONTRAT_MOIS[data.dureeContrat] || 12))} />
                <SummaryRow label="× Probabilité" value={`${data.probabiliteSignature}%`} />
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Valeur attendue</span>
                    <span className="text-2xl font-bold font-mono gradient-text">{formatCurrency(kpis.valeurAttendue)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-mono ${highlight ? "font-bold text-primary" : "font-medium"}`}>{value}</span>
    </div>
  );
}
