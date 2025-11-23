"use client"
import { Fragment } from "react/jsx-runtime";
import ThingSearch from "./thing-search";


import React, {useEffect, useState} from 'react';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  DragOverlay,
  closestCorners,
} from '@dnd-kit/core';
import {
  arrayMove,
  horizontalListSortingStrategy,
  rectSortingStrategy,
  rectSwappingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import ThingView from './thing';
import { Thing } from "@/lib/schema";
import { Dnd } from "./dnd";

export default function Home() {
  const [recipe, setRecipe] = useState<{id: number, thing: Thing}[]>([])
  const [nextID, setNextID] = useState(0)
  return (
    <div className="flex flex-col w-full items-stretch">
      <div className="overflow-x-auto whitespace-nowrap">
        <Dnd items={recipe} setItems={setRecipe} getID={({id}) => id} draggableClassName="inline-block" render={({thing}) => <ThingView props={thing} dist={0}></ThingView>}></Dnd>
      </div>
      <ThingSearch onPick={thing => {
        setNextID(nextID+1)
        setRecipe([...recipe, {id: nextID, thing}])
      }}></ThingSearch>
    </div>
  );
}
