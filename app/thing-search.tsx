"use client";
import ThingClassSelector, { ThingClassSelectorValue } from "./thing-class-selector";
import { Box, Divider, OutlinedInput } from "@mui/material";
import Stack from '@mui/material/Stack';
import SearchIcon from '@mui/icons-material/Search';
import React, { FormEventHandler, Fragment, useCallback, useEffect, useId, useImperativeHandle, useMemo, useState } from "react";
import { HierarchicalNSW, loadHnswlib} from 'hnswlib-wasm';
import { DIMENSIONS, Thing } from "@/lib/schema";
import ThingView from "./thing";

type MakePropNotNull<T, K extends keyof T> =
  Omit<T, K> & { [P in K]: Exclude<T[P], null> };

function ensureNotNull<T, Y extends keyof T & string>(obj: T, prop: Y): MakePropNotNull<T, Y> {
  if (obj[prop] === null) {
    throw new TypeError(prop + " must not be null")
  }
  return obj as any
}

function isValidVector(v: unknown): v is number[] {
  return Array.isArray(v) && v.length === DIMENSIONS;
}

function isIndexableThing(t: Thing): t is MakePropNotNull<Thing, "vector" | "n"> {
  return typeof t.n === "number" && Number.isFinite(t.n) && isValidVector(t.vector);
}

interface Indexable {
  n: number,
  vector: number[]
}

class Index<T extends Indexable> {
  private idx: HierarchicalNSW
  private map: Map<number, T>

  private constructor(idx: HierarchicalNSW, map: Map<number, T>) {
    this.idx = idx
    this.map = map
  }

  public static async init<T extends Indexable>(): Promise<Index<T>> {
    const lib = await loadHnswlib()
    lib.EmscriptenFileSystemManager.setDebugLogs(true);
    const idx = new lib.HierarchicalNSW("cosine", 3072, "index.dat")
    // console.log("current count", idx.getCurrentCount())
    idx.initIndex(5000, 16, 200, 100)
    idx.setEfSearch(32)
    return new Index(idx, new Map())
  }

  public addMultiple(ts: T[]) {
    if (ts.length === 0) {
      return
    }
    const points = []
    const ns = []
    for(const t of ts) {
      if (!this.map.has(t.n)) {
        this.map.set(t.n, t)
        points.push(t.vector)
        ns.push(t.n)
      }
    }
    if (points.length === 0) {
      return
    }
    this.idx.addPoints(points, ns, false)
  }

  public getDistances(vector: number[], ns: number[]): number[] {
    const result = this.idx.searchKnn(vector, ns.length, (n: number) => ns.includes(n))
    return ns.map(n => result.distances[result.neighbors.indexOf(n)])
  }

  public search(fromVector: number[], ns: number[] = Array.from(this.map.keys())): [T, number][] {
    if (this.map.size === 0) {
      return []
    }
    const result = this.idx.searchKnn(fromVector, ns ? ns.length : this.map.size, ns ? (n: number) => ns.includes(n) : () => true)
    return result.distances.map((dist, i) => ([this.map.get(result.neighbors[i])!, dist]))
  }

  public getClosest(toVector: number[], ns: number[] | undefined = undefined): [T, number][] {
    const result = this.search(toVector, ns)
    return result.sort((a, b) => a[1] - b[1])
  }
}

async function getEmbedding(text: string): Promise<number[]> {
  return await (await fetch("/api/embedding", {method: "POST", body: JSON.stringify({text})})).json()
}

export type ThingSearchHandle = {
  addThing: (t: Thing | Thing[]) => void;
  getTopResult: () => Thing | undefined;
};

const ThingSearch = React.forwardRef<ThingSearchHandle, {onPick: (t: Thing) => any}>(function ThingSearch({onPick}, ref) {
  const [searchText, setSearchText] = useState("");
  const [classFilter, setClassFilter] = useState<ThingClassSelectorValue>(null);
  const [allThings, setAllThings] = useState<Thing[]>([])
  const [index, setIndex] = useState<Index<MakePropNotNull<Thing, "vector">>>()
  const [embedding, setEmbedding] = useState<number[] | null>(null)
  const inputId = useId()
  const mergeThings = useCallback((incoming: Thing | Thing[]) => {
    const list = Array.isArray(incoming) ? incoming : [incoming];
    setAllThings((prev) => {
      const byThing = new Map(prev.map((t) => [t.thing, t]));
      const toIndex: MakePropNotNull<Thing, "vector" | "n">[] = [];
      for (const t of list) {
        if (!byThing.has(t.thing)) {
          byThing.set(t.thing, t);
          if (isIndexableThing(t)) {
            toIndex.push(t);
          }
        }
      }
      const next = Array.from(byThing.values());
      if (index && toIndex.length) {
        index.addMultiple(toIndex);
      }
      return next;
    });
  }, [index]);
  useEffect(() => {
    (async () => {
      if (searchText === "") {
        setEmbedding(null)
      } else {
        setEmbedding(await getEmbedding(searchText))
      }
    })()
  }, [searchText])
  useEffect(() => {
    (async () => {
      const things = (await (await fetch("/api/things")).json())
      mergeThings(things)
    })()
  }, [mergeThings])
  useEffect(() => {
    (async () => {
      if (!index) {
        const properAllThings = allThings.filter(isIndexableThing)
        const newIndex = await Index.init<typeof properAllThings[0]>()
        newIndex.addMultiple(properAllThings)
        setIndex(newIndex)
      }
    })()
  }, [allThings, index])
  const thingsToDisplay: [Thing, number][] = useMemo(() => {
    let items: [Thing, number][] = allThings.map(a => [a, 0])
    if (index && !(searchText === "" && classFilter === null)) {
      const specificThing = allThings.find(a => a.thing === searchText && isValidVector(a.vector))
      if (specificThing || isValidVector(embedding)) {
        try {
          items = index.getClosest((specificThing?.vector!) || (isValidVector(embedding) ? embedding : undefined))
        } catch (err) {
          console.error("Index search failed", err);
        }
      }
    }
    return items
  }, [allThings, classFilter, embedding, index, searchText])
  const getTopResult = useCallback(() => thingsToDisplay[0]?.[0], [thingsToDisplay]);
  const onSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const topResult = getTopResult();
    if (topResult) {
      onPick(topResult);
    }
  };

  useImperativeHandle(ref, () => ({
    addThing: mergeThings,
    getTopResult,
  }), [mergeThings, getTopResult]);

  return (
    <div className="flex min-h-screen justify-center bg-zinc-50 font-sans max-w-2xl p-10 text-black">
      <Stack className={"justify-start items-start w-full"}>
        <Box component="form" onSubmit={onSubmit} className={"flex w-full items-center"}>
          <OutlinedInput id={inputId} className={"w-full"} onChange={(e) => setSearchText(e.target.value)}/>
          <label htmlFor={inputId}><SearchIcon sx={{ color: 'action.active' }} className={"mr-1 my-0.5 ml-3"} /></label>
        </Box>
        <ThingClassSelector classFilter={classFilter} onChange={setClassFilter}></ThingClassSelector>
        <Divider orientation="horizontal" flexItem />
        <div className="flex flex-wrap justify-between gap-y-2" onClick={event => {
          const hello = event.target
          if (hello instanceof HTMLElement) {
            if (hello.classList.contains("thing")) {
              onPick(allThings.find(a => a.n === parseInt(hello.dataset.n!))!)
            }
          }
          console.log(hello)
        }}>
            {
            thingsToDisplay
            .map(a => <Fragment key={a[0].n}><ThingView props={a[0]} dist={a[1]} key={a[0].n} ></ThingView></Fragment>)
            // {(90-(Math.acos(a[1])/Math.PI)*180).toFixed(3)}
            }
        </div>
      </Stack>
    </div>
  );
});

export default ThingSearch;
