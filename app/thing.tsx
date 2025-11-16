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
import { Thing as ThingData } from '@/lib/schema';



export default function Thing({hmm}: {hmm: ThingData}) {
  return (
    <div className={"rounded border p-2 inline-block mr-5 mt-5"}>{hmm.emoji} {hmm.thing}</div>
  );
}