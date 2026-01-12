import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Service } from "@/hooks/use-services";
import { Activity, CheckCircle2, AlertCircle, Database, HardDrive, Cpu, ExternalLink } from "lucide-react";

interface ServiceCardProps {
  service: Service;
  detailedInfo?: any;
}

export function ServiceCard({ service, detailedInfo }: ServiceCardProps) {
  const isHealthy = service.health === "healthy";
  const isRunning = service.status === "running";

  const getIcon = (name: string) => {
    if (name.includes("redis")) return <Database className="h-5 w-5 text-red-500" />;
    if (name.includes("postgres")) return <Database className="h-5 w-5 text-blue-500" />;
    if (name.includes("minio")) return <HardDrive className="h-5 w-5 text-yellow-500" />;
    if (name.includes("qdrant")) return <Cpu className="h-5 w-5 text-green-500" />;
    return <Activity className="h-5 w-5" />;
  };

  return (
    <Card className="overflow-hidden border-2 transition-all hover:border-primary/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          {getIcon(service.name)}
          <CardTitle className="text-sm font-bold uppercase tracking-wider">
            {service.name.replace("infra-", "")}
          </CardTitle>
        </div>
        <Badge variant={isHealthy ? "default" : "destructive"} className="capitalize">
          {service.health === "healthy" ? (
            <CheckCircle2 className="mr-1 h-3 w-3" />
          ) : (
            <AlertCircle className="mr-1 h-3 w-3" />
          )}
          {service.health}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Status:</span>
            <span className={isRunning ? "text-green-500 font-medium" : "text-amber-500 font-medium"}>
              {service.status}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Image:</span>
            <span className="truncate max-w-[150px]" title={service.image}>
              {service.image.split(":")[0]}
            </span>
          </div>

          {detailedInfo && (
            <div className="mt-4 pt-4 border-t space-y-2">
              {service.name.includes("redis") && detailedInfo.status === "connected" && (
                <>
                  <div className="flex items-center justify-between">
                    <span>Keys:</span>
                    <span className="text-foreground font-mono">{detailedInfo.keys}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Memory:</span>
                    <span className="text-foreground font-mono">{detailedInfo.used_memory_human}</span>
                  </div>
                </>
              )}

              {service.name.includes("postgres") && detailedInfo.status === "connected" && (
                <>
                  <div className="flex items-center justify-between">
                    <span>Databases:</span>
                    <span className="text-foreground font-mono">{detailedInfo.databases?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Connections:</span>
                    <span className="text-foreground font-mono">{detailedInfo.connections}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          {service.name.includes("minio") && (
            <a
              href="http://localhost:9001"
              target="_blank"
              rel="noreferrer"
              className="w-full"
            >
              <Badge variant="outline" className="w-full flex justify-center py-1 cursor-pointer hover:bg-accent transition-colors">
                <ExternalLink className="h-3 w-3 mr-2" /> Console
              </Badge>
            </a>
          )}
          {service.name.includes("qdrant") && (
            <a
              href="http://localhost:6333/dashboard"
              target="_blank"
              rel="noreferrer"
              className="w-full"
            >
              <Badge variant="outline" className="w-full flex justify-center py-1 cursor-pointer hover:bg-accent transition-colors">
                <ExternalLink className="h-3 w-3 mr-2" /> Dashboard
              </Badge>
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
