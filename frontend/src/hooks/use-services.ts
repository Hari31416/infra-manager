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
  version?: string;
  uptime_days?: number;
  used_memory_human?: string;
  connected_clients?: number;
  keys?: number;
  message?: string;
}

export interface PostgresInfo {
  status: string;
  databases?: string[];
  connections?: number;
  message?: string;
}

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [redisInfo, setRedisInfo] = useState<RedisInfo | null>(null);
  const [postgresInfo, setPostgresInfo] = useState<PostgresInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [servicesRes, redisRes, postgresRes] = await Promise.all([
        fetch("http://localhost:8000/services"),
        fetch("http://localhost:8000/services/redis"),
        fetch("http://localhost:8000/services/postgres")
      ]);

      if (!servicesRes.ok) throw new Error("Failed to fetch services");
      
      const servicesData = await servicesRes.json();
      const redisData = await redisRes.json();
      const postgresData = await postgresRes.json();

      setServices(servicesData);
      setRedisInfo(redisData);
      setPostgresInfo(postgresData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return { services, redisInfo, postgresInfo, loading, error, refetch: fetchData };
}
