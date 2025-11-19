"use client"
import * as React from 'react';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { Box, FormControl, FormLabel } from '@mui/material';
import { useState } from 'react';

const values = {verb: "Verb", noun: "Noun", adjective: "Adjective"} as const
export type ThingClassSelectorValue = keyof typeof values | null

export default function ThingClassSelector({classFilter, onChange}: {
  classFilter: ThingClassSelectorValue,
  onChange: (value: ThingClassSelectorValue) => void}) {
  return (
    <Box className={"flex my-5"}>
      <FormControl variant="standard">
        <FormLabel component="legend">Class</FormLabel>
          <ToggleButtonGroup
            value={classFilter}
            exclusive
            onChange={(_, value) => onChange(value)}
            color="primary"
          >
            {Object.entries(values).map(([k, name]) =>
              <ToggleButton value={k}>{name}</ToggleButton>
            )}
          </ToggleButtonGroup>
        </FormControl>
      </Box>
  );
}

