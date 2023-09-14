import { randomInt, randomUUID } from "crypto";
import { userInfo } from "os";

console.log("Hello via Bun!");

const keyExists = (obj: object, key: string) => Object.keys(obj).includes(key);
type WebSocketData = {
    createdAt: number;
    channelId: string;
    userId: string;
};
type Message = {
    userId: string;
    type: string;
    text: string;
};

type Channel = {
    [key: string]: { messages: Message[]; users: string[] };
};

const channels: Channel = {};

const server = Bun.serve<WebSocketData>({
    port: 4000,
    fetch(req: Request, server) {
        const url = new URL(req.url);
        const channel = url.pathname;
        const userId = randomUUID();

        const upgraded = server.upgrade(req, {
            data: {
                createdAt: Date.now(),
                channelId: url.pathname,
                userId: userId,
                server,
            },
        });
        return new Response("Hello from the bun server!");
    },
    websocket: {
        message(ws, message: string) {
            const channelId = ws.data.channelId;
            const user = ws.data.userId;
            if (keyExists(channels, ws.data.channelId)) {
                channels[channelId].messages.push({
                    userId: user,
                    type: "message",
                    text: message,
                });
                ws.send(JSON.stringify(channels));
                ws.publish(ws.data.channelId, JSON.stringify(channels));
                console.log(channels);
                return;
            }

            console.log("SOMETHING WENT WRONG");
        },
        open(ws) {
            ws.subscribe(ws.data.channelId);
            const channelId = ws.data.channelId;
            const user = ws.data.userId;
            // create the channel if none exists
            if (!keyExists(channels, channelId)) {
                channels[channelId] = {
                    users: [],
                    messages: [],
                };
            }

            // if the user is not in the list of users already, add them.
            if (!channels[channelId].users.includes(user)) {
                channels[channelId].users.push(user);
            }

            channels[channelId].messages.push({
                userId: user,
                type: "update",
                text: `${user} just joined the channel!`,
            });
            ws.send(JSON.stringify(channels));
            ws.publish(ws.data.channelId, JSON.stringify(channels));
        },
    },
});

console.log(`Listening on http://${server.hostname}:${server.port}`);
