import React from 'react';
import { Zone, CabinetUnit, Obstacle, PresetType, CabinetType } from '../types';

interface Props {
  zone: Zone;
  height: number; // Wall Height
  onCabinetClick?: (index: number) => void;
  onObstacleClick?: (index: number) => void;
}

export const WallVisualizer: React.FC<Props> = ({ zone, height, onCabinetClick, onObstacleClick }) => {
  const sortedObs = [...zone.obstacles].sort((a, b) => a.fromLeft - b.fromLeft);
  
  // --- Flow Calculation ---
  let cursorX = 0;
  const placedCabinets: { x: number, w: number, unit: CabinetUnit, originalIndex: number }[] = [];
  
  zone.cabinets.forEach((cab, index) => {
    // Determine position based on obstacles
    let isClear = false;
    while (!isClear) {
      isClear = true;
      for (const obs of sortedObs) {
        // If cursor overlaps obstacle
        if (cursorX >= obs.fromLeft && cursorX < (obs.fromLeft + obs.width)) {
          cursorX = obs.fromLeft + obs.width; // Jump over
          isClear = false;
        }
        // If cabinet would partially overlap obstacle
        else if (cursorX < obs.fromLeft && (cursorX + cab.width) > obs.fromLeft) {
             // It hits the obstacle, so push cursor to after the obstacle?
             // Or assumes invalid placement. In "Speed" mode, we push to after obstacle.
             cursorX = obs.fromLeft + obs.width;
             isClear = false;
        }
      }
    }
    
    placedCabinets.push({ x: cursorX, w: cab.width, unit: cab, originalIndex: index });
    cursorX += cab.width;
  });

  const viewWidth = Math.max(zone.totalLength, 1500); 
  const viewHeight = Math.max(height, 2400);

  // --- RENDER HELPERS ---

  const renderCabinetDetail = (pc: { x: number, w: number, unit: CabinetUnit, originalIndex: number }, y: number, h: number) => {
    const { unit, originalIndex } = pc;
    
    // CAD Style Colors
    const isAuto = unit.isAutoFilled;
    const strokeColor = isAuto ? "#F59E0B" : "var(--cab-stroke)";
    const fillColor = isAuto ? "rgba(245, 158, 11, 0.15)" : "var(--cab-fill)";
    const textColor = "var(--text-color)";

    let details = null;

    switch (unit.preset) {
      case PresetType.BASE_DRAWER_3:
        const d1h = h * 0.2; 
        const d2h = h * 0.4; 
        details = (
          <g>
            <line x1={pc.x} y1={y + d1h} x2={pc.x + pc.w} y2={y + d1h} stroke={strokeColor} strokeWidth="1" />
            <line x1={pc.x} y1={y + d1h + d2h} x2={pc.x + pc.w} y2={y + d1h + d2h} stroke={strokeColor} strokeWidth="1" />
            <circle cx={pc.x + pc.w/2} cy={y + d1h/2} r="3" fill={strokeColor} />
            <circle cx={pc.x + pc.w/2} cy={y + d1h + d2h/2} r="3" fill={strokeColor} />
            <circle cx={pc.x + pc.w/2} cy={y + h - d2h/2} r="3" fill={strokeColor} />
          </g>
        );
        break;

      case PresetType.BASE_DOOR:
      case PresetType.WALL_STD:
        if (pc.w > 500) {
          details = (
            <g>
              <line x1={pc.x + pc.w/2} y1={y} x2={pc.x + pc.w/2} y2={y + h} stroke={strokeColor} strokeWidth="1" />
              <line x1={pc.x + 5} y1={y + h/2} x2={pc.x + pc.w - 5} y2={y + h/2} stroke={strokeColor} strokeWidth="1" strokeDasharray="4,4" opacity="0.6" />
              <path d={`M${pc.x} ${y} L${pc.x + pc.w/2} ${y+h/2} L${pc.x} ${y+h}`} fill="none" stroke={strokeColor} strokeWidth="0.5" opacity="0.4" />
              <path d={`M${pc.x+pc.w} ${y} L${pc.x + pc.w/2} ${y+h/2} L${pc.x+pc.w} ${y+h}`} fill="none" stroke={strokeColor} strokeWidth="0.5" opacity="0.4" />
            </g>
          );
        } else {
           details = (
            <g>
              <line x1={pc.x + 5} y1={y + h/2} x2={pc.x + pc.w - 5} y2={y + h/2} stroke={strokeColor} strokeWidth="1" strokeDasharray="4,4" opacity="0.6" />
              <path d={`M${pc.x+pc.w} ${y} L${pc.x} ${y+h/2} L${pc.x+pc.w} ${y+h}`} fill="none" stroke={strokeColor} strokeWidth="0.5" opacity="0.4" />
            </g>
           )
        }
        break;

      case PresetType.TALL_OVEN:
        const ovenY = y + 720;
        const ovenH = 600;
        details = (
          <g>
            <line x1={pc.x} y1={y + 360} x2={pc.x + pc.w} y2={y + 360} stroke={strokeColor} strokeWidth="1" />
            <line x1={pc.x} y1={y + 720} x2={pc.x + pc.w} y2={y + 720} stroke={strokeColor} strokeWidth="1" />
            <rect x={pc.x + 10} y={ovenY + 10} width={pc.w - 20} height={ovenH - 20} rx="4" fill="none" stroke={strokeColor} strokeWidth="2" />
            <line x1={pc.x} y1={ovenY + ovenH} x2={pc.x + pc.w} y2={ovenY + ovenH} stroke={strokeColor} strokeWidth="1" />
          </g>
        );
        break;
        
      case PresetType.FILLER:
        details = (
             <line x1={pc.x + pc.w/2} y1={y} x2={pc.x + pc.w/2} y2={y + h} stroke={strokeColor} strokeWidth="1" strokeDasharray="4,2" />
        );
        break;
    }

    return (
      <g key={unit.id} onClick={(e) => { e.stopPropagation(); onCabinetClick?.(originalIndex); }} className="cursor-pointer hover:opacity-80 transition-opacity">
        <rect 
          x={pc.x} y={y} width={pc.w} height={h} 
          fill={fillColor}
          stroke={strokeColor} 
          strokeWidth="2"
        />
        {details}
        <text 
          x={pc.x + pc.w/2} 
          y={y + h/2} 
          fill={textColor} 
          fontSize={Math.min(80, pc.w/3)} 
          textAnchor="middle" 
          dominantBaseline="middle" 
          fontWeight="bold"
          style={{pointerEvents: 'none'}}
        >
          {pc.w}
        </text>
      </g>
    );
  };

  return (
    <div className="w-full bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 overflow-hidden relative shadow-inner">
      <style>{`
        :root {
           --bg-wall: #ffffff;
           --bg-void: #f1f5f9;
           --grid-line: #e2e8f0;
           --wall-border: #94a3b8;
           --cab-stroke: #f59e0b;
           --cab-fill: rgba(245, 158, 11, 0.2);
           --obs-stroke: #64748b;
           --obs-fill: #e2e8f0;
           --text-color: #f59e0b;
        }
        .dark {
           --bg-wall: #0F172A; /* Slate 900 */
           --bg-void: #020617; /* Slate 950 */
           --grid-line: #1e293b;
           --wall-border: #64748b;
           --cab-stroke: #fbbf24;
           --cab-fill: rgba(251, 191, 36, 0.1);
           --obs-stroke: #475569;
           --obs-fill: #1e293b;
           --text-color: #fbbf24;
        }
      `}</style>
      
      <div className="absolute top-2 left-2 text-[10px] text-slate-400 font-mono z-10 px-2 rounded opacity-50">ELEVATION</div>
      
      <svg 
        viewBox={`-50 -100 ${viewWidth + 100} ${viewHeight + 150}`} 
        className="w-full h-48 md:h-full bg-[var(--bg-void)]"
        preserveAspectRatio="xMidYMax meet"
      >
        {/* Wall Background Area */}
        <rect x="0" y="0" width={zone.totalLength} height={height} fill="var(--bg-wall)" className="stroke-[var(--wall-border)]" strokeWidth="2"/>
        
        {/* Grid Pattern */}
        <defs>
          <pattern id="gridPattern" width="500" height="500" patternUnits="userSpaceOnUse">
            <path d="M 500 0 L 0 0 0 500" fill="none" stroke="var(--grid-line)" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect x="0" y="0" width={zone.totalLength} height={height} fill="url(#gridPattern)" />

        {/* Floor Line */}
        <line x1="-100" y1={height} x2={viewWidth + 100} y2={height} stroke="var(--wall-border)" strokeWidth="4" />

        {/* Obstacles */}
        {sortedObs.map((obs, idx) => (
          <g 
            key={obs.id} 
            onClick={(e) => { e.stopPropagation(); onObstacleClick?.(idx); }}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          >
             <rect 
              x={obs.fromLeft} 
              y={height - (obs.elevation || 0) - (obs.height || 2100)} 
              width={obs.width} 
              height={obs.height || 2100} 
              fill="var(--obs-fill)"
              stroke="var(--obs-stroke)"
              strokeWidth="2"
              fillOpacity="0.8"
            />
             {/* Window Detail */}
             {obs.type === 'window' && (
                <g stroke="var(--obs-stroke)" strokeWidth="1">
                  <line x1={obs.fromLeft} y1={height - (obs.elevation||0) - (obs.height||2100)/2} x2={obs.fromLeft + obs.width} y2={height - (obs.elevation||0) - (obs.height||2100)/2} />
                  <line x1={obs.fromLeft + obs.width/2} y1={height - (obs.elevation||0) - (obs.height||2100)} x2={obs.fromLeft + obs.width/2} y2={height - (obs.elevation||0)} />
                  <text 
                    x={obs.fromLeft + obs.width/2} 
                    y={height - (obs.elevation || 0) + 150} 
                    fill="var(--obs-stroke)" 
                    fontSize="80" 
                    textAnchor="middle"
                  >
                    ELEV: {obs.elevation}
                  </text>
                </g>
             )}
            <text 
              x={obs.fromLeft + obs.width/2} 
              y={height - (obs.elevation || 0) - (obs.height || 2100) + (obs.height || 2100)/2} 
              fill="var(--obs-stroke)"
              fontSize="120" 
              textAnchor="middle"
              dominantBaseline="middle"
              style={{textTransform: 'uppercase', opacity: 0.5, pointerEvents: 'none'}}
            >
              {obs.type}
            </text>
          </g>
        ))}

        {/* Cabinets */}
        {placedCabinets.map((pc) => {
          const isTall = pc.unit.type === CabinetType.TALL;
          const isWall = pc.unit.type === CabinetType.WALL;
          
          let h = 720;
          let yPos = height - 150 - 720; // 150 leg base default

          if (isTall) {
            h = 2100;
            yPos = height - 150 - 2100;
          } else if (isWall) {
             h = 720; 
             yPos = height - 150 - 2100; 
          }

          return renderCabinetDetail(pc, yPos, h);
        })}
      </svg>
      
      {/* Scale */}
      <div className="absolute bottom-1 right-2 bg-slate-900/80 px-2 py-1 text-[10px] text-amber-500 font-mono rounded pointer-events-none">
        1:{Math.round(viewWidth/400)}
      </div>
    </div>
  );
};