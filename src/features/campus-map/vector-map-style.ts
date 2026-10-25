import type { StyleSpecification, LayerSpecification } from "maplibre-gl";

export const VECTOR_STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

/** Shared by vector paint and the local floor-plan backing to avoid a white card edge. */
export const CAMPUS_MAP_PALETTE = {
  background: "#edf0e8",
  park: "#a9c68e",
  wood: "#87aa78",
  building: "#d3bea1",
  buildingOutline: "#9a8c78",
  water: "#8fbfc9",
  path: "#a7adb2",
  minorRoad: "#c6cbd0",
  majorRoad: "#e3e6e8",
  roadOutline: "#92999f",
  label: "#424a40",
  labelHalo: "#f7f8f2",
} as const;

/** Flat natural-campus colors; keep geometry, widths, and label layout zoom-dependent. */
export function createCampusVectorStyle(style: StyleSpecification): StyleSpecification {
  if (style.version !== 8 || !style.sources || !Array.isArray(style.layers)) {
    throw new Error("Invalid vector map style");
  }
  const palette = CAMPUS_MAP_PALETTE;
  return {
    ...style,
    sources: Object.fromEntries(Object.entries(style.sources).filter(([, source]) => source.type !== "raster" && source.type !== "raster-dem")),
    layers: style.layers.filter((layer) => layer.type !== "raster" && layer.type !== "fill-extrusion" && layer.type !== "hillshade").flatMap((layer): LayerSpecification[] => {
      // Positron styles woods but omits grass, including many mapped campus lawns.
      if (layer.type === "fill" && layer.id === "landcover_wood" && layer["source-layer"] === "landcover") {
        return [{ ...layer, id: "campus-grass", filter: ["==", ["get", "class"], "grass"],
          paint: { ...layer.paint, "fill-color": palette.park },
        }, layer];
      }
      return [layer];
    }).map((layer) => {
      if (layer.type === "background") return { ...layer, paint: { ...layer.paint, "background-color": palette.background } };
      if (layer.type === "symbol") return { ...layer, paint: { ...layer.paint,
        "text-color": palette.label, "text-halo-color": palette.labelHalo,
        "text-halo-width": 1, "text-halo-blur": 0,
      } };
      if (layer.type === "line") {
        const color = layer.id === "waterway" ? palette.water
          : layer.id === "highway_path" ? palette.path
            : layer.id === "highway_minor" ? palette.minorRoad
              : /^(highway|tunnel)_/.test(layer.id) && layer.id.endsWith("_casing") ? palette.roadOutline
                : /^(highway|tunnel)_/.test(layer.id) && layer.id.endsWith("_inner") ? palette.majorRoad : null;
        return color ? { ...layer, paint: { ...layer.paint, "line-color": color } } : layer;
      }
      if (layer.type !== "fill") return layer;
      const color = (layer.id === "park" || layer.id === "campus-grass") ? palette.park
        : layer.id === "landcover_wood" ? palette.wood
          : layer.id === "building" ? palette.building
            : layer.id === "water" ? palette.water : null;
      return color ? { ...layer, paint: { ...layer.paint, "fill-color": color,
        ...(layer.id === "building" ? { "fill-outline-color": palette.buildingOutline } : {}),
      } } : layer;
    }),
  };
}
