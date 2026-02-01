const apiKey = process.env.API_NINJAS_KEY;

if (!apiKey) {
  throw new Error("Missing API_NINJAS_KEY environment variable");
}

const res = await fetch(url, {
  headers: { "X-Api-Key": apiKey },
  cache: "no-store",
});
