export interface TableLocationInfo {
  tableId: string;
  libraryName: string;
  floor: string;
  zone: string;
  coordinates: { lat: number; lng: number };
  isValid: boolean;
}

const THOMPSON_COORDINATES = { lat: 40.0001, lng: -83.0146 };

export function parseTableLocation(
  rawTableId: string,
  library: string = "Thompson Library"
): TableLocationInfo {
  const tableId = (rawTableId || "").trim();
  if (!tableId) {
    return {
      tableId: "",
      libraryName: library || "Thompson Library",
      floor: "Floor 1",
      zone: "Main Reading Area",
      coordinates: THOMPSON_COORDINATES,
      isValid: false,
    };
  }

  // Parse patterns like "150b-1", "150a-6", "140-12", "105-3", "THO-3-E12"
  const standardMatch = tableId.match(/^(\d+)([a-zA-Z]?)-(\d+)$/);
  if (standardMatch) {
    const roomNum = standardMatch[1]; // e.g. 150
    const subLetter = (standardMatch[2] || "").toUpperCase(); // e.g. B
    const tableIndex = standardMatch[3]; // e.g. 1

    const floorNum = roomNum.charAt(0);
    const floor = `Floor ${floorNum}`;
    const zone = `Room ${roomNum}${subLetter ? subLetter : ""} (Table ${tableIndex})`;

    return {
      tableId,
      libraryName: library || "Thompson Library",
      floor,
      zone,
      coordinates: THOMPSON_COORDINATES,
      isValid: true,
    };
  }

  // Handle formats like "THO-3-E12" or "TH-304-B"
  const legacyMatch = tableId.match(/^(?:THO|TH)-(\d+)-([A-Za-z0-9]+)$/i);
  if (legacyMatch) {
    const floorNum = legacyMatch[1];
    const section = legacyMatch[2].toUpperCase();
    return {
      tableId,
      libraryName: library || "Thompson Library",
      floor: `Floor ${floorNum}`,
      zone: `Section ${section}`,
      coordinates: THOMPSON_COORDINATES,
      isValid: true,
    };
  }

  return {
    tableId,
    libraryName: library || "Thompson Library",
    floor: "Floor 1",
    zone: `Table ${tableId}`,
    coordinates: THOMPSON_COORDINATES,
    isValid: true,
  };
}
