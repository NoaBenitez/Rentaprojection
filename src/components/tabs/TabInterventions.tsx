import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Users, Car, Clock, GraduationCap } from "lucide-react";
import {
  calculateLaborCost,
  calculateTravelCost,
  calculateAstreinteCost,
  calculateTrainingCost,
  formatCurrency,
} from "@/utils/calculations";
import type { InterventionsData, GlobalSettings } from "@/types/simulation";
import { DUREE_CONTRAT_MOIS } from "@/types/simulation";

interface TabInterventionsProps {
  data: InterventionsData;
  settings: GlobalSettings;
  dureeContrat: string;
  onChange: (updates: Partial<InterventionsData>) => void;
}

export function TabInterventions({ data, settings, dureeContrat, onChange }: TabInterventionsProps) {
  const dureeMois = DUREE_CONTRAT_MOIS[dureeContrat] || 12;

  const addTechnicien = () => {
    onChange({
      techniciens: [
        ...data.techniciens,
        { id: crypto.randomUUID(), role: "Technicien", nombreRessources: 1, tauxHoraire: settings.tauxHoraireMOStandard, heuresMois: 151 },
      ],
    });
  };

  const removeTechnicien = (id: string) => {
    onChange({ techniciens: data.techniciens.filter((t) => t.id !== id) });
  };

  const updateTech = (id: string, field: string, value: number | string) => {
    onChange({
      techniciens: data.techniciens.map((t) =>
        t.id === id ? { ...t, [field]: value } : t
      ),
    });
  };

  const coutMO = calculateLaborCost(data.techniciens, settings.chargesSocialesPatronales);
  const coutDeplacements = calculateTravelCost(data.deplacements);
  const avgTaux = data.techniciens.length > 0
    ? data.techniciens.reduce((s, t) => s + t.tauxHoraire, 0) / data.techniciens.length
    : settings.tauxHoraireMOStandard;
  const coutAstreintes = calculateAstreinteCost(data.astreintes, avgTaux);
  const coutFormation = calculateTrainingCost(data.formation, dureeMois);
  const totalMensuel = coutMO + coutDeplacements + coutAstreintes + coutFormation;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold">Interventions prévisionnelles</h2>
        <p className="text-sm text-muted-foreground mt-1">Estimez les coûts de main-d'œuvre, déplacements et formation.</p>
      </div>

      {/* Techniciens */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Techniciens & Ressources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_80px_90px_90px_100px_40px] gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
              <span>Rôle</span><span>Ressources</span><span>Taux (€/h)</span><span>Heures/mois</span><span>Coût/mois</span><span></span>
            </div>
            {data.techniciens.map((t) => (
              <div key={t.id} className="grid grid-cols-[1fr_80px_90px_90px_100px_40px] gap-2 items-center animate-fade-in">
                <Input value={t.role} onChange={(e) => updateTech(t.id, "role", e.target.value)} className="h-9 text-sm" />
                <Input type="number" value={t.nombreRessources} onChange={(e) => updateTech(t.id, "nombreRessources", parseInt(e.target.value) || 0)} className="h-9 text-sm text-right" />
                <Input type="number" value={t.tauxHoraire} onChange={(e) => updateTech(t.id, "tauxHoraire", parseFloat(e.target.value) || 0)} className="h-9 text-sm text-right" />
                <Input type="number" value={t.heuresMois} onChange={(e) => updateTech(t.id, "heuresMois", parseFloat(e.target.value) || 0)} className="h-9 text-sm text-right" />
                <span className="text-sm font-mono font-semibold text-right">{formatCurrency(t.nombreRessources * t.heuresMois * t.tauxHoraire)}</span>
                <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-loss-muted" onClick={() => removeTechnicien(t.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addTechnicien} className="mt-2">
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Ajouter un profil
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Déplacements */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Car className="h-4 w-4 text-primary" /> Déplacements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <SmallField label="Déplacements/mois" value={data.deplacements.nombreDeplacementsMois} onChange={(v) => onChange({ deplacements: { ...data.deplacements, nombreDeplacementsMois: v } })} />
            <SmallField label="Distance moy. (km)" value={data.deplacements.distanceMoyenne} onChange={(v) => onChange({ deplacements: { ...data.deplacements, distanceMoyenne: v } })} />
            <SmallField label="Taux km (€/km)" value={data.deplacements.tauxKilometrique} onChange={(v) => onChange({ deplacements: { ...data.deplacements, tauxKilometrique: v } })} step={0.01} />
            <SmallField label="Coût véhicule fixe/mois (€)" value={data.deplacements.coutVehiculeFixe} onChange={(v) => onChange({ deplacements: { ...data.deplacements, coutVehiculeFixe: v } })} />
            <div className="border-t pt-2 flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Coût mensuel</span>
              <span className="font-mono font-bold text-sm">{formatCurrency(coutDeplacements)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Astreintes */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Astreintes & Heures sup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SmallField label="Heures astreinte/mois" value={data.astreintes.heuresAstreinteMois} onChange={(v) => onChange({ astreintes: { ...data.astreintes, heuresAstreinteMois: v } })} />
            <div>
              <div className="flex justify-between mb-1">
                <Label className="text-xs">Majoration astreinte</Label>
                <span className="text-xs font-mono font-bold text-primary">{data.astreintes.majorationAstreinte}%</span>
              </div>
              <Slider value={[data.astreintes.majorationAstreinte]} onValueChange={([v]) => onChange({ astreintes: { ...data.astreintes, majorationAstreinte: v } })} min={0} max={100} step={5} />
            </div>
            <SmallField label="Heures sup/mois" value={data.astreintes.heuresSupMois} onChange={(v) => onChange({ astreintes: { ...data.astreintes, heuresSupMois: v } })} />
            <div>
              <div className="flex justify-between mb-1">
                <Label className="text-xs">Majoration heures sup</Label>
                <span className="text-xs font-mono font-bold text-primary">{data.astreintes.majorationHeuresSup}%</span>
              </div>
              <Slider value={[data.astreintes.majorationHeuresSup]} onValueChange={([v]) => onChange({ astreintes: { ...data.astreintes, majorationHeuresSup: v } })} min={0} max={100} step={5} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Formation */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" /> Formation & Onboarding
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <SmallField label="Heures de formation (one-time)" value={data.formation.heuresFormation} onChange={(v) => onChange({ formation: { ...data.formation, heuresFormation: v } })} />
            <SmallField label="Taux horaire formation (€/h)" value={data.formation.tauxHoraireFormation} onChange={(v) => onChange({ formation: { ...data.formation, tauxHoraireFormation: v } })} />
          </div>
          <div className="border-t mt-3 pt-2 flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Total: {formatCurrency(data.formation.heuresFormation * data.formation.tauxHoraireFormation)} — Amorti sur {dureeMois} mois</span>
            <span className="font-mono font-bold text-sm">{formatCurrency(coutFormation)}/mois</span>
          </div>
        </CardContent>
      </Card>

      {/* Total Summary */}
      <Card className="glow-border">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Total coût main-d'œuvre mensuel</div>
              <div className="text-3xl font-bold font-mono gradient-text">{formatCurrency(totalMensuel)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Sur {dureeMois} mois</div>
              <div className="text-2xl font-bold font-mono">{formatCurrency(totalMensuel * dureeMois)}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SmallField({ label, value, onChange, step }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <div>
      <Label className="text-xs font-medium">{label}</Label>
      <Input type="number" value={value} step={step} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} className="h-9 text-sm mt-1" />
    </div>
  );
}
