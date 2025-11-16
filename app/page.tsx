import Image from "next/image";
import Link from "next/link";
import ThingClass from "./thingClass";
import Autocomplete from '@mui/material/Autocomplete';
import { Box, Divider, FormControl, Input, InputAdornment, InputLabel, OutlinedInput, TextField } from "@mui/material";
// import Card from "./card";
import Stack from '@mui/material/Stack';
import AccountCircle from "@mui/icons-material/AccountCircle";
import SearchIcon from '@mui/icons-material/Search';
import { craft } from "@/lib/data";
import Thing from "./thing";

export default async function Home() {
  return (
    <div className="flex min-h-screen justify-center bg-zinc-50 font-sans max-w-2xl p-10 text-black">
      <Stack sx={{
        justifyContent: "flex-start",
        alignItems: "flex-start",
      }}
        className={"w-full"}>
        <Box sx={{ display: 'flex' }} className={"w-full items-center"}>
          <OutlinedInput className={"w-full"}/>
          <SearchIcon sx={{ color: 'action.active', mr: 1, my: 0.5 }} className={"ml-3"} />
        </Box>
        <ThingClass></ThingClass>
        <Divider orientation="horizontal" flexItem />
        <div className="items-center">
          <Thing hmm={await craft("inside vase")}></Thing>
          <Thing hmm={await craft("bottom of vase")}></Thing>
          <Thing hmm={await craft("vase liquid")}></Thing>
        </div>
      </Stack>
    </div>
  );
}
