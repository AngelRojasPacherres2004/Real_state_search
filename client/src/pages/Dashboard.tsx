import { useAuth } from "@/_core/hooks/useAuth";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { Building2, Heart, Users, Bell, TrendingUp, Search, FileText } from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  // Fetch statistics
  const statsQuery = trpc.properties.stats.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const generateReportMutation = trpc.reports.generateWeekly.useMutation({
    onSuccess: () => {
      toast.success("Reporte semanal generado y enviado");
    },
    onError: () => {
      toast.error("Error al generar reporte");
    },
  });

  const favoritesQuery = trpc.favorites.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const alertsQuery = trpc.alerts.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const leadsQuery = trpc.leads.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const searchHistoryQuery = trpc.searchHistory.list.useQuery(
    { limit: 30 },
    { enabled: isAuthenticated }
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container py-16">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Acceso Restringido</CardTitle>
              <CardDescription>
                Debes iniciar sesión para ver tu dashboard de estadísticas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" asChild>
                <a href={getLoginUrl()}>Iniciar Sesión</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const totalFavorites = favoritesQuery.data?.length || 0;
  const totalLeads = leadsQuery.data?.length || 0;
  const activeAlerts = alertsQuery.data?.filter((a: any) => a.isActive).length || 0;
  const totalSearches = searchHistoryQuery.data?.length || 0;

  // Prepare chart data for searches over time
  const searchesOverTime = searchHistoryQuery.data?.reduce((acc: any[], search: any) => {
    const date = new Date(search.searchedAt).toLocaleDateString();
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ date, count: 1 });
    }
    return acc;
  }, []) || [];

  // Prepare chart data for properties by district
  const propertiesByDistrict = statsQuery.data?.reduce((acc: any[], stat: any) => {
    acc.push({
      district: stat.district || "Sin distrito",
      count: stat.count,
    });
    return acc;
  }, []) || [];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Dashboard de Estadísticas</h1>
            <p className="text-muted-foreground mt-2">
              Resumen de tu actividad en la plataforma
            </p>
          </div>
          <Button
            onClick={() => generateReportMutation.mutate()}
            disabled={generateReportMutation.isPending}
          >
            <FileText className="h-4 w-4 mr-2" />
            {generateReportMutation.isPending ? "Generando..." : "Generar Reporte Semanal"}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Búsquedas Realizadas</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSearches}</div>
              <p className="text-xs text-muted-foreground">
                Últimos 30 días
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Favoritos</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalFavorites}</div>
              <p className="text-xs text-muted-foreground">
                Propiedades guardadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leads Generados</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalLeads}</div>
              <p className="text-xs text-muted-foreground">
                Clientes potenciales
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertas Activas</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeAlerts}</div>
              <p className="text-xs text-muted-foreground">
                Notificaciones configuradas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Searches Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>Búsquedas en el Tiempo</CardTitle>
              <CardDescription>
                Cantidad de búsquedas realizadas por día
              </CardDescription>
            </CardHeader>
            <CardContent>
              {searchesOverTime.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={searchesOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#8b5cf6" name="Búsquedas" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-12">
                  No hay datos suficientes para mostrar
                </p>
              )}
            </CardContent>
          </Card>

          {/* Properties by District */}
          <Card>
            <CardHeader>
              <CardTitle>Propiedades por Distrito</CardTitle>
              <CardDescription>
                Distribución de propiedades disponibles
              </CardDescription>
            </CardHeader>
            <CardContent>
              {propertiesByDistrict.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={propertiesByDistrict}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="district" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8b5cf6" name="Propiedades" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-12">
                  No hay datos suficientes para mostrar
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>
              Tus últimas acciones en la plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {searchHistoryQuery.data && searchHistoryQuery.data.slice(0, 5).map((search: any) => (
                <div key={search.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">
                      Búsqueda: {search.operationType === "alquiler" ? "Alquiler" : "Venta"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {search.districts && JSON.parse(search.districts).join(", ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{search.resultsCount} resultados</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(search.searchedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              {(!searchHistoryQuery.data || searchHistoryQuery.data.length === 0) && (
                <p className="text-center text-muted-foreground py-8">
                  No hay actividad reciente
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
