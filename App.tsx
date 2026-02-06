import React, { useState, useMemo, useEffect } from 'react';
import { Home, Layers, Calculator, Zap, ArrowLeft, Trash2, Plus, Box, DoorOpen, Wand2, Moon, Sun, Table2, FileSpreadsheet, X, Pencil, Save, List, Settings } from 'lucide-react';
import { Screen, Project, ZoneId, PresetType, CabinetType, CabinetUnit, Obstacle } from './types';
import { createNewProject, generateProjectBOM, autoFillZone } from './services/bomService';

// Components
import { Button } from './components/Button';
import { NumberInput } from './components/NumberInput';
import { WallVisualizer } from './components/WallVisualizer';

// --- SUB-COMPONENTS ---

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <button 
      onClick={() => setIsDark(!isDark)}
      className="p-2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-amber-500 transition-colors"
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
};

const Header = ({ title, onBack, rightAction }: { title: string, onBack?: () => void, rightAction?: React.ReactNode }) => (
  <div className="h-14 md:h-16 px-4 flex items-center justify-between bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm shrink-0 md:hidden">
    <div className="flex items-center gap-3">
      {onBack && (
        <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
          <ArrowLeft size={24} />
        </button>
      )}
      <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{title}</h2>
    </div>
    <div className="flex items-center gap-2">
      <ThemeToggle />
      {rightAction}
    </div>
  </div>
);

// --- SCREENS ---

// 1. HOME SCREEN
const ScreenHome = ({ onNavigate, onNewProject }: { onNavigate: (s: Screen) => void, onNewProject: () => void }) => (
  <div className="flex flex-col h-full p-6 space-y-8 bg-slate-50 dark:bg-slate-950 items-center justify-center max-w-4xl mx-auto w-full overflow-y-auto">
    <div className="text-center space-y-2 mb-8">
      <h1 className="text-5xl md:text-6xl font-black tracking-tight text-slate-900 dark:text-white">
        CAB<span className="text-amber-600 dark:text-amber-500">ENGINE</span>
      </h1>
      <p className="text-slate-600 dark:text-slate-400 font-medium text-lg">Professional BOM Calculator</p>
    </div>

    <div className="w-full max-w-md space-y-4">
      <Button 
        variant="primary" 
        size="xl" 
        onClick={onNewProject}
        leftIcon={<Layers size={28} />}
        className="w-full py-8 text-xl shadow-xl shadow-amber-500/20"
      >
        Start New Project
      </Button>

      <div className="grid grid-cols-2 gap-4">
        <Button variant="secondary" size="lg" className="h-28 flex-col gap-2 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
          <Calculator size={28} className="text-amber-600 dark:text-amber-500" />
          <span>Quick Parts</span>
        </Button>
        <Button variant="secondary" size="lg" className="h-28 flex-col gap-2 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
          <Zap size={28} className="text-amber-600 dark:text-amber-500" />
          <span>Area Calc</span>
        </Button>
      </div>
    </div>
    
    <div className="text-xs text-slate-400 mt-auto pt-10">
      v2.4.0 • Desktop Sidebar & Mobile Sticky Actions
    </div>
  </div>
);

// 2. PROJECT SETUP
const ScreenProjectSetup = ({ project, setProject, onNext, onBack }: { project: Project, setProject: (p: Project) => void, onNext: () => void, onBack: () => void }) => {
  const toggleZone = (id: ZoneId) => {
    const updatedZones = project.zones.map(z => 
      z.id === id ? { ...z, active: !z.active } : z
    );
    setProject({ ...project, zones: updatedZones });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 w-full overflow-hidden">
      <Header title="Project Setup" onBack={onBack} />
      
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="hidden md:flex items-center justify-between mb-8">
             <h2 className="text-3xl font-black text-slate-900 dark:text-white">Project Setup</h2>
             <ThemeToggle />
          </div>

          {/* Active Zones */}
          <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            <h3 className="text-slate-500 font-bold uppercase text-xs tracking-wider mb-4 flex items-center gap-2">
              <Layers size={14} /> Active Zones
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {project.zones.map(zone => (
                <button
                  key={zone.id}
                  onClick={() => toggleZone(zone.id)}
                  className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    zone.active 
                      ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500 text-amber-700 dark:text-amber-500' 
                      : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-500'
                  }`}
                >
                  <div className={`p-2 rounded-full ${zone.active ? 'bg-amber-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                     <FileSpreadsheet size={20} />
                  </div>
                  <span className="font-bold text-sm">{zone.id}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Global Dimensions */}
          <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
            <h3 className="text-slate-500 font-bold uppercase text-xs tracking-wider mb-4">Global Heights (mm)</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <NumberInput 
                label="Base Height" 
                value={project.settings.baseHeight} 
                onChange={(v) => setProject({...project, settings: {...project.settings, baseHeight: v}})} 
                step={10} 
              />
              <NumberInput 
                label="Wall Cab Height" 
                value={project.settings.wallHeight} 
                onChange={(v) => setProject({...project, settings: {...project.settings, wallHeight: v}})} 
                step={50} 
              />
            </div>
          </section>
        </div>
      </div>

      <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 shrink-0 flex justify-center">
        <Button variant="primary" size="xl" className="w-full max-w-md" onClick={onNext}>
          Configure Walls
        </Button>
      </div>
    </div>
  );
};

// 3. WALL EDITOR (THE MAIN SCREEN)
const ScreenWallEditor = ({ project, setProject, onNext, onBack }: { project: Project, setProject: (p: Project) => void, onNext: () => void, onBack: () => void }) => {
  const activeZones = project.zones.filter(z => z.active);
  const [activeTab, setActiveTab] = useState<ZoneId>(activeZones[0]?.id || ZoneId.WALL_A);
  const currentZoneIndex = project.zones.findIndex(z => z.id === activeTab);
  const currentZone = project.zones[currentZoneIndex];

  // State for adding/editing items
  const [modalMode, setModalMode] = useState<'none' | 'add_obstacle' | 'add_cabinet' | 'edit_obstacle' | 'edit_cabinet'>('none');
  const [editIndex, setEditIndex] = useState<number>(-1);
  
  const [tempCabinet, setTempCabinet] = useState<CabinetUnit>({ id: '', preset: PresetType.BASE_DOOR, type: CabinetType.BASE, width: 600, qty: 1 });
  const [tempObstacle, setTempObstacle] = useState<Obstacle>({ id: '', type: 'door', fromLeft: 0, width: 900, height: 2100, elevation: 0, depth: 150 });

  // Actions
  const updateZone = (newZone: typeof currentZone) => {
    const newZones = [...project.zones];
    newZones[currentZoneIndex] = newZone;
    setProject({ ...project, zones: newZones });
  };

  const handleAutoFill = () => updateZone(autoFillZone(currentZone));
  
  const clearZone = () => {
    if (window.confirm(`Clear all items from ${currentZone.id}?`)) {
      updateZone({ ...currentZone, obstacles: [], cabinets: [] });
    }
  };

  // --- CRUD HANDLERS ---
  const openAddCabinet = () => {
    setTempCabinet({ id: Math.random().toString(), preset: PresetType.BASE_DOOR, type: CabinetType.BASE, width: 600, qty: 1 });
    setModalMode('add_cabinet');
  };

  const openAddObstacle = () => {
    setTempObstacle({ id: Math.random().toString(), type: 'door', fromLeft: 0, width: 900, height: 2100, elevation: 0, depth: 150 });
    setModalMode('add_obstacle');
  };

  const openEditCabinet = (index: number) => {
    const item = currentZone.cabinets[index];
    setTempCabinet({...item});
    setEditIndex(index);
    setModalMode('edit_cabinet');
  };

  const openEditObstacle = (index: number) => {
    const item = currentZone.obstacles[index];
    setTempObstacle({...item});
    setEditIndex(index);
    setModalMode('edit_obstacle');
  };

  const saveCabinet = () => {
    const newCabs = [...currentZone.cabinets];
    if (modalMode === 'add_cabinet') {
      newCabs.push({ ...tempCabinet, id: Math.random().toString() });
    } else {
      newCabs[editIndex] = tempCabinet;
    }
    updateZone({ ...currentZone, cabinets: newCabs });
    setModalMode('none');
  };

  const saveObstacle = () => {
    const newObs = [...currentZone.obstacles];
    if (modalMode === 'add_obstacle') {
      newObs.push({ ...tempObstacle, id: Math.random().toString() });
    } else {
      newObs[editIndex] = tempObstacle;
    }
    updateZone({ ...currentZone, obstacles: newObs });
    setModalMode('none');
  };

  const deleteCurrentItem = () => {
    if (modalMode.includes('cabinet')) {
      const newCabs = [...currentZone.cabinets];
      newCabs.splice(editIndex, 1);
      updateZone({ ...currentZone, cabinets: newCabs });
    } else {
      const newObs = [...currentZone.obstacles];
      newObs.splice(editIndex, 1);
      updateZone({ ...currentZone, obstacles: newObs });
    }
    setModalMode('none');
  };

  const EditorContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {modalMode.includes('obstacle') ? <DoorOpen className="text-slate-500"/> : <Box className="text-amber-500"/>}
            {modalMode.includes('edit') ? 'Edit' : 'Add'} {modalMode.includes('obstacle') ? 'Obstacle' : 'Cabinet'}
        </h3>
        <button onClick={() => setModalMode('none')} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 md:hidden">
            <X size={20} className="text-slate-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pb-6">
          {modalMode.includes('obstacle') ? (
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  {['door', 'window', 'column', 'pipe'].map(t => (
                    <button 
                      key={t}
                      onClick={() => setTempObstacle({...tempObstacle, type: t as any})}
                      className={`p-3 md:p-4 rounded-xl border-2 capitalize font-bold text-center transition-all ${tempObstacle.type === t ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500 text-amber-700 dark:text-amber-500' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-500'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="space-y-4">
                   <NumberInput label="Distance from Left" value={tempObstacle.fromLeft} onChange={v => setTempObstacle({...tempObstacle, fromLeft: v})} step={50} />
                   <NumberInput label="Width" value={tempObstacle.width} onChange={v => setTempObstacle({...tempObstacle, width: v})} step={50} />
                   <div className="grid grid-cols-2 gap-3">
                       <NumberInput label="Height" value={tempObstacle.height || 0} onChange={v => setTempObstacle({...tempObstacle, height: v})} step={50} />
                       <NumberInput label="Depth" value={tempObstacle.depth || 0} onChange={v => setTempObstacle({...tempObstacle, depth: v})} step={50} />
                   </div>
                   {tempObstacle.type === 'window' && (
                      <NumberInput label="Raise from Floor" value={tempObstacle.elevation || 0} onChange={v => setTempObstacle({...tempObstacle, elevation: v})} step={50} />
                   )}
                </div>
            </div>
          ) : (
            <div className="space-y-6">
                <div>
                  <label className="text-slate-400 text-xs font-bold uppercase mb-2 block">Cabinet Preset</label>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.values(PresetType).map(p => (
                      <button 
                        key={p}
                        onClick={() => {
                            let type = CabinetType.BASE;
                            if(p.includes('Wall')) type = CabinetType.WALL;
                            if(p.includes('Tall') || p.includes('Utility')) type = CabinetType.TALL;
                            setTempCabinet({ ...tempCabinet, preset: p, type });
                        }}
                        className={`p-3 rounded-lg text-sm font-bold border text-left transition-all ${tempCabinet.preset === p ? 'bg-amber-500 text-white border-amber-500 shadow-md' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <NumberInput label="Width" value={tempCabinet.width} onChange={v => setTempCabinet({...tempCabinet, width: v})} step={50} />
            </div>
          )}
      </div>

      <div className="flex gap-3 shrink-0 mt-2">
        {modalMode.includes('edit') && (
          <Button variant="danger" onClick={deleteCurrentItem} className="flex-1" leftIcon={<Trash2 size={20} />}>
            Delete
          </Button>
        )}
        <Button 
            onClick={modalMode.includes('obstacle') ? saveObstacle : saveCabinet} 
            className={modalMode.includes('edit') ? 'flex-[2]' : 'w-full'}
            leftIcon={modalMode.includes('edit') ? <Save size={20} /> : <Plus size={20} />}
        >
            {modalMode.includes('edit') ? 'Update' : 'Add Item'}
        </Button>
      </div>
    </div>
  );

  if (!currentZone) return <div>No active zones</div>;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      <Header 
        title="Wall Layout" 
        onBack={onBack} 
        rightAction={<Button size="sm" variant="primary" onClick={onNext}>BOM</Button>}
      />

      <div className="flex-1 flex overflow-hidden">
        
        {/* === LEFT SIDEBAR (DESKTOP) === */}
        <div className="hidden md:flex flex-col w-[320px] bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0 h-full">
           
           {/* Logo & Theme */}
           <div className="p-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
             <div className="font-black text-xl text-slate-900 dark:text-white">CAB<span className="text-amber-500">ENGINE</span></div>
             <ThemeToggle />
           </div>

           {/* Wall Settings */}
           <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
               <NumberInput 
                  label="Total Wall Length" 
                  value={currentZone.totalLength} 
                  onChange={(e) => updateZone({...currentZone, totalLength: e})} 
                  step={100} 
               />
           </div>

           {/* Zone List */}
           <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Zones</div>
              {activeZones.map(z => (
                <button
                  key={z.id}
                  onClick={() => { setActiveTab(z.id); setModalMode('none'); }}
                  className={`w-full px-4 py-4 rounded-xl font-bold text-sm text-left transition-all flex items-center gap-3 ${
                    activeTab === z.id 
                      ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-500 shadow-md ring-1 ring-slate-200 dark:ring-slate-700' 
                      : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  <FileSpreadsheet size={18} /> 
                  <span className="flex-1">{z.id}</span>
                  {activeTab === z.id && <div className="w-2 h-2 rounded-full bg-amber-500" />}
                </button>
              ))}
           </div>

           {/* Primary Actions */}
           <div className="p-4 space-y-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
              <div className="grid grid-cols-2 gap-2">
                <Button size="md" variant="secondary" onClick={clearZone} className="text-xs">
                   <Trash2 size={16} className="mr-2"/> Clear
                </Button>
                <Button size="md" variant="secondary" onClick={handleAutoFill} className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-500 border-amber-200 dark:border-amber-900">
                   <Wand2 size={16} className="mr-2"/> Auto Fill
                </Button>
              </div>
              <Button size="xl" variant="primary" onClick={onNext} className="w-full">
                 Calculate BOM
              </Button>
              
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-3">
                 <Button size="lg" onClick={openAddObstacle} className="flex-col h-20 gap-1 text-xs" variant="outline">
                    <DoorOpen size={24} /> + Obstacle
                 </Button>
                 <Button size="lg" onClick={openAddCabinet} className="flex-col h-20 gap-1 text-xs" variant="primary">
                    <Box size={24} /> + Cabinet
                 </Button>
              </div>
           </div>
        </div>

        {/* === CENTER COLUMN (VISUALIZER + LIST) === */}
        <div className="flex-1 flex flex-col min-w-0 relative h-full">
          
          {/* Mobile Tabs */}
          <div className="md:hidden flex bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-2 pt-2 gap-1 overflow-x-auto no-scrollbar shrink-0">
            {activeZones.map(z => (
              <button
                key={z.id}
                onClick={() => { setActiveTab(z.id); setModalMode('none'); }}
                className={`px-6 py-3 rounded-t-lg font-bold text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${
                  activeTab === z.id 
                    ? 'bg-white dark:bg-slate-950 text-amber-600 dark:text-amber-500 border-t-2 border-x border-amber-500 dark:border-amber-500 shadow-sm relative top-[1px]' 
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500 hover:bg-slate-300 dark:hover:bg-slate-700 border-t border-transparent'
                }`}
              >
                <FileSpreadsheet size={14} /> {z.id}
              </button>
            ))}
          </div>

          {/* Visualizer */}
          <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm relative z-10 shrink-0 h-[220px] md:h-[400px]">
            <WallVisualizer 
              zone={currentZone} 
              height={project.settings.tallHeight + 300} 
              onCabinetClick={openEditCabinet}
              onObstacleClick={openEditObstacle}
            />
          </div>

          {/* List/Grid */}
          <div className="flex-1 overflow-y-auto w-full relative min-h-0 bg-white dark:bg-slate-950 pb-32 md:pb-0">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="sticky top-0 bg-slate-100 dark:bg-slate-900 text-slate-500 font-bold text-xs uppercase z-10 shadow-sm">
                <tr>
                  <th className="p-3 border-b border-r border-slate-200 dark:border-slate-800 w-12 text-center">#</th>
                  <th className="p-3 border-b border-r border-slate-200 dark:border-slate-800 w-32">Type</th>
                  <th className="p-3 border-b border-r border-slate-200 dark:border-slate-800">Description</th>
                  <th className="p-3 border-b border-r border-slate-200 dark:border-slate-800 w-24 md:w-32 text-right">Width</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentZone.obstacles.map((obs, idx) => (
                  <tr 
                    key={obs.id} 
                    onClick={() => openEditObstacle(idx)}
                    className={`bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group cursor-pointer ${editIndex === idx && modalMode.includes('obstacle') ? 'bg-amber-50 dark:bg-slate-800 ring-2 ring-inset ring-amber-500' : ''}`}
                  >
                     <td className="p-3 md:p-4 text-center text-slate-400 font-mono border-r border-slate-200 dark:border-slate-800">{idx + 1}</td>
                     <td className="p-3 md:p-4 text-slate-500 font-bold border-r border-slate-200 dark:border-slate-800 flex items-center gap-2">
                        <DoorOpen size={16} /> <span className="hidden md:inline">Obstacle</span>
                     </td>
                     <td className="p-3 md:p-4 text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 font-medium">
                        <span className="capitalize">{obs.type}</span> <span className="text-slate-400 text-xs ml-2 block md:inline">@{obs.fromLeft}mm</span>
                     </td>
                     <td className="p-3 md:p-4 text-right font-mono text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                        {obs.width}
                     </td>
                  </tr>
                ))}
                {currentZone.cabinets.map((cab, idx) => (
                  <tr 
                    key={cab.id} 
                    onClick={() => openEditCabinet(idx)}
                    className={`hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors group cursor-pointer ${cab.isAutoFilled ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''} ${editIndex === idx && modalMode.includes('cabinet') ? 'bg-amber-50 dark:bg-slate-800 ring-2 ring-inset ring-amber-500' : ''}`}
                  >
                     <td className="p-3 md:p-4 text-center text-slate-400 font-mono border-r border-slate-200 dark:border-slate-800">
                        {currentZone.obstacles.length + idx + 1}
                     </td>
                     <td className="p-3 md:p-4 text-amber-600 dark:text-amber-500 font-bold border-r border-slate-200 dark:border-slate-800 flex items-center gap-2">
                        <Box size={16} /> <span className="hidden md:inline">{cab.type}</span>
                     </td>
                     <td className="p-3 md:p-4 text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800 font-medium text-base">
                        {cab.preset}
                        {cab.isAutoFilled && <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">AUTO</span>}
                     </td>
                     <td className="p-3 md:p-4 text-right font-mono font-bold text-slate-900 dark:text-amber-500 border-r border-slate-200 dark:border-slate-800 text-lg">
                        {cab.width}
                     </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* === MOBILE STICKY BOTTOM ACTIONS (DENSE) === */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 z-50 p-2 shadow-2xl safe-area-bottom">
             <div className="flex gap-2 mb-2">
               <Button onClick={openAddObstacle} className="flex-1 h-12 text-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700" variant="secondary">
                 <DoorOpen size={18} className="mr-2"/> + Obstacle
               </Button>
               <Button onClick={openAddCabinet} className="flex-1 h-12 text-sm shadow-amber-500/20" variant="primary">
                 <Box size={18} className="mr-2"/> + Cabinet
               </Button>
             </div>
             <div className="grid grid-cols-4 gap-2">
                <button onClick={() => { setActiveTab(project.zones.find(z => z.id !== activeTab)?.id || activeTab) }} className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-500">
                   <List size={20} />
                   <span className="text-[10px] mt-1 font-bold">Zones</span>
                </button>
                <button onClick={handleAutoFill} className="flex flex-col items-center justify-center p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500">
                   <Wand2 size={20} />
                   <span className="text-[10px] mt-1 font-bold">Fill</span>
                </button>
                <button onClick={clearZone} className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-red-500">
                   <Trash2 size={20} />
                   <span className="text-[10px] mt-1 font-bold">Clear</span>
                </button>
                <button onClick={onNext} className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-800 text-white">
                   <Table2 size={20} />
                   <span className="text-[10px] mt-1 font-bold">BOM</span>
                </button>
             </div>
          </div>
        </div>

        {/* === RIGHT SIDEBAR (DESKTOP EDITOR) === */}
        <div className={`hidden md:block w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shrink-0 transition-all duration-300 ${modalMode === 'none' ? '-mr-96 opacity-50' : 'mr-0 opacity-100'}`}>
           {modalMode !== 'none' && (
             <div className="h-full p-6 overflow-hidden border-l-4 border-amber-500">
                <EditorContent />
             </div>
           )}
        </div>
      </div>

      {/* MOBILE MODAL EDITOR */}
      {modalMode !== 'none' && (
        <div className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end justify-center animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full rounded-t-2xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto border-t border-slate-200 dark:border-slate-800 flex flex-col">
             <EditorContent />
          </div>
        </div>
      )}
    </div>
  );
};

// 4. BOM REPORT SCREEN (Simple Table)
const ScreenBOMReport = ({ project, onBack, onHome }: { project: Project, onBack: () => void, onHome: () => void }) => {
  const data = useMemo(() => generateProjectBOM(project), [project]);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 max-w-4xl mx-auto w-full shadow-2xl overflow-hidden">
      <Header title="Cut & Hardware List" onBack={onBack} />
      
      {/* Summary */}
      <div className="bg-white dark:bg-slate-900 p-6 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        <div>
          <div className="text-slate-400 text-xs font-bold uppercase">Total Area</div>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-500">{data.totalArea} m²</div>
        </div>
        <div>
           <div className="text-slate-400 text-xs font-bold uppercase">Cabinets</div>
           <div className="text-3xl font-black text-slate-900 dark:text-white">{data.groups.length}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
        
        {/* CUT LIST */}
        <div className="space-y-6">
          <h3 className="text-slate-900 dark:text-white font-bold text-xl flex items-center gap-2">
             <Table2 /> Panel List
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            {data.groups.map((group, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <span className="font-bold text-slate-700 dark:text-white text-sm">{group.cabinetName}</span>
                  <span className="text-xs bg-white dark:bg-slate-700 px-2 py-1 rounded text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-transparent">{group.items.length} parts</span>
                </div>
                <table className="w-full text-left text-sm">
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {group.items.map((item, i) => (
                      <tr key={i}>
                        <td className="p-3 text-slate-600 dark:text-slate-300 font-medium">
                          {item.name}
                          <div className="text-[10px] text-slate-400">{item.material}</div>
                        </td>
                        <td className="p-3 text-right text-slate-500 dark:text-slate-400 font-mono">
                          {item.length} × {item.width}
                        </td>
                        <td className="p-3 text-right font-bold text-amber-600 dark:text-amber-500">
                          x{item.qty}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>

        {/* HARDWARE */}
        <div>
          <h3 className="text-slate-900 dark:text-white font-bold text-xl mb-4 flex items-center gap-2">
             <Box /> Hardware Summary
          </h3>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm max-w-md">
            <table className="w-full">
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {Object.entries(data.hardwareSummary).map(([name, qty]) => (
                  <tr key={name} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-4 text-slate-700 dark:text-slate-200 font-medium">{name}</td>
                    <td className="p-4 text-right font-bold text-amber-600 dark:text-amber-500 text-lg">{qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 sticky bottom-0 shrink-0 safe-area-bottom">
        <Button variant="primary" className="w-full" onClick={onHome}>Finish Project</Button>
      </div>
    </div>
  );
};


// --- MAIN APP ---

export default function App() {
  const [screen, setScreen] = useState<Screen>(Screen.HOME);
  const [project, setProject] = useState<Project>(createNewProject());

  const handleStartProject = () => {
    setProject(createNewProject());
    setScreen(Screen.PROJECT_SETUP);
  };

  const renderScreen = () => {
    switch (screen) {
      case Screen.HOME:
        return <ScreenHome onNavigate={setScreen} onNewProject={handleStartProject} />;
      case Screen.PROJECT_SETUP:
        return <ScreenProjectSetup 
          project={project} 
          setProject={setProject} 
          onNext={() => setScreen(Screen.WALL_EDITOR)} 
          onBack={() => setScreen(Screen.HOME)} 
        />;
      case Screen.WALL_EDITOR:
        return <ScreenWallEditor 
          project={project} 
          setProject={setProject} 
          onNext={() => setScreen(Screen.BOM_REPORT)} 
          onBack={() => setScreen(Screen.PROJECT_SETUP)}
        />;
      case Screen.BOM_REPORT:
        return <ScreenBOMReport 
          project={project} 
          onBack={() => setScreen(Screen.WALL_EDITOR)} 
          onHome={() => setScreen(Screen.HOME)} 
        />;
      default:
        return <ScreenHome onNavigate={setScreen} onNewProject={handleStartProject} />;
    }
  };

  return (
    <div className="h-full w-full flex flex-col font-sans transition-colors duration-200">
      <main className="flex-1 overflow-hidden relative">
        {renderScreen()}
      </main>
    </div>
  );
}