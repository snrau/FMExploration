import express from "express";
import * as fs from "fs";
import { exec, spawn } from "child_process";
import cors from 'cors'
import * as JSONStream from 'JSONStream'



const app = express();
const PORT = 3000;

app.use(cors());

app.use(express.json({ limit: '200mb' }));

// @ts-ignore
app.post("/send_sysex_batch", (req, res) => {
    const sysexArray = req.body.allMessages;

    if (!sysexArray || !Array.isArray(sysexArray)) {
        return res.status(400).send("Invalid SysEx data.");
    }

    // Save SysEx array to a JSON file
    const sysexPath = "../luaScript/sysex_batch.json";
    fs.writeFileSync(sysexPath, JSON.stringify(sysexArray, null, 2));


    // Trigger Reaper rendering script
    // REAPER:
    const reaperPath = `"C:\\Program Files\\REAPER (x64)\\reaper.exe"`
    const luaScriptPath = `"C:\\Users\\rausn\\Documents\\GitHub\\FMExploration\\vibefm\\src\\luaScript\\render.lua"`
    exec(`${reaperPath} -nosplash -new -noactivate ${luaScriptPath}`, (error, stdout, stderr) => {
        if (error) {
            console.error("Error running Reaper script:", stderr);
            return res.status(500).send("Failed to trigger rendering.");
        }
        res.send("Rendering triggered successfully.");
    });

});

function euclideanDistance(a, b) {
    return Math.hypot(...Object.keys(a).map(k => b[k] - a[k]));
}


app.post('/analysis', (req, res) => {

    let wavFiles = []
    const folderPath = req.body.path

    fs.readdir(folderPath, (err, files) => {
        if (err) {
            return res.status(500).json({ error: "Failed to read directory" });
        }

        // Filter .wav files
        wavFiles = files.filter(file => file.endsWith(".wav"));

        // Path to the Python executable within the virtual environment
        const pythonExecutable = './signal/Scripts/python.exe'; // Use './venv/Scripts/python.exe' on Windows


        // Spawn a Python process
        const pythonProcess = spawn(pythonExecutable, ['analysis.py', req.body.path, JSON.stringify(wavFiles), JSON.stringify(wavFiles.map(file => file.replace(".wav", ".json"))), JSON.stringify(req.body.configs)]);

        // Capture output from the Python script
        pythonProcess.stdout.on('data', (data) => {
            console.log(data)
        });

        pythonProcess.stderr.on('data', (error) => {
            console.error(`${error}`);
        });

        pythonProcess.on('close', (code) => {
            if (code === 0) {
                res.status(200).send("done"); // Send the result back to the client
            } else {
                res.status(500).send('Python script execution failed');
            }
        });
    });
})

app.post('/readData', (req, res) => {
    try {
        const folderPath = req.body.path
        const files = fs.readdirSync(folderPath).filter(file => file.endsWith(".json"));


        /*
        // Read and parse each JSON file
        const dataList = [];
        for (const file of files) {
            const filePath = `${folderPath}/${file}`;
            const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
            dataList.push(data);
        }
        const ex = JSON.stringify(dataList)

        res.json(ex);
        */
        res.setHeader("Content-Type", "application/json");
        res.write("["); // Start the JSON array

        // Stream files one by one
        let isFirst = true;

        const processFile = (file, callback) => {
            const filePath = `${folderPath}/${file}`

            // Read the entire file into memory
            fs.readFile(filePath, { encoding: "utf8" }, (err, buffer) => {
                if (err) {
                    console.error(`Error reading file ${file}:`, err);
                    res.status(500).send("Error reading file.");
                    return;
                }

                try {
                    const objects = [];
                    let lastIndex = 0;

                    // Extract complete JSON objects from the buffer
                    for (let i = 0; i < buffer.length; i++) {
                        if (buffer[i] === "}") {
                            const jsonStr = buffer.slice(lastIndex, i + 1).trim();
                            lastIndex = i + 1;

                            try {
                                const jsonObject = JSON.parse(jsonStr);
                                objects.push({
                                    config: jsonObject.config,
                                    mfcc: jsonObject.mfcc,
                                });
                            } catch (e) {
                                console.error("Error parsing JSON fragment:", e);
                            }
                        }
                    }

                    // Process remaining buffer content if incomplete
                    buffer = buffer.slice(lastIndex).trim();

                    // Write extracted objects to the response
                    objects.forEach((obj) => {
                        if (!isFirst) res.write(",");
                        res.write(JSON.stringify(obj));
                        isFirst = false;
                    });

                    callback(); // Proceed to the next file
                } catch (error) {
                    console.error(`Error processing file ${file}:`, error);
                    res.status(500).send("Error processing file.");
                }
            });
        };
        /*
        const processFile = (file, callback) => {
            const filePath = `${folderPath}/${file}`
            const readStream = fs.createReadStream(filePath, { encoding: 'utf8' });

            let buffer = '';

            readStream.on('data', chunk => {
                buffer += chunk;

                if (buffer.includes("}")) {
                    const closingIndex = buffer.lastIndexOf("}");
                    const objects = buffer.slice(0, closingIndex + 1);
                    buffer = buffer.slice(closingIndex + 1);

                    objects.split("}{").forEach((obj, index) => {
                        const jsonObject = index > 0 ? `{${obj}` : obj;
                        const jsonString = JSON.stringify({ config: JSON.parse(jsonObject)['config'], mfcc: JSON.parse(jsonObject)['mfcc'] }) //JSON.stringify(JSON.parse(jsonObject));
                        if (!isFirst) res.write(",");
                        res.write(jsonString);
                        isFirst = false;
                    });
                }
            });

            readStream.on('end', () => {
                if (buffer.length > 0) {
                    const jsonObject = JSON.stringify(JSON.parse(buffer));
                    if (!isFirst) res.write(",");
                    const object = JSON.stringify({ config: jsonObject['config'], mfcc: jsonObject['mfcc'] })
                    res.write(object); // Write JSON object to response
                    console.log('written')
                    isFirst = false;
                }
                callback();
            });

            readStream.on('error', error => {
                console.error(`Error reading file ${file}:`, error);
                res.status(500).send('Error reading file.');
            });
        };
        */

        // Process files one by one to maintain order
        let currentFile = 0;
        const processNextFile = () => {
            if (currentFile < files.length) {
                processFile(files[currentFile], () => {
                    currentFile++;
                    processNextFile();
                });
            } else {
                console.log('end')
                res.write(']'); // End JSON array
                res.end(); // End response
            }
        };

        processNextFile();
    } catch (err) {
        console.error("Error:", err.message);
        res.status(500).json({ error: err.message });
    }
})

app.post('/distanceMatrix', (req, res) => {

    const mfccMatrices = [];
    const folderPath = req.body.path

    try {
        const files = fs.readdirSync(folderPath).filter(file => file.endsWith(".json"));
        if (files.length < 2) {
            return res.status(400).json({ error: "At least two JSON files are required for distance calculation." });
        }

        for (const file of files) {
            const filePath = `${folderPath}/${file}`;
            const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
            if (data.mfcc) {
                mfccMatrices.push(data.mfcc.flat());
            } else {
                throw new Error(`The key "mfcc" is not found in the JSON file: ${file}`);
            }
        }

        // Initialize the distance matrix
        const numFiles = mfccMatrices.length;
        const distanceMatrix = Array.from({ length: numFiles }, () => Array(numFiles).fill(0));

        // Calculate pairwise distances
        for (let i = 0; i < numFiles; i++) {
            for (let j = i + 1; j < numFiles; j++) {
                const mfcc1 = mfccMatrices[i]
                const mfcc2 = mfccMatrices[j]

                // Compute pairwise Euclidean distances and calculate the average distance
                let totalDistance = euclideanDistance(mfcc1, mfcc2);

                // Store the distance symmetrically
                distanceMatrix[i][j] = totalDistance;
                distanceMatrix[j][i] = totalDistance;
            }
        }

        res.json(distanceMatrix);
    } catch (err) {
        console.error("Error:", err.message);
        res.status(500).json({ error: err.message });
    }
})

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});