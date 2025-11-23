"use client"

import React, {CSSProperties, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState} from "react";
import {createPortal} from "react-dom";
import {Thing} from "@/lib/schema";
import ThingView from "./thing";
import {Dnd} from "./dnd";

type RemovePhase = "idle" | "pending" | "fading";
type RemoveStyle = CSSProperties;
type RecipeItem = {
  id: number;
  thing: Thing;
  removePhase?: RemovePhase;
  removeTransform?: string;
  removeStyle?: RemoveStyle;
};
type RemoveInfo = {delta: {x: number; y: number}; rect: ClientRect};

export type RecipeHandle = {
  addThing: (thing: Thing) => void;
  clear: () => void;
  getRecipeText: () => string;
};

export const Recipe = React.forwardRef<RecipeHandle, {}>(function Recipe(_, ref) {
  const [items, setItems] = useState<RecipeItem[]>([]);
  const recipeContainerRef = useRef<HTMLDivElement | null>(null);
  const [hasLeftShadow, setHasLeftShadow] = useState(false);
  const [hasRightShadow, setHasRightShadow] = useState(false);
  const scrollFrameRef = useRef<number | null>(null);
  const scrollDirRef = useRef<-1 | 1 | null>(null);
  const nextIdRef = useRef(0);
  const shouldScrollToEndRef = useRef(false);

  useImperativeHandle(ref, () => ({
    addThing: (thing: Thing) => {
      setItems((prev) => {
        const newId = nextIdRef.current++;
        shouldScrollToEndRef.current = true;
        return [...prev, {id: newId, thing}];
      });
    },
    clear: () => {
      setItems([]);
      shouldScrollToEndRef.current = false;
    },
    getRecipeText: () => items.map(({thing}) => thing.thing).join(" ").trim(),
  }), [items]);

  useLayoutEffect(() => {
    if (!shouldScrollToEndRef.current) return;
    const container = recipeContainerRef.current;
    if (!container) return;
    shouldScrollToEndRef.current = false;
    const frame = requestAnimationFrame(() => {
      container.scrollTo({left: container.scrollWidth, behavior: "smooth"});
      updateShadows();
    });
    return () => cancelAnimationFrame(frame);
  }, [items.length]);

  useEffect(() => {
    updateShadows();
    return () => stopAutoScroll();
  }, [items.length]);

  return (
    <div className="relative">
      <div
        ref={recipeContainerRef}
        className="overflow-x-auto my-3 whitespace-nowrap recipe-scroll px-2"
        onScroll={updateShadows}
      >
        {items.length === 0 ? (
          <div className="inline-block invisible pointer-events-none" aria-hidden>
            <ThingView
              props={{emoji: "👻", thing: "Phantom", n: -1, vector: null, verb: null, noun: null, adjective: null}}
              dist={0}
            />
          </div>
        ) : null}
        <Dnd
          items={items}
          setItems={setItems}
          getID={({id}) => id}
          draggableClassName="inline-block"
          onRemove={handleRemove}
          getManualTransform={({removeTransform, removePhase}) =>
            removePhase === "fading" ? removeTransform : undefined
          }
          getManualTransition={({removePhase}) => (removePhase === "fading" ? "none" : undefined)}
          getManualStyle={({removePhase}) => (removePhase ? {visibility: "hidden"} : undefined)}
          render={({thing, removePhase, removeStyle, removeTransform}) => {
            const baseStyle = {transition: "opacity 180ms ease, transform 180ms ease"};
            const removingStyle = removePhase === "fading" ? {opacity: 0, transform: "scale(0.85)"} : {};
            const overlayStyle =
              removeStyle && removePhase
                ? {
                    ...removeStyle,
                    ...baseStyle,
                    ...(removePhase === "fading" ? removingStyle : {}),
                    transform: removeTransform ?? removingStyle.transform,
                    opacity: removePhase === "fading" ? removingStyle.opacity : 1,
                  }
                : null;
            const portalTarget = typeof document !== "undefined" ? document.body : null;
            return (
              <>
                <ThingView className="mx-1" style={{...baseStyle, ...removingStyle}} props={thing} dist={0} />
                {overlayStyle && portalTarget
                  ? createPortal(
                      <ThingView style={overlayStyle} props={thing} dist={0} />,
                      portalTarget
                    )
                  : null}
              </>
            );
          }}
        />
      </div>
      <div className={`scroll-shadow scroll-shadow-left ${hasLeftShadow ? "opacity-100" : "opacity-0"}`} aria-hidden></div>
      <div className={`scroll-shadow scroll-shadow-right ${hasRightShadow ? "opacity-100" : "opacity-0"}`} aria-hidden></div>
      <div
        className={`scroll-hotspot scroll-hotspot-left ${hasLeftShadow ? "" : "pointer-events-none"}`}
        onMouseEnter={() => startAutoScroll(-1)}
        onMouseLeave={stopAutoScroll}
      ></div>
      <div
        className={`scroll-hotspot scroll-hotspot-right ${hasRightShadow ? "" : "pointer-events-none"}`}
        onMouseEnter={() => startAutoScroll(1)}
        onMouseLeave={stopAutoScroll}
      ></div>
    </div>
  );

  function handleRemove(id: number, info?: RemoveInfo) {
    const removeTransform = undefined;
    const removeStyle: RemoveStyle | undefined = info
      ? {
          position: "fixed",
          left: info.rect.left,
          top: info.rect.top,
          width: info.rect.width,
          height: info.rect.height,
          pointerEvents: "none",
          zIndex: 50,
        }
      : undefined;
    setItems((current) =>
      current.map((item) => (item.id === id ? {...item, removePhase: "pending", removeTransform, removeStyle} : item))
    );
    requestAnimationFrame(() => {
      setItems((current) =>
        current.map((item) => (item.id === id && item.removePhase === "pending" ? {...item, removePhase: "fading"} : item))
      );
    });
    setTimeout(() => {
      setItems((current) => current.filter((item) => item.id !== id));
    }, 200);

    // Keep the item rendered so the CSS transition can play
    return false;
  }

  function updateShadows() {
    const el = recipeContainerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const left = el.scrollLeft > 2;
    const right = el.scrollLeft < maxScroll - 2;
    setHasLeftShadow(left);
    setHasRightShadow(right && maxScroll > 0);
  }

  function startAutoScroll(dir: -1 | 1) {
    scrollDirRef.current = dir;
    if (scrollFrameRef.current !== null) return;
    const step = () => {
      const el = recipeContainerRef.current;
      if (!el || scrollDirRef.current === null) {
        scrollFrameRef.current = null;
        return;
      }
      el.scrollBy({left: 10 * scrollDirRef.current});
      updateShadows();
      scrollFrameRef.current = requestAnimationFrame(step);
    };
    scrollFrameRef.current = requestAnimationFrame(step);
  }

  function stopAutoScroll() {
    if (scrollFrameRef.current !== null) {
      cancelAnimationFrame(scrollFrameRef.current);
      scrollFrameRef.current = null;
    }
    scrollDirRef.current = null;
  }
});
