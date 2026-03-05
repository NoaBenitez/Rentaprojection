import { useState, useMemo, useCallback } from "react";
import {
  type GlobalSettings,
  type SimulationState,
  type KPIData,
  type PLLine,
  DEFAULT_SETTINGS,
} from "@/types/simulation";
import { buildProfitAndLoss } from "@/utils/calculations";

const INITIAL_STATE: SimulationState = {
  prospect: {
    nom: "",
    secteur: "",
    localisation: "",
    dureeContrat: "1 an",
    typeContrat: "Forfait",
    margeCible: 15,
    probabiliteSignature: 50,
    notes: "",
  },
  interventions: {
    techniciens: [
      { id: "1", role: "Technicien standard", nombreRessources: 1, tauxHoraire: 45, heuresMois: 151 },
    ],
    deplacements: {
      nombreDeplacementsMois: 10,
      distanceMoyenne: 30,
      tauxKilometrique: 0.45,
      coutVehiculeFixe: 600,
    },
    astreintes: {
      heuresAstreinteMois: 0,
      majorationAstreinte: 25,
      heuresSupMois: 0,
      majorationHeuresSup: 25,
    },
    formation: {
      heuresFormation: 0,
      tauxHoraireFormation: 45,
    },
  },
  facturation: {
    lignes: [
      { id: "1", designation: "Prestation maintenance", type: "Main-d'œuvre", quantiteMois: 1, prixUnitaireHT: 8000, frequence: "Mensuel" },
    ],
    conditions: {
      remiseGlobale: 0,
      delaiPaiement: "30",
      penalitesRetard: 0,
    },
    indexation: {
      clauseRevision: false,
      indiceRevision: "INSEE BT01",
      tauxRevisionAnnuel: 2,
    },
  },
  achats: {
    articles: [],
    sousTraitance: [],
    stock: { valeurStockSecurite: 0, coutImmobilisationPct: 3 },
    tauxMargeDefaut: 30,
    alerteMargeActive: false,
    seuilAlerteMarge: 10,
  },
};

export function useSimulation() {
  const [settings, setSettings] = useState<GlobalSettings>(() => {
    const saved = localStorage.getItem("profitsim-settings");
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  const [state, setState] = useState<SimulationState>(INITIAL_STATE);

  const updateSettings = useCallback((newSettings: GlobalSettings) => {
    setSettings(newSettings);
    localStorage.setItem("profitsim-settings", JSON.stringify(newSettings));
  }, []);

  const updateProspect = useCallback((updates: Partial<SimulationState["prospect"]>) => {
    setState((prev) => ({ ...prev, prospect: { ...prev.prospect, ...updates } }));
  }, []);

  const updateInterventions = useCallback((updates: Partial<SimulationState["interventions"]>) => {
    setState((prev) => ({ ...prev, interventions: { ...prev.interventions, ...updates } }));
  }, []);

  const updateFacturation = useCallback((updates: Partial<SimulationState["facturation"]>) => {
    setState((prev) => ({ ...prev, facturation: { ...prev.facturation, ...updates } }));
  }, []);

  const updateAchats = useCallback((updates: Partial<SimulationState["achats"]>) => {
    setState((prev) => ({ ...prev, achats: { ...prev.achats, ...updates } }));
  }, []);

  const resetSimulation = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const { lines: plLines, kpis } = useMemo(
    () => buildProfitAndLoss(state, settings),
    [state, settings]
  );

  return {
    state,
    settings,
    plLines,
    kpis,
    updateSettings,
    updateProspect,
    updateInterventions,
    updateFacturation,
    updateAchats,
    resetSimulation,
    setState,
  };
}
