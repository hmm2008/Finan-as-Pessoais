import React, { Suspense } from 'react';
import { usePreferences } from '../../contexts/PreferencesContext';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'motion/react';
import { WIDGETS, WidgetConfig } from './widgetConfigs';
import { WidgetSkeleton } from './WidgetSkeleton';
import { GripVertical } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DraggableWidgetProps {
  widget: WidgetConfig;
  isEditing: boolean;
  key?: string | number;
}

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

function DraggableWidget({ widget, isEditing }: DraggableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id, disabled: !isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const colSpanClass = {
    1: 'col-span-1',
    2: 'col-span-1 md:col-span-2',
    3: 'col-span-1 md:col-span-2 lg:col-span-3',
    4: 'col-span-1 md:col-span-2 lg:col-span-4',
    6: 'col-span-1 lg:col-span-6',
    8: 'col-span-1 lg:col-span-8',
    12: 'col-span-full',
  }[widget.defaultColSpan] || 'col-span-full';

  const WidgetComponent = widget.component;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      variants={itemVariants}
      className={cn(
        "relative group",
        colSpanClass,
        isDragging && "opacity-50"
      )}
    >
      {isEditing && (
        <div
          {...attributes}
          {...listeners}
          className="absolute top-4 right-4 z-50 p-2 bg-background/80 backdrop-blur-sm border rounded-xl cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
      <Suspense fallback={<WidgetSkeleton />}>
        <WidgetComponent />
      </Suspense>
    </motion.div>
  );
}

export function DashboardWidgetGrid({ isEditing }: { isEditing: boolean }) {
  const { prefs, updatePrefs } = usePreferences();
  const widgetOrder = prefs.dashboardWidgetOrder || WIDGETS.map(w => w.id);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = widgetOrder.indexOf(active.id as string);
      const newIndex = widgetOrder.indexOf(over.id as string);
      const newOrder = arrayMove(widgetOrder, oldIndex, newIndex);
      updatePrefs({ dashboardWidgetOrder: newOrder });
    }
  };

  const orderedWidgets = widgetOrder
    .map(id => WIDGETS.find(w => w.id === id))
    .filter((w): w is WidgetConfig => !!w);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-6 auto-rows-fr">
        <SortableContext items={widgetOrder} strategy={rectSortingStrategy}>
          {orderedWidgets.map((widget) => (
            <DraggableWidget 
              key={widget.id} 
              widget={widget} 
              isEditing={isEditing} 
            />
          ))}
        </SortableContext>
      </div>
    </DndContext>
  );
}
