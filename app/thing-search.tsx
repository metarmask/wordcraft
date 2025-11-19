"use client";
import Image from "next/image";
import Link from "next/link";
import ThingClassSelector, { ThingClassSelectorValue } from "./thing-class-selector";
import Autocomplete from '@mui/material/Autocomplete';
import { Box, debounce, Divider, FormControl, Input, InputAdornment, InputLabel, OutlinedInput, TextField } from "@mui/material";
// import Card from "./card";
import Stack from '@mui/material/Stack';
import AccountCircle from "@mui/icons-material/AccountCircle";
import SearchIcon from '@mui/icons-material/Search';
import { craft } from "@/lib/data";
import ThingEl from "./thing";
import { FormEvent, FormEventHandler, Fragment, RefObject, SetStateAction, use, useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { HierarchicalNSW, loadHnswlib} from 'hnswlib-wasm';
import { Thing } from "@/lib/schema";
import ThingView from "./thing";

type MakePropNotNull<T, K extends keyof T> =
  Omit<T, K> & { [P in K]: Exclude<T[P], null> };

function ensureNotNull<T, Y extends keyof T & string>(obj: T, prop: Y): MakePropNotNull<T, Y> {
  if (obj[prop] === null) {
    throw new TypeError(prop + " must not be null")
  }
  return obj as any
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
    this.idx.addPoints(points, ns, false)
  }

  public getDistances(vector: number[], ns: number[]): number[] {
    const result = this.idx.searchKnn(vector, ns.length, (n: number) => ns.includes(n))
    return ns.map(n => result.distances[result.neighbors.indexOf(n)])
  }

  public search(fromVector: number[], ns: number[] = this.map.keys().toArray()): [T, number][] {
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

export default function ThingSearch() {
  const [searchText, setSearchText] = useState("");
  const [classFilter, setClassFilter] = useState<ThingClassSelectorValue>(null);
  const [allThings, setAllThings] = useState<Thing[]>([])
  const [index, setIndex] = useState<Index<MakePropNotNull<Thing, "vector">>>()
  const [embedding, setEmbedding] = useState<number[] | null>(null)
  const inputId = useId()
  const setAllThingsAndUpdateIndex = (value: typeof allThings) => {
    index?.addMultiple(value.map(a => ensureNotNull(a, "vector")))
    setAllThings(value)
  }
  const onSubmit: FormEventHandler<HTMLFormElement> = e => {
    e.preventDefault()
    ;(async () => {
      const thing: Thing = (await (await fetch("/api/things", {method: "POST", body: JSON.stringify({thing: searchText})})).json())
      if (!thing.vector) {
        throw new TypeError("No vector?")
      }
      const newThings = [...allThings, thing]
      setAllThingsAndUpdateIndex(newThings)
    })()
  }
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
      setAllThingsAndUpdateIndex(things)
    })()
  }, [])
  useEffect(() => {
    (async () => {
      if (!index) {
        const properAllThings = allThings.map(a => ensureNotNull(a, "vector"))
        const index = await Index.init<typeof properAllThings[0]>()
        index.addMultiple(properAllThings)
        setIndex(index)
      }
    })()
  }, [allThings])
  let thingsToDisplay: [Thing, number][] = allThings.map(a => [a, 0])
  if (index && !(searchText === "" && classFilter === null)) {
    const specificThing = allThings.find(a => a.thing === searchText && a.vector)
    if (specificThing || embedding) {
      thingsToDisplay = index.getClosest((specificThing?.vector!) || embedding)
    }
  }
  return (
    <div className="flex min-h-screen justify-center bg-zinc-50 font-sans max-w-2xl p-10 text-black">
      <Stack className={"justify-start items-start w-full"}>
        <Box component="form" onSubmit={onSubmit} className={"flex w-full items-center"}>
          <OutlinedInput id={inputId} className={"w-full"} onChange={(e) => setSearchText(e.target.value)}/>
          <label htmlFor={inputId}><SearchIcon sx={{ color: 'action.active' }} className={"mr-1 my-0.5 ml-3"} /></label>
        </Box>
        <ThingClassSelector classFilter={classFilter} onChange={setClassFilter}></ThingClassSelector>
        <Divider orientation="horizontal" flexItem />
        <div className="flex flex-wrap justify-between">
          {
          thingsToDisplay
          .map(a => <Fragment key={a[0].n}><ThingView props={a[0]} dist={a[1]} key={a[0].n}></ThingView></Fragment>)
          // {(90-(Math.acos(a[1])/Math.PI)*180).toFixed(3)}
          }
        </div>
      </Stack>
    </div>
  );
}
