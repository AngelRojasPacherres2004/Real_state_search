import { useState } from "react";
import { trpc } from "@/lib/trpc";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Mail, Phone, Trash2, FileDown } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const STATUS_LABELS: Record<string, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  calificado: "Calificado",
  convertido: "Convertido",
  descartado: "Descartado",
};

const STATUS_COLORS: Record<string, string> = {
  nuevo: "bg-blue-500",
  contactado: "bg-yellow-500",
  calificado: "bg-purple-500",
  convertido: "bg-green-500",
  descartado: "bg-gray-500",
};

export default function Leads() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [interestedIn, setInterestedIn] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");

  const leadsQuery = trpc.leads.list.useQuery();

  const createLeadMutation = trpc.leads.create.useMutation({
    onSuccess: () => {
      toast.success("Lead creado exitosamente");
      leadsQuery.refetch();
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error("Error al crear lead");
    },
  });

  const updateLeadMutation = trpc.leads.update.useMutation({
    onSuccess: () => {
      toast.success("Lead actualizado");
      leadsQuery.refetch();
    },
    onError: () => {
      toast.error("Error al actualizar lead");
    },
  });

  const deleteLeadMutation = trpc.leads.delete.useMutation({
    onSuccess: () => {
      toast.success("Lead eliminado");
      leadsQuery.refetch();
    },
    onError: () => {
      toast.error("Error al eliminar lead");
    },
  });

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setInterestedIn("");
    setSource("");
    setNotes("");
  };

  const handleCreateLead = () => {
    if (!name.trim()) {
      toast.error("Por favor ingresa el nombre del lead");
      return;
    }

    createLeadMutation.mutate({
      name,
      email: email || undefined,
      phone: phone || undefined,
      interestedIn: interestedIn || undefined,
      source: source || undefined,
      notes: notes || undefined,
    });
  };

  const handleUpdateStatus = (leadId: number, status: string) => {
    updateLeadMutation.mutate({
      id: leadId,
      status: status as any,
    });
  };

  const handleDeleteLead = (leadId: number) => {
    deleteLeadMutation.mutate({ id: leadId });
  };

  const exportMutation = trpc.export.leads.useMutation({
    onSuccess: (data) => {
      // Convert base64 to blob and download
      const byteCharacters = atob(data.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("Leads exportados a Excel");
    },
    onError: () => {
      toast.error("Error al exportar leads");
    },
  });

  const handleExportToExcel = () => {
    exportMutation.mutate();
  };

  if (leadsQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando leads...</p>
        </div>
      </div>
    );
  }

  const leads = leadsQuery.data || [];

  const leadsByStatus = {
    nuevo: leads.filter((l: any) => l.lead.status === 'nuevo'),
    contactado: leads.filter((l: any) => l.lead.status === 'contactado'),
    calificado: leads.filter((l: any) => l.lead.status === 'calificado'),
    convertido: leads.filter((l: any) => l.lead.status === 'convertido'),
    descartado: leads.filter((l: any) => l.lead.status === 'descartado'),
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Gestión de Leads</h1>
            <p className="text-muted-foreground">
              Captura y gestiona clientes potenciales interesados en propiedades
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleExportToExcel}
              disabled={exportMutation.isPending}
            >
              <FileDown className="h-4 w-4 mr-2" />
              {exportMutation.isPending ? "Exportando..." : "Exportar a Excel"}
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Lead
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Lead</DialogTitle>
                  <DialogDescription>
                    Registra la información del cliente potencial
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="leadName">Nombre Completo *</Label>
                    <Input
                      id="leadName"
                      placeholder="Juan Pérez"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="leadEmail">Email</Label>
                      <Input
                        id="leadEmail"
                        type="email"
                        placeholder="juan@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="leadPhone">Teléfono</Label>
                      <Input
                        id="leadPhone"
                        placeholder="+51 999 999 999"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="leadInterested">Interesado en</Label>
                    <Input
                      id="leadInterested"
                      placeholder="Departamento 2 dorm. en San Isidro"
                      value={interestedIn}
                      onChange={(e) => setInterestedIn(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="leadSource">Fuente</Label>
                    <Input
                      id="leadSource"
                      placeholder="Portal web, referido, etc."
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="leadNotes">Notas</Label>
                    <Textarea
                      id="leadNotes"
                      placeholder="Información adicional sobre el lead..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateLead} disabled={createLeadMutation.isPending}>
                    {createLeadMutation.isPending ? "Creando..." : "Crear Lead"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {Object.entries(leadsByStatus).map(([status, statusLeads]) => (
            <Card key={status}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">{STATUS_LABELS[status]}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statusLeads.length}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {leads.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No tienes leads registrados</h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                Comienza a capturar información de clientes potenciales interesados en tus propiedades
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Lead
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Todos los Leads</CardTitle>
              <CardDescription>
                {leads.length} lead{leads.length !== 1 ? 's' : ''} registrado{leads.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold">Nombre</th>
                      <th className="text-left p-3 font-semibold">Contacto</th>
                      <th className="text-left p-3 font-semibold">Interesado en</th>
                      <th className="text-left p-3 font-semibold">Estado</th>
                      <th className="text-left p-3 font-semibold">Fecha</th>
                      <th className="text-right p-3 font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map(({ lead, property }: any) => (
                      <tr key={lead.id} className="border-b hover:bg-muted/50">
                        <td className="p-3 font-medium">{lead.name}</td>
                        <td className="p-3">
                          <div className="space-y-1">
                            {lead.email && (
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                <a href={`mailto:${lead.email}`} className="hover:underline">
                                  {lead.email}
                                </a>
                              </div>
                            )}
                            {lead.phone && (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                <a href={`tel:${lead.phone}`} className="hover:underline">
                                  {lead.phone}
                                </a>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-sm">
                          {lead.interestedIn || property?.title || '-'}
                        </td>
                        <td className="p-3">
                          <Select
                            value={lead.status}
                            onValueChange={(value) => handleUpdateStatus(lead.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {format(new Date(lead.createdAt), 'dd MMM yyyy', { locale: es })}
                        </td>
                        <td className="p-3 text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar lead?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. El lead será eliminado permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteLead(lead.id)}>
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
