console.log("Hello via Bun!");

const messages: string[] = [];

const server = Bun.serve({
    port: 4000,
    fetch(req) {
        return new Response("Hello from the bun server!");
    },
});

console.log(`Listening on http://${server.hostname}:${server.port}`);
