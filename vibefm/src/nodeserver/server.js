import express from "express";
import * as fs from "fs";
import { exec, spawn } from "child_process";
import cors from 'cors'
import { euclidean } from "ml-distance";


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
        const pythonProcess = spawn(pythonExecutable, ['analysis.py', req.body.path, JSON.stringify(wavFiles), JSON.stringify(wavFiles.map(file => file.replace(".wav", ".json"))), req.body.configs]);

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
                let totalDistance = euclidean(mfcc1, mfcc2);

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