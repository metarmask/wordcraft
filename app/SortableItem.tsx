"use client"


import React, { CSSProperties, ReactNode } from 'react';
import {horizontalListSortingStrategy, useSortable, defaultAnimateLayoutChanges, AnimateLayoutChanges} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import { UniqueIdentifier } from '@dnd-kit/core';

export function SortableItem<T>({
    id,
    children,
    className,
    manualTransform,
    manualTransition,
    manualStyle,
}: {
    id: UniqueIdentifier,
    children: ReactNode,
    className?: string,
    manualTransform?: string,
    manualTransition?: string,
    manualStyle?: CSSProperties,
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id,
        strategy: horizontalListSortingStrategy,
        animateLayoutChanges,
    });

    const computedTransform = !isDragging && manualTransform
        ? manualTransform
        : CSS.Transform.toString(transform);
    const computedTransition = !isDragging && manualTransform
        ? (manualTransition ?? transition)
        : transition;

    const style = {
        transform: computedTransform,
        transition: computedTransition,
        ...(manualStyle ?? {}),
    };
    className = ["touch-pan-x", className, isDragging ? "invisible" : ""]
        .filter(Boolean)
        .join(" ")
  
    return (
        <div data-recipe-id={id} className={className} ref={setNodeRef} style={style} {...attributes} {...listeners}>
        {children}
        </div>
    );
}

const animateLayoutChanges: AnimateLayoutChanges = (args) =>
  defaultAnimateLayoutChanges({...args, wasDragging: true});
