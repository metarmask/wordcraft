"use client"

import React, {ReactElement, SetStateAction, useCallback, useState} from 'react';
import {
  DndContext, 
  DragStartEvent,
  KeyboardSensor,
  closestCenter,
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
        onRemove?: (id: Y, info: {delta: {x: number, y: number}, rect: ClientRect | DOMRect}) => boolean | void,
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
  const collisionDetection = useCallback((context: any) => {
    // Keyboard sensor has no pointer coordinates; fall back to center-based detection
    return context?.pointerCoordinates
      ? pointerWithin(context)
      : closestCenter(context);
  }, []);

  return (
    <DndContext 
        onDragStart={handleDragStart}
        sensors={sensors}
        collisionDetection={collisionDetection}
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
            onRemoveKey={rect => handleKeyRemove(getID(item), rect)}
            focusPrev={() => focusItemBefore(getID(item))}
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

  function handleKeyRemove(id: Y, rect?: ClientRect | DOMRect) {
    if (!onRemove) return;
    setItems((currentItems) => {
      const activeIndex = currentItems.findIndex((item) => getID(item) === id);
      if (activeIndex === -1) return currentItems;

      const shouldRemove = onRemove(id, {
        delta: {x: 0, y: 0},
        rect: rect ?? new DOMRect(),
      });
      if (shouldRemove === false) {
        return currentItems;
      }
      const next = [...currentItems];
      next.splice(activeIndex, 1);
      return next;
    });
  }

  function focusItemBefore(id: Y) {
    const el = document.querySelector<HTMLElement>(`[data-recipe-id="${id}"]`);
    if (!el) return;
    const itemsIds = items.map(getID);
    const idx = itemsIds.indexOf(id);
    const targetId = itemsIds[idx - 1] ?? itemsIds[idx + 1];
    if (targetId === undefined) return;
    const target = document.querySelector<HTMLElement>(`[data-recipe-id="${targetId}"]`);
    target?.focus();
  }
}

const dropAnimation: DropAnimation | null = null;
