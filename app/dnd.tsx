"use client"

import React, {ReactElement, SetStateAction, useState} from 'react';
import {
  DndContext, 
  DragStartEvent,
  KeyboardSensor,
  pointerWithin,
  PointerSensor,
  useSensor,
  useSensors,
  UniqueIdentifier,
  TouchSensor,
  DragOverlay,
  DragEndEvent,
  MeasuringStrategy,
  DropAnimation,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import {
  restrictToWindowEdges,
} from '@dnd-kit/modifiers';

import {SortableItem} from './SortableItem';

export function Dnd<T, Y extends UniqueIdentifier>(
    {items, setItems, getID, render, draggableClassName, onRemove, getManualTransform, getManualTransition, getManualStyle}:
    {
        items: T[],
        setItems: React.Dispatch<SetStateAction<T[]>>,
        getID: (t: T) => Y,
        render: (t: T) => ReactElement,
        draggableClassName?: string,
        onRemove?: (id: Y, info: {delta: {x: number, y: number}, rect: ClientRect}) => boolean | void,
        getManualTransform?: (t: T) => string | undefined,
        getManualTransition?: (t: T) => string | undefined,
        getManualStyle?: (t: T) => React.CSSProperties | undefined,
    }
){
const [activeId, setActiveId] = useState<Y | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  return (
    <DndContext 
        onDragStart={handleDragStart}
        sensors={sensors}
        collisionDetection={pointerWithin}
        measuring={{droppable: {strategy: MeasuringStrategy.Always}}}
        onDragEnd={handleDragEnd}
    >
      <SortableContext 
        items={items.map(getID)}
      >
        {items.map(item => (
          <SortableItem
            className={draggableClassName}
            key={getID(item)}
            id={getID(item)}
            manualTransform={getManualTransform?.(item)}
            manualTransition={getManualTransition?.(item)}
            manualStyle={getManualStyle?.(item)}
          >
            {render(item)}
          </SortableItem>
        ))}
      </SortableContext>
      <DragOverlay
        modifiers={[restrictToWindowEdges]}
        dropAnimation={dropAnimation}
      >
        {activeId !== null ? render(items.find(a => getID(a) === activeId)!) : undefined}
      </DragOverlay>
    </DndContext>
  );
  
  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as Y);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const {active, over} = event;

    setItems((currentItems) => {
      const activeIndex = currentItems.findIndex((item) => getID(item) === active.id);

      if (activeIndex === -1) {
        return currentItems;
      }

      // Drop outside of any sortable item removes it from the recipe
      if (!over) {
        if (onRemove) {
          const shouldRemove = onRemove(active.id as Y, {
            delta: event.delta,
            rect: (event.active.rect.current.translated ?? event.active.rect.current.initial) as ClientRect,
          });
          if (shouldRemove === false) {
            return currentItems;
          }
        }
        return currentItems.filter((_, index) => index !== activeIndex);
      }

      const overIndex = currentItems.findIndex((item) => getID(item) === over.id);

      if (overIndex !== -1 && activeIndex !== overIndex) {
        return arrayMove(currentItems, activeIndex, overIndex);
      }

      return currentItems;
    });
  }
}

const dropAnimation: DropAnimation | null = null;
