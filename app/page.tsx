"use client"
import ThingSearch, { ThingSearchHandle } from "./thing-search";

import React, {useRef, useState} from 'react';
import Button from "@mui/material/Button";

import { Recipe, RecipeHandle } from "./recipe";
import { Thing } from "@/lib/schema";
import ThingView from "./thing";

export default function Home() {
  const recipeRef = useRef<RecipeHandle | null>(null)
  const thingSearchRef = useRef<ThingSearchHandle | null>(null)
  const [isCrafting, setIsCrafting] = useState(false)
  const [craftResult, setCraftResult] = useState<Thing | null>(null)

  return (
    <div className="flex flex-col w-full items-stretch">
      <Recipe ref={recipeRef} />
      <div className="px-2 flex flex-col items-center">
        <Button
          variant="contained"
          color="inherit"
          aria-label="Craft recipe"
          loading={isCrafting}
          loadingPosition="start"
          onClick={async () => {
            const recipeText = recipeRef.current?.getRecipeText() ?? "";
            if (!recipeText) return;
            setIsCrafting(true);
            setCraftResult(null);
            try {
              const response = await fetch("/api/craft", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({recipe: recipeText}),
              });
              if (!response.ok) return;
              const craftedThing: Thing = await response.json();
              if (craftedThing) {
                thingSearchRef.current?.addThing(craftedThing);
                setCraftResult(craftedThing);
              }
            } finally {
              recipeRef.current?.clear();
              setIsCrafting(false);
            }
          }}
        >
            <span
              className={`text-3xl py-3 hammer-icon ${isCrafting ? "hammer-icon--loading" : ""}`}
            >
              🔨
            </span>
        </Button>
        {craftResult ? (
          <div className="mt-3 text-center">
            <ThingView props={craftResult} dist={0} />
          </div>
        ) : null}
      </div>
      <ThingSearch ref={thingSearchRef} onPick={thing => {
        recipeRef.current?.addThing(thing)
      }}></ThingSearch>
    </div>
  );
}
