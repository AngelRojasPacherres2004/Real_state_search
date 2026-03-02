import { useState } from "react";
import { trpc } from "@/lib/trpc";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, Building2, DollarSign, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#f97316'];

export default function Analytics() {
  const [operationType, setOperationType] = useState<"alquiler" | "venta">("alquiler");

  const districtStatsQuery = trpc.analytics.statsByDistrict.useQuery({ operationType });
  const portalStatsQuery = trpc.analytics.statsByPortal.useQuery({ operationType });

  const formatDistrictData = (stats: any[]) => {
    return stats.map(stat => ({
      distrito: stat.district,
      cantidad: Number(stat.count),
      precioPromedio: Math.round(Number(stat.avgPrice)),
      precioMin: Math.round(Number(stat.minPrice)),
      precioMax: Math.round(Number(stat.maxPrice)),
    })).sort((a, b) => b.cantidad - a.cantidad);
  };

  const formatPortalData = (stats: any[]) => {
    return stats.map(stat => ({
      portal: stat.portal,
      cantidad: Number(stat.count),
      precioPromedio: Math.round(Number(stat.avgPrice)),
    })).sort((a, b) => b.cantidad - a.cantidad);
  };

  const isLoading = districtStatsQuery.isLoading || portalStatsQuery.isLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando análisis...</p>
        </div>
      </div>
    );
  }

  const districtData = formatDistrictData(districtStatsQuery.data || []);
  const portalData = formatPortalData(portalStatsQuery.data || []);

  const totalProperties = districtData.reduce((sum, item) => sum + item.cantidad, 0);
  const avgPrice = districtData.length > 0
    ? Math.round(districtData.reduce((sum, item) => sum + item.precioPromedio, 0) / districtData.length)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Análisis de Competencia</h1>
          <p className="text-muted-foreground">
            Visualiza tendencias de mercado, precios promedio y estrategias de la competencia
          </p>
        </div>

        <Tabs value={operationType} onValueChange={(v) => setOperationType(v as "alquiler" | "venta")} className="mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="alquiler">Alquiler</TabsTrigger>
            <TabsTrigger value="venta">Venta</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Propiedades</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProperties.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                En {districtData.length} distritos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Precio Promedio</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${avgPrice.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {operationType === 'alquiler' ? 'por mes' : 'precio total'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Portales Activos</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{portalData.length}</div>
              <p className="text-xs text-muted-foreground">
                Portales con propiedades
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* District Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Propiedades por Distrito</CardTitle>
              <CardDescription>
                Cantidad de propiedades disponibles en cada distrito
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={districtData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="distrito" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      fontSize={12}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="cantidad" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Portal Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribución por Portal</CardTitle>
              <CardDescription>
                Proporción de propiedades en cada portal inmobiliario
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={portalData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ portal, percent }) => `${portal} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="cantidad"
                    >
                      {portalData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Price Analysis by District */}
        <Card>
          <CardHeader>
            <CardTitle>Análisis de Precios por Distrito</CardTitle>
            <CardDescription>
              Comparación de precios promedio, mínimos y máximos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={districtData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="distrito" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => `$${value.toLocaleString()}`}
                  />
                  <Legend />
                  <Bar dataKey="precioPromedio" fill="#3b82f6" name="Precio Promedio" />
                  <Bar dataKey="precioMin" fill="#10b981" name="Precio Mínimo" />
                  <Bar dataKey="precioMax" fill="#f59e0b" name="Precio Máximo" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Stats Table */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Estadísticas Detalladas por Distrito</CardTitle>
            <CardDescription>
              Información completa de cada distrito analizado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Distrito</th>
                    <th className="text-right p-3 font-semibold">Cantidad</th>
                    <th className="text-right p-3 font-semibold">Precio Promedio</th>
                    <th className="text-right p-3 font-semibold">Precio Mínimo</th>
                    <th className="text-right p-3 font-semibold">Precio Máximo</th>
                  </tr>
                </thead>
                <tbody>
                  {districtData.map((stat) => (
                    <tr key={stat.distrito} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {stat.distrito}
                        </div>
                      </td>
                      <td className="text-right p-3">
                        <Badge variant="secondary">{stat.cantidad}</Badge>
                      </td>
                      <td className="text-right p-3 font-semibold">
                        ${stat.precioPromedio.toLocaleString()}
                      </td>
                      <td className="text-right p-3 text-green-600">
                        ${stat.precioMin.toLocaleString()}
                      </td>
                      <td className="text-right p-3 text-orange-600">
                        ${stat.precioMax.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
