import type { StyleSpecification } from "maplibre-gl";

/** Dieselbe Kugel wie /tournaments — Esri-Satellit, scharf. */
export const GLOBE_STYLE: StyleSpecification = {
  version: 8,
  projection: { type: "vertical-perspective" },
  sky: { "atmosphere-blend": 0.85 },
  sources: {
    esri: {
      type: "raster",
      tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
      tileSize: 256,
      maxzoom: 19,
      attribution: "Esri, Maxar, Earthstar Geographics",
    },
  },
  layers: [{
    id: "sat",
    type: "raster",
    source: "esri",
    paint: { "raster-fade-duration": 0, "raster-resampling": "linear" },
  }],
};

/**
 * Moderne Straßenkarte nach dem Reinzoomen.
 * OpenFreeMap Liberty (Mapbox-ähnlicher Vektor-Look) — kein Mapbox-Token nötig.
 */
export const STREET_STYLE = "https://tiles.openfreemap.org/styles/liberty";

export const GLOBE_CENTER: [number, number] = [0, 16];
export const GLOBE_ZOOM = 1.55;
export const STREET_FROM_ZOOM = 4.6;
