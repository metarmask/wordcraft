"use client"
import { Thing } from '@/lib/schema';
import {useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';


export default function ThingView({className, props, dist}: {className?: string, props: Thing, dist: number}) {
  // const {
  //   attributes,
  //   listeners,
  //   setNodeRef,
  //   transform,
  //   transition,
  // } = useSortable({id: props.n})
  // const style = {
  //   transform: CSS.Transform.toString(transform),
  //   transition,
  // }
  return (
    // `scale(${1-Math.E**(5*(dist-1))})`
    <div data-n={props.n} className={className??"" + " thing rounded border border-gray-400 p-1 bg-white inline-block mr-2 mt-2"} >{props.emoji} {props.thing}</div>
  )
  // style={{transform: `scale(${0.8+Math.acos(dist)/(Math.PI*2)})`}}
}

