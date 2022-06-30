import { IncomingMessage, ServerResponse } from "http";

const {MongoClient} = require("mongodb");
const fs = require("fs");
const http = require("http");

const uri = "not leaking my api key this time";

async function getPlanetData() {
    const client = new MongoClient(uri);

    let ret: (Object | null)[] = [];

	try {
        await client.connect();
        const planets = client.db("planets").collection("planets");
        const searchCursor = planets.find();
        
        while (await searchCursor.hasNext()) {
            ret.push(await searchCursor.next());
        }

        fs.writeFile("planetData.json", JSON.stringify(ret), (error: Error) => {
            if (error) {
                console.log("Couldn't create planetData.json.");
            }
            else {
                console.log("Successfully created planetData.json.");
            }
        });
    }
    catch (error) {
        console.error(error);
    }
    finally {
        client.close();
    }
}

async function main() {
    await getPlanetData();
    
    const server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
        if (req.url === "/") {
            res.writeHead(200, {"Content-Type": "text/html"});
            fs.readFile("index.html", (error: Error, data: Buffer) => {
                if (error) {
                    res.writeHead(404);
                    res.write("File not found.");
                }
                else {
                    res.write(data);
                }
                res.end();
            });
        }
        else {
            res.writeHead(200, {"Content-Type": "text"});
            fs.readFile(req.url?.slice(1), (error: Error, data: Buffer) => {
                if (error) {
                    res.writeHead(404);
                    res.write("File not found.");
                }
                else {
                    res.write(data);
                }
                res.end();
            });
        }
    });

    server.listen(3000, (error: Error) => {
        if (error) {
            console.error(error);
        }
        else {
            console.log("Listening.");
        }
    });
}

main();