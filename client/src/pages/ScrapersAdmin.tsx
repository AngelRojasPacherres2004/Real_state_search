import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  PlayCircle, 
  StopCircle, 
  RefreshCw, 
  Activity, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Database,
  Code2,
  Upload,
  Settings,
  ExternalLink
} from 'lucide-react';
import { Link } from 'wouter';
import { toast } from 'sonner';

type DataSource = 'python' | 'octoparse' | 'hybrid';

export default function ScrapersAdmin() {
  const [runningPortal, setRunningPortal] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<DataSource>('hybrid');

  // Scrapers configuration with real status
  const scrapers = [
    { id: 'babilonia', name: 'Babilonia', status: 'active', lastRun: '2026-01-12', properties: 21, pythonReady: true, octoparseReady: true },
    { id: 'urbania', name: 'Urbania', status: 'active', lastRun: '2026-01-12', properties: 14, pythonReady: true, octoparseReady: true },
    { id: 'nexo', name: 'Nexo Inmobiliario', status: 'active', lastRun: '2026-01-12', properties: 12, pythonReady: true, octoparseReady: false },
    { id: 'properati', name: 'Properati', status: 'active', lastRun: '2026-01-12', properties: 4, pythonReady: true, octoparseReady: true },
    { id: 'adondevivir', name: 'Adondevivir', status: 'partial', lastRun: 'Never', properties: 0, pythonReady: false, octoparseReady: true },
    { id: 'infocasas', name: 'Infocasas', status: 'partial', lastRun: 'Never', properties: 0, pythonReady: false, octoparseReady: true },
    { id: 'losportales', name: 'Los Portales', status: 'pending', lastRun: 'Never', properties: 0, pythonReady: false, octoparseReady: true },
    { id: 'laencontre', name: 'La Encontré', status: 'pending', lastRun: 'Never', properties: 0, pythonReady: false, octoparseReady: true },
    { id: 'mitula', name: 'Mitula', status: 'pending', lastRun: 'Never', properties: 0, pythonReady: false, octoparseReady: true },
    { id: 'fazwaz', name: 'FazWaz', status: 'pending', lastRun: 'Never', properties: 0, pythonReady: false, octoparseReady: true },
    { id: 'ubicasa', name: 'Ubicasa', status: 'pending', lastRun: 'Never', properties: 0, pythonReady: false, octoparseReady: true },
    { id: 'facebook', name: 'Facebook Marketplace', status: 'pending', lastRun: 'Never', properties: 0, pythonReady: false, octoparseReady: true },
    { id: 'mercadolibre', name: 'Mercado Libre', status: 'pending', lastRun: 'Never', properties: 0, pythonReady: false, octoparseReady: true },
    { id: 'tiktok', name: 'TikTok', status: 'pending', lastRun: 'Never', properties: 0, pythonReady: false, octoparseReady: false },
  ];

  const handleRunScraper = async (scraperId: string, scraperName: string) => {
    setRunningPortal(scraperId);
    toast.info(`Ejecutando scraper de ${scraperName}...`);

    // Simulate scraper run (replace with actual API call)
    setTimeout(() => {
      setRunningPortal(null);
      toast.success(`${scraperName} ha terminado de extraer propiedades.`);
    }, 3000);
  };

  const handleRunAll = () => {
    toast.info('Ejecutando todos los scrapers activos...');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Activo</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" />Parcial</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
      case 'error':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  const getSourceBadge = (scraper: typeof scrapers[0]) => {
    if (dataSource === 'python') {
      return scraper.pythonReady ? (
        <Badge variant="outline" className="text-green-600 border-green-600">
          <Code2 className="w-3 h-3 mr-1" />Python
        </Badge>
      ) : (
        <Badge variant="outline" className="text-red-600 border-red-600">
          <XCircle className="w-3 h-3 mr-1" />No disponible
        </Badge>
      );
    } else if (dataSource === 'octoparse') {
      return scraper.octoparseReady ? (
        <Badge variant="outline" className="text-blue-600 border-blue-600">
          <Upload className="w-3 h-3 mr-1" />Octoparse
        </Badge>
      ) : (
        <Badge variant="outline" className="text-red-600 border-red-600">
          <XCircle className="w-3 h-3 mr-1" />No disponible
        </Badge>
      );
    } else {
      // Hybrid
      if (scraper.pythonReady && scraper.octoparseReady) {
        return (
          <Badge variant="outline" className="text-purple-600 border-purple-600">
            <Settings className="w-3 h-3 mr-1" />Híbrido
          </Badge>
        );
      } else if (scraper.pythonReady) {
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <Code2 className="w-3 h-3 mr-1" />Python
          </Badge>
        );
      } else if (scraper.octoparseReady) {
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            <Upload className="w-3 h-3 mr-1" />Octoparse
          </Badge>
        );
      }
      return (
        <Badge variant="outline" className="text-gray-600 border-gray-600">
          <Clock className="w-3 h-3 mr-1" />Pendiente
        </Badge>
      );
    }
  };

  const isScraperAvailable = (scraper: typeof scrapers[0]) => {
    if (dataSource === 'python') return scraper.pythonReady;
    if (dataSource === 'octoparse') return scraper.octoparseReady;
    return scraper.pythonReady || scraper.octoparseReady;
  };

  const totalProperties = scrapers.reduce((sum, s) => sum + s.properties, 0);
  const activeScrapers = scrapers.filter(s => s.status === 'active').length;

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Administración de Scrapers</h1>
          <p className="text-muted-foreground mt-2">
            Sistema híbrido: Python + Octoparse para 14 portales inmobiliarios
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/importar">
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Importar CSV
            </Button>
          </Link>
          <Button onClick={handleRunAll} size="lg">
            <RefreshCw className="w-4 h-4 mr-2" />
            Ejecutar Todos
          </Button>
        </div>
      </div>

      {/* Data Source Selector */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Fuente de Datos
          </CardTitle>
          <CardDescription>
            Selecciona cómo quieres obtener los datos de los portales inmobiliarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={dataSource} onValueChange={(v) => setDataSource(v as DataSource)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="python" className="flex items-center gap-2">
                <Code2 className="h-4 w-4" />
                Python Scrapers
              </TabsTrigger>
              <TabsTrigger value="octoparse" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Octoparse (CSV)
              </TabsTrigger>
              <TabsTrigger value="hybrid" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Híbrido
              </TabsTrigger>
            </TabsList>

            <TabsContent value="python" className="mt-4">
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2">
                  Scrapers Python Automatizados
                </h4>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Extracción automática usando Selenium + BeautifulSoup. 
                  Funciona para 4 portales actualmente (Babilonia, Urbania, Nexo, Properati).
                </p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                  <strong>Ventaja:</strong> Totalmente automatizado, se puede programar con cron.
                </p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  <strong>Limitación:</strong> Números de contacto pueden ser genéricos del portal.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="octoparse" className="mt-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">
                  Importación desde Octoparse
                </h4>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Importa datos extraídos con Octoparse en formato CSV. 
                  Soporta todos los portales con configuración manual.
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                  <strong>Ventaja:</strong> Puede extraer números de contacto reales haciendo clic en "Ver teléfono".
                </p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  <strong>Limitación:</strong> Requiere configuración manual y ejecución periódica.
                </p>
                <Link href="/importar">
                  <Button variant="outline" className="mt-4">
                    <Upload className="w-4 h-4 mr-2" />
                    Ir a Importar CSV
                  </Button>
                </Link>
              </div>
            </TabsContent>

            <TabsContent value="hybrid" className="mt-4">
              <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <h4 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">
                  Modo Híbrido (Recomendado)
                </h4>
                <p className="text-sm text-purple-600 dark:text-purple-400">
                  Combina lo mejor de ambos métodos:
                </p>
                <ul className="text-sm text-purple-600 dark:text-purple-400 mt-2 list-disc list-inside">
                  <li>Python para actualizaciones automáticas cada 12 horas</li>
                  <li>Octoparse para datos de alta calidad con contactos reales</li>
                  <li>Los datos de Octoparse tienen prioridad sobre Python</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scrapers Activos</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeScrapers}</div>
            <p className="text-xs text-muted-foreground">de 14 portales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propiedades Totales</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProperties}</div>
            <p className="text-xs text-muted-foreground">en base de datos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Ejecución</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Hoy</div>
            <p className="text-xs text-muted-foreground">12 Ene 2026</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fuente Activa</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{dataSource}</div>
            <p className="text-xs text-muted-foreground">
              {dataSource === 'python' ? 'Automatizado' : dataSource === 'octoparse' ? 'Manual' : 'Combinado'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Scrapers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scrapers.map((scraper) => (
          <Card key={scraper.id} className={!isScraperAvailable(scraper) ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{scraper.name}</CardTitle>
                {getStatusBadge(scraper.status)}
              </div>
              <CardDescription>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm">
                    <Database className="w-3 h-3 inline mr-1" />
                    {scraper.properties} propiedades
                  </span>
                  <span className="text-sm">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {scraper.lastRun}
                  </span>
                </div>
                <div className="mt-2">
                  {getSourceBadge(scraper)}
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {dataSource !== 'octoparse' && (
                  <Button
                    onClick={() => handleRunScraper(scraper.id, scraper.name)}
                    disabled={runningPortal === scraper.id || !scraper.pythonReady}
                    className="flex-1"
                    variant={scraper.pythonReady ? 'default' : 'secondary'}
                  >
                    {runningPortal === scraper.id ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Ejecutando...
                      </>
                    ) : (
                      <>
                        <PlayCircle className="w-4 h-4 mr-2" />
                        {scraper.pythonReady ? 'Ejecutar' : 'No disponible'}
                      </>
                    )}
                  </Button>
                )}
                {dataSource === 'octoparse' && (
                  <Link href="/importar" className="flex-1">
                    <Button variant="outline" className="w-full">
                      <Upload className="w-4 h-4 mr-2" />
                      Importar CSV
                    </Button>
                  </Link>
                )}
              </div>
              {!isScraperAvailable(scraper) && (
                <p className="text-xs text-muted-foreground mt-2">
                  ⚠️ No disponible con la fuente de datos seleccionada
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Card */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Información del Sistema Híbrido</CardTitle>
          <CardDescription>
            Detalles sobre la configuración y funcionamiento de los scrapers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Code2 className="h-4 w-4" />
                Python Scrapers
              </h4>
              <ul className="text-sm space-y-1">
                <li>• <strong>Activos:</strong> Babilonia, Urbania, Nexo, Properati</li>
                <li>• <strong>Frecuencia:</strong> Cada 12 horas (cron)</li>
                <li>• <strong>Tecnología:</strong> Selenium + BeautifulSoup</li>
                <li>• <strong>Contactos:</strong> Números genéricos del portal</li>
              </ul>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Octoparse Import
              </h4>
              <ul className="text-sm space-y-1">
                <li>• <strong>Soportados:</strong> Todos los 14 portales</li>
                <li>• <strong>Frecuencia:</strong> Manual (cuando importes)</li>
                <li>• <strong>Formato:</strong> CSV con campos mapeados</li>
                <li>• <strong>Contactos:</strong> Números reales del agente</li>
              </ul>
            </div>
          </div>
          <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
            <h4 className="font-semibold text-yellow-700 dark:text-yellow-300 mb-2">
              Recomendación
            </h4>
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              Usa el <strong>modo híbrido</strong> para obtener los mejores resultados:
              los scrapers Python mantienen los datos actualizados automáticamente,
              mientras que Octoparse te permite importar datos de alta calidad con
              números de contacto reales cuando los necesites.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
