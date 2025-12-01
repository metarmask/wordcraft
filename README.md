Collect the rarest words in the English language by combining them together. Inspired by [InfiniCraft by Neal](https://neal.fun/infinite-craft/).

## Running
Coming soon.

## Architecture
Written in React and Next.js. Uses Drizzle+PostgreSQL for caching OpenAI responses between users. The vector search happens on the client via the WebAssembly package hnswlib-wasm. (TODO: More details)