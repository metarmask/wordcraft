"use client"
import ThingSearch from "./thing-search";

import React, {useEffect, useRef, useState} from 'react';

import ThingView from './thing';
import { Thing } from "@/lib/schema";
import { Dnd } from "./dnd";

export default function Home() {
  const [recipe, setRecipe] = useState<{id: number, thing: Thing}[]>([])
  const nextIdRef = useRef(0)
  const recipeContainerRef = useRef<HTMLDivElement | null>(null)
  const [lastAddedId, setLastAddedId] = useState<number | null>(null)

  useEffect(() => {
    if (lastAddedId === null || !recipeContainerRef.current) {
      return
    }
    const container = recipeContainerRef.current
    requestAnimationFrame(() => {
      const newThing = container.querySelector<HTMLElement>(`[data-recipe-id="${lastAddedId}"]`)
      if (newThing) {
        newThing.scrollIntoView({behavior: "smooth", block: "nearest", inline: "end"})
      } else {
        container.scrollTo({left: container.scrollWidth, behavior: "smooth"})
      }
    })
  }, [recipe.length, lastAddedId])

  return (
    <div className="flex flex-col w-full items-stretch">
      <div ref={recipeContainerRef} className="overflow-x-auto whitespace-nowrap">
        <Dnd items={recipe} setItems={setRecipe} getID={({id}) => id} draggableClassName="inline-block" render={({thing}) => <ThingView props={thing} dist={0}></ThingView>}></Dnd>
      </div>
      <ThingSearch onPick={thing => {
        setRecipe(prev => {
          const newId = nextIdRef.current++
          setLastAddedId(newId)
          return [...prev, {id: newId, thing}]
        })
      }}></ThingSearch>
    </div>
  );
}
