"use client"
import Button from '@mui/material/Button';

import * as React from 'react';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import FormatAlignJustifyIcon from '@mui/icons-material/FormatAlignJustify';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { Box, FormControl, FormLabel } from '@mui/material';
import { Thing } from '@/lib/schema';



export default function ThingView({props, dist}: {props: Thing, dist: number}) {
  return (
    // `scale(${1-Math.E**(5*(dist-1))})`
    <div className={"rounded border border-gray-400 p-1 inline-block mr-2 mt-2"} style={{transform: `scale(${0.8+Math.acos(dist)/(Math.PI*2)})`}}>{props.emoji} {props.thing}</div>
  );
}