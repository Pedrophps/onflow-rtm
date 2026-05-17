
"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, GripVertical, Edit3, Trash2, Settings2, FileText, Type } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { cn } from "@/lib/utils";

const initialTemplates = [
  {
    id: "1",
    name: "Onboarding Standard B2B",
    stages: 6,
    activeClients: 42,
    lastUpdate: "Há 2 dias"
  },
  {
    id: "2",
    name: "Trial Premium",
    stages: 3,
    activeClients: 12,
    lastUpdate: "Há 1 semana"
  }
];

export default function OnboardingManagement() {
  const [selectedTemplate, setSelectedTemplate] = useState(initialTemplates[0]);

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold font-headline">Fluxos de Onboarding</h1>
            <p className="text-muted-foreground">Crie e organize as sequências de etapas para seus clientes.</p>
          </div>
          <Button className="gap-2">
            <Plus className="size-4" /> Novo Fluxo
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2 px-1">
              Seus Modelos
            </h3>
            {initialTemplates.map((template) => (
              <Card 
                key={template.id} 
                className={cn(
                  "cursor-pointer transition-all hover:border-primary/50",
                  selectedTemplate.id === template.id ? "border-primary ring-2 ring-primary/5" : ""
                )}
                onClick={() => setSelectedTemplate(template)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold">{template.name}</h4>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary" className="text-[10px]">{template.stages} etapas</Badge>
                        <Badge variant="outline" className="text-[10px]">{template.activeClients} clientes</Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="size-8"><Settings2 className="size-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-2xl border p-6 space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="text-xl font-bold font-headline">{selectedTemplate.name}</h3>
                  <p className="text-sm text-muted-foreground">Arraste para reordenar as etapas</p>
                </div>
                <Button variant="outline" size="sm">Editar Detalhes</Button>
              </div>

              <div className="space-y-3">
                {[
                  { title: "Boas Vindas", type: "Informação", req: "Cadastro básico" },
                  { title: "Contrato e Documentação", type: "Upload", req: "2 arquivos PDF" },
                  { title: "Configuração Técnica", type: "Formulário", req: "Dados de API" },
                  { title: "Call de Alinhamento", type: "Agendamento", req: "Data/Hora" },
                ].map((stage, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl border bg-white hover:shadow-sm transition-all group">
                    <GripVertical className="size-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
                    <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-sm">{stage.title}</h5>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <FileText className="size-3" /> {stage.type}
                        </span>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Type className="size-3" /> {stage.req}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="size-8"><Edit3 className="size-4" /></Button>
                      <Button variant="ghost" size="icon" className="size-8 text-destructive hover:bg-destructive/10"><Trash2 className="size-4" /></Button>
                    </div>
                  </div>
                ))}
                
                <Button variant="dashed" className="w-full py-8 border-2 rounded-xl text-muted-foreground hover:text-primary hover:border-primary gap-2">
                  <Plus className="size-4" /> Adicionar Nova Etapa
                </Button>
              </div>
            </div>

            <Card className="bg-muted/50 border-dashed border-2">
              <CardContent className="p-8 text-center space-y-4">
                <div className="size-12 rounded-full bg-white mx-auto flex items-center justify-center shadow-sm">
                  <BarChart3 className="size-6 text-primary" />
                </div>
                <div className="max-w-sm mx-auto space-y-1">
                  <h4 className="font-bold">Dica de Performance</h4>
                  <p className="text-sm text-muted-foreground">
                    Modelos com até 5 etapas têm uma taxa de conclusão 40% maior. Tente simplificar seu fluxo se possível.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
