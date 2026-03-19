import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import Navigation from "@/components/Navigation";
import PropertyDetailModal from "@/components/PropertyDetailModal";
import PropertyComparator from "@/components/PropertyComparator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Building2, MapPin, DollarSign, Bed, Bath, Maximize, Heart, ExternalLink, Filter, Save, History, Trash2, Map, List, MessageCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { MapView } from "@/components/Map";

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
  "Lima Cercado",
  "Bellavista",
  "Surquillo",
  "Ate",
  "La Victoria",
  "Breña",
];

const PORTALS = [
  { id: "urbania", name: "Urbania" },
  { id: "babilonia", name: "Babilonia" },
  { id: "infocasas", name: "Infocasas" },
  { id: "properati", name: "Properati" },
  { id: "adondevivir", name: "Adondevivir" },
  { id: "fazwaz", name: "FazWaz" },
  { id: "ubicasa", name: "Ubicasa" },
  { id: "losportales", name: "Los Portales" },
  { id: "laencontre", name: "La Encontré" },
  { id: "mitula", name: "Mitula" },
  { id: "nexoinmobiliario", name: "Nexo Inmobiliario" },
  { id: "facebook", name: "Facebook Marketplace" },
  { id: "mercadolibre", name: "Mercado Libre" },
  { id: "tiktok", name: "TikTok" },
];

const PROPERTY_TYPES = [
  { id: "departamento", name: "Departamento" },
  { id: "casa", name: "Casa" },
  { id: "terreno", name: "Terreno" },
  { id: "local_comercial", name: "Local Comercial" },
  { id: "oficina", name: "Oficina" },
];

const AMENITIES = [
  { id: "piscina", name: "Piscina" },
  { id: "gimnasio", name: "Gimnasio" },
  { id: "estacionamiento", name: "Estacionamiento" },
  { id: "seguridad", name: "Seguridad 24h" },
  { id: "ascensor", name: "Ascensor" },
  { id: "terraza", name: "Terraza" },
  { id: "jardin", name: "Jardín" },
  { id: "lavanderia", name: "Lavandería" },
];

export default function Home() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  
  const [operationType, setOperationType] = useState<"alquiler" | "venta">("alquiler");
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [selectedPortals, setSelectedPortals] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minBedrooms, setMinBedrooms] = useState("");
  const [maxBedrooms, setMaxBedrooms] = useState("");
  const [minArea, setMinArea] = useState("");
  const [maxArea, setMaxArea] = useState("");
  const [publishedWithin, setPublishedWithin] = useState<string>("");
  const [propertyType, setPropertyType] = useState<string>("");
  const [currency, setCurrency] = useState<"USD" | "PEN">("USD");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [compareProperties, setCompareProperties] = useState<any[]>([]);
  const [showComparator, setShowComparator] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [showSavedSearches, setShowSavedSearches] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [sortBy, setSortBy] = useState<"price" | "area" | "none">("none");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [visibleCount, setVisibleCount] = useState(100);
  const mapRef = useRef<google.maps.Map | null>(null);

  const handleToggleCompare = (property: any) => {
    setCompareProperties(prev => {
      const exists = prev.find(p => p.id === property.id);
      if (exists) {
        return prev.filter(p => p.id !== property.id);
      } else if (prev.length < 4) {
        return [...prev, property];
      } else {
        toast.error("Solo puedes comparar hasta 4 propiedades");
        return prev;
      }
    });
  };

  const handleRemoveFromCompare = (propertyId: number) => {
    setCompareProperties(prev => prev.filter(p => p.id !== propertyId));
  };

  const isInCompare = (propertyId: number) => {
    return compareProperties.some(p => p.id === propertyId);
  };
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const searchQuery = trpc.properties.search.useQuery(
    {
      operationType,
      propertyType: propertyType && propertyType !== "all" ? propertyType : undefined,
      districts: selectedDistricts.length > 0 ? selectedDistricts : undefined,
      portals: selectedPortals.length > 0 ? selectedPortals : undefined,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      currency: currency,
      minBedrooms: minBedrooms ? parseInt(minBedrooms) : undefined,
      maxBedrooms: maxBedrooms ? parseInt(maxBedrooms) : undefined,
      minArea: minArea ? parseFloat(minArea) : undefined,
      maxArea: maxArea ? parseFloat(maxArea) : undefined,
      amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
      limit: 50000,
    },
    {
      enabled: isAuthenticated,
    }
  );

  useEffect(() => {
    setVisibleCount(100);
  }, [operationType, propertyType, selectedDistricts, selectedPortals, selectedAmenities, minPrice, maxPrice, minBedrooms, maxBedrooms, minArea, maxArea, currency]);

  const addFavoriteMutation = trpc.favorites.add.useMutation({
    onSuccess: () => {
      toast.success("Propiedad agregada a favoritos");
    },
    onError: () => {
      toast.error("Error al agregar a favoritos");
    },
  });

  const exportMutation = trpc.export.properties.useMutation({
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
      
      toast.success("Propiedades exportadas a Excel");
    },
    onError: () => {
      toast.error("Error al exportar propiedades");
    },
  });

  const toggleDistrict = (district: string) => {
    setSelectedDistricts(prev =>
      prev.includes(district)
        ? prev.filter(d => d !== district)
        : [...prev, district]
    );
  };

  const togglePortal = (portalId: string) => {
    setSelectedPortals(prev =>
      prev.includes(portalId)
        ? prev.filter(p => p !== portalId)
        : [...prev, portalId]
    );
  };

  const toggleAmenity = (amenityId: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenityId)
        ? prev.filter(a => a !== amenityId)
        : [...prev, amenityId]
    );
  };

  const handleAddFavorite = (propertyId: number) => {
    addFavoriteMutation.mutate({ propertyId });
  };

  // Saved searches
  const savedSearchesQuery = trpc.savedSearches.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createSavedSearchMutation = trpc.savedSearches.create.useMutation({
    onSuccess: () => {
      toast.success("Búsqueda guardada exitosamente");
      setShowSaveDialog(false);
      setSearchName("");
      savedSearchesQuery.refetch();
    },
    onError: () => {
      toast.error("Error al guardar búsqueda");
    },
  });

  const deleteSavedSearchMutation = trpc.savedSearches.delete.useMutation({
    onSuccess: () => {
      toast.success("Búsqueda eliminada");
      savedSearchesQuery.refetch();
    },
  });

  const deleteHistoryMutation = trpc.searchHistory.delete.useMutation({
    onSuccess: () => {
      toast.success("Historial eliminado");
      searchHistoryQuery.refetch();
    },
  });

  // Search history
  const searchHistoryQuery = trpc.searchHistory.list.useQuery(
    { limit: 10 },
    { enabled: isAuthenticated }
  );

  const recordSearchMutation = trpc.searchHistory.record.useMutation();

  const handleSaveSearch = () => {
    if (!searchName.trim()) {
      toast.error("Por favor ingresa un nombre para la búsqueda");
      return;
    }

    createSavedSearchMutation.mutate({
      name: searchName,
      operationType,
      propertyType,
      districts: selectedDistricts.length > 0 ? selectedDistricts : undefined,
      portals: selectedPortals.length > 0 ? selectedPortals : undefined,
      minPrice,
      maxPrice,
      minBedrooms,
      maxBedrooms,
      minArea,
      maxArea,
      publishedWithin,
    });
  };

  const handleLoadSavedSearch = (search: any) => {
    setOperationType(search.operationType);
    setPropertyType(search.propertyType || "");
    setSelectedDistricts(search.districts ? JSON.parse(search.districts) : []);
    setSelectedPortals(search.portals ? JSON.parse(search.portals) : []);
    setMinPrice(search.minPrice || "");
    setMaxPrice(search.maxPrice || "");
    setMinBedrooms(search.minBedrooms || "");
    setMaxBedrooms(search.maxBedrooms || "");
    setMinArea(search.minArea || "");
    setMaxArea(search.maxArea || "");
    setPublishedWithin(search.publishedWithin || "");
    setShowSavedSearches(false);
    toast.success(`Búsqueda "${search.name}" cargada`);
  };

  const handleLoadHistory = (history: any) => {
    setOperationType(history.operationType);
    setPropertyType(history.propertyType || "");
    setSelectedDistricts(history.districts ? JSON.parse(history.districts) : []);
    setSelectedPortals(history.portals ? JSON.parse(history.portals) : []);
    setMinPrice(history.minPrice || "");
    setMaxPrice(history.maxPrice || "");
    setMinBedrooms(history.minBedrooms || "");
    setMaxBedrooms(history.maxBedrooms || "");
    setMinArea(history.minArea || "");
    setMaxArea(history.maxArea || "");
    setPublishedWithin(history.publishedWithin || "");
    setShowHistory(false);
    toast.success("Búsqueda del historial cargada");
  };

  // Record search when results are loaded
  useEffect(() => {
    if (searchQuery.data && isAuthenticated) {
      recordSearchMutation.mutate({
        operationType,
        propertyType,
        districts: selectedDistricts.length > 0 ? selectedDistricts : undefined,
        portals: selectedPortals.length > 0 ? selectedPortals : undefined,
        minPrice,
        maxPrice,
        minBedrooms,
        maxBedrooms,
        minArea,
        maxArea,
        publishedWithin,
        resultsCount: searchQuery.data.total,
      });
    }
  }, [searchQuery.data]);

  const handleExportToExcel = () => {
    exportMutation.mutate({
      operationType,
      propertyType: propertyType && propertyType !== "all" ? propertyType : undefined,
      districts: selectedDistricts.length > 0 ? selectedDistricts : undefined,
      portals: selectedPortals.length > 0 ? selectedPortals : undefined,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      minBedrooms: minBedrooms ? parseInt(minBedrooms) : undefined,
      maxBedrooms: maxBedrooms ? parseInt(maxBedrooms) : undefined,
      minArea: minArea ? parseFloat(minArea) : undefined,
      maxArea: maxArea ? parseFloat(maxArea) : undefined,
    });
  };

  const handlePropertyClick = (property: any) => {
    setSelectedProperty(property);
    setIsDetailModalOpen(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <Building2 className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Sistema Inteligente de Búsqueda Inmobiliaria</CardTitle>
            <CardDescription>
              Busca propiedades en 14 portales inmobiliarios de Lima en tiempo real
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-primary" />
                  <span>Búsqueda multi-portal</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-primary" />
                  <span>Sistema de favoritos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-primary" />
                  <span>Filtros avanzados</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span>Análisis de precios</span>
                </div>
              </div>
              <Button className="w-full" size="lg" asChild>
                <a href={getLoginUrl()}>Iniciar Sesión</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container py-8">
        {/* Search Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Buscar Propiedades</CardTitle>
                <CardDescription>
                  Busca en múltiples portales inmobiliarios de Lima simultáneamente
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHistory(true)}
                >
                  <History className="h-4 w-4 mr-2" />
                  Historial
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSavedSearches(true)}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Guardadas
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setShowSaveDialog(true)}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Búsqueda
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Operation Type */}
            <Tabs value={operationType} onValueChange={(v) => setOperationType(v as "alquiler" | "venta")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="alquiler">Alquiler</TabsTrigger>
                <TabsTrigger value="venta">Venta</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Districts */}
            <div>
              <Label className="mb-3 block">Distritos</Label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {DISTRICTS.map(district => (
                  <div key={district} className="flex items-center space-x-2">
                    <Checkbox
                      id={district}
                      checked={selectedDistricts.includes(district)}
                      onCheckedChange={() => toggleDistrict(district)}
                    />
                    <label
                      htmlFor={district}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {district}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Currency Selector */}
            <div>
              <Label>Moneda</Label>
              <Select value={currency} onValueChange={(value: "USD" | "PEN") => setCurrency(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">Dólares (USD) - $</SelectItem>
                  <SelectItem value="PEN">Soles (PEN) - S/</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minPrice">Precio Mínimo ({currency === 'USD' ? '$' : 'S/'})</Label>
                <Input
                  id="minPrice"
                  type="number"
                  placeholder="800"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="maxPrice">Precio Máximo ({currency === 'USD' ? '$' : 'S/'})</Label>
                <Input
                  id="maxPrice"
                  type="number"
                  placeholder="2000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
            </div>

            {/* Advanced Filters Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="w-full"
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? "Ocultar" : "Mostrar"} Filtros Avanzados
            </Button>

            {showFilters && (
              <div className="space-y-4 pt-4 border-t">
                {/* Bedrooms */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minBedrooms">Dormitorios Mínimos</Label>
                    <Input
                      id="minBedrooms"
                      type="number"
                      placeholder="1"
                      value={minBedrooms}
                      onChange={(e) => setMinBedrooms(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxBedrooms">Dormitorios Máximos</Label>
                    <Input
                      id="maxBedrooms"
                      type="number"
                      placeholder="4"
                      value={maxBedrooms}
                      onChange={(e) => setMaxBedrooms(e.target.value)}
                    />
                  </div>
                </div>

                {/* Property Type */}
                <div>
                  <Label htmlFor="propertyType">Tipo de Propiedad</Label>
                  <Select value={propertyType} onValueChange={setPropertyType}>
                    <SelectTrigger id="propertyType">
                      <SelectValue placeholder="Todos los tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los tipos</SelectItem>
                      {PROPERTY_TYPES.map(type => (
                        <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Published Within */}
                <div>
                  <Label htmlFor="publishedWithin">Fecha de Publicación</Label>
                  <Select value={publishedWithin} onValueChange={setPublishedWithin}>
                    <SelectTrigger id="publishedWithin">
                      <SelectValue placeholder="Todas las fechas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las fechas</SelectItem>
                      <SelectItem value="24h">Últimas 24 horas</SelectItem>
                      <SelectItem value="week">Última semana</SelectItem>
                      <SelectItem value="month">Último mes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Area */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minArea">Área Mínima (m²)</Label>
                    <Input
                      id="minArea"
                      type="number"
                      placeholder="50"
                      value={minArea}
                      onChange={(e) => setMinArea(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxArea">Área Máxima (m²)</Label>
                    <Input
                      id="maxArea"
                      type="number"
                      placeholder="200"
                      value={maxArea}
                      onChange={(e) => setMaxArea(e.target.value)}
                    />
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <Label className="mb-3 block">Amenidades</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {AMENITIES.map(amenity => (
                      <div key={amenity.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={amenity.id}
                          checked={selectedAmenities.includes(amenity.id)}
                          onCheckedChange={() => toggleAmenity(amenity.id)}
                        />
                        <label
                          htmlFor={amenity.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {amenity.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Portals */}
                <div>
                  <Label className="mb-3 block">Portales (dejar vacío para buscar en todos)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {PORTALS.map(portal => (
                      <div key={portal.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={portal.id}
                          checked={selectedPortals.includes(portal.id)}
                          onCheckedChange={() => togglePortal(portal.id)}
                        />
                        <label
                          htmlFor={portal.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {portal.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {searchQuery.isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Buscando propiedades...</p>
          </div>
        )}

        {searchQuery.data && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-foreground">
                {searchQuery.data.total} Propiedades Encontradas
              </h2>
              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin ordenar</SelectItem>
                    <SelectItem value="price">Precio</SelectItem>
                    <SelectItem value="area">Área</SelectItem>
                  </SelectContent>
                </Select>
                {sortBy !== "none" && (
                  <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Menor a Mayor</SelectItem>
                      <SelectItem value="desc">Mayor a Menor</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                {compareProperties.length > 0 && (
                  <Button 
                    variant="default"
                    size="sm"
                    onClick={() => setShowComparator(true)}
                  >
                    Comparar ({compareProperties.length})
                  </Button>
                )}
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4 mr-2" />
                  Lista
                </Button>
                <Button
                  variant={viewMode === "map" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("map")}
                >
                  <Map className="h-4 w-4 mr-2" />
                  Mapa
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleExportToExcel}
                  disabled={exportMutation.isPending}
                >
                  {exportMutation.isPending ? "Exportando..." : "Exportar a Excel"}
                </Button>
                <Badge variant="secondary">
                  Fuente: {searchQuery.data.source === 'database' ? 'Base de datos' : 'Búsqueda en tiempo real'}
                </Badge>
              </div>
            </div>

            {searchQuery.data.total === 0 && (
              <div className="mb-4 p-4 border border-yellow-300 rounded-lg bg-yellow-50 text-yellow-900">
                <p className="font-medium">No hay propiedades en la base de datos con estos filtros.</p>
                <p className="text-sm">Puedes cambiar filtros o recargar datos de la base para mostrar propiedades.</p>
                <div className="mt-2">
                  <Button size="sm" onClick={() => searchQuery.refetch()}>
                    Recargar propiedades
                  </Button>
                </div>
              </div>
            )}

            {viewMode === "map" && (
              <div className="mb-6">
                <MapView
                  className="w-full h-[600px] rounded-lg border"
                  initialCenter={{ lat: -12.0464, lng: -77.0428 }} // Lima, Peru
                  initialZoom={12}
                  onMapReady={(map) => {
                    mapRef.current = map;
                    
                    // Clear existing markers
                    const markers: google.maps.marker.AdvancedMarkerElement[] = [];
                    
                    // Add markers for each property
                    searchQuery.data.properties.forEach((property: any) => {
                      if (property.latitude && property.longitude) {
                        const lat = parseFloat(String(property.latitude));
                        const lng = parseFloat(String(property.longitude));
                        
                        const marker = new google.maps.marker.AdvancedMarkerElement({
                          map,
                          position: { lat, lng },
                          title: property.title,
                        });
                        
                        // Create info window
                        const infoWindow = new google.maps.InfoWindow({
                          content: `
                            <div style="max-width: 250px; padding: 8px;">
                              <h3 style="font-weight: bold; margin-bottom: 8px;">${property.title}</h3>
                              <p style="margin: 4px 0;"><strong>Precio:</strong> ${property.currency} ${parseFloat(String(property.price)).toLocaleString()}</p>
                              <p style="margin: 4px 0;"><strong>Área:</strong> ${property.area}m²</p>
                              <p style="margin: 4px 0;"><strong>Distrito:</strong> ${property.district}</p>
                              <button 
                                onclick="window.dispatchEvent(new CustomEvent('property-detail', { detail: ${property.id} }))"
                                style="margin-top: 8px; padding: 4px 12px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;"
                              >
                                Ver detalles
                              </button>
                            </div>
                          `,
                        });
                        
                        marker.addListener('click', () => {
                          infoWindow.open(map, marker);
                        });
                        
                        markers.push(marker);
                      }
                    });
                    
                    // Listen for property detail events
                    window.addEventListener('property-detail', ((e: CustomEvent) => {
                      const propertyId = e.detail;
                      const property = searchQuery.data.properties.find((p: any) => p.id === propertyId);
                      if (property) {
                        setSelectedProperty(property);
                        setIsDetailModalOpen(true);
                      }
                    }) as EventListener);
                  }}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" style={{ display: viewMode === "list" ? "grid" : "none" }}>
              {(() => {
                let sortedProperties = [...searchQuery.data.properties];
                if (sortBy === "price") {
                  sortedProperties.sort((a, b) => {
                    const priceA = parseFloat(String(a.price));
                    const priceB = parseFloat(String(b.price));
                    return sortOrder === "asc" ? priceA - priceB : priceB - priceA;
                  });
                } else if (sortBy === "area") {
                  sortedProperties.sort((a, b) => {
                    const areaA = parseFloat(String(a.area || 0));
                    const areaB = parseFloat(String(b.area || 0));
                    return sortOrder === "asc" ? areaA - areaB : areaB - areaA;
                  });
                }
                return sortedProperties.slice(0, visibleCount);
              })().map((property: any) => (
                <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
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
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute top-2 right-2"
                      onClick={() => handleAddFavorite(property.id)}
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{property.title}</h3>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {property.address || property.district}
                      </span>
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

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {property.currency === 'PEN' ? 'S/' : '$'}
                            </Badge>
                            <div className="text-2xl font-bold text-primary">
                              {parseFloat(property.price).toLocaleString()}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {property.operationType === 'alquiler' ? 'por mes' : 'precio total'}
                          </div>
                        </div>
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => handleAddFavorite(property.id)}
                        >
                          <Heart className="h-5 w-5" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        {property.ownerWhatsapp && (
                          <Button
                            size="sm"
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => {
                              const cleanPhone = property.ownerWhatsapp.replace(/[^0-9]/g, '');
                              window.open(`https://wa.me/${cleanPhone}`, '_blank');
                            }}
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            WhatsApp
                          </Button>
                        )}
                        {property.sourceUrl && (
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              const url = property.sourceUrl.startsWith('http') 
                                ? property.sourceUrl 
                                : `https://${property.sourceUrl}`;
                              window.open(url, '_blank');
                            }}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Ver Anuncio Original
                          </Button>
                        )}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`compare-${property.id}`}
                              checked={isInCompare(property.id)}
                              onCheckedChange={() => handleToggleCompare(property)}
                            />
                            <label
                              htmlFor={`compare-${property.id}`}
                              className="text-sm cursor-pointer"
                            >
                              Comparar
                            </label>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="flex-1"
                            onClick={() => handlePropertyClick(property)}
                          >
                            Ver Detalles
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {searchQuery.data.properties.length > visibleCount && (
              <div className="mt-4 flex flex-col items-center gap-2">
                <div className="text-sm text-muted-foreground">
                  Mostrando {Math.min(visibleCount, searchQuery.data.properties.length)} de {searchQuery.data.properties.length} propiedades
                </div>
                <Button
                  variant="outline"
                  onClick={() => setVisibleCount(prev => prev + 100)}
                >
                  Ver más
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Property Detail Modal */}
        <PropertyDetailModal
          property={selectedProperty}
          open={isDetailModalOpen}
          onOpenChange={setIsDetailModalOpen}
        />

        {/* Property Comparator */}
        <PropertyComparator
          properties={compareProperties}
          open={showComparator}
          onOpenChange={setShowComparator}
          onRemoveProperty={handleRemoveFromCompare}
        />

        {/* Save Search Dialog */}
        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Guardar Búsqueda</DialogTitle>
              <DialogDescription>
                Dale un nombre a esta búsqueda para acceder rápidamente en el futuro
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="searchName">Nombre de la búsqueda</Label>
              <Input
                id="searchName"
                placeholder="Ej: Departamentos San Isidro 2 dorm"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveSearch} disabled={createSavedSearchMutation.isPending}>
                {createSavedSearchMutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Saved Searches Dialog */}
        <Dialog open={showSavedSearches} onOpenChange={setShowSavedSearches}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Búsquedas Guardadas</DialogTitle>
              <DialogDescription>
                Carga una búsqueda guardada previamente
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {savedSearchesQuery.data && savedSearchesQuery.data.length > 0 ? (
                savedSearchesQuery.data.map((search: any) => (
                  <Card key={search.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{search.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {search.operationType === "alquiler" ? "Alquiler" : "Venta"}
                          {search.districts && ` • ${JSON.parse(search.districts).join(", ")}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleLoadSavedSearch(search)}
                        >
                          Cargar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteSavedSearchMutation.mutate({ id: search.id })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No tienes búsquedas guardadas aún
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Search History Dialog */}
        <Dialog open={showHistory} onOpenChange={setShowHistory}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Historial de Búsquedas</DialogTitle>
              <DialogDescription>
                Tus últimas 10 búsquedas realizadas
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {searchHistoryQuery.data && searchHistoryQuery.data.length > 0 ? (
                searchHistoryQuery.data.map((history: any) => (
                  <Card key={history.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {history.operationType === "alquiler" ? "Alquiler" : "Venta"}
                          {history.districts && ` • ${JSON.parse(history.districts).join(", ")}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(history.searchedAt).toLocaleString()} • {history.resultsCount} resultados
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleLoadHistory(history)}
                        >
                          Cargar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteHistoryMutation.mutate({ id: history.id })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No hay historial de búsquedas aún
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
