import { useEffect, useState, useCallback } from "react";

const useFetchData = (url) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message);
      }

      setData(result.data);
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

export default useFetchData;