import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Team from "./pages/Team";
import Favorites from "./pages/Favorites";
import Alerts from "./pages/Alerts";
import Analytics from "./pages/Analytics";
import Leads from '@/pages/Leads';
import ScrapersAdmin from '@/pages/ScrapersAdmin';
import ImportData from '@/pages/ImportData';

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path={"/favoritos"} component={Favorites} />
      <Route path={"/alertas"} component={Alerts} />
      <Route path={"/analisis"} component={Analytics} />
      <Route path={"/leads"} component={Leads} />
      <Route path="/scrapers" component={ScrapersAdmin} />
      <Route path="/importar" component={ImportData} />
      <Route path="/team" component={Team} />      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route - unknown paths go home */}
      <Route component={Home} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
