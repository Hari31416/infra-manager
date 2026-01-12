import { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8888";

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
      const res = await fetch(`${API_BASE}/services`);
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
        fetch(`${API_BASE}/services/redis`),
        fetch(`${API_BASE}/services/postgres`),
        fetch(`${API_BASE}/services/minio`),
        fetch(`${API_BASE}/services/qdrant`),
        fetch(`${API_BASE}/services/mongodb`)
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

  const dropPostgresDatabase = async (dbName: string) => {
    try {
      const res = await fetch(`${API_BASE}/services/postgres/databases/${dbName}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to drop database");
      await fetchDetails();
      return await res.json();
    } catch (err) {
      console.error("Error dropping PostgreSQL database:", err);
      throw err;
    }
  };

  const dropMinioBucket = async (bucketName: string) => {
    try {
      const res = await fetch(`${API_BASE}/services/minio/buckets/${bucketName}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to drop bucket");
      await fetchDetails();
      return await res.json();
    } catch (err) {
      console.error("Error dropping MinIO bucket:", err);
      throw err;
    }
  };

  const dropMongoDatabase = async (dbName: string) => {
    try {
      const res = await fetch(`${API_BASE}/services/mongodb/databases/${dbName}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to drop database");
      await fetchDetails();
      return await res.json();
    } catch (err) {
      console.error("Error dropping MongoDB database:", err);
      throw err;
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
    dropPostgresDatabase,
    dropMinioBucket,
    dropMongoDatabase,
    refetch: () => { fetchHealth(); fetchDetails(); }
  };
}
