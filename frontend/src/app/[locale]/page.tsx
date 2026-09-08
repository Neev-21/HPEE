'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState, useTransition } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useParams } from 'next/navigation';
import {
  fetchNodesGeoJSON,
  fetchIndustriesGeoJSON,
  fetchPollutionEvents,
  fetchEventGisLayers,
  type GeoJSONFeatureCollection,
  type GeoJSONFeature,
  type PollutionEvent,
} from '@/lib/api';
import { appStore, type BlueprintPin } from '@/lib/store';
import { liveSocket } from '@/lib/websocket';
import FacilityBlueprint from '@/components/Blueprint/FacilityBlueprint';
import NodeDetailPanel, { type NodeMeasurement } from '@/components/DetailPanel/NodeDetailPanel';

const GisMap = dynamic(() => import('@/components/Map/GisMap'), { ssr: false });

const ANKLESHWAR_BOUNDS = {
  centerLat: 21.62,
  centerLon: 73.02,
  radiusKm: 18,
};

function filterNearbyGeoJSON(
  collection: GeoJSONFeatureCollection | null,
  centerLat: number,
  centerLon: number,
  radiusKm: number
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
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || 'en';

  const [nodes, setNodes] = useState<GeoJSONFeatureCollection | null>(null);
  const [industries, setIndustries] = useState<GeoJSONFeatureCollection | null>(null);
  const [activeEvent, setActiveEvent] = useState<PollutionEvent | null>(null);
  const [plumeCone, setPlumeCone] = useState<GeoJSONFeature | null>(null);
  const [windVector, setWindVector] = useState<GeoJSONFeature | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'blueprint' | 'gis'>('blueprint');

  // Selected node state
  const [selectedNodeId, setSelectedNodeId] = useState('S-001');
  const [selectedZone, setSelectedZone] = useState('Boiler Area');
  const [selectedNodeName, setSelectedNodeName] = useState('Boiler Sensor 01');
  const [nodeStatus, setNodeStatus] = useState<'ONLINE' | 'INVESTIGATE' | 'OFFLINE'>('ONLINE');
  const [readings, setReadings] = useState<NodeMeasurement[]>([
    { label: 'PM2.5', value: '84.6', unit: 'µg/m³', isAlert: true },
    { label: 'SO₂', value: '42.7', unit: 'µg/m³', isAlert: true },
    { label: 'Temperature', value: '29.4', unit: '°C' },
    { label: 'Humidity', value: '71', unit: '%' },
  ]);

  useEffect(() => {
    async function load() {
      try {
        const [nodesData, industriesData, events] = await Promise.all([
          fetchNodesGeoJSON(),
          fetchIndustriesGeoJSON(),
          fetchPollutionEvents(),
        ]);

        const filteredNodes = filterNearbyGeoJSON(
          nodesData,
          ANKLESHWAR_BOUNDS.centerLat,
          ANKLESHWAR_BOUNDS.centerLon,
          ANKLESHWAR_BOUNDS.radiusKm
        );
        const filteredIndustries = filterNearbyGeoJSON(
          industriesData,
          ANKLESHWAR_BOUNDS.centerLat,
          ANKLESHWAR_BOUNDS.centerLon,
          ANKLESHWAR_BOUNDS.radiusKm
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
          } catch {
            /* plume layers optional */
          }
        }
      } catch (e) {
        console.error('Error loading overview data:', e);
      } finally {
        setLoading(false);
      }
    }
    load().catch(() => {});
  }, []);

  // Live WebSocket streaming + fallback polling
  useEffect(() => {
    const unsubscribe = liveSocket.subscribe((msg) => {
      if (msg.type === 'TELEMETRY_UPDATE') {
        setNodes((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            features: prev.features.map((f) => {
              if (f.properties.node_id === msg.node_id) {
                return {
                  ...f,
                  properties: {
                    ...f.properties,
                    pm25: msg.pm25 ?? f.properties.pm25,
                    pm10: msg.pm10 ?? f.properties.pm10,
                    so2: msg.so2 ?? f.properties.so2,
                    temperature: msg.temperature ?? f.properties.temperature,
                    humidity: msg.humidity ?? f.properties.humidity,
                    wind_speed: msg.wind_speed ?? f.properties.wind_speed,
                  },
                };
              }
              return f;
            }),
          };
        });

        if (msg.node_id === selectedNodeId) {
          setReadings((prev) =>
            prev.map((r) => {
              if (r.label === 'PM2.5' && msg.pm25 != null) {
                return { ...r, value: Number(msg.pm25).toFixed(1), isAlert: msg.pm25 > 60 };
              }
              if (r.label === 'SO₂' && msg.so2 != null) {
                return { ...r, value: Number(msg.so2).toFixed(1), isAlert: msg.so2 > 40 };
              }
              if (r.label === 'Temperature' && msg.temperature != null) {
                return { ...r, value: Number(msg.temperature).toFixed(1) };
              }
              if (r.label === 'Humidity' && msg.humidity != null) {
                return { ...r, value: Number(msg.humidity).toFixed(1) };
              }
              return r;
            })
          );
        }
      } else if (msg.type === 'POLLUTION_ALERT') {
        setActiveEvent({
          event_id: msg.event_id,
          village_name: msg.village_name,
          severity: msg.severity,
          status: 'active',
          detected_at: msg.started_at || new Date().toISOString(),
          started_at: msg.started_at || new Date().toISOString(),
          peak_pm25: msg.peak_pm25,
          peak_so2: msg.peak_so2,
        });

        fetchEventGisLayers(msg.event_id)
          .then((layers) => {
            if (layers.layers.plume_cone) setPlumeCone(layers.layers.plume_cone as GeoJSONFeature);
            if (layers.layers.wind_vector) setWindVector(layers.layers.wind_vector as GeoJSONFeature);
          })
          .catch(() => {});
      }
    });

    // Background poll fallback every 30s
    const pollTimer = setInterval(async () => {
      try {
        const [nodesData, events] = await Promise.all([
          fetchNodesGeoJSON(),
          fetchPollutionEvents(),
        ]);
        setNodes(filterNearbyGeoJSON(nodesData, ANKLESHWAR_BOUNDS.centerLat, ANKLESHWAR_BOUNDS.centerLon, ANKLESHWAR_BOUNDS.radiusKm));
        const active = events.find((e) => e.status === 'active') || events[0] || null;
        setActiveEvent(active);
      } catch {
        /* ignore */
      }
    }, 30_000);

    return () => {
      unsubscribe();
      clearInterval(pollTimer);
    };
  }, [selectedNodeId]);

  // Handler when a pin in the blueprint is clicked
  const handleSelectBlueprintPin = (pin: BlueprintPin) => {
    setSelectedNodeId(pin.sensorId);
    setSelectedZone(pin.zone);
    setSelectedNodeName(pin.sensorId);

    // Update measurements from configured store
    const sensorConfig = appStore.getSensors().find((s) => s.id === pin.sensorId);
    setNodeStatus(sensorConfig?.status ?? 'ONLINE');

    const vals: Record<string, [string, string]> = {
      'PM2.5': ['84.6', 'µg/m³'],
      'SO₂': ['42.7', 'µg/m³'],
      Temperature: ['29.4', '°C'],
      Humidity: ['71', '%'],
      VOC: ['18.2', 'ppb'],
      CO: ['1.7', 'ppm'],
      'NO₂': ['22.1', 'µg/m³'],
      'Wind Speed': ['4.8', 'm/s'],
    };

    const newReadings: NodeMeasurement[] = (pin.measurements || ['PM2.5', 'SO₂', 'Temperature']).map((m) => {
      const [val, unit] = vals[m] || ['25.0', ''];
      const num = parseFloat(val);
      const isAlert = (m === 'PM2.5' && num > 60) || (m === 'SO₂' && num > 40);
      return { label: m, value: val, unit, isAlert };
    });

    setReadings(newReadings);
  };

  // Handler when a GIS map circle marker is clicked
  const handleSelectGisNode = (nodeId: string) => {
    const feature = nodes?.features.find((f) => String(f.properties.node_id) === nodeId);
    if (!feature) return;

    const p = feature.properties as Record<string, unknown>;
    setSelectedNodeId(nodeId);
    setSelectedNodeName(String(p.name || p.village_name || nodeId));
    setSelectedZone(String(p.district || p.village_name || 'Industrial Zone'));
    setNodeStatus(p.status === 'online' ? 'ONLINE' : p.status === 'degraded' ? 'INVESTIGATE' : 'OFFLINE');

    setReadings([
      { label: 'PM2.5', value: p.pm25 != null ? Number(p.pm25).toFixed(1) : '—', unit: 'µg/m³', isAlert: Number(p.pm25) > 60 },
      { label: 'SO₂', value: p.so2 != null ? Number(p.so2).toFixed(1) : '—', unit: 'µg/m³', isAlert: Number(p.so2) > 40 },
      { label: 'Temperature', value: p.temperature != null ? Number(p.temperature).toFixed(1) : '28.5', unit: '°C' },
      { label: 'Humidity', value: p.humidity != null ? Number(p.humidity).toFixed(1) : '72', unit: '%' },
      { label: 'Wind Speed', value: p.wind_speed != null ? Number(p.wind_speed).toFixed(1) : '3.2', unit: 'm/s' },
      { label: 'Battery', value: p.battery_percent != null ? `${p.battery_percent}%` : '95%' },
    ]);
  };

  return (
    <div style={{ padding: '16px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Top Header & Refresh */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <div style={{ textTransform: 'uppercase', letterSpacing: '0.12em', color: '#0d7778', fontSize: '10px', fontWeight: 800 }}>
            FACILITY OVERVIEW
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, margin: '3px 0 2px', letterSpacing: '-0.03em', color: '#09090b' }}>
            Live Environmental Status
          </h1>
          <div style={{ fontSize: '12px', color: '#71717a' }}>
            Interactive blueprint & regional GIS air monitoring console. Select any node to view real-time calibrated readings.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setViewMode(viewMode === 'blueprint' ? 'gis' : 'blueprint')}
            style={{
              background: '#0d7778',
              color: '#ffffff',
              border: 'none',
              padding: '8px 14px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Switch to {viewMode === 'blueprint' ? 'Regional GIS Map' : 'Facility Blueprint'}
          </button>
        </div>
      </div>

      {/* Dense 4-Metric Summary Row (From Mockup) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px', marginBottom: '16px' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e4e4e7', padding: '14px 16px' }}>
          <div style={{ fontSize: '11px', color: '#71717a' }}>PM2.5 • {selectedNodeId}</div>
          <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-mono)', margin: '4px 0 2px', color: '#dc2626' }}>
            {readings.find((r) => r.label === 'PM2.5')?.value ?? '84.6'} <small style={{ fontSize: '11px', fontWeight: 400 }}>µg/m³</small>
          </div>
          <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: 600 }}>↑ 2.4× baseline</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e4e4e7', padding: '14px 16px' }}>
          <div style={{ fontSize: '11px', color: '#71717a' }}>SO₂ • {selectedNodeId}</div>
          <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-mono)', margin: '4px 0 2px', color: '#d97706' }}>
            {readings.find((r) => r.label === 'SO₂')?.value ?? '42.7'} <small style={{ fontSize: '11px', fontWeight: 400 }}>µg/m³</small>
          </div>
          <div style={{ fontSize: '11px', color: '#d97706', fontWeight: 600 }}>↑ 1.8× baseline</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e4e4e7', padding: '14px 16px' }}>
          <div style={{ fontSize: '11px', color: '#71717a' }}>Temperature • Ambient</div>
          <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-mono)', margin: '4px 0 2px', color: '#09090b' }}>
            {readings.find((r) => r.label === 'Temperature')?.value ?? '29.4'} <small style={{ fontSize: '11px', fontWeight: 400 }}>°C</small>
          </div>
          <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>Stable</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e4e4e7', padding: '14px 16px' }}>
          <div style={{ fontSize: '11px', color: '#71717a' }}>Relative Humidity</div>
          <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-mono)', margin: '4px 0 2px', color: '#09090b' }}>
            {readings.find((r) => r.label === 'Humidity')?.value ?? '71'} <small style={{ fontSize: '11px', fontWeight: 400 }}>%</small>
          </div>
          <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>Stable</div>
        </div>
      </div>

      {/* Main Content Area: Map / Blueprint + Detail Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: '16px', minHeight: '600px' }}>
        {/* Left Map Container */}
        <div style={{ background: '#ffffff', border: '1px solid #e4e4e7', display: 'flex', flexDirection: 'column' }}>
          {/* Header toolbar */}
          <div
            style={{
              padding: '10px 16px',
              borderBottom: '1px solid #e4e4e7',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#fcfcfc',
            }}
          >
            <div>
              <strong style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {viewMode === 'blueprint' ? 'Facility Blueprint — Ankleshwar Plant' : 'Regional PostGIS Sensory Network'}
              </strong>
              <div style={{ fontSize: '10px', color: '#71717a' }}>
                {viewMode === 'blueprint'
                  ? 'ANK-001 • 6 installed nodes • 5 operational zones'
                  : '20 Active Monitoring Stations • 14 Attributed Industrial Units'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setViewMode(viewMode === 'blueprint' ? 'gis' : 'blueprint')}
                style={{
                  background: '#ffffff',
                  border: '1px solid #d4d4d8',
                  padding: '5px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {viewMode === 'blueprint' ? 'View Regional GIS Map' : 'View Facility Blueprint'}
              </button>
              <button
                onClick={() => router.push(`/${locale}/admin/blueprint`)}
                style={{
                  background: '#ffffff',
                  border: '1px solid #d4d4d8',
                  padding: '5px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Edit Layout
              </button>
            </div>
          </div>

          {/* Interactive Workspace */}
          <div style={{ flex: 1, position: 'relative', minHeight: '560px' }}>
            {viewMode === 'blueprint' ? (
              <FacilityBlueprint selectedPinId={selectedNodeId} onSelectPin={handleSelectBlueprintPin} />
            ) : (
              <GisMap
                nodesGeoJSON={nodes}
                industriesGeoJSON={industries}
                plumeLayer={plumeCone}
                windVectorLayer={windVector}
                onNodeClick={handleSelectGisNode}
              />
            )}
          </div>
        </div>

        {/* Right Detail Panel */}
        <div style={{ background: '#ffffff', border: '1px solid #e4e4e7' }}>
          <NodeDetailPanel
            nodeId={selectedNodeId}
            nodeName={selectedNodeName}
            zone={selectedZone}
            status={nodeStatus}
            readings={readings}
            activeEvent={activeEvent}
          />
        </div>
      </div>
    </div>
  );
}
