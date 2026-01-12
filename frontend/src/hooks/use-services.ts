import { useState, useEffect } from "react";

export interface Service {
  id: string;
  name: string;
  image: string;
  status: string;
  health: string;
}

export interface RedisInfo {
  status: string;
  host?: string;
  port?: number;
  version?: string;
  uptime_days?: number;
  used_memory_human?: string;
  connected_clients?: number;
  keys?: number;
  message?: string;
}

export interface PostgresInfo {
  status: string;
  host?: string;
  port?: number;
  databases?: Array<{
    name: string;
    size: string;
    tables: string[];
    table_count: number;
  }>;
  database_count?: number;
  connections?: number;
  message?: string;
}

export interface MinioInfo {
  status: string;
  endpoint?: string;
  console_url?: string;
  buckets?: string[];
  bucket_count?: number;
  message?: string;
}

export interface QdrantInfo {
  status: string;
  host?: string;
  rest_port?: number;
  grpc_port?: number;
  dashboard_url?: string;
  collections?: Array<{
    name: string;
    vectors_count: number;
    points_count: number;
  }>;
  collection_count?: number;
  message?: string;
}

export interface MongoDBInfo {
  status: string;
  host?: string;
  port?: number;
  databases?: Array<{
    name: string;
    collections: string[];
    collection_count: number;
  }>;
  database_count?: number;
  message?: string;
}

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [redisInfo, setRedisInfo] = useState<RedisInfo | null>(null);
  const [postgresInfo, setPostgresInfo] = useState<PostgresInfo | null>(null);
  const [minioInfo, setMinioInfo] = useState<MinioInfo | null>(null);
  const [qdrantInfo, setQdrantInfo] = useState<QdrantInfo | null>(null);
  const [mongodbInfo, setMongodbInfo] = useState<MongoDBInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    try {
      const res = await fetch("http://localhost:8000/services");
      if (!res.ok) throw new Error("Failed to fetch health status");
      const data = await res.json();
      setServices(data);
    } catch (err) {
      console.error("Health fetch error:", err);
    }
  };

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const [redisRes, postgresRes, minioRes, qdrantRes, mongodbRes] = await Promise.all([
        fetch("http://localhost:8000/services/redis"),
        fetch("http://localhost:8000/services/postgres"),
        fetch("http://localhost:8000/services/minio"),
        fetch("http://localhost:8000/services/qdrant"),
        fetch("http://localhost:8000/services/mongodb")
      ]);

      const redisData = await redisRes.json();
      const postgresData = await postgresRes.json();
      const minioData = await minioRes.json();
      const qdrantData = await qdrantRes.json();
      const mongodbData = await mongodbRes.json();

      setRedisInfo(redisData);
      setPostgresInfo(postgresData);
      setMinioInfo(minioData);
      setQdrantInfo(qdrantData);
      setMongodbInfo(mongodbData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred fetching details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    fetchDetails();

    const healthInterval = setInterval(fetchHealth, 5000); // Poll health every 5 seconds
    const detailsInterval = setInterval(fetchDetails, 60000); // Refresh heavy details only every minute

    return () => {
      clearInterval(healthInterval);
      clearInterval(detailsInterval);
    };
  }, []);

  return {
    services,
    redisInfo,
    postgresInfo,
    minioInfo,
    qdrantInfo,
    mongodbInfo,
    loading,
    error,
    refetch: () => { fetchHealth(); fetchDetails(); }
  };
}
