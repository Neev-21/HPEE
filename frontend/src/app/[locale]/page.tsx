'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  fetchNodesGeoJSON,
  fetchIndustriesGeoJSON,
  fetchPollutionEvents,
  fetchEventGisLayers,
  type GeoJSONFeatureCollection,
  type GeoJSONFeature,
  type PollutionEvent,
} from '@/lib/api';

const GisMap = dynamic(() => import('@/components/Map/GisMap'), { ssr: false });

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#dc2626',
  severe: '#dc2626',
  watch: '#d97706',
  normal: '#16a34a',
};

const CPCB_LIMITS = { pm25: 60, so2: 80 };
const ANKLESHWAR_BOUNDS = {
  centerLat: 21.62,
  centerLon: 73.02,
  radiusKm: 18,
};

function filterNearbyGeoJSON(
  collection: GeoJSONFeatureCollection | null,
  centerLat: number,
  centerLon: number,
  radiusKm: number,
): GeoJSONFeatureCollection | null {
  if (!collection) return null;

  const filteredFeatures = collection.features.filter((feature) => {
    const coords = feature.geometry.coordinates as number[];
    const lon = coords[0];
    const lat = coords[1];
    const dx = (lon - centerLon) * 111.32;
    const dy = (lat - centerLat) * 111.32;
    const distanceKm = Math.sqrt(dx * dx + dy * dy);
    return distanceKm <= radiusKm;
  });

  return {
    type: 'FeatureCollection',
    features: filteredFeatures,
  };
}

export default function OverviewPage() {
  const t = useTranslations('Overview');
  const tCommon = useTranslations('Common');

  const [nodes, setNodes] = useState<GeoJSONFeatureCollection | null>(null);
  const [industries, setIndustries] = useState<GeoJSONFeatureCollection | null>(null);
  const [activeEvent, setActiveEvent] = useState<PollutionEvent | null>(null);
  const [plumeCone, setPlumeCone] = useState<GeoJSONFeature | null>(null);
  const [windVector, setWindVector] = useState<GeoJSONFeature | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [nodesData, industriesData, events] = await Promise.all([
          fetchNodesGeoJSON(),
          fetchIndustriesGeoJSON(),
          fetchPollutionEvents(),
        ]);

        // Keep the map fast and focused on the active local Ankleshwar cluster.
        const filteredNodes = filterNearbyGeoJSON(
          nodesData,
          ANKLESHWAR_BOUNDS.centerLat,
          ANKLESHWAR_BOUNDS.centerLon,
          ANKLESHWAR_BOUNDS.radiusKm,
        );
        const filteredIndustries = filterNearbyGeoJSON(
          industriesData,
          ANKLESHWAR_BOUNDS.centerLat,
          ANKLESHWAR_BOUNDS.centerLon,
          ANKLESHWAR_BOUNDS.radiusKm,
        );

        setNodes(filteredNodes);
        setIndustries(filteredIndustries);

        const active = events.find((e) => e.status === 'active') || events[0] || null;
        setActiveEvent(active);

        if (active) {
          try {
            const layers = await fetchEventGisLayers(active.event_id);
            if (layers.layers.plume_cone) setPlumeCone(layers.layers.plume_cone as GeoJSONFeature);
            if (layers.layers.wind_vector) setWindVector(layers.layers.wind_vector as GeoJSONFeature);
          } catch { /* plume layers optional */ }
        }
      } catch (e) {
        setError(tCommon('error'));
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load().catch(() => { /* backend offline */ });
  }, [tCommon]);

  // WebSocket Live Connection
  useEffect(() => {
    // If running dev server on 3100 and backend on 8100, Next.js must proxy this route
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/v1/ws/live?token=hpee-live-token`;
    
    let ws: WebSocket;
    let reconnectTimer: NodeJS.Timeout;

    const connectWS = () => {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected to', wsUrl);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'TELEMETRY_UPDATE') {
            setNodes((prevNodes) => {
              if (!prevNodes) return prevNodes;
              return {
                ...prevNodes,
                features: prevNodes.features.map((f) => {
                  if (f.properties.node_id === data.node_id) {
                    return {
                      ...f,
                      properties: {
                        ...f.properties,
                        pm25: data.pm25 !== null ? data.pm25 : f.properties.pm25,
                        pm10: data.pm10 !== null ? data.pm10 : f.properties.pm10,
                        so2: data.so2 !== null ? data.so2 : f.properties.so2,
                        nox: data.nox !== null ? data.nox : f.properties.nox,
                        no2: data.no2 !== null ? data.no2 : f.properties.no2,
                        co: data.co !== null ? data.co : f.properties.co,
                        co2: data.co2 !== null ? data.co2 : f.properties.co2,
                      }
                    };
                  }
                  return f;
                })
              };
            });
          } else if (data.type === 'POLLUTION_ALERT') {
            setActiveEvent((prev) => {
              // Fetch latest GIS layers for the new or updated event
              fetchEventGisLayers(data.event_id)
                .then((layers) => {
                  if (layers.layers.plume_cone) setPlumeCone(layers.layers.plume_cone as GeoJSONFeature);
                  if (layers.layers.wind_vector) setWindVector(layers.layers.wind_vector as GeoJSONFeature);
                })
                .catch(console.error);

              return {
                event_id: data.event_id,
                status: 'active',
                severity: data.severity,
                village_name: data.village_name,
                peak_pm25: data.peak_pm25,
                peak_so2: data.peak_so2,
                detected_at: data.started_at || new Date().toISOString(),
                // Fill other required properties if necessary
              } as PollutionEvent;
            });
          }
        } catch (err) {
          console.error('Error parsing WS message:', err);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket closed. Reconnecting in 5s...');
        reconnectTimer = setTimeout(connectWS, 5000);
      };
    };

    connectWS();

    return () => {
      clearTimeout(reconnectTimer);
      if (ws) {
        ws.onclose = null; // Prevent reconnect on unmount
        ws.close();
      }
    };
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-118px)] w-full">
      {/* ---- LEFT: GIS Map ---- */}
      <div className="relative flex-1 border-b-2 md:border-b-0 md:border-r-2 border-stone-300 min-h-[50vh] md:min-h-0 overflow-hidden">
        {/* Map panel header */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          background: 'rgba(255,255,255,0.95)',
          borderBottom: '1px solid #e4e4e7',
          padding: '6px 12px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          zIndex: 800, fontSize: '11px',
        }}>
          <div>
            <strong style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('mapTitle')}</strong>
            <span style={{ color: '#71717a', marginLeft: 8 }}>{t('mapSubtitle')}</span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', color: '#71717a' }}>MAP / 01</span>
        </div>
        <div style={{ position: 'absolute', inset: 0, paddingTop: 32 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#71717a' }}>
              {tCommon('loading')}
            </div>
          ) : error ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8 }}>
              <span style={{ color: '#dc2626' }}>{error}</span>
            </div>
          ) : (
            <GisMap
              nodesGeoJSON={nodes}
              industriesGeoJSON={industries}
              plumeLayer={plumeCone}
              windVectorLayer={windVector}
            />
          )}
        </div>
      </div>

      {/* ---- RIGHT: Incident Dossier Panel ---- */}
      <div className="w-full md:w-[460px] overflow-y-auto bg-[#fffff0] flex-shrink-0">
        {/* Active Alert Banner */}
        {activeEvent && (
          <div style={{
            background: activeEvent.severity === 'normal' ? '#f0fdf4' : '#fef2f2',
            borderBottom: `2px solid ${SEVERITY_COLORS[activeEvent.severity] || '#dc2626'}`,
            padding: '8px 16px',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span
              className="severity-pulse"
              style={{
                display: 'inline-block', width: 8, height: 8,
                background: SEVERITY_COLORS[activeEvent.severity] || '#dc2626',
              }}
            />
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {activeEvent.severity.toUpperCase()} — {activeEvent.village_name}
            </span>
            <span style={{ marginLeft: 'auto', fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#71717a' }}>
              {new Date(activeEvent.detected_at).toLocaleTimeString('en-IN')} IST
            </span>
          </div>
        )}

        {/* Telemetry Section */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #e4e4e7' }}>
          <div style={{
            fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.8px', color: '#71717a', marginBottom: 10,
            display: 'flex', justifyContent: 'space-between',
          }}>
            <span>{t('telemetryTitle')}</span>
            {activeEvent?.peak_pm25 && (
              <span style={{ color: '#dc2626' }}>
                {Math.round((activeEvent.peak_pm25 / CPCB_LIMITS.pm25) * 100)}% OF CPCB LIMIT
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              {
                label: 'PM2.5 Concentration',
                value: activeEvent?.peak_pm25,
                unit: 'µg/m³',
                limit: CPCB_LIMITS.pm25,
                sub: `CPCB 24h Limit: ${CPCB_LIMITS.pm25}`,
              },
              {
                label: 'PM10 Respirable Dust',
                value: activeEvent?.peak_pm10 ?? null,
                unit: 'µg/m³',
                limit: 100,
                sub: 'CPCB 24h Benchmark: 100',
              },
              {
                label: 'SO2 Toxic Gas',
                value: activeEvent?.peak_so2,
                unit: 'µg/m³',
                limit: CPCB_LIMITS.so2,
                sub: `CPCB Limit: ${CPCB_LIMITS.so2}`,
              },
              {
                label: 'NOx Oxides',
                value: activeEvent?.peak_nox ?? null,
                unit: 'µg/m³',
                limit: 80,
                sub: 'NOx Trigger Band: 80',
              },
              {
                label: 'NO2 Nitrogen Dioxide',
                value: activeEvent?.peak_no2 ?? null,
                unit: 'µg/m³',
                limit: 80,
                sub: 'NO2 Benchmark: 80',
              },
              {
                label: 'CO Carbon Monoxide',
                value: activeEvent?.peak_co ?? null,
                unit: 'ppm',
                limit: 2,
                sub: 'Short-term threshold: 2',
              },
              {
                label: 'CO₂ Ambient Level',
                value: activeEvent?.peak_co2 ?? null,
                unit: 'ppm',
                limit: 500,
                sub: 'Baseline reference: 500',
              },
            ].map((metric) => {
              const isCritical = metric.value != null && metric.value > metric.limit;
              return (
                <div
                  key={metric.label}
                  style={{
                    border: `1px solid ${isCritical ? '#dc2626' : '#e4e4e7'}`,
                    background: isCritical ? '#fef2f2' : '#f8fafc',
                    padding: '8px 10px',
                  }}
                >
                  <div style={{ fontSize: '10px', color: '#71717a', textTransform: 'uppercase' }}>{metric.label}</div>
                  <div style={{
                    fontSize: '20px', fontWeight: 600, fontFamily: 'var(--font-mono)',
                    color: isCritical ? '#dc2626' : '#000', marginTop: 2,
                  }}>
                    {metric.value != null ? metric.value.toFixed(1) : '—'}
                    <small style={{ fontSize: '11px', fontWeight: 400 }}> {metric.unit}</small>
                  </div>
                  <div style={{ fontSize: '10px', color: '#a1a1aa' }}>{metric.sub}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* No active incident fallback */}
        {!activeEvent && !loading && (
          <div style={{ padding: '24px 16px', color: '#71717a', fontSize: '13px' }}>
            {t('noActiveIncident')}
          </div>
        )}
      </div>
    </div>
  );
}
