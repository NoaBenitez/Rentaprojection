import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Copy, Receipt, CreditCard, RefreshCw } from "lucide-react";
import { calculateRevenue, calculateOneTimeRevenue, formatCurrency } from "@/utils/calculations";
import type { FacturationData } from "@/types/simulation";
import { DUREE_CONTRAT_MOIS } from "@/types/simulation";

interface TabFacturationProps {
  data: FacturationData;
  dureeContrat: string;
  onChange: (updates: Partial<FacturationData>) => void;
}

const TYPES_LIGNE = ["Main-d'œuvre", "Fourniture", "Prestation forfaitaire", "Location matériel", "Autre"];
const FREQUENCES = ["Mensuel", "Trimestriel", "Annuel", "Unique"];
const DELAIS = ["30", "45", "60", "90"];
const INDICES = ["INSEE BT01", "IPC", "SYNTEC", "Manuel"];

export function TabFacturation({ data, dureeContrat, onChange }: TabFacturationProps) {
  const dureeMois = DUREE_CONTRAT_MOIS[dureeContrat] || 12;
  const caMensuel = calculateRevenue(data.lignes);
  const caOneTime = calculateOneTimeRevenue(data.lignes);
  const caTotal = caMensuel * dureeMois + caOneTime;
  const remise = caTotal * (data.conditions.remiseGlobale / 100);

  const addLigne = () => {
    onChange({
      lignes: [...data.lignes, { id: crypto.randomUUID(), designation: "", type: "Main-d'œuvre", quantiteMois: 1, prixUnitaireHT: 0, frequence: "Mensuel" }],
    });
  };

  const removeLigne = (id: string) => onChange({ lignes: data.lignes.filter((l) => l.id !== id) });

  const duplicateLigne = (id: string) => {
    const src = data.lignes.find((l) => l.id === id);
    if (src) onChange({ lignes: [...data.lignes, { ...src, id: crypto.randomUUID() }] });
  };

  const updateLigne = (id: string, field: string, value: string | number) => {
    onChange({ lignes: data.lignes.map((l) => l.id === id ? { ...l, [field]: value } : l) });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold">Facturation prévisionnelle</h2>
        <p className="text-sm text-muted-foreground mt-1">Estimez les revenus et conditions commerciales du contrat.</p>
      </div>

      {/* Billing lines */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" /> Lignes de facturation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_130px_80px_90px_110px_70px] gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
              <span>Désignation</span><span>Type</span><span>Qté/mois</span><span>PU HT (€)</span><span>Fréquence</span><span></span>
            </div>
            {data.lignes.map((l) => (
              <div key={l.id} className="grid grid-cols-[1fr_130px_80px_90px_110px_70px] gap-2 items-center animate-fade-in">
                <Input value={l.designation} onChange={(e) => updateLigne(l.id, "designation", e.target.value)} className="h-9 text-sm" placeholder="Désignation..." />
                <Select value={l.type} onValueChange={(v) => updateLigne(l.id, "type", v)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES_LIGNE.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
                <Input type="number" value={l.quantiteMois} onChange={(e) => updateLigne(l.id, "quantiteMois", parseFloat(e.target.value) || 0)} className="h-9 text-sm text-right" />
                <Input type="number" value={l.prixUnitaireHT} onChange={(e) => updateLigne(l.id, "prixUnitaireHT", parseFloat(e.target.value) || 0)} className="h-9 text-sm text-right" />
                <Select value={l.frequence} onValueChange={(v) => updateLigne(l.id, "frequence", v)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{FREQUENCES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                </Select>
                <div className="flex gap-0.5">
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => duplicateLigne(l.id)}><Copy className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-loss-muted" onClick={() => removeLigne(l.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addLigne} className="mt-2">
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Ajouter une ligne
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conditions */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" /> Conditions commerciales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <Label className="text-xs font-medium">Remise commerciale</Label>
                <span className="text-xs font-mono font-bold text-primary">{data.conditions.remiseGlobale}%</span>
              </div>
              <Slider value={[data.conditions.remiseGlobale]} onValueChange={([v]) => onChange({ conditions: { ...data.conditions, remiseGlobale: v } })} min={0} max={30} step={0.5} />
            </div>
            <div>
              <Label className="text-xs font-medium">Délai de paiement</Label>
              <Select value={data.conditions.delaiPaiement} onValueChange={(v) => onChange({ conditions: { ...data.conditions, delaiPaiement: v } })}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{DELAIS.map((d) => <SelectItem key={d} value={d}>{d} jours</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium">Pénalités de retard (€/mois)</Label>
              <Input type="number" value={data.conditions.penalitesRetard} onChange={(e) => onChange({ conditions: { ...data.conditions, penalitesRetard: parseFloat(e.target.value) || 0 } })} className="h-9 text-sm mt-1" />
            </div>
          </CardContent>
        </Card>

        {/* Indexation */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-primary" /> Indexations & Révisions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Clause de révision de prix</Label>
              <Switch checked={data.indexation.clauseRevision} onCheckedChange={(v) => onChange({ indexation: { ...data.indexation, clauseRevision: v } })} />
            </div>
            {data.indexation.clauseRevision && (
              <>
                <div>
                  <Label className="text-xs font-medium">Indice de révision</Label>
                  <Select value={data.indexation.indiceRevision} onValueChange={(v) => onChange({ indexation: { ...data.indexation, indiceRevision: v } })}>
                    <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{INDICES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {data.indexation.indiceRevision === "Manuel" && (
                  <div>
                    <Label className="text-xs font-medium">Taux révision annuel (%)</Label>
                    <Input type="number" value={data.indexation.tauxRevisionAnnuel} onChange={(e) => onChange({ indexation: { ...data.indexation, tauxRevisionAnnuel: parseFloat(e.target.value) || 0 } })} className="h-9 text-sm mt-1" />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card className="glow-border">
        <CardContent className="p-5">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">CA mensuel HT</div>
              <div className="text-2xl font-bold font-mono">{formatCurrency(caMensuel)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">CA total sur {dureeMois} mois</div>
              <div className="text-2xl font-bold font-mono">{formatCurrency(caTotal)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Après remise ({data.conditions.remiseGlobale}%)</div>
              <div className="text-2xl font-bold font-mono gradient-text">{formatCurrency(caTotal - remise)}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
