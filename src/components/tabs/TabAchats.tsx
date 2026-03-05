import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Package, Wrench, Warehouse, FileSpreadsheet } from "lucide-react";
import { calculateArticleCost, calculateArticleRevenue, calculateArticleMargin, calculateSubcontractingCost, calculateStockCost, formatCurrency } from "@/utils/calculations";
import type { AchatsData, GlobalSettings, ExcelImportResult } from "@/types/simulation";
import { ExcelImportDialog } from "@/components/ExcelImportDialog";

interface TabAchatsProps {
  data: AchatsData;
  settings: GlobalSettings;
  onChange: (updates: Partial<AchatsData>) => void;
}

const FAMILLES = ["Pièce détachée", "Consommable", "Outil", "Sous-traitance", "Autre"];
const FREQUENCES = ["Mensuel", "Trimestriel", "Annuel", "Unique"];

export function TabAchats({ data, settings, onChange }: TabAchatsProps) {
  const [importOpen, setImportOpen] = useState(false);
  const coutAchats = calculateArticleCost(data.articles);
  const caRevente = calculateArticleRevenue(data.articles);
  const margeArticles = calculateArticleMargin(data.articles);
  const coutSousTraitance = calculateSubcontractingCost(data.sousTraitance);
  const coutStock = calculateStockCost(data.stock);

  const handleExcelImport = (result: ExcelImportResult) => {
    const newArticles = result.produits
      .filter((p) => p.coutTotal > 0)
      .map((p) => ({
        id: crypto.randomUUID(),
        reference: "IMP",
        designation: p.designation,
        famille: "Consommable" as const,
        quantiteMois: p.quantiteChiffree,
        prixAchatHT: p.prixUnitaire,
        prixReventeHT: p.prixUnitaire * (1 + data.tauxMargeDefaut / 100),
        frequence: "Annuel",
      }));
    onChange({ articles: [...data.articles, ...newArticles] });
  };

  const addArticle = () => {
    onChange({
      articles: [...data.articles, { id: crypto.randomUUID(), reference: "", designation: "", famille: "Consommable", quantiteMois: 1, prixAchatHT: 0, prixReventeHT: 0, frequence: "Mensuel" }],
    });
  };
  const removeArticle = (id: string) => onChange({ articles: data.articles.filter((a) => a.id !== id) });
  const updateArticle = (id: string, field: string, value: string | number) => {
    onChange({
      articles: data.articles.map((a) => {
        if (a.id !== id) return a;
        const updated = { ...a, [field]: value };
        if (field === "prixAchatHT" && typeof value === "number") {
          updated.prixReventeHT = value * (1 + data.tauxMargeDefaut / 100);
        }
        return updated;
      }),
    });
  };

  const addSousTraitance = () => {
    onChange({ sousTraitance: [...data.sousTraitance, { id: crypto.randomUUID(), prestataire: "", typePrestation: "", coutMensuel: 0 }] });
  };
  const removeSousTraitance = (id: string) => onChange({ sousTraitance: data.sousTraitance.filter((s) => s.id !== id) });
  const updateST = (id: string, field: string, value: string | number) => {
    onChange({ sousTraitance: data.sousTraitance.map((s) => s.id === id ? { ...s, [field]: value } : s) });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold">Achats & Matières</h2>
          <p className="text-sm text-muted-foreground mt-1">Gérez les articles, fournitures et sous-traitance prévisionnels.</p>
        </div>
        <Button variant="outline" onClick={() => setImportOpen(true)} className="gap-2">
          <FileSpreadsheet className="h-4 w-4" /> Importer Excel
        </Button>
      </div>

      <ExcelImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleExcelImport}
      />

      {/* Articles */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" /> Articles & Fournitures
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 overflow-x-auto">
            <div className="grid grid-cols-[80px_1fr_110px_70px_80px_80px_70px_100px_40px] gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 min-w-[800px]">
              <span>Réf.</span><span>Désignation</span><span>Famille</span><span>Qté/mois</span><span>Achat €</span><span>Revente €</span><span>Marge</span><span>Fréquence</span><span></span>
            </div>
            {data.articles.map((a) => {
              const marge = a.prixReventeHT > 0 ? ((a.prixReventeHT - a.prixAchatHT) / a.prixReventeHT * 100) : 0;
              const margeAlert = data.alerteMargeActive && marge < data.seuilAlerteMarge;
              return (
                <div key={a.id} className="grid grid-cols-[80px_1fr_110px_70px_80px_80px_70px_100px_40px] gap-2 items-center min-w-[800px] animate-fade-in">
                  <Input value={a.reference} onChange={(e) => updateArticle(a.id, "reference", e.target.value)} className="h-9 text-sm" placeholder="REF" />
                  <Input value={a.designation} onChange={(e) => updateArticle(a.id, "designation", e.target.value)} className="h-9 text-sm" />
                  <Select value={a.famille} onValueChange={(v) => updateArticle(a.id, "famille", v)}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{FAMILLES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input type="number" value={a.quantiteMois} onChange={(e) => updateArticle(a.id, "quantiteMois", parseFloat(e.target.value) || 0)} className="h-9 text-sm text-right" />
                  <Input type="number" value={a.prixAchatHT} onChange={(e) => updateArticle(a.id, "prixAchatHT", parseFloat(e.target.value) || 0)} className="h-9 text-sm text-right" />
                  <Input type="number" value={a.prixReventeHT} onChange={(e) => updateArticle(a.id, "prixReventeHT", parseFloat(e.target.value) || 0)} className="h-9 text-sm text-right" />
                  <span className={`text-xs font-mono text-right font-bold ${margeAlert ? "profit-negative" : "profit-positive"}`}>{marge.toFixed(1)}%</span>
                  <Select value={a.frequence} onValueChange={(v) => updateArticle(a.id, "frequence", v)}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{FREQUENCES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-loss-muted" onClick={() => removeArticle(a.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </div>
              );
            })}
            {data.articles.length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Aucun article. Cliquez ci-dessous pour en ajouter.
              </div>
            )}
            <Button variant="outline" size="sm" onClick={addArticle} className="mt-2">
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Ajouter un article
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sous-traitance */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Wrench className="h-4 w-4 text-primary" /> Sous-traitance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.sousTraitance.map((s) => (
                <div key={s.id} className="grid grid-cols-[1fr_1fr_120px_40px] gap-2 items-center animate-fade-in">
                  <Input value={s.prestataire} onChange={(e) => updateST(s.id, "prestataire", e.target.value)} className="h-9 text-sm" placeholder="Prestataire" />
                  <Input value={s.typePrestation} onChange={(e) => updateST(s.id, "typePrestation", e.target.value)} className="h-9 text-sm" placeholder="Type" />
                  <Input type="number" value={s.coutMensuel} onChange={(e) => updateST(s.id, "coutMensuel", parseFloat(e.target.value) || 0)} className="h-9 text-sm text-right" />
                  <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-loss-muted" onClick={() => removeSousTraitance(s.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </div>
              ))}
              {data.sousTraitance.length === 0 && (
                <div className="text-center py-4 text-sm text-muted-foreground">Aucune ligne de sous-traitance.</div>
              )}
              <Button variant="outline" size="sm" onClick={addSousTraitance} className="mt-1">
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Ajouter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stock & Marge */}
        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Warehouse className="h-4 w-4 text-primary" /> Stock de sécurité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs font-medium">Valeur stock (€)</Label>
                <Input type="number" value={data.stock.valeurStockSecurite} onChange={(e) => onChange({ stock: { ...data.stock, valeurStockSecurite: parseFloat(e.target.value) || 0 } })} className="h-9 text-sm mt-1" />
              </div>
              <div>
                <Label className="text-xs font-medium">Coût immobilisation (% /an)</Label>
                <Input type="number" value={data.stock.coutImmobilisationPct} onChange={(e) => onChange({ stock: { ...data.stock, coutImmobilisationPct: parseFloat(e.target.value) || 0 } })} className="h-9 text-sm mt-1" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4 space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <Label className="text-xs font-medium">Marge par défaut articles</Label>
                  <span className="text-xs font-mono font-bold text-primary">{data.tauxMargeDefaut}%</span>
                </div>
                <Slider value={[data.tauxMargeDefaut]} onValueChange={([v]) => onChange({ tauxMargeDefaut: v })} min={0} max={80} step={1} />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={data.alerteMargeActive} onCheckedChange={(v) => onChange({ alerteMargeActive: v })} />
                <Label className="text-xs font-medium">Alerte si marge &lt; {data.seuilAlerteMarge}%</Label>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Summary */}
      <Card className="glow-border">
        <CardContent className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <SummaryMetric label="Coût achats/mois" value={formatCurrency(coutAchats)} />
            <SummaryMetric label="Revente articles/mois" value={formatCurrency(caRevente)} />
            <SummaryMetric label="Marge articles" value={formatCurrency(margeArticles)} highlight />
            <SummaryMetric label="Sous-traitance/mois" value={formatCurrency(coutSousTraitance)} />
            <SummaryMetric label="Immobilisation/mois" value={formatCurrency(coutStock)} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryMetric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1">{label}</div>
      <div className={`text-lg font-bold font-mono ${highlight ? "gradient-text" : ""}`}>{value}</div>
    </div>
  );
}
