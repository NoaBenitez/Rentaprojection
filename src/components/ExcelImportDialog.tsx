import { useState, useRef, useMemo, useCallback } from "react";
import * as XLSX from "xlsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, FileSpreadsheet, Settings2, Eye, ChevronRight, ChevronLeft, Check, AlertCircle } from "lucide-react";
import type { ColumnRole, ExcelColumnConfig, ExcelImportResult } from "@/types/simulation";
import { formatCurrency } from "@/utils/calculations";

interface ExcelImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (result: ExcelImportResult) => void;
}

type Step = "upload" | "mapping" | "preview";

const ROLE_LABELS: Record<ColumnRole, string> = {
  site: "Identifiant site",
  produit: "Produit (quantite)",
  date: "Colonne date",
  ignorer: "Ignorer",
};

const ROLE_COLORS: Record<ColumnRole, string> = {
  site: "bg-blue-100 text-blue-800",
  produit: "bg-green-100 text-green-800",
  date: "bg-amber-100 text-amber-800",
  ignorer: "bg-gray-100 text-gray-500",
};

export function ExcelImportDialog({ open, onClose, onImport }: ExcelImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [rawData, setRawData] = useState<string[][]>([]);
  const [columns, setColumns] = useState<ExcelColumnConfig[]>([]);
  const [hasHeader, setHasHeader] = useState(true);

  // Parse Excel file
  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array", cellDates: true });
      setSheetNames(workbook.SheetNames);
      const firstSheet = workbook.SheetNames[0];
      setSelectedSheet(firstSheet);
      loadSheet(workbook, firstSheet);
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const loadSheet = (workbook: XLSX.WorkBook, sheetName: string) => {
    const sheet = workbook.Sheets[sheetName];
    const json: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, dateNF: "dd/mm/yyyy" });
    const rows = json.map((row) => (row as unknown[]).map((cell) => (cell != null ? String(cell) : "")));
    setRawData(rows);

    // Init column configs from headers
    if (rows.length > 0) {
      const headerRow = rows[0];
      const cols: ExcelColumnConfig[] = headerRow.map((name, index) => ({
        index,
        name: name || `Col ${index + 1}`,
        role: index === 0 ? "site" as ColumnRole : "produit" as ColumnRole,
        prixUnitaire: 0,
        pourcentageParc: 100,
        seuilAnnees: 5,
        produitAssocieIndex: null,
      }));
      setColumns(cols);
    }
  };

  // Data rows (skip header if needed)
  const dataRows = useMemo(() => {
    if (!rawData.length) return [];
    return hasHeader ? rawData.slice(1) : rawData;
  }, [rawData, hasHeader]);

  // Product columns
  const productColumns = useMemo(() => columns.filter((c) => c.role === "produit"), [columns]);
  const dateColumns = useMemo(() => columns.filter((c) => c.role === "date"), [columns]);

  // Calculate results
  const results = useMemo<ExcelImportResult>(() => {
    const produits: ExcelImportResult["produits"] = [];
    const now = new Date();

    for (const col of productColumns) {
      let quantiteTotal = 0;
      let quantiteDateBonus = 0;

      for (const row of dataRows) {
        const cellValue = row[col.index];
        const qty = parseFloat(cellValue) || 0;
        quantiteTotal += qty;

        // Check linked date columns for age-based bonus
        for (const dateCol of dateColumns) {
          if (dateCol.produitAssocieIndex === col.index) {
            const dateStr = row[dateCol.index];
            if (dateStr) {
              const parsedDate = parseDate(dateStr);
              if (parsedDate) {
                const ageYears = (now.getTime() - parsedDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
                if (ageYears > dateCol.seuilAnnees) {
                  quantiteDateBonus += 1;
                }
              }
            }
          }
        }
      }

      const quantiteChiffree = Math.ceil(quantiteTotal * (col.pourcentageParc / 100)) + quantiteDateBonus;
      const coutTotal = quantiteChiffree * col.prixUnitaire;

      produits.push({
        designation: col.name,
        quantiteTotal,
        quantiteChiffree,
        prixUnitaire: col.prixUnitaire,
        coutTotal,
      });
    }

    return {
      produits,
      totalGeneral: produits.reduce((sum, p) => sum + p.coutTotal, 0),
    };
  }, [productColumns, dateColumns, dataRows]);

  const updateColumn = (index: number, updates: Partial<ExcelColumnConfig>) => {
    setColumns((prev) => prev.map((c) => (c.index === index ? { ...c, ...updates } : c)));
  };

  const handleImport = () => {
    onImport(results);
    handleReset();
  };

  const handleReset = () => {
    setStep("upload");
    setFileName("");
    setSheetNames([]);
    setSelectedSheet("");
    setRawData([]);
    setColumns([]);
    setHasHeader(true);
    onClose();
  };

  const canProceedToMapping = rawData.length > 0;
  const canProceedToPreview = productColumns.length > 0 && productColumns.some((c) => c.prixUnitaire > 0);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleReset(); }}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Import Excel - Parc materiel
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-sm">
          <StepBadge label="1. Fichier" active={step === "upload"} done={step !== "upload"} />
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <StepBadge label="2. Mapping" active={step === "mapping"} done={step === "preview"} />
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <StepBadge label="3. Resultat" active={step === "preview"} done={false} />
        </div>

        <Separator />

        <div className="flex-1 overflow-hidden">
          {/* STEP 1: Upload */}
          {step === "upload" && (
            <div className="space-y-4 py-4">
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="font-medium">Cliquez ou glissez votre fichier Excel</p>
                <p className="text-sm text-muted-foreground mt-1">.xlsx, .xls, .csv</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleFile}
                />
              </div>

              {fileName && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-accent/50 rounded-lg">
                    <FileSpreadsheet className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{fileName}</span>
                    <Badge variant="secondary" className="ml-auto">{dataRows.length} lignes</Badge>
                  </div>

                  {sheetNames.length > 1 && (
                    <div>
                      <Label className="text-xs font-medium">Feuille</Label>
                      <Select value={selectedSheet} onValueChange={setSelectedSheet}>
                        <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {sheetNames.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Preview first rows */}
                  {rawData.length > 0 && (
                    <div>
                      <Label className="text-xs font-medium mb-2 block">Apercu (5 premieres lignes)</Label>
                      <ScrollArea className="border rounded-lg">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                {rawData[0]?.map((cell, i) => (
                                  <TableHead key={i} className="text-xs whitespace-nowrap">{cell || `Col ${i + 1}`}</TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {rawData.slice(1, 6).map((row, ri) => (
                                <TableRow key={ri}>
                                  {rawData[0]?.map((_, ci) => (
                                    <TableCell key={ci} className="text-xs py-1.5 whitespace-nowrap">{row[ci] ?? ""}</TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Mapping */}
          {step === "mapping" && (
            <ScrollArea className="h-[55vh] pr-4">
              <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">
                  Assignez un role a chaque colonne, puis configurez les prix et pourcentages pour les produits.
                </p>

                {columns.map((col) => (
                  <Card key={col.index} className={`transition-all ${col.role === "ignorer" ? "opacity-50" : ""}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Column name + role */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={ROLE_COLORS[col.role]}>{col.name}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {dataRows.length} valeurs
                            </span>
                          </div>
                          <Select
                            value={col.role}
                            onValueChange={(v) => updateColumn(col.index, { role: v as ColumnRole })}
                          >
                            <SelectTrigger className="h-8 text-xs w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.keys(ROLE_LABELS) as ColumnRole[]).map((r) => (
                                <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Product config */}
                        {col.role === "produit" && (
                          <div className="flex items-center gap-3">
                            <div>
                              <Label className="text-[10px] text-muted-foreground">Prix unitaire</Label>
                              <div className="relative">
                                <Input
                                  type="number"
                                  value={col.prixUnitaire || ""}
                                  onChange={(e) => updateColumn(col.index, { prixUnitaire: parseFloat(e.target.value) || 0 })}
                                  className="h-8 text-sm w-28 pr-6"
                                  placeholder="0"
                                />
                                <span className="input-unit">EUR</span>
                              </div>
                            </div>
                            <div>
                              <Label className="text-[10px] text-muted-foreground">% du parc</Label>
                              <div className="relative">
                                <Input
                                  type="number"
                                  value={col.pourcentageParc}
                                  onChange={(e) => updateColumn(col.index, { pourcentageParc: parseFloat(e.target.value) || 0 })}
                                  className="h-8 text-sm w-20 pr-6"
                                  min={0}
                                  max={100}
                                />
                                <span className="input-unit">%</span>
                              </div>
                            </div>
                            <div className="text-right min-w-[80px]">
                              <Label className="text-[10px] text-muted-foreground">Total parc</Label>
                              <div className="text-sm font-mono font-bold">
                                {dataRows.reduce((sum, row) => sum + (parseFloat(row[col.index]) || 0), 0)}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Date config */}
                        {col.role === "date" && (
                          <div className="flex items-center gap-3">
                            <div>
                              <Label className="text-[10px] text-muted-foreground">Seuil (annees)</Label>
                              <Input
                                type="number"
                                value={col.seuilAnnees}
                                onChange={(e) => updateColumn(col.index, { seuilAnnees: parseFloat(e.target.value) || 0 })}
                                className="h-8 text-sm w-20"
                                min={0}
                              />
                            </div>
                            <div>
                              <Label className="text-[10px] text-muted-foreground">Produit lie</Label>
                              <Select
                                value={col.produitAssocieIndex != null ? String(col.produitAssocieIndex) : "none"}
                                onValueChange={(v) => updateColumn(col.index, { produitAssocieIndex: v === "none" ? null : parseInt(v) })}
                              >
                                <SelectTrigger className="h-8 text-xs w-44">
                                  <SelectValue placeholder="Choisir..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">Aucun</SelectItem>
                                  {productColumns.map((pc) => (
                                    <SelectItem key={pc.index} value={String(pc.index)}>{pc.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="text-right min-w-[80px]">
                              <Label className="text-[10px] text-muted-foreground">Depassees</Label>
                              <div className="text-sm font-mono font-bold text-amber-600">
                                {countExpiredDates(dataRows, col.index, col.seuilAnnees)}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Sample values */}
                      <div className="flex gap-1 mt-2">
                        {dataRows.slice(0, 5).map((row, i) => (
                          <span key={i} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                            {(row[col.index] ?? "").toString().slice(0, 20)}
                          </span>
                        ))}
                        {dataRows.length > 5 && (
                          <span className="text-[10px] text-muted-foreground">+{dataRows.length - 5}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* STEP 3: Preview */}
          {step === "preview" && (
            <ScrollArea className="h-[55vh] pr-4">
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  Recapitulatif de l'import
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead className="text-right">Parc total</TableHead>
                      <TableHead className="text-right">Qte chiffree</TableHead>
                      <TableHead className="text-right">Prix unit.</TableHead>
                      <TableHead className="text-right">Cout total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.produits.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{p.designation}</TableCell>
                        <TableCell className="text-right font-mono">{p.quantiteTotal}</TableCell>
                        <TableCell className="text-right font-mono">
                          {p.quantiteChiffree}
                          {p.quantiteChiffree !== p.quantiteTotal && (
                            <span className="text-[10px] text-muted-foreground ml-1">
                              ({Math.round((p.quantiteChiffree / p.quantiteTotal) * 100) || 0}%)
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(p.prixUnitaire)}</TableCell>
                        <TableCell className="text-right font-mono font-bold">{formatCurrency(p.coutTotal)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Card className="glow-border">
                  <CardContent className="p-4 flex items-center justify-between">
                    <span className="font-semibold">Total achats import</span>
                    <span className="text-xl font-bold font-mono gradient-text">{formatCurrency(results.totalGeneral)}</span>
                  </CardContent>
                </Card>

                {/* Detail per site if useful */}
                {dateColumns.some((d) => d.produitAssocieIndex != null) && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        Bonus vetuste (dates depassees)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      {dateColumns
                        .filter((d) => d.produitAssocieIndex != null)
                        .map((d) => {
                          const linked = columns.find((c) => c.index === d.produitAssocieIndex);
                          const count = countExpiredDates(dataRows, d.index, d.seuilAnnees);
                          return (
                            <p key={d.index}>
                              <strong>{d.name}</strong> : {count} site(s) avec date &gt; {d.seuilAnnees} ans
                              → +{count} unite(s) ajoutee(s) a <strong>{linked?.name}</strong>
                            </p>
                          );
                        })}
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        <Separator />

        <DialogFooter className="flex-row justify-between">
          <div>
            {step !== "upload" && (
              <Button variant="outline" onClick={() => setStep(step === "preview" ? "mapping" : "upload")}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Retour
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleReset}>Annuler</Button>
            {step === "upload" && (
              <Button onClick={() => setStep("mapping")} disabled={!canProceedToMapping}>
                Mapping <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
            {step === "mapping" && (
              <Button onClick={() => setStep("preview")} disabled={!canProceedToPreview}>
                Apercu <Eye className="h-4 w-4 ml-1" />
              </Button>
            )}
            {step === "preview" && (
              <Button onClick={handleImport} className="bg-primary">
                <Check className="h-4 w-4 mr-1" /> Importer {results.produits.length} article(s)
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StepBadge({ label, active, done }: { label: string; active: boolean; done: boolean }) {
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
      active ? "bg-primary text-primary-foreground" : done ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
    }`}>
      {done && <Check className="h-3 w-3 inline mr-1" />}
      {label}
    </span>
  );
}

function parseDate(str: string): Date | null {
  if (!str) return null;
  // Try ISO format
  const iso = new Date(str);
  if (!isNaN(iso.getTime())) return iso;
  // Try dd/mm/yyyy
  const parts = str.split(/[/\-\.]/);
  if (parts.length === 3) {
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const year = parseInt(parts[2]);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function countExpiredDates(rows: string[][], colIndex: number, seuilAnnees: number): number {
  const now = new Date();
  let count = 0;
  for (const row of rows) {
    const dateStr = row[colIndex];
    if (dateStr) {
      const d = parseDate(dateStr);
      if (d) {
        const age = (now.getTime() - d.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
        if (age > seuilAnnees) count++;
      }
    }
  }
  return count;
}
