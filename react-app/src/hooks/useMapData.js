import { useState, useEffect } from 'react';
import { getAssetPath } from '../api';

export const useMapData = (mapId) => {
  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!mapId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch(getAssetPath(`Data/${mapId}.json`))
      .then(r => {
        if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
        return r.json();
      })
      .then(data => {
        if (isMounted) {
          setMapData(data);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error(`Error loading map ${mapId}:`, err);
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => { isMounted = false; };
  }, [mapId]);

  return { mapData, loading, error };
};
