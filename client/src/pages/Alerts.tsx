import { useState } from "react";
import { trpc } from "@/lib/trpc";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Bell, Plus, Trash2, Edit } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const DISTRICTS = [
  "San Isidro",
  "Pueblo Libre",
  "Jesús María",
  "Lince",
  "Magdalena",
  "Miraflores",
  "San Borja",
  "Barranco",
  "Surco",
  "La Molina",
];

export default function Alerts() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [alertName, setAlertName] = useState("");
  const [operationType, setOperationType] = useState<"alquiler" | "venta">("alquiler");
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minBedrooms, setMinBedrooms] = useState("");
  const [maxBedrooms, setMaxBedrooms] = useState("");

  const alertsQuery = trpc.alerts.list.useQuery();
  
  const checkNowMutation = trpc.alerts.checkNow.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: () => {
      toast.error("Error al verificar alertas");
    },
  });
  
  const createAlertMutation = trpc.alerts.create.useMutation({
    onSuccess: () => {
      toast.success("Alerta creada exitosamente");
      alertsQuery.refetch();
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error("Error al crear alerta");
    },
  });

  const updateAlertMutation = trpc.alerts.update.useMutation({
    onSuccess: () => {
      toast.success("Alerta actualizada");
      alertsQuery.refetch();
    },
    onError: () => {
      toast.error("Error al actualizar alerta");
    },
  });

  const deleteAlertMutation = trpc.alerts.delete.useMutation({
    onSuccess: () => {
      toast.success("Alerta eliminada");
      alertsQuery.refetch();
    },
    onError: () => {
      toast.error("Error al eliminar alerta");
    },
  });

  const resetForm = () => {
    setAlertName("");
    setOperationType("alquiler");
    setSelectedDistricts([]);
    setMinPrice("");
    setMaxPrice("");
    setMinBedrooms("");
    setMaxBedrooms("");
  };

  const toggleDistrict = (district: string) => {
    setSelectedDistricts(prev =>
      prev.includes(district)
        ? prev.filter(d => d !== district)
        : [...prev, district]
    );
  };

  const handleCreateAlert = () => {
    if (!alertName.trim()) {
      toast.error("Por favor ingresa un nombre para la alerta");
      return;
    }

    createAlertMutation.mutate({
      name: alertName,
      operationType,
      districts: selectedDistricts.length > 0 ? selectedDistricts : undefined,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      minBedrooms: minBedrooms ? parseInt(minBedrooms) : undefined,
      maxBedrooms: maxBedrooms ? parseInt(maxBedrooms) : undefined,
    });
  };

  const handleToggleAlert = (alertId: number, isActive: boolean) => {
    updateAlertMutation.mutate({ id: alertId, isActive });
  };

  const handleDeleteAlert = (alertId: number) => {
    deleteAlertMutation.mutate({ id: alertId });
  };

  if (alertsQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando alertas...</p>
        </div>
      </div>
    );
  }

  const alerts = alertsQuery.data || [];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Mis Alertas</h1>
            <p className="text-muted-foreground">
              Recibe notificaciones cuando aparezcan propiedades que coincidan con tus criterios
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => checkNowMutation.mutate()}
              disabled={checkNowMutation.isPending}
            >
              <Bell className="h-4 w-4 mr-2" />
              {checkNowMutation.isPending ? "Verificando..." : "Verificar Ahora"}
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Alerta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Nueva Alerta</DialogTitle>
                <DialogDescription>
                  Define los criterios de búsqueda y te notificaremos cuando aparezcan nuevas propiedades
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="alertName">Nombre de la Alerta *</Label>
                  <Input
                    id="alertName"
                    placeholder="Ej: Departamentos en San Isidro"
                    value={alertName}
                    onChange={(e) => setAlertName(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Tipo de Operación</Label>
                  <Select value={operationType} onValueChange={(v) => setOperationType(v as "alquiler" | "venta")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alquiler">Alquiler</SelectItem>
                      <SelectItem value="venta">Venta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-3 block">Distritos</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded p-3">
                    {DISTRICTS.map(district => (
                      <div key={district} className="flex items-center space-x-2">
                        <Checkbox
                          id={`alert-${district}`}
                          checked={selectedDistricts.includes(district)}
                          onCheckedChange={() => toggleDistrict(district)}
                        />
                        <label
                          htmlFor={`alert-${district}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {district}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="alertMinPrice">Precio Mínimo (USD)</Label>
                    <Input
                      id="alertMinPrice"
                      type="number"
                      placeholder="800"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="alertMaxPrice">Precio Máximo (USD)</Label>
                    <Input
                      id="alertMaxPrice"
                      type="number"
                      placeholder="2000"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="alertMinBedrooms">Dormitorios Mínimos</Label>
                    <Input
                      id="alertMinBedrooms"
                      type="number"
                      placeholder="1"
                      value={minBedrooms}
                      onChange={(e) => setMinBedrooms(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="alertMaxBedrooms">Dormitorios Máximos</Label>
                    <Input
                      id="alertMaxBedrooms"
                      type="number"
                      placeholder="4"
                      value={maxBedrooms}
                      onChange={(e) => setMaxBedrooms(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateAlert} disabled={createAlertMutation.isPending}>
                  {createAlertMutation.isPending ? "Creando..." : "Crear Alerta"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {alerts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No tienes alertas configuradas</h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                Crea una alerta para recibir notificaciones cuando aparezcan propiedades que coincidan con tus criterios
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Alerta
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {alerts.map((alert: any) => {
              const districts = alert.districts ? JSON.parse(alert.districts) : [];
              
              return (
                <Card key={alert.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{alert.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {alert.operationType === 'alquiler' ? 'Alquiler' : 'Venta'}
                        </CardDescription>
                      </div>
                      <Switch
                        checked={alert.isActive}
                        onCheckedChange={(checked) => handleToggleAlert(alert.id, checked)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {districts.length > 0 && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Distritos</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {districts.map((district: string) => (
                            <Badge key={district} variant="secondary" className="text-xs">
                              {district}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {(alert.minPrice || alert.maxPrice) && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Rango de Precio</Label>
                        <p className="text-sm mt-1">
                          {alert.minPrice && `$${parseFloat(alert.minPrice).toLocaleString()}`}
                          {alert.minPrice && alert.maxPrice && ' - '}
                          {alert.maxPrice && `$${parseFloat(alert.maxPrice).toLocaleString()}`}
                        </p>
                      </div>
                    )}

                    {(alert.minBedrooms || alert.maxBedrooms) && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Dormitorios</Label>
                        <p className="text-sm mt-1">
                          {alert.minBedrooms && `${alert.minBedrooms}`}
                          {alert.minBedrooms && alert.maxBedrooms && ' - '}
                          {alert.maxBedrooms && `${alert.maxBedrooms}`}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Eliminar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar alerta?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. La alerta será eliminada permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteAlert(alert.id)}>
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
