import express from "express";
import * as fs from "fs";
import { exec, spawn } from "child_process";
import cors from 'cors'
import path from "path";
import { startingIndex } from "../utils/stores.js";
import multer from 'multer'


const reaperPath = `"C:\\Program Files\\REAPER (x64)\\reaper.exe"`



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

    let startindex = 0

    fs.readdir("..\\..\\public\\sampled", (err, files) => {
        // Filter .wav files
        startindex = files.filter(file => file.endsWith(".json")).length
        startingIndex.set(startindex)


        // Save SysEx array to a JSON file
        const sysexPath = "../luaScript/sysex_batch.json";
        fs.writeFileSync(sysexPath, JSON.stringify([startindex, sysexArray], null, 2));

        if (err) {
            return res.status(500).json({ error: "Failed to read directory" });
        }



        const baseDir = path.resolve(process.cwd(), '..');
        // Trigger Reaper rendering script
        // REAPER:
        const luaScriptPath = path.join(baseDir, 'luaScript', 'render.lua');

        exec(`${reaperPath} -nosplash -new -noactivate ${luaScriptPath}`, (error, stdout, stderr) => {
            if (error) {
                console.error("Error running Reaper script:", stderr, error);
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
    const startindex = req.body.startindex
    const name = req.body.name
    const sysex = req.body.sysex

    if (startindex !== -28) {

        fs.readdir(folderPath, (err, files) => {
            if (err) {
                return res.status(500).json({ error: "Failed to read directory" });
            }

            // Filter .wav files
            wavFiles = files.filter(file => file.endsWith(".wav"))

            wavFiles = wavFiles.filter((f, i) => parseInt(f.split('_')[1].split('.wav')[0]) >= startindex)

            console.log(wavFiles)

            // Path to the Python executable within the virtual environment
            const pythonExecutable = './signal/Scripts/python.exe'; // Use './venv/Scripts/python.exe' on Windows


            // Spawn a Python process
            const pythonProcess = spawn(pythonExecutable, ['analysis.py', req.body.path, JSON.stringify(wavFiles), JSON.stringify(wavFiles.map(file => file.replace(".wav", ".json"))), JSON.stringify(req.body.configs), false, startindex]);

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
    } else {
        fs.readdir(folderPath2, (err, files) => {
            if (err) {
                return res.status(500).json({ error: "Failed to read directory" });
            }

            // Filter .wav files
            wavFiles = files.filter(file => file.endsWith(name + ".wav"));

            // Path to the Python executable within the virtual environment
            const pythonExecutable = './signal/Scripts/python.exe'; // Use './venv/Scripts/python.exe' on Windows

            // Spawn a Python process
            const pythonProcess = spawn(pythonExecutable, ['analysis.py', req.body.path2, JSON.stringify(wavFiles), JSON.stringify(wavFiles.map(file => file.replace(".wav", ".json"))), JSON.stringify(req.body.configs), sysex, startindex]);

            // Capture output from the Python script
            pythonProcess.stdout.on('data', (data) => {
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
    }
})

app.post('/exportMFCC', (req, res) => {

    let jsonFiles = []
    const folderPath = req.body.path
    const start = req.body.start

    fs.readdir(folderPath, (err, files) => {
        if (err) {
            return res.status(500).json({ error: "Failed to read directory" });
        }

        // Filter .wav files
        jsonFiles = files.filter(file => file.endsWith(".json") && parseInt(file.split('_')[1].split('.json')[0]) >= start);

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
                                    reference: false,
                                    sysex: false,
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

app.post('/readSpecificFile', (req, res) => {
    try {
        const folderPath = req.body.filePath;
        const fileName = req.body.fileName;

        const filePath = `${folderPath}/${fileName}`

        // Read the specified file
        fs.readFile(filePath, { encoding: "utf8" }, (err, buffer) => {
            if (err) {
                console.error(`Error reading file ${filePath}:`, err);
                res.status(500).send("Error reading file.");
                return;
            }

            try {
                const jsonObject = JSON.parse(buffer);
                const responseObject = {
                    config: jsonObject.config,
                    mfcc: jsonObject.mfcc,
                    hrps: { harmonic: jsonObject.harmonic, residual: jsonObject.residual, percussive: jsonObject.percussive },
                    centroid: jsonObject.centroid_frequencies,
                    rms: jsonObject.rms,
                    sampled: folderPath.includes("sampled") ? true : false,
                    reference: folderPath.includes("reference") ? true : false,
                    sysex: jsonObject.sysex,
                    filename: fileName
                };

                res.setHeader("Content-Type", "application/json");
                res.json(responseObject);
            } catch (error) {
                console.error(`Error parsing JSON from file ${filePath}:`, error);
                res.status(500).send("Error parsing JSON.");
            }
        });
    } catch (err) {
        console.error("Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

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
                                    reference: true,
                                    sysex: jsonObject.sysex,
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
                    jsonData[item] = jsonData[item] || [];
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
    const withRef = req.body.withRef


    try {
        const files = fs.readdirSync(folderPath).filter(file => file.endsWith(".json"));
        let refFiles = []
        if (withRef) 
            refFiles = fs.readdirSync(folderReference).filter(file => file.endsWith(".json"));
        if (files.length + refFiles.length < 2) {
            return res.json([[0,1],[1,0]])
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

        if (withRef) {
            const files = fs.readdirSync(folderReference).filter(file => file.endsWith(".json"));

            for (const file of files) {
                const filePath = `${folderReference}/${file}`;
                const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
                if (data.mfcc) {
                    mfccMatrices.push(data.mfcc.flat());
                } else {
                    throw new Error(`The key "mfcc" is not found in the JSON file: ${file}`);
                }
            }
        }

        /*
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
        */


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
    const name = req.body.name


    const filePath = `${folderPath}/${name}.wav`;

    if (fs.existsSync(filePath)) {
        console.log('exists')
        return res.send("File already exists");
    }

    if (!sysexArray || !Array.isArray(sysexArray)) {
        return res.status(400).send("Invalid SysEx data.");
    }


    // Save SysEx array to a JSON file
    const sysexPath = "../luaScript/sysex_batch.json";
    fs.writeFileSync(sysexPath, JSON.stringify(sysexArray[0], null, 2));


    // Trigger Reaper rendering script
    // REAPER:
    //const reaperPath = `"C:\\Program Files\\REAPER (x64)\\reaper.exe"`
    //const luaScriptPath = `"C:\\Users\\rausn\\Documents\\GitHub\\FMExploration\\vibefm\\src\\luaScript\\renderRef.lua"`
    const baseDir = path.resolve(process.cwd(), '..');
    // Trigger Reaper rendering script
    // REAPER:

    const luaScriptPath = path.join(baseDir, 'luaScript', 'renderRef.lua');
    exec(`${reaperPath} -nosplash -new -noactivate ${luaScriptPath}`, (error, stdout, stderr) => {
        if (error) {
            console.error("Error running Reaper script:", stderr);
            return res.status(500).send("Failed to trigger rendering.");
        }
        console.log("after reaper")
        res.send("Rendering triggered successfully.");

        /*
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
        */
    });
})


async function refAnalysis(folderPath, name, configs, res) {
    fs.readdir(folderPath, (err, files) => {
        if (err) {
            return res.status(500).json({ error: "Failed to read directory" });
        }

        // Filter .wav files
        const wavFiles = files.filter(file => file.endsWith(name + ".wav"));

        // Path to the Python executable within the virtual environment
        const pythonExecutable = './signal/Scripts/python.exe'; // Use './venv/Scripts/python.exe' on Windows


        // Spawn a Python process
        const pythonProcess = spawn(pythonExecutable, ['analysis.py', folderPath, JSON.stringify(wavFiles), JSON.stringify(wavFiles.map(file => file.replace(".wav", ".json"))), JSON.stringify(configs), true, 0]);

        // Capture output from the Python script
        pythonProcess.stdout.on('data', (data) => {
            console.log(data)
        });

        pythonProcess.stderr.on('data', (error) => {
            console.error(`${error}`);
        });

        pythonProcess.on('close', (code) => {
            console.log("analysis closed")
            if (code === 0) {
                refMel(folderPath, name, res)
                return res.status(200).send("done"); // Send the result back to the client
            } else {
                return res.status(500).send('Python script execution failed');
            }
        });
    });

}


app.post('/refMel', (req, res) => {
    const folderPath = req.body.path
    const name = req.body.name
    refMel(folderPath, name, res)
})

async function refMel(folderPath, name, res) {
    // Filter .wav files
    let jsonFiles = [name + ".json"];

    // Path to the Python executable within the virtual environment
    const pythonExecutable = './signal/Scripts/python.exe'; // Use './venv/Scripts/python.exe' on Windows


    // Spawn a Python process
    const pythonProcess = spawn(pythonExecutable, ['mfcc.py', folderPath, JSON.stringify(jsonFiles)]);

    // Capture output from the Python script
    pythonProcess.stdout.on('data', (data) => {
    });

    pythonProcess.stderr.on('data', (error) => {
        console.error(`${error}`);
    });

    pythonProcess.on('close', (code) => {
        if (code === 0) {
            console.log("RefMel closed")
            return res.status(200).send("done"); // Send the result back to the client
        } else {
            return res.status(500).send('Python script execution failed');
        }
    });
}


function wavAnalysis(folderPath, name, configs) {
    console.log(name)
    return new Promise((resolve, reject) => {
        fs.readdir(folderPath, (err, files) => {
            if (err) {
                reject()
            }

            // Filter .wav files
            const wavFiles = files.filter(file => file.endsWith(name + ".wav"));

            // Path to the Python executable within the virtual environment
            const pythonExecutable = './signal/Scripts/python.exe'; // Use './venv/Scripts/python.exe' on Windows

            // Spawn a Python process
            const pythonProcess = spawn(pythonExecutable, ['analysis.py', folderPath, JSON.stringify(wavFiles), JSON.stringify(wavFiles.map(file => file.replace(".wav", ".json"))), JSON.stringify(configs), false, 0]);

            // Capture output from the Python script
            pythonProcess.stdout.on('data', (data) => {
            });

            pythonProcess.stderr.on('data', (error) => {
                console.error(`${error}`);
            });

            pythonProcess.on('close', (code) => {
                console.log("analysis closed")
                if (code === 0) {
                    resolve()
                } else {
                    reject()
                }

            });
        });
    })

}

function wavMel(folderPath, name) {
    return new Promise((resolve, reject) => {
        // Filter .wav files
        let jsonFiles = [name + ".json"];

        // Path to the Python executable within the virtual environment
        const pythonExecutable = './signal/Scripts/python.exe'; // Use './venv/Scripts/python.exe' on Windows


        // Spawn a Python process
        const pythonProcess = spawn(pythonExecutable, ['mfcc.py', folderPath, JSON.stringify(jsonFiles)]);

        // Capture output from the Python script
        pythonProcess.stdout.on('data', (data) => {
        });

        pythonProcess.stderr.on('data', (error) => {
            console.error(`${error}`);
        });

        pythonProcess.on('close', (code) => {
            if (code === 0) {
                resolve()
            } else {
                reject()
            }

        });
    })
}

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join("..", "..", "public", "upload");
        if (!fs.existsSync(uploadPath)) {
            console.log(uploadPath)
            //fs.mkdirSync(uploadPath, { recursive: true }); // Create folder if it doesn't exist
        }
        console.log(uploadPath)
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); // Keep original filename
    }
});

const upload = multer({ storage: storage });

// Upload route
app.post("/upload", upload.single("file"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }
    console.log("do analysis")
    wavAnalysis(path.join("..", "..", "public", "upload"), req.file.filename.split('.')[0], []).then(v => {
        wavMel(path.join("..", "..", "public", "upload"), req.file.filename.split('.')[0]).then(v => {
            const file = req.file.filename.split('.')[0] + ".json"
            console.log(file)
            // Step 3: Read the JSON output file
            fs.readFile(`../../public/upload/${file}`, "utf-8", (err, jsonData) => {


                // Step 4: Parse JSON and extract required values
                const jsonObject = JSON.parse(jsonData);

                const objects = [{
                    config: null,
                    mfcc: jsonObject.mfcc,
                    hrps: {
                        harmonic: jsonObject.harmonic,
                        residual: jsonObject.residual,
                        percussive: jsonObject.percussive
                    },
                    centroid: jsonObject.centroid_frequencies,
                    rms: jsonObject.rms,
                    sampled: false,
                    reference: false,
                    sysex: false,
                    filename: req.file.filename
                }];

                // Step 5: Respond with extracted data
                res.json(objects);
            });

        })
    })

});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});