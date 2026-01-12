import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Service, RedisInfo, PostgresInfo, MinioInfo, QdrantInfo, MongoDBInfo } from "@/hooks/use-services";
import { Activity, CheckCircle2, AlertCircle, Database, HardDrive, Cpu, ExternalLink, ChevronDown, Copy, Check, Circle, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";

interface ServiceCardProps {
  service: Service;
  detailedInfo?: RedisInfo | PostgresInfo | MinioInfo | QdrantInfo | MongoDBInfo | null;
  onDropPostgres?: (dbName: string) => Promise<any>;
  onDropMinio?: (bucketName: string) => Promise<any>;
  onDropMongo?: (dbName: string) => Promise<any>;
}

export function ServiceCard({ service, detailedInfo, onDropPostgres, onDropMinio, onDropMongo }: ServiceCardProps) {
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
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

  const handleDrop = async (type: string, name: string, dropFn?: (n: string) => Promise<any>) => {
    if (!dropFn) return;
    setIsDeleting(`${type}-${name}`);
    try {
      await dropFn(name);
    } catch (err) {
      console.error(`Failed to drop ${type}:`, err);
    } finally {
      setIsDeleting(null);
    }
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
                      {info.databases?.map((db) => {
                        const isProtected = ['postgres', 'template0', 'template1'].includes(db.name);
                        const deleting = isDeleting === `pg-${db.name}`;
                        return (
                          <Collapsible key={db.name} open={expandedDbs.has(`pg-${db.name}`)}>
                            <div className="flex items-center gap-1">
                              <CollapsibleTrigger
                                onClick={() => toggleDbExpansion(`pg-${db.name}`)}
                                className="flex items-center justify-between flex-1 pl-2 py-1 bg-accent/50 rounded hover:bg-accent transition-colors text-left"
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

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <button
                                    disabled={isProtected || !!isDeleting}
                                    className="p-1.5 bg-accent/50 rounded hover:bg-destructive hover:text-destructive-foreground disabled:opacity-30 disabled:hover:bg-accent/50 disabled:hover:text-muted-foreground transition-colors"
                                    title={isProtected ? "System database (protected)" : "Drop Database"}
                                  >
                                    {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                  </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Drop Database?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to drop <strong>{db.name}</strong>? This action is permanent and cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDrop('pg', db.name, onDropPostgres)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Drop Database
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
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
                        );
                      })}
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
                          {info.buckets.map((bucket) => {
                            const deleting = isDeleting === `minio-${bucket}`;
                            return (
                              <div key={bucket} className="flex items-center gap-1">
                                <div className="flex items-center gap-2 flex-1 pl-2 py-1 bg-accent/50 rounded">
                                  <HardDrive className="h-3 w-3 text-yellow-500" />
                                  <span className="font-mono text-xs text-foreground">{bucket}</span>
                                </div>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <button
                                      disabled={!!isDeleting}
                                      className="p-1.5 bg-accent/50 rounded hover:bg-destructive hover:text-destructive-foreground transition-colors"
                                      title="Drop Bucket"
                                    >
                                      {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                    </button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Drop Bucket?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to drop <strong>{bucket}</strong>? This will delete all objects inside and cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDrop('minio', bucket, onDropMinio)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Drop Bucket
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            );
                          })}
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
                        {info.databases.map((db) => {
                          const isProtected = ['admin', 'config', 'local'].includes(db.name);
                          const deleting = isDeleting === `mongo-${db.name}`;
                          return (
                            <Collapsible key={db.name} open={expandedDbs.has(`mongo-${db.name}`)}>
                              <div className="flex items-center gap-1">
                                <CollapsibleTrigger
                                  onClick={() => toggleDbExpansion(`mongo-${db.name}`)}
                                  className="flex items-center justify-between flex-1 pl-2 py-1 bg-accent/50 rounded hover:bg-accent transition-colors text-left"
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

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <button
                                      disabled={isProtected || !!isDeleting}
                                      className="p-1.5 bg-accent/50 rounded hover:bg-destructive hover:text-destructive-foreground disabled:opacity-30 disabled:hover:bg-accent/50 disabled:hover:text-muted-foreground transition-colors"
                                      title={isProtected ? "System database (protected)" : "Drop Database"}
                                    >
                                      {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                    </button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Drop Database?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to drop <strong>{db.name}</strong>? This action is permanent and cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDrop('mongo', db.name, onDropMongo)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Drop Database
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                              <CollapsibleContent className="pl-4 mt-1 space-y-0.5">
                                {db.collections.map((col) => (
                                  <div key={col} className="flex items-center gap-2 py-0.5 text-xs text-muted-foreground">
                                    <Circle className="h-2 w-2" />
                                    <span className="font-mono">{col}</span>
                                  </div>
                                ))}
                              </CollapsibleContent>
                            </Collapsible>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          {service.name.includes("postgres") && (
            <a
              href="http://localhost:5050"
              target="_blank"
              rel="noreferrer"
              className="w-full"
            >
              <Badge variant="outline" className="w-full flex justify-center py-1 cursor-pointer hover:bg-accent transition-colors">
                <ExternalLink className="h-3 w-3 mr-2" />pgAdmin
              </Badge>
            </a>
          )}
          {service.name.includes("redis") && (
            <a
              href="http://localhost:5540"
              target="_blank"
              rel="noreferrer"
              className="w-full"
            >
              <Badge variant="outline" className="w-full flex justify-center py-1 cursor-pointer hover:bg-accent transition-colors">
                <ExternalLink className="h-3 w-3 mr-2" />RedisInsight
              </Badge>
            </a>
          )}
          {service.name.includes("minio") && (
            <a
              href="http://localhost:9001"
              target="_blank"
              rel="noreferrer"
              className="w-full"
            >
              <Badge variant="outline" className="w-full flex justify-center py-1 cursor-pointer hover:bg-accent transition-colors">
                <ExternalLink className="h-3 w-3 mr-2" />Console
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
                <ExternalLink className="h-3 w-3 mr-2" />Dashboard
              </Badge>
            </a>
          )}
          {service.name.includes("mongodb") && (
            <a
              href="http://localhost:8081"
              target="_blank"
              rel="noreferrer"
              className="w-full"
            >
              <Badge variant="outline" className="w-full flex justify-center py-1 cursor-pointer hover:bg-accent transition-colors">
                <ExternalLink className="h-3 w-3 mr-2" />Mongo Express
              </Badge>
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
