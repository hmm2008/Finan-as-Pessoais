import React, { useState } from 'react';
import { PageHeader } from '../components/layout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { 
  Vehicle, 
  VehicleForm, 
  VehicleTask, 
  VehicleTaskForm, 
  calculateNextDueDate,
  FuelEntry, 
  VehicleProfile, 
  VehicleTasks, 
  VehicleFuelHistory, 
  VehicleReminders, 
  SyncToCalendarModal 
} from '../components/viaturas';
import { 
  Plus, 
  Car, 
  Calendar, 
  Wrench, 
  Fuel, 
  Trash2, 
  Edit, 
  Calculator, 
  Gauge,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { usePrivacy } from '../contexts';
import { ConfirmDeleteModal } from '../components/ui/ConfirmDeleteModal';
import { scheduleSheetsBackgroundSync } from '../lib/googleSheetsDataService';
import { motion, AnimatePresence } from 'motion/react';

export default function ViaturasView() {
  const { maskValue } = usePrivacy();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    try {
      const saved = localStorage.getItem('fin_vehicles');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Erro ao carregar veículos:', e);
    }
    return [];
  });

  const [tasks, setTasks] = useState<VehicleTask[]>(() => {
    try {
      const saved = localStorage.getItem('fin_vehicle_tasks');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Erro ao carregar tarefas de veículos:', e);
    }
    return [];
  });

  const [fuelEntries, setFuelEntries] = useState<FuelEntry[]>(() => {
    try {
      const saved = localStorage.getItem('fin_vehicle_fuel');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Erro ao carregar abastecimentos:', e);
    }
    return [];
  });

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(() => vehicles[0]?.id || '');

  React.useEffect(() => {
    const reloadData = () => {
      try {
        const savedVeh = localStorage.getItem('fin_vehicles');
        if (savedVeh) setVehicles(JSON.parse(savedVeh));
        
        const savedFuel = localStorage.getItem('fin_vehicle_fuel');
        if (savedFuel) setFuelEntries(JSON.parse(savedFuel));
        
        const savedTasks = localStorage.getItem('fin_vehicle_tasks');
        if (savedTasks) setTasks(JSON.parse(savedTasks));
      } catch (e) {
        console.error('Erro ao recarregar dados de veículos:', e);
      }
    };

    reloadData();
    window.addEventListener('storage', reloadData);
    window.addEventListener('focus', reloadData);
    return () => {
      window.removeEventListener('storage', reloadData);
      window.removeEventListener('focus', reloadData);
    };
  }, []);

  React.useEffect(() => {
    try {
      localStorage.setItem('fin_vehicles', JSON.stringify(vehicles));
      scheduleSheetsBackgroundSync();
    } catch (e) {
      console.error('Erro ao guardar veículos:', e);
    }
  }, [vehicles]);

  React.useEffect(() => {
    try {
      localStorage.setItem('fin_vehicle_tasks', JSON.stringify(tasks));
      scheduleSheetsBackgroundSync();
    } catch (e) {
      console.error('Erro ao guardar tarefas:', e);
    }
  }, [tasks]);

  React.useEffect(() => {
    try {
      localStorage.setItem('fin_vehicle_fuel', JSON.stringify(fuelEntries));
      scheduleSheetsBackgroundSync();
    } catch (e) {
      console.error('Erro ao guardar abastecimentos:', e);
    }
  }, [fuelEntries]);

  // Modals state
  const [isVehicleFormOpen, setIsVehicleFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<VehicleTask | null>(null);

  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'vehicle' | 'task' | 'fuel';
    id: string;
    label: string;
    entityName: string;
    data: any;
  } | null>(null);

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId) || vehicles[0];

  // Calculations for selected vehicle
  const selectedVehicleTasks = tasks.filter(t => t.vehicleId === selectedVehicleId);
  const selectedVehicleFuel = fuelEntries.filter(f => f.vehicleId === selectedVehicleId);

  const totalMaintenanceCost = selectedVehicleTasks
    .filter(t => t.status === 'concluída')
    .reduce((acc, curr) => acc + curr.cost, 0);

  const totalFuelCost = selectedVehicleFuel.reduce((acc, curr) => acc + curr.totalCost, 0);

  const totalDistance = selectedVehicle ? selectedVehicle.kilometers : 0;
  const costPerKm = totalDistance > 0 ? (totalMaintenanceCost + totalFuelCost) / totalDistance : 0;

  // Global calculations across ALL vehicles
  const totalAllFuelCost = fuelEntries.reduce((acc, curr) => acc + (curr.totalCost || 0), 0);
  const totalAllMaintenanceCost = tasks
    .filter(t => t.status === 'concluída')
    .reduce((acc, curr) => acc + (curr.cost || 0), 0);
  const totalAllFleetCharges = totalAllFuelCost + totalAllMaintenanceCost;
  const totalAllKm = vehicles.reduce((acc, v) => acc + (v.kilometers || 0), 0);

  // Handlers
  const handleSaveVehicle = (v: Vehicle) => {
    setVehicles(prev => {
      const exists = prev.some(item => item.id === v.id);
      if (exists) return prev.map(item => item.id === v.id ? v : item);
      return [...prev, v];
    });
    setSelectedVehicleId(v.id);
  };

  const handleDeleteVehicle = (id: string) => {
    setVehicles(prev => prev.filter(v => v.id !== id));
    setTasks(prev => prev.filter(t => t.vehicleId !== id));
    setFuelEntries(prev => prev.filter(f => f.vehicleId !== id));
    if (selectedVehicleId === id) {
      const remaining = vehicles.filter(v => v.id !== id);
      if (remaining.length > 0) setSelectedVehicleId(remaining[0].id);
    }
  };

  const handleSaveTask = (t: VehicleTask) => {
    setTasks(prev => {
      let updatedList = prev.some(item => item.id === t.id)
        ? prev.map(item => item.id === t.id ? t : item)
        : [...prev, t];

      const isRecurring = t.recurring || (t.recurrenceInterval && t.recurrenceInterval !== 'none');
      if (t.status === 'concluída' && isRecurring && t.autoCreateNext !== false) {
        const targetNextDueDate = t.nextDueDate || calculateNextDueDate(t.completedDate || t.dueDate || new Date().toISOString().split('T')[0], t.recurrenceInterval || '12_months');
        
        const alreadyExists = updatedList.some(item => 
          item.vehicleId === t.vehicleId && 
          item.taskType === t.taskType && 
          item.dueDate === targetNextDueDate &&
          item.id !== t.id
        );

        if (!alreadyExists) {
          const interval = t.recurrenceInterval || '12_months';
          const subsequentDueDate = calculateNextDueDate(targetNextDueDate, interval);

          const nextTask: VehicleTask = {
            id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            vehicleId: t.vehicleId,
            title: t.title,
            taskType: t.taskType,
            cost: t.nextCost !== undefined ? t.nextCost : t.cost,
            status: 'pendente',
            dueDate: targetNextDueDate,
            recurring: true,
            recurrenceInterval: interval,
            nextDueDate: subsequentDueDate,
            nextStatus: 'pendente',
            nextCost: t.nextCost !== undefined ? t.nextCost : t.cost,
            autoCreateNext: true,
            parentTaskId: t.id,
            notes: `Agendamento automático para o próximo ciclo.`
          };
          updatedList = [...updatedList, nextTask];
        }
      }

      return updatedList;
    });
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleToggleTaskStatus = (id: string) => {
    setTasks(prev => {
      let newNextTaskToCreate: VehicleTask | null = null;

      const updated = prev.map(t => {
        if (t.id === id) {
          const nextStatus = t.status === 'pendente' ? 'concluída' : 'pendente';
          const completedDateStr = nextStatus === 'concluída' ? new Date().toISOString().split('T')[0] : undefined;

          const isRecurring = t.recurring || (t.recurrenceInterval && t.recurrenceInterval !== 'none');
          if (nextStatus === 'concluída' && isRecurring && t.autoCreateNext !== false) {
            const targetNextDueDate = t.nextDueDate || calculateNextDueDate(completedDateStr || t.dueDate, t.recurrenceInterval || '12_months');
            
            const alreadyExists = prev.some(item => 
              item.vehicleId === t.vehicleId && 
              item.taskType === t.taskType && 
              item.dueDate === targetNextDueDate &&
              item.id !== t.id
            );

            if (!alreadyExists) {
              const interval = t.recurrenceInterval || '12_months';
              const subsequentDueDate = calculateNextDueDate(targetNextDueDate, interval);

              newNextTaskToCreate = {
                id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                vehicleId: t.vehicleId,
                title: t.title,
                taskType: t.taskType,
                cost: t.nextCost !== undefined ? t.nextCost : t.cost,
                status: 'pendente',
                dueDate: targetNextDueDate,
                recurring: true,
                recurrenceInterval: interval,
                nextDueDate: subsequentDueDate,
                nextStatus: 'pendente',
                nextCost: t.nextCost !== undefined ? t.nextCost : t.cost,
                autoCreateNext: true,
                parentTaskId: t.id,
                notes: `Agendamento automático para o próximo ciclo.`
              };
            }
          }

          return {
            ...t,
            status: nextStatus,
            completedDate: completedDateStr
          };
        }
        return t;
      });

      if (newNextTaskToCreate) {
        return [...updated, newNextTaskToCreate];
      }
      return updated;
    });
  };

  const handleAddFuelEntry = (f: FuelEntry) => {
    setFuelEntries(prev => [f, ...prev]);
    if (selectedVehicle && f.kilometers > (selectedVehicle.kilometers || 0)) {
      setVehicles(prev => prev.map(v => v.id === f.vehicleId ? { ...v, kilometers: f.kilometers } : v));
    }
  };

  const handleDeleteFuelEntry = (id: string) => {
    setFuelEntries(prev => prev.filter(f => f.id !== id));
    setTasks(prev => prev.filter(t => !(t.isFuelExpense && t.id === id)));
  };

  return (
    <div className="relative min-h-screen pb-20">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-40 left-0 -z-10 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <PageHeader 
          title="Frota Automóvel" 
          subtitle="Controlo total de manutenções, inspeções e consumos"
        >
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={() => setIsSyncModalOpen(true)}
              className="hidden sm:flex h-11 px-6 rounded-2xl items-center gap-2 font-black uppercase tracking-widest text-[10px] border border-border/40 hover:bg-muted transition-all"
            >
              <Calendar className="w-4 h-4" /> Google Calendar
            </Button>
            <Button 
              onClick={() => { setEditingVehicle(null); setIsVehicleFormOpen(true); }}
              className="h-11 px-6 rounded-2xl items-center gap-2 bg-foreground text-background hover:bg-foreground/90 font-black uppercase tracking-widest text-[10px] shadow-2xl transition-all hover:scale-105 active:scale-95 flex"
            >
              <Plus className="w-4 h-4" /> Nova Viatura
            </Button>
          </div>
        </PageHeader>
      </motion.div>

      {/* Fleet Reminders */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <VehicleReminders vehicles={vehicles} tasks={tasks} />
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 my-8">
        {[
          { label: 'Encargos Totais', value: totalAllFleetCharges, icon: Calculator, color: 'blue' },
          { label: 'Total Combustível', value: totalAllFuelCost, icon: Fuel, color: 'amber' },
          { label: 'Total Manutenções', value: totalAllMaintenanceCost, icon: Wrench, color: 'indigo' },
          { label: 'KM Acumulados', value: totalAllKm, icon: Gauge, color: 'emerald', suffix: ' km' }
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + idx * 0.1 }}
          >
            <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-2xl shadow-black/5 rounded-3xl overflow-hidden group hover:bg-card/80 transition-all duration-300">
               <div className={`h-1 w-full ${
                 stat.color === 'blue' ? 'bg-blue-500' :
                 stat.color === 'amber' ? 'bg-amber-500' :
                 stat.color === 'indigo' ? 'bg-primary' :
                 'bg-emerald-500'
               } opacity-40 group-hover:opacity-100 transition-opacity`} />
               <CardContent className="p-6 flex items-center justify-between">
                 <div className="space-y-1.5">
                   <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-70">{stat.label}</p>
                   <p className="text-2xl font-black text-foreground tracking-tighter">
                     {stat.suffix ? `${stat.value.toLocaleString('pt-PT')}${stat.suffix}` : maskValue(stat.value, formatter.format)}
                   </p>
                 </div>
                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-6 ${
                   stat.color === 'blue' ? 'bg-blue-500/10 text-blue-600' :
                   stat.color === 'amber' ? 'bg-amber-500/10 text-amber-500' :
                   stat.color === 'indigo' ? 'bg-primary/10 text-primary' :
                   'bg-emerald-500/10 text-emerald-500'
                 }`}>
                   <stat.icon className="w-6 h-6" />
                 </div>
               </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Fleet View / Selection */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 px-1">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Frota Registada</h2>
        </div>

        {vehicles.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-20 border-2 border-dashed border-border/40 bg-card/20 rounded-[2.5rem] flex flex-col items-center justify-center text-center px-6"
          >
             <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mb-6 border border-amber-500/20">
                <Car className="w-10 h-10 text-amber-600" />
             </div>
             <h3 className="text-xl font-black text-foreground tracking-tight">Frota Vazia</h3>
             <p className="text-sm text-muted-foreground mt-2 max-w-sm">Adicione as suas viaturas para gerir custos, alertas de manutenção e consumos.</p>
             <Button 
                onClick={() => { setEditingVehicle(null); setIsVehicleFormOpen(true); }}
                className="mt-8 rounded-2xl h-12 px-8 bg-amber-600 hover:bg-amber-700 font-black uppercase tracking-widest text-[10px]"
             >
                Registar Primeira Viatura
             </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {vehicles.map((v) => {
                const isSelected = v.id === selectedVehicleId;
                return (
                  <motion.div
                    key={v.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -5 }}
                    onClick={() => setSelectedVehicleId(v.id)}
                    className="relative"
                  >
                    <Card className={`cursor-pointer overflow-hidden transition-all duration-500 rounded-[2rem] border-2 h-full flex flex-col ${
                      isSelected 
                        ? 'border-amber-500/50 bg-card/80 shadow-2xl shadow-amber-500/10' 
                        : 'border-border/40 bg-card/40 hover:border-amber-500/20'
                    }`}>
                      <div className="h-28 overflow-hidden relative">
                         <img 
                            src={v.photoUrl || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=60'} 
                            alt={v.brand} 
                            className={`w-full h-full object-cover transition-transform duration-700 ${isSelected ? 'scale-110' : 'group-hover:scale-105'}`}
                         />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                         <div className="absolute bottom-3 left-4">
                            <p className="text-[9px] font-black text-white/70 uppercase tracking-widest mb-1">{v.brand}</p>
                            <h4 className="text-sm font-black text-white uppercase tracking-tight">{v.model}</h4>
                         </div>
                         {isSelected && (
                           <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center shadow-lg">
                              <ArrowRight className="w-3.5 h-3.5 text-white" />
                           </div>
                         )}
                      </div>
                      <CardContent className="p-5 flex-1 flex flex-col justify-between">
                         <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-mono font-bold bg-muted/60 px-2 py-1 rounded-lg border border-border/20">
                              {v.plate}
                            </span>
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">
                              {(v.kilometers || 0).toLocaleString()} km
                            </span>
                         </div>
                         <div className="pt-3 border-t border-border/10 flex items-center justify-between">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Encargos Totais</span>
                            <span className="text-sm font-black text-foreground tracking-tighter">
                               {maskValue(
                                 (fuelEntries.filter(f => f.vehicleId === v.id).reduce((acc, c) => acc + (c.totalCost || 0), 0)) +
                                 (tasks.filter(t => t.vehicleId === v.id && t.status === 'concluída').reduce((acc, c) => acc + (c.cost || 0), 0)),
                                 formatter.format
                               )}
                            </span>
                         </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* Detailed Vehicle Panel */}
      <AnimatePresence mode="wait">
        {selectedVehicle && (
          <motion.div
            key={selectedVehicle.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mt-12"
          >
            <Card className="rounded-[2.5rem] border-border/40 bg-card/60 backdrop-blur-xl shadow-3xl overflow-hidden border">
              <div className="bg-amber-600/10 p-8 sm:p-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                 <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-3xl overflow-hidden border-4 border-white shadow-xl rotate-[-3deg] hover:rotate-0 transition-transform duration-500">
                       <img 
                          src={selectedVehicle.photoUrl || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=60'} 
                          alt={selectedVehicle.brand} 
                          className="w-full h-full object-cover"
                       />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1.5">
                        <h2 className="text-3xl font-black tracking-tighter text-foreground uppercase">
                          {selectedVehicle.brand} {selectedVehicle.model}
                        </h2>
                        <span className="text-[11px] font-mono font-black bg-foreground text-background px-3 py-1 rounded-xl shadow-sm">
                          {selectedVehicle.plate}
                        </span>
                      </div>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] flex items-center gap-2">
                        {selectedVehicle.year} <span className="w-1 h-1 rounded-full bg-border" /> 
                        {selectedVehicle.fuelType} <span className="w-1 h-1 rounded-full bg-border" /> 
                        {(selectedVehicle.kilometers || 0).toLocaleString()} km
                      </p>
                    </div>
                 </div>

                 <div className="flex gap-2 w-full sm:w-auto">
                    <Button 
                      variant="ghost" 
                      onClick={() => { setEditingVehicle(selectedVehicle); setIsVehicleFormOpen(true); }}
                      className="flex-1 sm:flex-none h-12 px-6 rounded-2xl font-black uppercase tracking-widest text-[10px] border border-border/40 hover:bg-muted"
                    >
                      <Edit className="w-4 h-4 mr-2" /> Editar
                    </Button>
                    <Button 
                      variant="ghost"
                      onClick={() => {
                        setDeleteTarget({
                          type: 'vehicle',
                          id: selectedVehicle.id,
                          label: `${selectedVehicle.brand} ${selectedVehicle.model} (${selectedVehicle.plate})`,
                          entityName: 'Veículos',
                          data: selectedVehicle
                        });
                      }}
                      className="flex-1 sm:flex-none h-12 w-12 rounded-2xl text-rose-500 hover:bg-rose-500/10 border border-rose-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                 </div>
              </div>

              <CardContent className="p-0">
                <Tabs defaultValue="perfil" className="w-full">
                  <div className="px-8 sm:px-10 border-b border-border/10">
                    <TabsList className="h-16 bg-transparent gap-8">
                      <TabsTrigger value="perfil" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-amber-600 data-[state=active]:bg-transparent font-black uppercase tracking-widest text-[10px] text-muted-foreground data-[state=active]:text-foreground transition-all px-0">
                        Perfil Geral
                      </TabsTrigger>
                      <TabsTrigger value="tarefas" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-amber-600 data-[state=active]:bg-transparent font-black uppercase tracking-widest text-[10px] text-muted-foreground data-[state=active]:text-foreground transition-all px-0">
                        Manutenções & Tarefas ({selectedVehicleTasks.length})
                      </TabsTrigger>
                      <TabsTrigger value="combustivel" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-amber-600 data-[state=active]:bg-transparent font-black uppercase tracking-widest text-[10px] text-muted-foreground data-[state=active]:text-foreground transition-all px-0">
                        Histórico Combustível ({selectedVehicleFuel.length})
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <div className="p-8 sm:p-10">
                    <TabsContent value="perfil" className="mt-0">
                      <VehicleProfile 
                        vehicle={selectedVehicle}
                        onEdit={() => { setEditingVehicle(selectedVehicle); setIsVehicleFormOpen(true); }}
                        totalMaintenanceCost={totalMaintenanceCost}
                        totalFuelCost={totalFuelCost}
                        costPerKm={costPerKm}
                      />
                    </TabsContent>

                    <TabsContent value="tarefas" className="mt-0">
                      <VehicleTasks 
                        vehicleId={selectedVehicle.id}
                        tasks={tasks}
                        onAddTask={() => { setEditingTask(null); setIsTaskFormOpen(true); }}
                        onEditTask={(task) => { setEditingTask(task); setIsTaskFormOpen(true); }}
                        onDeleteTask={(taskId) => {
                          const task = tasks.find(t => t.id === taskId);
                          if (task) {
                            setDeleteTarget({
                              type: 'task',
                              id: task.id,
                              label: `Tarefa "${task.title}"`,
                              entityName: 'Tarefas de Veículo',
                              data: task
                            });
                          }
                        }}
                        onToggleStatus={handleToggleTaskStatus}
                      />
                    </TabsContent>

                    <TabsContent value="combustivel" className="mt-0">
                      <VehicleFuelHistory 
                        vehicleId={selectedVehicle.id}
                        vehicleKm={selectedVehicle.kilometers}
                        fuelEntries={selectedVehicleFuel}
                        onAddFuelEntry={handleAddFuelEntry}
                        onDeleteFuelEntry={(fuelId) => {
                          const fuel = fuelEntries.find(f => f.id === fuelId);
                          if (fuel) {
                            setDeleteTarget({
                              type: 'fuel',
                              id: fuel.id,
                              label: `Abastecimento de ${fuel.liters}L em ${fuel.date}`,
                              entityName: 'Abastecimentos',
                              data: fuel
                            });
                          }
                        }}
                      />
                    </TabsContent>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <VehicleForm 
        isOpen={isVehicleFormOpen}
        onClose={() => setIsVehicleFormOpen(false)}
        onSave={handleSaveVehicle}
        initialData={editingVehicle}
      />

      {selectedVehicle && (
        <VehicleTaskForm 
          isOpen={isTaskFormOpen}
          vehicleId={selectedVehicle.id}
          onClose={() => setIsTaskFormOpen(false)}
          onSave={handleSaveTask}
          initialData={editingTask}
        />
      )}

      <SyncToCalendarModal 
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        vehicles={vehicles}
        tasks={tasks}
      />

      {/* Confirm Delete & Trash Modal */}
      {deleteTarget && (
        <ConfirmDeleteModal
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirmPermanent={() => {
            if (deleteTarget.type === 'vehicle') {
              handleDeleteVehicle(deleteTarget.id);
            } else if (deleteTarget.type === 'task') {
              handleDeleteTask(deleteTarget.id);
            } else if (deleteTarget.type === 'fuel') {
              handleDeleteFuelEntry(deleteTarget.id);
            }
            setDeleteTarget(null);
          }}
          entityLabel={deleteTarget.label}
          entityName={deleteTarget.entityName}
          entityId={deleteTarget.id}
          entityData={deleteTarget.data}
          onMoveToTrashSuccess={() => {
            if (deleteTarget.type === 'vehicle') {
              handleDeleteVehicle(deleteTarget.id);
            } else if (deleteTarget.type === 'task') {
              handleDeleteTask(deleteTarget.id);
            } else if (deleteTarget.type === 'fuel') {
              handleDeleteFuelEntry(deleteTarget.id);
            }
            setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
}
