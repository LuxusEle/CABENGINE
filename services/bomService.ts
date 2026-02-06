import { Project, Zone, CabinetUnit, BOMGroup, BOMItem, CabinetType, PresetType, ProjectSettings, ZoneId } from '../types';

// Helper to generate unique IDs
const uuid = () => Math.random().toString(36).substr(2, 9);

// Hardware Constants
const HW = {
  HINGE: 'Soft-Close Hinge',
  SLIDE: 'Drawer Slide (Pair)',
  LEG: 'Adjustable Leg',
  HANDLE: 'Handle/Knob',
  HANGER: 'Wall Hanger (Pair)'
};

// Standard widths to try for auto-fill
const STD_WIDTHS = [900, 600, 500, 450, 400, 300];

export const autoFillZone = (zone: Zone): Zone => {
  // 1. Filter out existing auto-filled items to regenerate them
  const manualCabs = zone.cabinets.filter(c => !c.isAutoFilled);
  const obstacles = zone.obstacles;

  // 2. Build a Timeline of Occupied Space
  // We need to know where manual cabinets end up visually to calculate true gaps.
  // Since we don't have X coordinates stored, we simulate the flow.
  
  interface PlacedItem {
    start: number;
    end: number;
    originalIndex: number; // -1 for obstacle
    type: 'cabinet' | 'obstacle';
  }

  const placedItems: PlacedItem[] = [];
  
  // Sort obstacles
  const sortedObs = [...obstacles].sort((a, b) => a.fromLeft - b.fromLeft);
  
  // Add obstacles to timeline
  sortedObs.forEach(obs => {
    placedItems.push({ start: obs.fromLeft, end: obs.fromLeft + obs.width, originalIndex: -1, type: 'obstacle' });
  });

  // Flow manual cabinets to find their positions
  let cursor = 0;
  manualCabs.forEach((cab, idx) => {
    // Determine position based on obstacles
    let isClear = false;
    while (!isClear) {
      isClear = true;
      for (const obs of sortedObs) {
        // Overlap check
        if (cursor >= obs.fromLeft && cursor < (obs.fromLeft + obs.width)) {
          cursor = obs.fromLeft + obs.width;
          isClear = false;
        } else if (cursor < obs.fromLeft && (cursor + cab.width) > obs.fromLeft) {
             cursor = obs.fromLeft + obs.width;
             isClear = false;
        }
      }
    }
    placedItems.push({ start: cursor, end: cursor + cab.width, originalIndex: idx, type: 'cabinet' });
    cursor += cab.width;
  });

  // Sort all items by start position to find gaps between them
  placedItems.sort((a, b) => a.start - b.start);

  // 3. Find Gaps and Generate Auto Cabinets
  const newCabinetList: CabinetUnit[] = [];
  let currentPos = 0;

  // We iterate through the timeline.
  // If we find a gap, we fill it with auto-cabinets.
  // If we find a manual cabinet, we push it to the list.
  
  // Helper to fill a gap
  const fillGap = (start: number, end: number) => {
    let remaining = end - start;
    if (remaining < 300) {
      if(remaining > 0) {
         // Tiny gap filler
         newCabinetList.push({ id: uuid(), preset: PresetType.FILLER, type: CabinetType.BASE, width: remaining, qty: 1, isAutoFilled: true });
      }
      return;
    }

    while (remaining >= 300) {
      const width = STD_WIDTHS.find(w => w <= remaining) || remaining;
      
      if (width >= 300) {
        // Add Base
        newCabinetList.push({ id: uuid(), preset: PresetType.BASE_DOOR, type: CabinetType.BASE, width: width, qty: 1, isAutoFilled: true });
        // Add Wall
        newCabinetList.push({ id: uuid(), preset: PresetType.WALL_STD, type: CabinetType.WALL, width: width, qty: 1, isAutoFilled: true });
        remaining -= width;
      } else {
        newCabinetList.push({ id: uuid(), preset: PresetType.FILLER, type: CabinetType.BASE, width: remaining, qty: 1, isAutoFilled: true });
        remaining = 0;
      }
    }
  };

  placedItems.forEach(item => {
    // Gap before this item?
    if (item.start > currentPos) {
      fillGap(currentPos, item.start);
    }
    
    // If it's a cabinet, add it to list
    if (item.type === 'cabinet') {
      newCabinetList.push(manualCabs[item.originalIndex]);
    }
    
    currentPos = Math.max(currentPos, item.end);
  });

  // Final gap after last item
  if (currentPos < zone.totalLength) {
    fillGap(currentPos, zone.totalLength);
  }

  return {
    ...zone,
    cabinets: newCabinetList
  };
};

const generateCabinetParts = (unit: CabinetUnit, settings: ProjectSettings, cabIndex: number): BOMItem[] => {
  const parts: BOMItem[] = [];
  const { thickness } = settings;
  const labelPrefix = `#${cabIndex + 1} ${unit.preset}`;
  
  let height = settings.baseHeight;
  let depth = settings.depthBase;
  
  if (unit.type === CabinetType.WALL) {
    height = settings.wallHeight;
    depth = settings.depthWall;
  } else if (unit.type === CabinetType.TALL) {
    height = settings.tallHeight;
    depth = settings.depthTall;
  }
  
  if (unit.preset === PresetType.FILLER) {
    parts.push({
      id: uuid(), name: 'Filler Panel', qty: 1, width: unit.width, length: height, 
      material: `${thickness}mm White`, label: labelPrefix
    });
    return parts;
  }

  // --- CARCASS LOGIC ---
  
  // Sides
  parts.push({
    id: uuid(), name: 'Side Panel', qty: 2, width: depth, length: height, 
    material: `${thickness}mm White`, label: labelPrefix
  });

  // Bottom
  const horizWidth = unit.width - (2 * thickness);
  parts.push({
    id: uuid(), name: 'Bottom Panel', qty: 1, width: depth, length: horizWidth, 
    material: `${thickness}mm White`, label: labelPrefix
  });

  // Top / Rails
  if (unit.type === CabinetType.BASE) {
    parts.push({
      id: uuid(), name: 'Top Rail', qty: 2, width: 100, length: horizWidth, 
      material: `${thickness}mm White`, label: labelPrefix
    });
  } else {
    parts.push({
      id: uuid(), name: 'Top Panel', qty: 1, width: depth, length: horizWidth, 
      material: `${thickness}mm White`, label: labelPrefix
    });
  }

  // Back (Simplified full overlay)
  parts.push({
    id: uuid(), name: 'Back Panel', qty: 1, width: unit.width - 2, length: height - 2, 
    material: '6mm MDF', label: labelPrefix
  });

  // --- PRESET SPECIFIC LOGIC & HARDWARE ---

  // 1. Base 2-Door
  if (unit.preset === PresetType.BASE_DOOR) {
    parts.push({
      id: uuid(), name: 'Shelf', qty: 1, width: depth - 20, length: horizWidth, 
      material: `${thickness}mm White`, label: labelPrefix
    });
    parts.push({ id: uuid(), name: HW.HINGE, qty: unit.width > 400 ? 4 : 2, width: 0, length: 0, material: 'Hardware', isHardware: true });
    parts.push({ id: uuid(), name: HW.HANDLE, qty: unit.width > 400 ? 2 : 1, width: 0, length: 0, material: 'Hardware', isHardware: true });
    parts.push({ id: uuid(), name: HW.LEG, qty: 4, width: 0, length: 0, material: 'Hardware', isHardware: true });
  }

  // 2. Base 3-Drawer
  if (unit.preset === PresetType.BASE_DRAWER_3) {
    parts.push({ id: uuid(), name: 'Drawer Bottom', qty: 3, width: depth - 50, length: horizWidth - 26, material: '16mm White', label: labelPrefix });
    parts.push({ id: uuid(), name: 'Drawer Side', qty: 6, width: depth - 10, length: 150, material: '16mm White', label: labelPrefix });
    parts.push({ id: uuid(), name: HW.SLIDE, qty: 3, width: 0, length: 0, material: 'Hardware', isHardware: true });
    parts.push({ id: uuid(), name: HW.HANDLE, qty: 3, width: 0, length: 0, material: 'Hardware', isHardware: true });
    parts.push({ id: uuid(), name: HW.LEG, qty: 4, width: 0, length: 0, material: 'Hardware', isHardware: true });
  }

  // 3. Wall Standard
  if (unit.preset === PresetType.WALL_STD) {
    parts.push({
      id: uuid(), name: 'Shelf', qty: 2, width: depth - 20, length: horizWidth, 
      material: `${thickness}mm White`, label: labelPrefix
    });
    parts.push({ id: uuid(), name: HW.HINGE, qty: unit.width > 400 ? 4 : 2, width: 0, length: 0, material: 'Hardware', isHardware: true });
    parts.push({ id: uuid(), name: HW.HANDLE, qty: unit.width > 400 ? 2 : 1, width: 0, length: 0, material: 'Hardware', isHardware: true });
    parts.push({ id: uuid(), name: HW.HANGER, qty: 1, width: 0, length: 0, material: 'Hardware', isHardware: true });
  }
  
  // 4. Tall Oven/Micro
  if (unit.preset === PresetType.TALL_OVEN) {
    parts.push({
      id: uuid(), name: 'Fixed Shelf (Oven)', qty: 2, width: depth, length: horizWidth, 
      material: `${thickness}mm White`, label: labelPrefix
    });
    parts.push({ id: uuid(), name: HW.LEG, qty: 4, width: 0, length: 0, material: 'Hardware', isHardware: true });
    parts.push({ id: uuid(), name: HW.SLIDE, qty: 2, width: 0, length: 0, material: 'Hardware', isHardware: true });
  }

  return parts;
};

export const generateProjectBOM = (project: Project): { groups: BOMGroup[], hardwareSummary: Record<string, number>, totalArea: number } => {
  const groups: BOMGroup[] = [];
  const hardwareSummary: Record<string, number> = {};
  let totalArea = 0;

  project.zones.filter(z => z.active).forEach(zone => {
    zone.cabinets.forEach((unit, index) => {
      const parts = generateCabinetParts(unit, project.settings, index);
      
      const woodParts = parts.filter(p => !p.isHardware);
      const hwParts = parts.filter(p => p.isHardware);

      woodParts.forEach(p => {
        totalArea += (p.width * p.length * p.qty) / 1000000;
      });

      hwParts.forEach(h => {
        hardwareSummary[h.name] = (hardwareSummary[h.name] || 0) + h.qty;
      });

      groups.push({
        cabinetId: unit.id,
        cabinetName: `${zone.id} - #${index + 1} ${unit.preset} (${unit.width}mm)`,
        items: woodParts
      });
    });
  });

  return {
    groups,
    hardwareSummary,
    totalArea: parseFloat(totalArea.toFixed(2))
  };
};

export const createNewProject = (): Project => ({
  id: uuid(),
  name: 'New Project',
  settings: {
    baseHeight: 720,
    wallHeight: 720,
    tallHeight: 2100,
    depthBase: 560,
    depthWall: 320,
    depthTall: 580,
    thickness: 16
  },
  zones: [
    { id: ZoneId.WALL_A, active: true, totalLength: 3000, obstacles: [], cabinets: [] },
    { id: ZoneId.WALL_B, active: false, totalLength: 3000, obstacles: [], cabinets: [] },
    { id: ZoneId.WALL_C, active: false, totalLength: 3000, obstacles: [], cabinets: [] },
    { id: ZoneId.ISLAND, active: false, totalLength: 2400, obstacles: [], cabinets: [] },
  ]
});