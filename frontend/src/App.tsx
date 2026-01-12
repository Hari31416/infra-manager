import { useServices } from "@/hooks/use-services";
import { ServiceCard } from "@/components/service-card";
import { Activity, RefreshCw, Server, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function App() {
  const { services, redisInfo, postgresInfo, loading, error, refetch } = useServices();

  const getDetailedInfo = (name: string) => {
    if (name.includes("redis")) return redisInfo;
    if (name.includes("postgres")) return postgresInfo;
    return null;
  };

  return (
    <div className="min-h-screen bg-[oklch(0.98_0_0)] dark:bg-[oklch(0.12_0_0)] text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between mx-auto px-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary rounded-lg text-primary-foreground">
              <Server className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Infra Manager</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Active Services</span>
            </div>
            <div className="text-3xl font-bold">{services.filter(s => s.status === 'running').length}</div>
          </div>
          <div className="p-6 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">Healthy Systems</span>
            </div>
            <div className="text-3xl font-bold">{services.filter(s => s.health === 'healthy').length}</div>
          </div>
          <div className="p-6 rounded-2xl bg-slate-500/10 border border-slate-500/20 shadow-sm lg:col-span-2 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Infrastructure Hub</div>
              <div className="text-xs text-muted-foreground max-w-sm">
                Centralized monitoring for PostgreSQL, Redis, MinIO, and Qdrant.
                Data updates every 5 seconds.
              </div>
            </div>
            <div className="hidden sm:block">
              <Badge variant="secondary" className="font-mono">v1.0.0</Badge>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 mb-8 border border-destructive/50 bg-destructive/10 text-destructive rounded-lg flex items-center gap-3">
            <Activity className="h-5 w-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              detailedInfo={getDetailedInfo(service.name)}
            />
          ))}

          {services.length === 0 && !loading && (
            <div className="col-span-full py-12 text-center border-2 border-dashed rounded-2xl">
              <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground font-medium">No services found. Ensure your docker-compose is running.</p>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t py-6 mt-12 bg-muted/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Infra Manager Dashboard &copy; 2026 • Powered by FastAPI & Vite
        </div>
      </footer>
    </div>
  );
}

export default App;