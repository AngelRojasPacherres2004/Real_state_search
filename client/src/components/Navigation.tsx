import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import { useLocation } from "wouter";

export default function Navigation() {
  const { user } = useAuth();
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <header className="border-b bg-card sticky top-0 z-10">
      <div className="container py-4">
        <div className="flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Búsqueda Inmobiliaria</h1>
              <p className="text-sm text-muted-foreground">14 portales en tiempo real</p>
            </div>
          </a>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-1">
              <Button 
                variant={isActive("/") ? "default" : "ghost"} 
                size="sm" 
                asChild
              >
                <a href="/">Buscar</a>
              </Button>
              <Button 
                variant={isActive("/dashboard") ? "default" : "ghost"} 
                size="sm" 
                asChild
              >
                <a href="/dashboard">Dashboard</a>
              </Button>
              <Button 
                variant={isActive("/favoritos") ? "default" : "ghost"} 
                size="sm" 
                asChild
              >
                <a href="/favoritos">Favoritos</a>
              </Button>
              <Button 
                variant={isActive("/alertas") ? "default" : "ghost"} 
                size="sm" 
                asChild
              >
                <a href="/alertas">Alertas</a>
              </Button>
              <Button 
                variant={isActive("/analisis") ? "default" : "ghost"} 
                size="sm" 
                asChild
              >
                <a href="/analisis">Análisis</a>
              </Button>
              <Button 
                variant={isActive("/leads") ? "default" : "ghost"} 
                size="sm" 
                asChild
              >
                <a href="/leads">Leads</a>
              </Button>
              {user?.role === 'admin' && (
                <>
                  <Button 
                    variant={isActive("/scrapers") ? "default" : "ghost"} 
                    size="sm" 
                    asChild
                  >
                    <a href="/scrapers">Scrapers</a>
                  </Button>
                  <Button 
                    variant={isActive("/team") ? "default" : "ghost"} 
                    size="sm" 
                    asChild
                  >
                    <a href="/team">Equipo</a>
                  </Button>
                </>
              )}
            </nav>
            <span className="text-sm text-muted-foreground hidden sm:block">
              Bienvenido, {user?.name}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
