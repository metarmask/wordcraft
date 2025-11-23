"use client"


import React, { CSSProperties, ReactNode, useRef } from 'react';
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
    onRemoveKey,
    focusPrev,
}: {
    id: UniqueIdentifier,
    children: ReactNode,
    className?: string,
    manualTransform?: string,
    manualTransition?: string,
    manualStyle?: CSSProperties,
    onRemoveKey?: (rect?: ClientRect | DOMRect) => void,
    focusPrev?: () => void,
}) {
    const nodeRef = useRef<HTMLDivElement | null>(null);
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

    const refSetter = (node: HTMLDivElement | null) => {
        nodeRef.current = node;
        setNodeRef(node);
    };

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
        <div
          data-recipe-id={id}
          className={className}
          ref={refSetter}
          style={style}
          {...attributes}
          {...listeners}
          onKeyDown={(e) => {
            // preserve sortable's key handling
            listeners?.onKeyDown?.(e);
            if (e.defaultPrevented) return;
            if ((e.key === "Delete" || e.key === "Backspace") && onRemoveKey) {
              e.preventDefault();
              onRemoveKey(nodeRef.current?.getBoundingClientRect());
              focusPrev?.();
            }
          }}
        >
        {children}
        </div>
    );
}

const animateLayoutChanges: AnimateLayoutChanges = (args) =>
  defaultAnimateLayoutChanges({...args, wasDragging: true});
