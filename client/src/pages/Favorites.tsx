import { useState } from "react";
import { trpc } from "@/lib/trpc";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, Bed, Bath, Maximize, ExternalLink, TrendingDown, TrendingUp, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Favorites() {
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [editingNotes, setEditingNotes] = useState<{propertyId: number, notes: string} | null>(null);
  
  const favoritesQuery = trpc.favorites.list.useQuery();
  const removeFavoriteMutation = trpc.favorites.remove.useMutation({
    onSuccess: () => {
      toast.success("Propiedad eliminada de favoritos");
      favoritesQuery.refetch();
    },
    onError: () => {
      toast.error("Error al eliminar de favoritos");
    },
  });

  const updateNotesMutation = trpc.favorites.updateNotes.useMutation({
    onSuccess: () => {
      toast.success("Notas actualizadas");
      favoritesQuery.refetch();
      setEditingNotes(null);
    },
    onError: () => {
      toast.error("Error al actualizar notas");
    },
  });

  const priceHistoryQuery = trpc.properties.getPriceHistory.useQuery(
    { propertyId: selectedPropertyId! },
    { enabled: !!selectedPropertyId }
  );

  const handleRemoveFavorite = (propertyId: number) => {
    removeFavoriteMutation.mutate({ propertyId });
  };

  const formatPriceHistory = (history: any[]) => {
    return history.map(item => ({
      date: format(new Date(item.recordedAt), 'dd MMM', { locale: es }),
      precio: parseFloat(item.price),
    })).reverse();
  };

  if (favoritesQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando favoritos...</p>
        </div>
      </div>
    );
  }

  const favorites = favoritesQuery.data || [];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Mis Favoritos</h1>
          <p className="text-muted-foreground">
            Propiedades guardadas y seguimiento de cambios de precio
          </p>
        </div>

        {favorites.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Heart className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No tienes favoritos aún</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Agrega propiedades a favoritos desde la búsqueda para hacer seguimiento de sus precios
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map(({ favorite, property }: any) => (
              <Card key={favorite.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-48 bg-muted">
                  {property.imageUrl && (
                    <img
                      src={property.imageUrl}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <Badge className="absolute top-2 left-2" variant="secondary">
                    {property.portal}
                  </Badge>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-2 right-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar de favoritos?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción eliminará la propiedad de tu lista de favoritos y dejará de hacer seguimiento de su precio.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleRemoveFavorite(property.id)}>
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">{property.title}</h3>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{property.district}</span>
                  </div>

                  <div className="flex items-center gap-4 mb-3 text-sm">
                    {property.bedrooms && (
                      <div className="flex items-center gap-1">
                        <Bed className="h-4 w-4 text-muted-foreground" />
                        <span>{property.bedrooms}</span>
                      </div>
                    )}
                    {property.bathrooms && (
                      <div className="flex items-center gap-1">
                        <Bath className="h-4 w-4 text-muted-foreground" />
                        <span>{property.bathrooms}</span>
                      </div>
                    )}
                    {property.area && (
                      <div className="flex items-center gap-1">
                        <Maximize className="h-4 w-4 text-muted-foreground" />
                        <span>{property.area}m²</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-2xl font-bold text-primary">
                        ${parseFloat(property.price).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {property.operationType === 'alquiler' ? 'por mes' : 'precio total'}
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    {favorite.notes ? (
                      <div className="p-2 bg-muted rounded text-sm">
                        <p className="text-muted-foreground">{favorite.notes}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Sin notas</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Dialog open={editingNotes?.propertyId === property.id} onOpenChange={(open) => !open && setEditingNotes(null)}>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setEditingNotes({propertyId: property.id, notes: favorite.notes || ""})}
                        >
                          Editar Notas
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Editar Notas</DialogTitle>
                          <DialogDescription>Agrega comentarios privados sobre esta propiedad</DialogDescription>
                        </DialogHeader>
                        <textarea
                          className="w-full min-h-[100px] p-2 border rounded"
                          value={editingNotes?.notes || ""}
                          onChange={(e) => setEditingNotes(prev => prev ? {...prev, notes: e.target.value} : null)}
                          placeholder="Escribe tus notas aquí..."
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setEditingNotes(null)}>Cancelar</Button>
                          <Button onClick={() => {
                            if (editingNotes) {
                              updateNotesMutation.mutate({
                                propertyId: editingNotes.propertyId,
                                notes: editingNotes.notes || null
                              });
                            }
                          }}>
                            Guardar
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => setSelectedPropertyId(property.id)}
                        >
                          Ver Historial
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>Historial de Precios</DialogTitle>
                          <DialogDescription>{property.title}</DialogDescription>
                        </DialogHeader>
                        {priceHistoryQuery.isLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          </div>
                        ) : priceHistoryQuery.data && priceHistoryQuery.data.length > 0 ? (
                          <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={formatPriceHistory(priceHistoryQuery.data)}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip 
                                  formatter={(value: number) => `$${value.toLocaleString()}`}
                                  labelFormatter={(label) => `Fecha: ${label}`}
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="precio" 
                                  stroke="hsl(var(--primary))" 
                                  strokeWidth={2}
                                  dot={{ fill: 'hsl(var(--primary))' }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            No hay historial de precios disponible
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    <Button size="sm" variant="default" asChild>
                      <a href={property.sourceUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Ver
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
