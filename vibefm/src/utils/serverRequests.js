import { get } from "svelte/store";
import { createSysexMessageFromConfig } from "./dexed";
import { startingIndex } from "./stores";
import { getNamefromConfig, getShortNamefromConfig } from "./sysex";

export async function doAnalysis(collection, startindex, name = "", sysex = true) {

    const response = await fetch("http://localhost:3000/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            path: "..\\..\\public\\sampled",
            path2: "..\\..\\public\\reference",
            configs: collection,
            startindex: startindex,
            name: name,
            sysex: sysex
        }),
    });

    if (response.ok) {
        if (startindex !== -28) {
            exportMFCC(startindex)
        }
        if (response.ok) {
            console.log("analysis done");
        }
    } else {
        alert("Failed to do hrps.");
    }
    return response
}

export async function refMel(name) {
    console.log("refMel called")
    const response = fetch("http://localhost:3000/refMel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            path: "..\\..\\public\\reference",
            name: name,
        }),
    });
}

export async function addReference(config, sysex) {
    let name = getShortNamefromConfig(config)

    const response = await fetch("http://localhost:3000/addReference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            path: "..\\..\\public\\reference",
            config: createSysexMessageFromConfig(config),
            name: name,
        }),
    });


    if (response.ok) {
        const response1 = await doAnalysis([config], -28, name, sysex)
            .then(v => {
                console.log(name, "added to reference")
                refMel(name)
                return name
            })
        return response1
    } else {
        alert("Failed to do hrps.");
    }

}

export async function exportMFCC(start) {
    const response = await fetch("http://localhost:3000/exportMFCC", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            path: "..\\..\\public\\sampled",
            start: start,
        }),
    });

    if (response.ok) {
        console.log("mfcc done");
    } else {
        alert("Failed to do mfcc.");
    }
    return response
}

export async function distanceMatrix() {
    try {
        const response = await fetch("http://localhost:3000/distanceMatrix", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                sampled: "..\\..\\public\\sampled",
                ref: "..\\..\\public\\reference",
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

export async function readSpecificFile(folderName, fileName) {
    try {
        const response = await fetch("http://localhost:3000/readSpecificFile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filePath: "..\\..\\public\\" + folderName, fileName }),
        });

        if (!response.ok) {
            throw new Error("Network response was not ok " + response.statusText);
        }

        const jsonObject = await response.json();
        console.log("Received JSON Object:", jsonObject);
        return jsonObject;

    } catch (err) {
        console.error("Error fetching data:", err);
    }
}

export async function readRef() {
    try {
        const response = await fetch("http://localhost:3000/readRef", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                sampled: "..\\..\\public\\sampled",
                ref: "..\\..\\public\\reference",
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


        while (!done) {
            const { value, done: streamDone } = await reader.read();
            done = streamDone;
            // Decode the chunk and append to the buffer
            buffer += decoder.decode(value, { stream: true });

            // Process complete JSON objects from the buffer
            let openingBracketIndex = buffer.indexOf('{');
            let closingBracketIndex;

            while (
                openingBracketIndex !== -1
            ) {

                const configStartIndex = buffer.indexOf('"config"', openingBracketIndex);

                if (done) {
                    const jsonString = buffer.slice(openingBracketIndex, buffer.length - 1);
                    const jsonObject = JSON.parse(jsonString);
                    console.log("Received JSON Object:", jsonObject);
                    parsedData.push(jsonObject)
                    break
                }

                if (configStartIndex === -1) {
                    // If "config" key is not found, break out of the loop since we're incomplete
                    break;
                }

                // Find the closing bracket for the JSON object after finding "config"
                closingBracketIndex = buffer.indexOf('},{"config"', configStartIndex);

                if (closingBracketIndex === -1) {
                    // If no closing bracket is found, break out of the loop, the object is incomplete
                    break;
                }
                const jsonString = buffer.slice(openingBracketIndex, closingBracketIndex + 1);

                try {
                    const jsonObject = JSON.parse(jsonString);
                    console.log("Received JSON Object:", jsonObject);
                    parsedData.push(jsonObject)

                    // Clear processed data from the buffer
                    buffer = buffer.slice(closingBracketIndex + 1);
                } catch (error) {
                    // Ignore incomplete JSON fragments
                    console.log(error)
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

export async function readEdges() {
    try {
        const response = await fetch("http://localhost:3000/readEdges", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                edges: "..\\..\\public\\connection.json",
            }),
        }).then(v => {
            return v.json()
        }).then(v => {
            return v
        })


    } catch (err) {
        console.error("Error fetching data:", err);
    }
}

export async function readSampled() {
    try {
        const response = await fetch("http://localhost:3000/readData", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                sampled: "..\\..\\public\\sampled",
                ref: "..\\..\\public\\reference",
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
                openingBracketIndex !== -1
            ) {

                const configStartIndex = buffer.indexOf('"config"', openingBracketIndex);

                if (done) {
                    const jsonString = buffer.slice(openingBracketIndex, buffer.length - 1);
                    const jsonObject = JSON.parse(jsonString);
                    console.log("Received JSON Object:", jsonObject);
                    parsedData.push(jsonObject)
                    break
                }

                if (configStartIndex === -1) {
                    // If "config" key is not found, break out of the loop since we're incomplete
                    break;
                }

                // Find the closing bracket for the JSON object after finding "config"
                closingBracketIndex = buffer.indexOf('},{"config"', configStartIndex);

                if (closingBracketIndex === -1) {
                    // If no closing bracket is found, break out of the loop, the object is incomplete
                    break;
                }
                const jsonString = buffer.slice(openingBracketIndex, closingBracketIndex + 1);

                try {
                    const jsonObject = JSON.parse(jsonString);
                    console.log("Received JSON Object:", jsonObject);
                    parsedData.push(jsonObject)

                    // Clear processed data from the buffer
                    buffer = buffer.slice(closingBracketIndex + 1);
                } catch (error) {
                    // Ignore incomplete JSON fragments
                    console.log(error)
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



export async function writeEdges(point, newConfigs, startingIndex) {

    if (newConfigs.length === 0) return null;

    let temp = []

    for (let i = startingIndex; i < startingIndex + newConfigs.length; i++) {
        temp.push("patch_" + i)
    }


    // {selectedpoint.filename: [newname, ...], ...} (newname is 'patch_' + (startindex + i))
    const response = await fetch("http://localhost:3000/writeEdges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ point: point.label, array: temp, edges: "..\\..\\public\\connection.json", }),
    });

    if (response.ok) {

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

export async function sendReaper(collection) {
    if (collection.length === 0) return null;
    let allMessages = collection.map((arr) =>
        createSysexMessageFromConfig(arr),
    );
    /*.map((arr) =>
        arr.map((v, i) => v / Object.entries(dx7Parameters)[i][1].max),
    );*/

    const response = await fetch("http://localhost:3000/send_sysex_batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allMessages }),
    });

    if (response.ok) {
        const response = await doAnalysis(collection, get(startingIndex), "", true)

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


export async function uploadWav(file) {
    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await fetch("http://localhost:3000/upload", {
            method: "POST",
            body: formData // No need to set headers, browser sets them automatically
        })

        const result = await response.json()
        console.log(result);
        return result


    } catch (error) {
        console.error("Upload failed:", error);
    }
}