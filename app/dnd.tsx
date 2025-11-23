"use client"

import React, {ReactElement, SetStateAction, useState} from 'react';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  UniqueIdentifier,
  TouchSensor,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates
} from '@dnd-kit/sortable';
import {
  restrictToWindowEdges,
} from '@dnd-kit/modifiers';

import {SortableItem} from './SortableItem';
import { RenderingMode } from 'next/dist/build/rendering-mode';

export function Dnd<T>(
    {items, setItems, getID, render, draggableClassName}:
    {
        items: T[],
        setItems: React.Dispatch<SetStateAction<T[]>>,
        getID: (t: T) => UniqueIdentifier,
        render: (t: T) => ReactElement,
        draggableClassName?: string
    }
){
const [activeId, setActiveId] = useState(null);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  console.log(activeId)
  return (
    <DndContext 
        onDragStart={handleDragStart}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
    >
      <SortableContext 
        items={items.map(getID)}
        // strategy={horizontalListSortingStrategy}
      >
        {items.map(item => <SortableItem className={draggableClassName} key={getID(item)} id={getID(item)}>{render(item)}</SortableItem>)}
      </SortableContext>
      <DragOverlay dropAnimation={{
  duration: 200,
  easing: 'ease-out',
}} modifiers={[restrictToWindowEdges]}>
        {activeId !== null ? render(items.find(a => getID(a) === activeId)!) : undefined}
      </DragOverlay>
    </DndContext>
  );
  
  function handleDragStart(event: any) {
    setActiveId(event.active.id);
  }

  function handleDragEnd(event: any) {
    setActiveId(null);
    const {active, over} = event;
    if (active.id !== over.id) {
        const oldIndex = items.findIndex(a => getID(a) === active.id);
        const newIndex = items.findIndex(a => getID(a) === over.id);

        setItems(arrayMove(items, oldIndex, newIndex));
    }
  }
}