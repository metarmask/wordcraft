"use client";
import Image from "next/image";
import Link from "next/link";
import ThingClassSelector, { ThingClassSelectorValue } from "./thing-class-selector";
import Autocomplete from '@mui/material/Autocomplete';
import { Box, Divider, FormControl, Input, InputAdornment, InputLabel, OutlinedInput, TextField } from "@mui/material";
// import Card from "./card";
import Stack from '@mui/material/Stack';
import AccountCircle from "@mui/icons-material/AccountCircle";
import SearchIcon from '@mui/icons-material/Search';
import { craft } from "@/lib/data";
import ThingEl from "./thing";
import { FormEvent, FormEventHandler, RefObject, use, useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
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
    const result = this.idx.searchKnn(fromVector, ns ? ns.length : this.map.size, ns ? (n: number) => ns.includes(n) : () => true)
    return result.distances.map((dist, i) => ([this.map.get(result.neighbors[i])!, dist]))
  }

  public getClosest(toVector: number[], ns: number[] | undefined = undefined): [T, number][] {
    const result = this.search(toVector, ns)
    return result.sort((a, b) => a[1] - b[1])
  }
}

export default function ThingSearch() {
  const [searchText, setSearchText] = useState("");
  const [classFilter, setClassFilter] = useState<ThingClassSelectorValue>(null);
  const [limit, setLimit] = useState(5);
  const [allThings, setAllThings] = useState<Thing[]>([])
  // const [hmm, hmm2] = useTransition()
  // const initPromise: RefObject<Promise<Index<MakePropNotNull<Thing, "vector">>>> = useRef(null)
  const [index, setIndex] = useState<Index<MakePropNotNull<Thing, "vector">>>()
  // const [vectorSearch, setVectorSearch] = useState<Thing["n"] | null>(null)
  // const [distances, setDistances] = useState<Map<number, number>>(new Map())
  const inputId = useId()
  const onSubmit: FormEventHandler<HTMLFormElement> = e => {
    e.preventDefault()
    ;(async () => {
      const thing: Thing = (await (await fetch("/api/things", {method: "POST", body: JSON.stringify({thing: searchText})})).json())
      if (!thing.vector) {
        throw new TypeError("No vector??")
      }
      const newThings = [...allThings, thing]
      setAllThings(newThings)
    })()
  }
  // useEffect(() => {
  //   (async () => {

  //   })()
  // }, [searchText, classFilter, limit])
  useEffect(() => {
    (async () => {
      const things = (await (await fetch("/api/things")).json())
      setAllThings(things)
    })()
  }, [])
  useEffect(() => {
    (async () => {
      setIndex(await Index.init())
    })()
  }, [])
  useEffect(() => {
    index?.addMultiple(allThings.map(a => ensureNotNull(a, "vector")))
  }, [allThings, index])
  let thingsToDisplay = allThings
  if (index && !(searchText === "" && classFilter === null)) {
    const specificThing = allThings.find(a => a.thing === searchText && a.vector)
    if (specificThing) {
      thingsToDisplay = index.getClosest(specificThing.vector!).map(a => a[0])
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
        <div className="items-center">
          {thingsToDisplay.map(a => <ThingView props={a} key={a.n}></ThingView>)}
        </div>
      </Stack>
    </div>
  );
}
