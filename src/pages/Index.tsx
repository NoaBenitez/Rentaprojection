import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppHeader } from "@/components/AppHeader";
import { KpiSidebar } from "@/components/KpiSidebar";
import { GlobalSettingsSheet } from "@/components/GlobalSettingsSheet";
import { TabProspect } from "@/components/tabs/TabProspect";
import { TabInterventions } from "@/components/tabs/TabInterventions";
import { TabFacturation } from "@/components/tabs/TabFacturation";
import { TabAchats } from "@/components/tabs/TabAchats";
import { TabResultats } from "@/components/tabs/TabResultats";
import { useSimulation } from "@/hooks/useSimulation";
import { toast } from "sonner";
import { Building2, Wrench, Receipt, Package, BarChart3 } from "lucide-react";
import type { TimeScale } from "@/types/simulation";
import { DUREE_CONTRAT_MOIS } from "@/types/simulation";

const Index = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("prospect");
  const [timeScale, setTimeScale] = useState<TimeScale>("mois");
  const sim = useSimulation();
  const dureeMois = DUREE_CONTRAT_MOIS[sim.state.prospect.dureeContrat] || 12;

  const handleSave = () => {
    toast.success("Simulation sauvegardée localement", {
      description: "Connectez Lovable Cloud pour sauvegarder en base de données.",
    });
  };

  const handleNewProspect = () => {
    sim.resetSimulation();
    toast.info("Nouvelle simulation créée");
  };

  const tabs = [
    { id: "prospect", label: "Prospect & Périmètre", icon: Building2 },
    { id: "interventions", label: "Interventions", icon: Wrench },
    { id: "facturation", label: "Facturation", icon: Receipt },
    { id: "achats", label: "Achats & Matières", icon: Package },
    { id: "resultats", label: "Résultats", icon: BarChart3 },
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <AppHeader
        kpis={sim.kpis}
        settings={sim.settings}
        timeScale={timeScale}
        dureeMois={dureeMois}
        onTimeScaleChange={setTimeScale}
        onOpenSettings={() => setSettingsOpen(true)}
        onNewProspect={handleNewProspect}
        onSave={handleSave}
      />

      <div className="flex flex-1 overflow-hidden">
        <KpiSidebar kpis={sim.kpis} settings={sim.settings} timeScale={timeScale} dureeMois={dureeMois} />

        <main className="flex-1 overflow-hidden flex flex-col">
          {/* Tab navigation as horizontal strip */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="border-b bg-card px-6">
              <TabsList className="h-11 bg-transparent p-0 gap-0">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="custom-tab relative h-11 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 gap-2 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground transition-colors"
                  >
                    <tab.icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-6 max-w-5xl animate-fade-in">
                <TabsContent value="prospect" className="mt-0">
                  <TabProspect data={sim.state.prospect} kpis={sim.kpis} onChange={sim.updateProspect} />
                </TabsContent>
                <TabsContent value="interventions" className="mt-0">
                  <TabInterventions
                    data={sim.state.interventions}
                    settings={sim.settings}
                    dureeContrat={sim.state.prospect.dureeContrat}
                    onChange={sim.updateInterventions}
                  />
                </TabsContent>
                <TabsContent value="facturation" className="mt-0">
                  <TabFacturation
                    data={sim.state.facturation}
                    dureeContrat={sim.state.prospect.dureeContrat}
                    onChange={sim.updateFacturation}
                  />
                </TabsContent>
                <TabsContent value="achats" className="mt-0">
                  <TabAchats
                    data={sim.state.achats}
                    settings={sim.settings}
                    onChange={sim.updateAchats}
                  />
                </TabsContent>
                <TabsContent value="resultats" className="mt-0">
                  <TabResultats
                    plLines={sim.plLines}
                    kpis={sim.kpis}
                    settings={sim.settings}
                    state={sim.state}
                    timeScale={timeScale}
                  />
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </main>
      </div>

      <GlobalSettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={sim.settings}
        onUpdate={sim.updateSettings}
      />
    </div>
  );
};

export default Index;
