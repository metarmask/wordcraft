Collect the rarest words in the English language by combining them together. Inspired by [InfiniCraft by Neal](https://neal.fun/infinite-craft/).

## Running
Coming soon.

## Architecture
Written in React and Next.js. Uses Drizzle+PostgreSQL for caching OpenAI responses between users. The vector search happens on the client via the WebAssembly package hnswlib-wasm. (TODO: More details)

![A screenshot of the interface shows a line of words at the top cut off by a shadow at the right edge. Beneath a big hammer button is the word "the" with the preceeding captial A emoji. Beneath is a search bar, word class filters and a list of the words "grammar", "article", "noun" and "the".](screenshot.png)