import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { Service, RedisInfo, PostgresInfo, MinioInfo, QdrantInfo, MongoDBInfo } from "@/hooks/use-services";
import { Activity, CheckCircle2, AlertCircle, Database, HardDrive, Cpu, ExternalLink, ChevronDown, Copy, Check, Circle } from "lucide-react";
import { useState } from "react";

interface ServiceCardProps {
  service: Service;
  detailedInfo?: RedisInfo | PostgresInfo | MinioInfo | QdrantInfo | MongoDBInfo | null;
}

export function ServiceCard({ service, detailedInfo }: ServiceCardProps) {
  const [copied, setCopied] = useState(false);
  const [expandedDbs, setExpandedDbs] = useState<Set<string>>(new Set());
  const isHealthy = service.health === "healthy";
  const isRunning = service.status === "running";

  const getIcon = (name: string) => {
    if (name.includes("redis")) return <Database className="h-5 w-5 text-red-500" />;
    if (name.includes("postgres")) return <Database className="h-5 w-5 text-blue-500" />;
    if (name.includes("minio")) return <HardDrive className="h-5 w-5 text-yellow-500" />;
    if (name.includes("qdrant")) return <Cpu className="h-5 w-5 text-green-500" />;
    if (name.includes("mongodb")) return <Database className="h-5 w-5 text-emerald-500" />;
    return <Activity className="h-5 w-5" />;
  };

  const getConnectionString = (): string | null => {
    if (!detailedInfo || detailedInfo.status !== "connected") return null;

    if (service.name.includes("redis")) {
      const info = detailedInfo as RedisInfo;
      return `redis://${info.host}:${info.port}`;
    }
    if (service.name.includes("postgres")) {
      const info = detailedInfo as PostgresInfo;
      return `postgresql://admin:***@${info.host}:${info.port}/main_db`;
    }
    if (service.name.includes("minio")) {
      const info = detailedInfo as MinioInfo;
      return info.endpoint || null;
    }
    if (service.name.includes("qdrant")) {
      const info = detailedInfo as QdrantInfo;
      return `http://${info.host}:${info.rest_port}`;
    }
    if (service.name.includes("mongodb")) {
      const info = detailedInfo as MongoDBInfo;
      return `mongodb://admin:***@${info.host}:${info.port}`;
    }
    return null;
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleDbExpansion = (dbName: string) => {
    const newExpanded = new Set(expandedDbs);
    if (newExpanded.has(dbName)) {
      newExpanded.delete(dbName);
    } else {
      newExpanded.add(dbName);
    }
    setExpandedDbs(newExpanded);
  };

  const connectionString = getConnectionString();

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

          {/* Connection Info */}
          {connectionString && (
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground truncate flex-1 font-mono" title={connectionString}>
                  {connectionString}
                </span>
                <button
                  onClick={() => copyToClipboard(connectionString)}
                  className="p-1 hover:bg-accent rounded transition-colors shrink-0"
                  title="Copy connection string"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
            </div>
          )}

          {detailedInfo && detailedInfo.status === "connected" && (
            <div className="mt-4 pt-4 border-t space-y-2">
              {/* Redis Info */}
              {service.name.includes("redis") && (
                <>
                  <div className="flex items-center justify-between">
                    <span>Keys:</span>
                    <span className="text-foreground font-mono">{(detailedInfo as RedisInfo).keys}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Memory:</span>
                    <span className="text-foreground font-mono">{(detailedInfo as RedisInfo).used_memory_human}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Clients:</span>
                    <span className="text-foreground font-mono">{(detailedInfo as RedisInfo).connected_clients}</span>
                  </div>
                </>
              )}

              {/* Postgres Info - Updated to Collapsible */}
              {service.name.includes("postgres") && (() => {
                const info = detailedInfo as PostgresInfo;
                return (
                  <>
                    <div className="flex items-center justify-between">
                      <span>Connections:</span>
                      <span className="text-foreground font-mono">{info.connections}</span>
                    </div>
                    <div className="mt-2 space-y-1">
                      <span className="text-muted-foreground block mb-2">Databases:</span>
                      {info.databases?.map((db) => (
                        <Collapsible key={db.name} open={expandedDbs.has(`pg-${db.name}`)}>
                          <CollapsibleTrigger
                            onClick={() => toggleDbExpansion(`pg-${db.name}`)}
                            className="flex items-center justify-between w-full pl-2 py-1 bg-accent/50 rounded hover:bg-accent transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Database className="h-3 w-3 text-blue-500" />
                              <span className="font-mono text-xs text-foreground">{db.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{db.size}</span>
                              <ChevronDown className={`h-3 w-3 transition-transform ${expandedDbs.has(`pg-${db.name}`) ? 'rotate-180' : ''}`} />
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="pl-4 mt-1 space-y-0.5">
                            {db.tables.length > 0 ? (
                              db.tables.map((table) => (
                                <div key={table} className="flex items-center gap-2 py-0.5 text-xs text-muted-foreground">
                                  <Circle className="h-2 w-2" />
                                  <span className="font-mono">{table}</span>
                                </div>
                              ))
                            ) : (
                              <div className="text-[10px] text-muted-foreground italic pl-4">No tables found</div>
                            )}
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  </>
                );
              })()}

              {/* MinIO Info */}
              {service.name.includes("minio") && (() => {
                const info = detailedInfo as MinioInfo;
                return (
                  <>
                    <div className="flex items-center justify-between">
                      <span>Buckets:</span>
                      <span className="text-foreground font-mono">{info.bucket_count}</span>
                    </div>
                    {info.buckets && info.buckets.length > 0 && (
                      <div className="mt-2">
                        <span className="text-muted-foreground">Bucket List:</span>
                        <div className="mt-1 space-y-1">
                          {info.buckets.map((bucket) => (
                            <div key={bucket} className="flex items-center gap-2 pl-2 py-0.5 bg-accent/50 rounded">
                              <HardDrive className="h-3 w-3 text-yellow-500" />
                              <span className="font-mono text-xs text-foreground">{bucket}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Qdrant Info */}
              {service.name.includes("qdrant") && (() => {
                const info = detailedInfo as QdrantInfo;
                return (
                  <>
                    <div className="flex items-center justify-between">
                      <span>Collections:</span>
                      <span className="text-foreground font-mono">{info.collection_count}</span>
                    </div>
                    {info.collections && info.collections.length > 0 && (
                      <div className="mt-2">
                        <span className="text-muted-foreground">Collection List:</span>
                        <div className="mt-1 space-y-1">
                          {info.collections.map((col) => (
                            <div key={col.name} className="flex items-center justify-between pl-2 py-0.5 bg-accent/50 rounded">
                              <span className="font-mono text-xs text-foreground">{col.name}</span>
                              <span className="text-xs text-muted-foreground">{col.points_count} pts</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* MongoDB Info */}
              {service.name.includes("mongodb") && (() => {
                const info = detailedInfo as MongoDBInfo;
                return (
                  <>
                    <div className="flex items-center justify-between">
                      <span>Databases:</span>
                      <span className="text-foreground font-mono">{info.database_count}</span>
                    </div>
                    {info.databases && info.databases.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {info.databases.map((db) => (
                          <Collapsible key={db.name} open={expandedDbs.has(`mongo-${db.name}`)}>
                            <CollapsibleTrigger
                              onClick={() => toggleDbExpansion(`mongo-${db.name}`)}
                              className="flex items-center justify-between w-full pl-2 py-1 bg-accent/50 rounded hover:bg-accent transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <Database className="h-3 w-3 text-emerald-500" />
                                <span className="font-mono text-xs text-foreground">{db.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{db.collection_count} cols</span>
                                <ChevronDown className={`h-3 w-3 transition-transform ${expandedDbs.has(`mongo-${db.name}`) ? 'rotate-180' : ''}`} />
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="pl-4 mt-1 space-y-0.5">
                              {db.collections.map((col) => (
                                <div key={col} className="flex items-center gap-2 py-0.5 text-xs text-muted-foreground">
                                  <Circle className="h-2 w-2" />
                                  <span className="font-mono">{col}</span>
                                </div>
                              ))}
                            </CollapsibleContent>
                          </Collapsible>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
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
