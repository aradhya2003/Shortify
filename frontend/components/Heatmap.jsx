import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import 'leaflet.heat';
import 'leaflet/dist/leaflet.css';

const Heatmap = ({ locations }) => {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const heatmapLayer = useRef(null);
  const [isReady, setIsReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    mapInstance.current = L.map(mapContainer.current, {
      center: [20, 0],
      zoom: 2,
      zoomControl: true,
      attributionControl: false,
      preferCanvas: true, // Better performance for heatmaps
      inertia: true, // Smooth panning
    });

    // Add base map tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapInstance.current);

    // Set ready state after initialization
    setIsReady(true);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update heatmap data
  useEffect(() => {
    if (!isReady || !mapInstance.current || !locations) return;

    try {
      // Process and validate location data
      const heatData = locations
        .filter(loc => loc.latitude && loc.longitude)
        .map(loc => [
          Number(loc.latitude),
          Number(loc.longitude),
          Math.max(0.5, Number(loc.count || 1)) * 3 // Minimum intensity of 0.5
        ]);

      if (heatData.length === 0) {
        if (heatmapLayer.current) {
          mapInstance.current.removeLayer(heatmapLayer.current);
          heatmapLayer.current = null;
        }
        return;
      }

      // Create or update heatmap layer
      if (heatmapLayer.current) {
        heatmapLayer.current.setLatLngs(heatData);
      } else {
        heatmapLayer.current = L.heatLayer(heatData, {
          radius: 25,
          blur: 20,
          maxZoom: 17,
          minOpacity: 0.7,
          gradient: {
            0.2: 'rgba(0, 119, 255, 0.7)',   // Blue
            0.4: 'rgba(0, 255, 255, 0.8)',   // Cyan
            0.6: 'rgba(50, 255, 50, 0.9)',    // Green
            0.8: 'rgba(255, 255, 0, 0.9)',    // Yellow
            1.0: 'rgba(255, 50, 50, 1)'       // Red
          }
        }).addTo(mapInstance.current);
      }

      // Adjust view to show all points
      const bounds = L.latLngBounds(heatData.map(([lat, lng]) => [lat, lng]));
      mapInstance.current.flyToBounds(bounds, {
        padding: [50, 50],
        duration: 1,
      });

    } catch (error) {
      console.error('Error updating heatmap:', error);
    }
  }, [isReady, locations]);

  // Handle container resize
  useEffect(() => {
    if (!isReady || !mapContainer.current) return;

    const observer = new ResizeObserver(() => {
      if (mapInstance.current) {
        setTimeout(() => {
          mapInstance.current.invalidateSize();
        }, 100);
      }
    });

    observer.observe(mapContainer.current);
    return () => observer.disconnect();
  }, [isReady]);

  return (
    <div
      ref={mapContainer}
      style={{
        width: '100%',
        height: '500px',
        borderRadius: '12px',
        marginTop: '1rem',
        backgroundColor: '#f1f5f9',
        overflow: 'hidden',
      }}
    />
  );
};

export default dynamic(() => Promise.resolve(Heatmap), {
  ssr: false,
  loading: () => (
    <div style={{
      width: '100%',
      height: '500px',
      borderRadius: '12px',
      marginTop: '1rem',
      backgroundColor: '#f1f5f9',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#64748b'
    }}>
      Loading heatmap...
    </div>
  )
});