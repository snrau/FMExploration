import express from "express";
import * as fs from "fs";
import { exec } from "child_process";
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

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});