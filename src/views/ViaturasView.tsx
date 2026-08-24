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
  FuelEntry, 
  VehicleProfile, 
  VehicleTasks, 
  VehicleFuelHistory, 
  VehicleReminders, 
  SyncToCalendarModal 
} from '../components/viaturas';
import { Plus, Car, Calendar, Wrench, Fuel, Trash2, Edit } from 'lucide-react';
import { usePrivacy } from '../contexts';
import { ConfirmDeleteModal } from '../components/ui/ConfirmDeleteModal';

const INITIAL_VEHICLES: Vehicle[] = [];
const INITIAL_TASKS: VehicleTask[] = [];
const INITIAL_FUEL: FuelEntry[] = [];

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
    } catch (e) {
      console.error('Erro ao guardar veículos:', e);
    }
  }, [vehicles]);

  React.useEffect(() => {
    try {
      localStorage.setItem('fin_vehicle_tasks', JSON.stringify(tasks));
    } catch (e) {
      console.error('Erro ao guardar tarefas:', e);
    }
  }, [tasks]);

  React.useEffect(() => {
    try {
      localStorage.setItem('fin_vehicle_fuel', JSON.stringify(fuelEntries));
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
      const exists = prev.some(item => item.id === t.id);
      if (exists) return prev.map(item => item.id === t.id ? t : item);
      return [...prev, t];
    });
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleToggleTaskStatus = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextStatus = t.status === 'pendente' ? 'concluída' : 'pendente';
        return {
          ...t,
          status: nextStatus,
          completedDate: nextStatus === 'concluída' ? new Date().toISOString().split('T')[0] : undefined
        };
      }
      return t;
    }));
  };

  const handleAddFuelEntry = (f: FuelEntry) => {
    setFuelEntries(prev => [f, ...prev]);
    // Also update vehicle kilometers if higher
    if (selectedVehicle && f.kilometers > selectedVehicle.kilometers) {
      setVehicles(prev => prev.map(v => v.id === f.vehicleId ? { ...v, kilometers: f.kilometers } : v));
    }
  };

  const handleDeleteFuelEntry = (id: string) => {
    setFuelEntries(prev => prev.filter(f => f.id !== id));
    // Check if task associated and delete if specified
    setTasks(prev => prev.filter(t => !(t.isFuelExpense && t.id === id)));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader 
          title="Gestão de Viaturas" 
          subtitle="Manutenções, inspeções, custos de combustível e alertas"
        />
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => setIsSyncModalOpen(true)}>
            <Calendar className="w-4 h-4 mr-2" /> Google Calendar
          </Button>
          <Button onClick={() => { setEditingVehicle(null); setIsVehicleFormOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Nova Viatura
          </Button>
        </div>
      </div>

      {/* Dashboard Reminders Component */}
      <VehicleReminders vehicles={vehicles} tasks={tasks} />

      {/* Vehicles Cards List / Selector */}
      {vehicles.length === 0 ? (
        <Card className="border border-dashed border-border bg-card/50 p-8 text-center rounded-2xl">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="p-3 bg-primary/10 text-primary rounded-full">
              <Car className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-lg text-foreground">Nenhuma viatura registada</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Registe os seus veículos para gerir manutenções, inspeções, seguros e custos de combustível.
            </p>
            <Button onClick={() => { setEditingVehicle(null); setIsVehicleFormOpen(true); }} className="mt-2">
              <Plus className="w-4 h-4 mr-2" /> Adicionar Viatura
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {vehicles.map(v => {
            const isSelected = v.id === selectedVehicleId;
            const vFuel = fuelEntries.filter(f => f.vehicleId === v.id).reduce((acc, c) => acc + (c.totalCost || 0), 0);
            const vMaint = tasks.filter(t => t.vehicleId === v.id && t.status === 'concluída').reduce((acc, c) => acc + (c.cost || 0), 0);
            const totalV = vFuel + vMaint;

            return (
              <Card 
                key={v.id} 
                onClick={() => setSelectedVehicleId(v.id)}
                className={`cursor-pointer transition-all border-2 ${
                  isSelected ? 'border-primary ring-2 ring-primary/20 shadow-md' : 'border-border hover:border-primary/40'
                }`}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-secondary overflow-hidden shrink-0 border border-border">
                    <img 
                      src={v.photoUrl || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=60'} 
                      alt={v.brand} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=60';
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-base truncate">{v.brand} {v.model}</h3>
                    </div>
                    <p className="text-xs font-mono bg-secondary inline-block px-1.5 py-0.5 rounded font-semibold text-foreground mt-0.5">
                      {v.plate}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                      <span>{(v.kilometers ?? 0).toLocaleString()} km</span>
                      <span className="font-semibold text-foreground">{maskValue(totalV, formatter.format)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Main Selected Vehicle Details View */}
      {selectedVehicle && (
        <Card className="border-border shadow-sm">
          <CardContent className="p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border pb-4 gap-4">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Car className="w-6 h-6 text-primary" />
                  {selectedVehicle.brand} {selectedVehicle.model}
                  <span className="text-sm font-mono font-semibold bg-secondary px-2.5 py-1 rounded">
                    {selectedVehicle.plate}
                  </span>
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedVehicle.year} • {selectedVehicle.fuelType} • {(selectedVehicle.kilometers ?? 0).toLocaleString()} km
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => { setEditingVehicle(selectedVehicle); setIsVehicleFormOpen(true); }}>
                  <Edit className="w-4 h-4 mr-1" /> Editar
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => {
                  if (selectedVehicle) {
                    setDeleteTarget({
                      type: 'vehicle',
                      id: selectedVehicle.id,
                      label: `Viatura "${selectedVehicle.brand} ${selectedVehicle.model}" (${selectedVehicle.plate})`,
                      entityName: 'Veículos',
                      data: selectedVehicle
                    });
                  }
                }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Vehicle Tabs */}
            <Tabs defaultValue="perfil" className="w-full">
              <TabsList className="grid grid-cols-3 max-w-md mb-6">
                <TabsTrigger value="perfil" className="flex items-center gap-1.5">
                  <Car className="w-4 h-4" /> Perfil
                </TabsTrigger>
                <TabsTrigger value="tarefas" className="flex items-center gap-1.5">
                  <Wrench className="w-4 h-4" /> Tarefas ({selectedVehicleTasks.length})
                </TabsTrigger>
                <TabsTrigger value="combustivel" className="flex items-center gap-1.5">
                  <Fuel className="w-4 h-4" /> Combustível ({selectedVehicleFuel.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="perfil">
                <VehicleProfile 
                  vehicle={selectedVehicle}
                  onEdit={() => { setEditingVehicle(selectedVehicle); setIsVehicleFormOpen(true); }}
                  totalMaintenanceCost={totalMaintenanceCost}
                  totalFuelCost={totalFuelCost}
                  costPerKm={costPerKm}
                />
              </TabsContent>

              <TabsContent value="tarefas">
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
                        label: `Tarefa "${task.title}"${task.cost > 0 ? ` (${formatter.format(task.cost)})` : ''}`,
                        entityName: 'Tarefas de Veículo',
                        data: task
                      });
                    }
                  }}
                  onToggleStatus={handleToggleTaskStatus}
                />
              </TabsContent>

              <TabsContent value="combustivel">
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
                        label: `Abastecimento de ${fuel.liters}L (${formatter.format(fuel.totalCost)}) em ${fuel.date}`,
                        entityName: 'Abastecimentos',
                        data: fuel
                      });
                    }
                  }}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

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
