import { createSysexMessageFromConfig } from "./dexed";
import JSONStream from 'JSONStream'

export async function doAnalysis(collection) {
    const response = await fetch("http://localhost:3000/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            path: "..\\luaScript\\output",
            configs: JSON.stringify(collection),
        }),
    });

    if (response.ok) {
        console.log("analysis done");
    } else {
        alert("Failed to do hrps.");
    }
    return response
}

export async function distanceMatrix() {
    try {
        const response = await fetch("http://localhost:3000/distanceMatrix", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                path: "..\\luaScript\\output",
            }),
        })

        if (!response.ok) {
            throw new Error(
                "Network response was not ok " + response.statusText,
            );
        }
        return response.json();
    } catch (err) {
        console.error("Error fetching data:", err);
    }
}

export async function readData() {
    try {
        const response = await fetch("http://localhost:3000/readData", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                path: "..\\luaScript\\output",
            }),
        })

        if (!response.ok) {
            throw new Error(
                "Network response was not ok " + response.statusText,
            );
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");

        let buffer = '';
        const parsedData = []
        let done = false;

        /*
        while (!done) {
            const { value, done: streamDone } = await reader.read();
            done = streamDone;
            buffer += decoder.decode(value, { stream: true });
            console.log(decoder.decode(value, { stream: true }))
            // Process complete JSON objects
            try {
                const data = JSON.parse(buffer);
                parsedData.push(data)
                console.log('Received a JSON Object');
                buffer = ''; // Clear buffer after processing
            } catch (e) {
                // Ignore incomplete JSON chunks
            }
        }
            */
        while (!done) {
            const { value, done: streamDone } = await reader.read();
            done = streamDone;
            // Decode the chunk and append to the buffer
            buffer += decoder.decode(value, { stream: true });

            // Process complete JSON objects from the buffer
            let openingBracketIndex = buffer.indexOf('{');
            let closingBracketIndex;

            while (
                openingBracketIndex !== -1 &&
                (closingBracketIndex = buffer.indexOf('}', openingBracketIndex)) !== -1
            ) {
                const jsonString = buffer.slice(openingBracketIndex, closingBracketIndex + 1);

                try {
                    const jsonObject = JSON.parse(jsonString);
                    console.log("Received JSON Object");
                    parsedData.push(jsonObject)

                    // Clear processed data from the buffer
                    buffer = buffer.slice(closingBracketIndex + 1);
                } catch (error) {
                    // Ignore incomplete JSON fragments
                    break;
                }

                openingBracketIndex = buffer.indexOf('{');
            }
        }


        return parsedData;

    } catch (err) {
        console.error("Error fetching data:", err);
    }
}

export async function sendReaper(collection) {
    if (collection.length === 0) return null;
    let allMessages = collection.map((arr) =>
        createSysexMessageFromConfig(arr),
    );
    /*.map((arr) =>
        arr.map((v, i) => v / Object.entries(dx7Parameters)[i][1].max),
    );*/

    console.log(allMessages);
    const response = await fetch("http://localhost:3000/send_sysex_batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allMessages }),
    });

    if (response.ok) {
        const response = await doAnalysis(collection)

        if (response.ok) {
            console.log("Finished analysis");
        } else {
            alert("Failed to do hrps.");
        }
        console.log("Rendering done!");
    } else {
        alert("Failed to trigger rendering.");
    }
    return response
}