"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  Polyline,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  SEOUL_DISTRICT_BOUNDARIES,
  DISTRICT_BOUNDARY_STYLE,
  type DistrictPolygon,
} from "@/data/district-boundaries";

// Fix for default markers in React-Leaflet
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: string })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
}

const createCustomIcon = (color = "blue", size: "small" | "medium" | "large" = "medium") => {
  const sizes: Record<string, [number, number]> = { small: [20, 32], medium: [25, 41], large: [30, 50] };
  return L.icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: sizes[size],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
};

// Map event handler
function MapEvents({
  onMapClick,
  onLocationFound,
}: {
  onMapClick?: (latlng: L.LatLng) => void;
  onLocationFound?: (latlng: L.LatLng) => void;
}) {
  const map = useMapEvents({
    click: (e) => onMapClick?.(e.latlng),
    locationfound: (e) => {
      onLocationFound?.(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });
  return null;
}

// Custom controls
function CustomControls({
  onLocate,
  onToggleLayer,
  layers,
}: {
  onLocate: () => void;
  onToggleLayer: (type: string) => void;
  layers: Record<string, boolean>;
}) {
  const map = useMap();

  useEffect(() => {
    const control = new L.Control({ position: "topright" });
    control.onAdd = () => {
      const div = L.DomUtil.create("div", "custom-controls");
      div.innerHTML = `
        <div style="background: white; padding: 10px; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.2);">
          <button id="locate-btn" style="margin: 2px; padding: 8px; border: none; border-radius: 3px; cursor: pointer;">📍 Locate Me</button>
          <button id="satellite-btn" style="margin: 2px; padding: 8px; border: none; border-radius: 3px; cursor: pointer;">🛰️ Satellite</button>
          <button id="traffic-btn" style="margin: 2px; padding: 8px; border: none; border-radius: 3px; cursor: pointer;">🚦 Traffic</button>
        </div>
      `;
      L.DomEvent.disableClickPropagation(div);
      div.querySelector("#locate-btn")?.addEventListener("click", onLocate);
      div.querySelector("#satellite-btn")?.addEventListener("click", () => onToggleLayer("satellite"));
      div.querySelector("#traffic-btn")?.addEventListener("click", () => onToggleLayer("traffic"));
      return div;
    };
    control.addTo(map);
    return () => {
      control.remove();
    };
  }, [map, onLocate, onToggleLayer]);

  return null;
}

type MarkerType = {
  id?: string;
  position: [number, number];
  color?: string;
  size?: "small" | "medium" | "large";
  popup?: { title: string; content: string; image?: string };
  icon?: L.Icon;
};

type PolygonType = {
  id?: string;
  positions: [number, number][][];
  popup?: string;
  style?: L.PathOptions;
};

type PolylineType = {
  id?: string;
  positions: [number, number][];
  popup?: string;
  style?: L.PathOptions;
};

export type AdvancedMapProps = {
  center?: [number, number];
  zoom?: number;
  markers?: MarkerType[];
  polygons?: PolygonType[];
  circles?: unknown[];
  polylines?: PolylineType[];
  onMarkerClick?: (marker: MarkerType) => void;
  onMapClick?: (latlng: L.LatLng) => void;
  enableClustering?: boolean;
  enableSearch?: boolean;
  enableControls?: boolean;
  showDistrictBoundaries?: boolean;
  mapLayers?: { openstreetmap?: boolean; satellite?: boolean; traffic?: boolean };
  className?: string;
  style?: React.CSSProperties;
};

export function AdvancedMap({
  center = [37.5012, 127.0396],
  zoom = 14,
  markers = [],
  polygons = [],
  polylines = [],
  onMarkerClick,
  onMapClick,
  enableClustering = false,
  enableControls = true,
  showDistrictBoundaries = true,
  mapLayers = { openstreetmap: true, satellite: false, traffic: false },
  className = "",
  style = { height: "500px", width: "100%" },
}: AdvancedMapProps) {
  const [currentLayers, setCurrentLayers] = useState(mapLayers);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [clickedLocation, setClickedLocation] = useState<L.LatLng | null>(null);

  const handleToggleLayer = useCallback((layerType: string) => {
    setCurrentLayers((prev) => ({
      ...prev,
      [layerType]: !prev[layerType as keyof typeof prev],
    }));
  }, []);

  const handleLocate = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        () => {}
      );
    }
  }, []);

  const handleMapClick = useCallback(
    (latlng: L.LatLng) => {
      setClickedLocation(latlng);
      onMapClick?.(latlng);
    },
    [onMapClick]
  );

  return (
    <div className={`advanced-map ${className}`} style={style}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
      >
        {currentLayers.openstreetmap && (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        )}
        {currentLayers.satellite && (
          <TileLayer
            attribution="&copy; Esri"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        )}

        <MapEvents onMapClick={handleMapClick} onLocationFound={(e) => setUserLocation([e.lat, e.lng])} />

        {enableControls && (
          <CustomControls onLocate={handleLocate} onToggleLayer={handleToggleLayer} layers={currentLayers} />
        )}

        {/* 시군구 경계 테두리 - 반투명 파란색 */}
        {showDistrictBoundaries &&
          SEOUL_DISTRICT_BOUNDARIES.map((district: DistrictPolygon) =>
            district.positions.map((ring, ringIdx) => (
              <Polygon
                key={`${district.id}-${ringIdx}`}
                positions={ring}
                pathOptions={DISTRICT_BOUNDARY_STYLE}
              >
                <Popup>{district.name}</Popup>
              </Polygon>
            ))
          )}

        {/* 사용자 정의 폴리곤 */}
        {polygons.map((polygon, index) => (
          <Polygon
            key={polygon.id ?? index}
            positions={polygon.positions}
            pathOptions={polygon.style ?? { color: "purple", weight: 2, fillOpacity: 0.3 }}
          >
            {polygon.popup && <Popup>{polygon.popup}</Popup>}
          </Polygon>
        ))}

        {/* 폴리라인 */}
        {polylines.map((polyline, index) => (
          <Polyline
            key={polyline.id ?? index}
            positions={polyline.positions}
            pathOptions={polyline.style ?? { color: "red", weight: 3 }}
          >
            {polyline.popup && <Popup>{polyline.popup}</Popup>}
          </Polyline>
        ))}

        {/* 마커 */}
        {markers.map((marker, index) => (
          <Marker
            key={marker.id ?? index}
            position={marker.position}
            icon={marker.icon ?? createCustomIcon(marker.color ?? "blue", marker.size)}
            eventHandlers={{ click: () => onMarkerClick?.(marker) }}
          >
            {marker.popup && (
              <Popup>
                <div>
                  <h3>{marker.popup.title}</h3>
                  <p>{marker.popup.content}</p>
                  {marker.popup.image && (
                    <img src={marker.popup.image} alt={marker.popup.title} style={{ maxWidth: "200px" }} />
                  )}
                </div>
              </Popup>
            )}
          </Marker>
        ))}

        {userLocation && (
          <Marker position={userLocation} icon={createCustomIcon("red", "medium")}>
            <Popup>현재 위치</Popup>
          </Marker>
        )}

        {clickedLocation && (
          <Marker
            position={[clickedLocation.lat, clickedLocation.lng]}
            icon={createCustomIcon("orange", "small")}
          >
            <Popup>
              Lat: {clickedLocation.lat.toFixed(6)}
              <br />
              Lng: {clickedLocation.lng.toFixed(6)}
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

const AdvancedMapDynamic = dynamic(() => Promise.resolve(AdvancedMap), { ssr: false });
export default AdvancedMapDynamic;
