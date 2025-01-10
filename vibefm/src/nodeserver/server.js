import express from "express";
import * as fs from "fs";
import { exec, spawn } from "child_process";
import cors from 'cors'

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


app.post('/hrps', (req, res) => {

    // Path to the Python executable within the virtual environment
    const pythonExecutable = './signal/Scripts/python.exe'; // Use './venv/Scripts/python.exe' on Windows


    // Spawn a Python process
    const pythonProcess = spawn(pythonExecutable, ['analysis.py', req.body.path, req.body.inputFile, req.body.outputFile]);

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
})

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});