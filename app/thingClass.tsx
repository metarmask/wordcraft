"use client"
import * as React from 'react';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { Box, FormControl, FormLabel } from '@mui/material';



export default function ThingClass() {
  const [clazz, setClass] = React.useState<string | null>(null);

  const handleClass = (
    event: React.MouseEvent<HTMLElement>,
    newAlignment: string | null,
  ) => {
    setClass(newAlignment);
  };

  return (
    <Box sx={{ display: 'flex' }} className={"my-5"}>
      <FormControl variant="standard">
        <FormLabel component="legend">Class</FormLabel>
          <ToggleButtonGroup
            value={clazz}
            exclusive
            onChange={handleClass}
            color="primary"
          >
            <ToggleButton value="verb" aria-label="left aligned">
              Verb
            </ToggleButton>
            <ToggleButton value="noun" aria-label="centered">
              Noun
            </ToggleButton>
            <ToggleButton value="adjective" aria-label="right aligned">
              Adjective
            </ToggleButton>
          </ToggleButtonGroup>
        </FormControl>
      </Box>
  );
}