'use client';

import { useEffect, useRef } from 'react';
import type { GeoJSONFeatureCollection, GeoJSONFeature } from '@/lib/api';

interface MapLegendItem {
  color: string;
  label: string;
}

interface GisMapProps {
  nodesGeoJSON: GeoJSONFeatureCollection | null;
  industriesGeoJSON: GeoJSONFeatureCollection | null;
  plumeLayer?: GeoJSONFeature | null;
  windVectorLayer?: GeoJSONFeature | null;
  onNodeClick?: (nodeId: string) => void;
}

export default function GisMap({
  nodesGeoJSON,
  industriesGeoJSON,
  plumeLayer,
  windVectorLayer,
  onNodeClick,
}: GisMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layersRef = useRef<any[]>([]);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Dynamic import Leaflet (client only)
    import('leaflet').then((L) => {
      if (!mapRef.current) return;
      // Prevent double init in React Strict Mode
      // @ts-expect-error leaflet internal id
      if (mapRef.current._leaflet_id) {
        if (mapInstanceRef.current) return;
        // @ts-expect-error leaflet internal id
        mapRef.current._leaflet_id = null;
      }
      const map = L.map(mapRef.current, { zoomControl: true }).setView([21.62, 73.02], 12);
      
      // Use the provided CARTO raster basemap key so the watermark is removed.
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=cb1_2lfg_1_7e94faf556c86dd2e04298a7', {
        maxZoom: 20,
        subdomains: 'abcd',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
      }).addTo(map);
      
      mapInstanceRef.current = map;

      // Fix "gray tiles" / cutoffs by invalidating size when container resizes
      const resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      });
      resizeObserver.observe(mapRef.current);
      resizeObserverRef.current = resizeObserver;
    });

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update layers whenever data changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    import('leaflet').then((L) => {
      const map = mapInstanceRef.current;

      // Clear previous dynamic layers
      layersRef.current.forEach((l) => map.removeLayer(l));
      layersRef.current = [];

      // 1. Sensor Nodes
      if (nodesGeoJSON) {
        nodesGeoJSON.features.forEach((feature) => {
          const [lon, lat] = feature.geometry.coordinates as number[];
          const p = feature.properties;
          const color = String(p.aqi_color || '#6b7280');
          const marker = L.circleMarker([lat, lon], {
            radius: 9,
            fillColor: color,
            color: '#000',
            weight: 2,
            fillOpacity: 0.9,
          });
          marker.bindPopup(`
            <div style="font-family:sans-serif;font-size:12px;min-width:190px">
              <strong style="font-size:13px">${p.name || p.node_id}</strong><br/>
              <span style="color:#6b7280;font-size:10px">NODE ID: ${p.node_id}</span><br/><br/>
              PM2.5: <strong>${p.pm25 ?? '—'} µg/m³</strong><br/>
              PM10: <strong>${p.pm10 ?? '—'} µg/m³</strong><br/>
              SO2: <strong>${p.so2 ?? '—'} ppb</strong><br/>
              NOx: <strong>${p.nox ?? '—'} µg/m³</strong><br/>
              CO₂: <strong>${p.co2 ?? '—'} ppm</strong><br/>
              AQI Status: <strong>${p.aqi ?? '—'}</strong><br/>
              Battery: ${p.battery_percent ?? '—'}%
            </div>
          `);
          if (onNodeClick) {
            marker.on('click', () => onNodeClick(String(p.node_id)));
          }
          marker.addTo(map);
          layersRef.current.push(marker);
        });
      }

      // 2. Industrial Sites
      if (industriesGeoJSON) {
        industriesGeoJSON.features.forEach((feature) => {
          const [lon, lat] = feature.geometry.coordinates as number[];
          const p = feature.properties;
          const marker = L.circleMarker([lat, lon], {
            radius: 7,
            fillColor: '#000',
            color: '#dc2626',
            weight: 2,
            fillOpacity: 0.9,
          });
          marker.bindPopup(`
            <div style="font-family:sans-serif;font-size:12px;min-width:180px">
              <strong style="font-size:13px">${p.name}</strong><br/>
              <span style="color:#6b7280;font-size:10px">${p.gspcb_consent_id}</span><br/><br/>
              Sector: ${p.industry_type}<br/>
              Process: ${p.declared_process || '—'}
            </div>
          `);
          marker.addTo(map);
          layersRef.current.push(marker);
        });
      }

      // 3. Plume cone overlay
      if (plumeLayer) {
        const cone = L.geoJSON(plumeLayer as unknown as Parameters<typeof L.geoJSON>[0], {
          style: {
            color: '#dc2626',
            weight: 2,
            fillColor: '#ef4444',
            fillOpacity: 0.18,
          },
        }).addTo(map);
        layersRef.current.push(cone);
      }

      // 4. Wind vector
      if (windVectorLayer) {
        const wv = L.geoJSON(windVectorLayer as unknown as Parameters<typeof L.geoJSON>[0], {
          style: { color: '#1d4ed8', weight: 2, dashArray: '5,5' },
        }).addTo(map);
        layersRef.current.push(wv);
      }
    });
  }, [nodesGeoJSON, industriesGeoJSON, plumeLayer, windVectorLayer, onNodeClick]);

  // Dynamic legend from node data
  const legendItems: MapLegendItem[] = [
    { color: '#16a34a', label: 'Good (0–60 µg/m³)' },
    { color: '#d97706', label: 'Moderate (61–120 µg/m³)' },
    { color: '#dc2626', label: 'Severe (>120 µg/m³)' },
    { color: '#000', label: 'Industrial Site' },
    { color: '#ef4444', label: 'Plume Cone' },
  ];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%', background: '#e5e7eb' }} />
      {/* Dynamic Legend */}
      <div style={{
        position: 'absolute',
        bottom: 24,
        left: 12,
        background: 'rgba(255,255,255,0.95)',
        border: '1px solid #27272a',
        padding: '8px 10px',
        fontSize: '11px',
        zIndex: 1000,
        minWidth: 160,
      }}>
        <div style={{ fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          MAP LEGEND
        </div>
        {legendItems.map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <div style={{
              width: 10, height: 10, background: item.color,
              border: '1px solid #000', flexShrink: 0,
            }} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
