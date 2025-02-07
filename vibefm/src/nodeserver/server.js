import express from "express";
import * as fs from "fs";
import { exec, spawn } from "child_process";
import cors from 'cors'
import path from "path";



const app = express();
const PORT = 3000;

app.use(cors());

app.use(express.json({ limit: '200mb' }));
app.use(express.raw({ type: "audio/wav", limit: "50mb" }));

function getNamefromConfig(config) {
    return config
        .slice(145, 155)
        .map((code) => String.fromCharCode(code))
        .join("")
}


// @ts-ignore
app.post("/send_sysex_batch", (req, res) => {
    const sysexArray = req.body.allMessages;

    if (!sysexArray || !Array.isArray(sysexArray)) {
        return res.status(400).send("Invalid SysEx data.");
    }

    // Save SysEx array to a JSON file
    const sysexPath = "../luaScript/sysex_batch.json";
    fs.writeFileSync(sysexPath, JSON.stringify(sysexArray, null, 2));

    fs.readdir("..\\..\\public\\sampled", (err, files) => {
        if (err) {
            return res.status(500).json({ error: "Failed to read directory" });
        }

        // Filter .wav files
        const startindex = files.filter(file => file.endsWith(".wav")).length
        startingIndex.set(startindex)

        // Trigger Reaper rendering script
        // REAPER:
        const reaperPath = `"C:\\Program Files\\REAPER (x64)\\reaper.exe"`
        const luaScriptPath = `"C:\\Users\\rausn\\Documents\\GitHub\\FMExploration\\vibefm\\src\\luaScript\\render.lua"`
        exec(`${reaperPath} -nosplash -new -noactivate ${luaScriptPath} ${startindex}`, (error, stdout, stderr) => {
            if (error) {
                console.error("Error running Reaper script:", stderr);
                return res.status(500).send("Failed to trigger rendering.");
            }
            res.send("Rendering triggered successfully.");
        });
    })

});

function euclideanDistance(a, b) {
    return Math.hypot(...Object.keys(a).map(k => b[k] - a[k]));
}


app.post('/analysis', (req, res) => {

    let wavFiles = []
    const folderPath = req.body.path
    const folderPath2 = req.body.path2

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
    fs.readdir(folderPath2, (err, files) => {
        if (err) {
            return res.status(500).json({ error: "Failed to read directory" });
        }

        // Filter .wav files
        wavFiles = files.filter(file => file.endsWith(".wav"));

        // Path to the Python executable within the virtual environment
        const pythonExecutable = './signal/Scripts/python.exe'; // Use './venv/Scripts/python.exe' on Windows


        // Spawn a Python process
        const pythonProcess = spawn(pythonExecutable, ['analysis.py', req.body.path2, JSON.stringify(wavFiles), JSON.stringify(wavFiles.map(file => file.replace(".wav", ".json"))), []]);

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

app.post('/exportMFCC', (req, res) => {

    let jsonFiles = []
    const folderPath = req.body.path

    fs.readdir(folderPath, (err, files) => {
        if (err) {
            return res.status(500).json({ error: "Failed to read directory" });
        }

        // Filter .wav files
        jsonFiles = files.filter(file => file.endsWith(".json"));

        // Path to the Python executable within the virtual environment
        const pythonExecutable = './signal/Scripts/python.exe'; // Use './venv/Scripts/python.exe' on Windows


        // Spawn a Python process
        const pythonProcess = spawn(pythonExecutable, ['mfcc.py', req.body.path, JSON.stringify(jsonFiles)]);

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
        const folderPath = req.body.sampled
        let files = fs.readdirSync(folderPath).filter(file => file.endsWith(".json"));

        /*
        const folderRef = req.body.ref
        const temp = fs.readdirSync(folderPath).filter(file => file.endsWith(".json"))
        if (temp.length > 0)
            files = files.concat(temp)
        */

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
                                    hrps: { harmonic: jsonObject.harmonic, residual: jsonObject.residual, percussive: jsonObject.percussive },
                                    centroid: jsonObject.centroid_frequencies,
                                    rms: jsonObject.rms,
                                    sampled: true,
                                    filename: file
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

app.post('/readRef', (req, res) => {
    try {
        const folderPath = req.body.ref
        let files = fs.readdirSync(folderPath).filter(file => file.endsWith(".json"));


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
                                    hrps: { harmonic: jsonObject.harmonic, residual: jsonObject.residual, percussive: jsonObject.percussive },
                                    centroid: jsonObject.centroid_frequencies,
                                    rms: jsonObject.rms,
                                    sampled: false,
                                    filename: file
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

app.post('/readEdges', (req, res) => {
    try {
        const file = req.body.edges

        res.setHeader("Content-Type", "application/json");

        fs.readFile(file, { encoding: "utf8" }, (err, data) => {
            if (err) {
                console.error(`Error reading file ${file}:`, err);
                res.status(500).send("Error reading file.");
                return;
            }

            try {
                const jsonData = JSON.parse(data);
                res.setHeader("Content-Type", "application/json");
                res.status(200).json(jsonData);
            } catch (parseErr) {
                res.status(500).json({ error: "Invalid JSON format" });
            }
        });



    } catch (err) {
        console.error("Error:", err.message);
        res.status(500).json({ error: err.message });
    }
})

app.post('/WriteEdges', (req, res) => {
    try {
        const file = req.body.edges
        const array = req.body.array
        const point = req.body.point

        fs.readFile(file, { encoding: "utf8" }, (err, data) => {
            if (err) {
                console.error(`Error reading file ${file}:`, err);
                return res.status(500).json({ error: "Error reading file" });
            }

            try {
                const jsonData = JSON.parse(data);

                // Ensure the target point exists in JSON
                if (!jsonData[point]) {
                    jsonData[point] = [];
                }

                // Convert existing values to a Set for quick lookup
                const existingSet = new Set(jsonData[point]);

                // Add only new values
                array.forEach(item => {
                    if (!existingSet.has(item)) {
                        existingSet.add(item);
                    }
                });

                // Convert Set back to an array
                jsonData[point] = Array.from(existingSet);

                // Write updated JSON back to file
                fs.writeFile(file, JSON.stringify(jsonData, null, 2), (writeErr) => {
                    if (writeErr) {
                        console.error(`Error writing file ${file}:`, writeErr);
                        return res.status(500).json({ error: "Error writing file" });
                    }

                    // Send updated data as response
                    res.status(200).json(jsonData);
                });

            } catch (parseErr) {
                console.error("JSON parse error:", parseErr);
                res.status(500).json({ error: "Invalid JSON format" });
            }
        });



    } catch (err) {
        console.error("Error:", err.message);
        res.status(500).json({ error: err.message });
    }
})

app.post('/distanceMatrix', (req, res) => {

    const mfccMatrices = [];
    const folderPath = req.body.sampled
    const folderReference = req.body.ref

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

        const filesRef = fs.readdirSync(folderReference).filter(file => file.endsWith(".json"));
        if (filesRef.length > 0) {
            for (const file of filesRef) {
                const filePath = `${filesRef}/${file}`;
                const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
                if (data.mfcc) {
                    mfccMatrices.push(data.mfcc.flat());
                } else {
                    throw new Error(`The key "mfcc" is not found in the JSON file: ${file}`);
                }
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


app.post('/addReference', (req, res) => {

    const folderPath = req.body.path
    const sysexArray = [req.body.config]

    if (!sysexArray || !Array.isArray(sysexArray)) {
        return res.status(400).send("Invalid SysEx data.");
    }

    // Save SysEx array to a JSON file
    const sysexPath = "../luaScript/sysex_batch.json";
    fs.writeFileSync(sysexPath, JSON.stringify(sysexArray, null, 2));


    // Trigger Reaper rendering script
    // REAPER:
    const reaperPath = `"C:\\Program Files\\REAPER (x64)\\reaper.exe"`
    const luaScriptPath = `"C:\\Users\\rausn\\Documents\\GitHub\\FMExploration\\vibefm\\src\\luaScript\\renderRef.lua"`
    exec(`${reaperPath} -nosplash -new -noactivate ${luaScriptPath}`, (error, stdout, stderr) => {
        if (error) {
            console.error("Error running Reaper script:", stderr);
            return res.status(500).send("Failed to trigger rendering.");
        }
        res.send("Rendering triggered successfully.");

        const name = getNamefromConfig(sysexArray[0])

        const outputFilePath = path.join(folderPath, name + ".wav"); // Adjust file path

        const checkFileExists = setInterval(() => {
            if (fs.existsSync(outputFilePath)) {
                clearInterval(checkFileExists); // Stop checking
                console.log("Rendering complete. Proceeding to next step...");

                // **Step 2: Trigger the next action**
                refAnalysis(folderPath, name, sysexArray, res);

                res.send("Rendering completed successfully. Next step triggered.");
            }
        }, 3000); // Check every 3 seconds
    });
})


function refAnalysis(folderPath, name, configs, res) {
    fs.readdir(folderPath, (err, files) => {
        if (err) {
            return res.status(500).json({ error: "Failed to read directory" });
        }

        // Filter .wav files
        const wavFiles = files.filter(file => file.endsWith(name + ".wav"));

        // Path to the Python executable within the virtual environment
        const pythonExecutable = './signal/Scripts/python.exe'; // Use './venv/Scripts/python.exe' on Windows


        // Spawn a Python process
        const pythonProcess = spawn(pythonExecutable, ['analysis.py', folderPath, JSON.stringify(wavFiles), JSON.stringify(wavFiles.map(file => file.replace(".wav", ".json"))), JSON.stringify(configs)]);

        // Capture output from the Python script
        pythonProcess.stdout.on('data', (data) => {
            console.log(data)
        });

        pythonProcess.stderr.on('data', (error) => {
            console.error(`${error}`);
        });

        pythonProcess.on('close', (code) => {
            if (code === 0) {
                refMel(folderPath, name, res)
                return res.status(200).send("done"); // Send the result back to the client
            } else {
                return res.status(500).send('Python script execution failed');
            }
        });
    });

}

function refMel(folderPath, name, res) {
    // Filter .wav files
    let jsonFiles = [name + ".json"];

    // Path to the Python executable within the virtual environment
    const pythonExecutable = './signal/Scripts/python.exe'; // Use './venv/Scripts/python.exe' on Windows


    // Spawn a Python process
    const pythonProcess = spawn(pythonExecutable, ['mfcc.py', folderPath, JSON.stringify(jsonFiles)]);

    // Capture output from the Python script
    pythonProcess.stdout.on('data', (data) => {
        console.log(data)
    });

    pythonProcess.stderr.on('data', (error) => {
        console.error(`${error}`);
    });

    pythonProcess.on('close', (code) => {
        if (code === 0) {
            return res.status(200).send("done"); // Send the result back to the client
        } else {
            return res.status(500).send('Python script execution failed');
        }
    });
}

// Upload route
app.post("/upload", (req, res) => {
    if (!req.body) return res.status(400).json({ error: "No file uploaded" });

    const path = "..\\..\\public\\output"
    const filePath = `${path}/upload.wav`

    // Write the received file to the fixed path
    fs.writeFile(filePath, req.body, (err) => {
        if (err) {
            return res.status(500).json({ error: "File saving failed" });
        }

        console.log("File saved at:", filePath);
        res.json({ message: "File uploaded successfully", path: filePath });

        refAnalysis(path, 'upload.wav', [], res)
    });



});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});