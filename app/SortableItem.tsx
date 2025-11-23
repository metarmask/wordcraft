"use client"


import React, { ReactElement, ReactNode } from 'react';
import {horizontalListSortingStrategy, rectSortingStrategy, rectSwappingStrategy, useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import ThingView from './thing';
import { UniqueIdentifier } from '@dnd-kit/core';

export function SortableItem<T>({id, children, className}: {id: UniqueIdentifier, children: ReactNode, className?: string}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({id, strategy: horizontalListSortingStrategy});

    const style = {
        transform: CSS.Transform.toString(transform),
        transition
    };
    className = ["touch-none", className, isDragging ? "invisible" : ""]
        .filter(Boolean)
        .join(" ")
  
    return (
        <div data-recipe-id={id} className={className} ref={setNodeRef} style={style} {...attributes} {...listeners}>
        {children}
        </div>
    );
}
