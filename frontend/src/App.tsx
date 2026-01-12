import { useServices, type Service } from "@/hooks/use-services";
import { ServiceCard } from "@/components/service-card";
import { Activity, RefreshCw, Server, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

function App() {
  const {
    services,
    redisInfo,
    postgresInfo,
    minioInfo,
    qdrantInfo,
    mongodbInfo,
    loading,
    error,
    refetch,
    dropPostgresDatabase,
    dropMinioBucket,
    dropMongoDatabase
  } = useServices();

  const getDetailedInfo = (name: string) => {
    if (name.includes("redis")) return redisInfo;
    if (name.includes("postgres")) return postgresInfo;
    if (name.includes("minio")) return minioInfo;
    if (name.includes("qdrant")) return qdrantInfo;
    if (name.includes("mongodb")) return mongodbInfo;
    return null;
  };

  const activeCount = services.filter((s: Service) => s.status === 'running').length;
  const healthyCount = services.filter((s: Service) => s.health === 'healthy').length;

  return (
    <div className="min-h-screen bg-[oklch(0.98_0_0)] dark:bg-[oklch(0.12_0_0)] text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between mx-auto px-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="p-1 bg-primary/10 rounded-xl">
                <img src="/logo.png" alt="Infra Manager" className="h-8 w-8 object-contain" />
              </div>
              <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Infra Manager
              </h1>
            </div>

            <Separator orientation="vertical" className="h-6 hidden md:block" />

            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
                <Activity className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                  {activeCount} Active
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                <span className="text-xs font-semibold text-green-700 dark:text-green-300">
                  {healthyCount} Healthy
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={loading}
              className="gap-2 h-8"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        {error && (
          <div className="p-4 mb-8 border border-destructive/50 bg-destructive/10 text-destructive rounded-lg flex items-center gap-3">
            <Activity className="h-5 w-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service: Service) => (
            <ServiceCard
              key={service.id}
              service={service}
              detailedInfo={getDetailedInfo(service.name)}
              onDropPostgres={dropPostgresDatabase}
              onDropMinio={dropMinioBucket}
              onDropMongo={dropMongoDatabase}
            />
          ))}

          {services.length === 0 && !loading && (
            <div className="col-span-full py-24 text-center border-2 border-dashed rounded-3xl bg-muted/20">
              <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground font-medium">No services found. Ensure your docker-compose is running.</p>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t py-8 mt-12 bg-muted/30">
        <div className="container mx-auto px-4 flex flex-col items-center gap-4">
          <img src="/logo.png" alt="Infra Manager" className="h-6 w-6 opacity-50 grayscale hover:grayscale-0 transition-all" />
          <div className="text-center text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
            Infra Manager Dashboard &copy; 2026 • Powered by FastAPI & Vite
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;