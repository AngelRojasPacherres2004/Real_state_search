import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Download,
  Copy,
  Database,
  Code2
} from "lucide-react";
import { toast } from "sonner";

export default function ImportData() {
  const { user } = useAuth();
  const [csvData, setCsvData] = useState("");
  const [importResult, setImportResult] = useState<{
    success: boolean;
    imported: number;
    errors: number;
    duplicates: number;
    errorMessages: string[];
  } | null>(null);

  const templateQuery = trpc.import.template.useQuery();
  const importMutation = trpc.import.octoparse.useMutation({
    onSuccess: (result) => {
      setImportResult(result);
      if (result.success) {
        toast.success(`Importación exitosa: ${result.imported} propiedades importadas`);
      } else {
        toast.error(`Importación con errores: ${result.errors} errores`);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvData(content);
      toast.success(`Archivo "${file.name}" cargado correctamente`);
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!csvData.trim()) {
      toast.error("Por favor, ingresa datos CSV para importar");
      return;
    }
    importMutation.mutate({ csvData });
  };

  const copyTemplate = () => {
    if (templateQuery.data?.template) {
      navigator.clipboard.writeText(templateQuery.data.template);
      toast.success("Plantilla copiada al portapapeles");
    }
  };

  const downloadTemplate = () => {
    if (templateQuery.data?.template) {
      const blob = new Blob([templateQuery.data.template], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "plantilla_octoparse.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Plantilla descargada");
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acceso Denegado</AlertTitle>
          <AlertDescription>
            Solo los administradores pueden importar datos.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Importar Datos</h1>
        <p className="text-muted-foreground">
          Importa propiedades desde Octoparse u otras fuentes de datos externos
        </p>
      </div>

      <Tabs defaultValue="import" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Importar CSV
          </TabsTrigger>
          <TabsTrigger value="template" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Plantilla
          </TabsTrigger>
          <TabsTrigger value="guide" className="flex items-center gap-2">
            <Code2 className="h-4 w-4" />
            Guía Octoparse
          </TabsTrigger>
        </TabsList>

        {/* Tab: Importar CSV */}
        <TabsContent value="import">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Cargar Datos
                </CardTitle>
                <CardDescription>
                  Sube un archivo CSV o pega los datos directamente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Subir archivo CSV
                  </label>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-muted-foreground
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-primary file:text-primary-foreground
                      hover:file:bg-primary/90
                      cursor-pointer"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      O pega los datos
                    </span>
                  </div>
                </div>

                <Textarea
                  placeholder="Pega aquí los datos CSV de Octoparse..."
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />

                <Button
                  onClick={handleImport}
                  disabled={importMutation.isPending || !csvData.trim()}
                  className="w-full"
                >
                  {importMutation.isPending ? (
                    <>Importando...</>
                  ) : (
                    <>
                      <Database className="h-4 w-4 mr-2" />
                      Importar a Base de Datos
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Resultado de Importación
                </CardTitle>
                <CardDescription>
                  Resumen de la última importación realizada
                </CardDescription>
              </CardHeader>
              <CardContent>
                {importResult ? (
                  <div className="space-y-4">
                    <Alert variant={importResult.success ? "default" : "destructive"}>
                      {importResult.success ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      <AlertTitle>
                        {importResult.success ? "Importación Exitosa" : "Importación con Errores"}
                      </AlertTitle>
                    </Alert>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {importResult.imported}
                        </div>
                        <div className="text-sm text-muted-foreground">Importadas</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">
                          {importResult.duplicates}
                        </div>
                        <div className="text-sm text-muted-foreground">Duplicadas</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                          {importResult.errors}
                        </div>
                        <div className="text-sm text-muted-foreground">Errores</div>
                      </div>
                    </div>

                    {importResult.errorMessages.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Errores:</h4>
                        <ul className="text-sm text-red-600 space-y-1">
                          {importResult.errorMessages.slice(0, 5).map((msg, i) => (
                            <li key={i}>• {msg}</li>
                          ))}
                          {importResult.errorMessages.length > 5 && (
                            <li>... y {importResult.errorMessages.length - 5} más</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay resultados de importación todavía</p>
                    <p className="text-sm">Sube un archivo CSV para comenzar</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Plantilla */}
        <TabsContent value="template">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Plantilla CSV para Octoparse
              </CardTitle>
              <CardDescription>
                Usa esta plantilla para configurar tu extracción en Octoparse
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-2">
                <Button onClick={downloadTemplate} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar Plantilla
                </Button>
                <Button onClick={copyTemplate} variant="outline">
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar al Portapapeles
                </Button>
              </div>

              <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                <pre className="text-sm font-mono whitespace-pre-wrap">
                  {templateQuery.data?.template || "Cargando plantilla..."}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Campos Esperados</h3>
                <div className="grid gap-2">
                  {templateQuery.data?.fields?.map((field, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <code className="text-sm font-mono bg-background px-2 py-1 rounded">
                          {field.name}
                        </code>
                        <span className="ml-2 text-sm text-muted-foreground">
                          {field.description}
                        </span>
                      </div>
                      <Badge variant={field.required ? "default" : "secondary"}>
                        {field.required ? "Requerido" : "Opcional"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Guía Octoparse */}
        <TabsContent value="guide">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5" />
                Guía de Configuración de Octoparse
              </CardTitle>
              <CardDescription>
                Paso a paso para extraer datos de portales inmobiliarios
              </CardDescription>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <h3>1. Crear un nuevo proyecto en Octoparse</h3>
              <ol>
                <li>Abre Octoparse y crea un nuevo proyecto</li>
                <li>Ingresa la URL del portal (ej: babilonia.pe, urbania.pe)</li>
                <li>Selecciona "Modo Avanzado" para mayor control</li>
              </ol>

              <h3>2. Configurar la extracción de datos</h3>
              <p>Para cada propiedad, configura la extracción de estos campos:</p>
              <ul>
                <li><strong>titulo</strong>: Selector del título del anuncio</li>
                <li><strong>precio</strong>: Selector del precio (incluye símbolo de moneda)</li>
                <li><strong>direccion</strong>: Selector de la dirección completa</li>
                <li><strong>distrito</strong>: Selector del distrito</li>
                <li><strong>dormitorios</strong>: Número de habitaciones</li>
                <li><strong>banos</strong>: Número de baños</li>
                <li><strong>area</strong>: Área en m²</li>
                <li><strong>url</strong>: URL del anuncio (usar @href del enlace)</li>
                <li><strong>imagen</strong>: URL de la imagen (usar @src)</li>
                <li><strong>telefono</strong>: Número de teléfono del agente</li>
                <li><strong>whatsapp</strong>: Número de WhatsApp</li>
                <li><strong>email</strong>: Email de contacto</li>
              </ul>

              <h3>3. Configurar paginación</h3>
              <p>
                Configura el botón "Siguiente" para extraer múltiples páginas
                de resultados automáticamente.
              </p>

              <h3>4. Ejecutar y exportar</h3>
              <ol>
                <li>Ejecuta la extracción (local o en la nube)</li>
                <li>Exporta los resultados como CSV</li>
                <li>Importa el CSV aquí usando la pestaña "Importar CSV"</li>
              </ol>

              <h3>5. Consejos para obtener datos de contacto reales</h3>
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Importante</AlertTitle>
                <AlertDescription>
                  Muchos portales ocultan los números de teléfono detrás de un botón
                  "Ver teléfono". En Octoparse, puedes configurar una acción de clic
                  antes de extraer el número para obtener el dato real.
                </AlertDescription>
              </Alert>

              <h3>URLs de portales soportados</h3>
              <ul>
                <li><strong>Babilonia</strong>: babilonia.pe/inmuebles/...</li>
                <li><strong>Urbania</strong>: urbania.pe/buscar/...</li>
                <li><strong>Adondevivir</strong>: adondevivir.com/...</li>
                <li><strong>Properati</strong>: properati.com.pe/...</li>
                <li><strong>Infocasas</strong>: infocasas.com.pe/...</li>
                <li><strong>Facebook</strong>: facebook.com/marketplace/...</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
