# Virtual Env

Create a virtual environment:
1. Go to the folder src/nodeserver:
`python -m venv signal`
2. Activate the env:
`signal\Scripts\activate`
3. Install dependencies:
`pip install -r requirements.txt`
4. `Deactivate`

# LoopMidi
Install LoopMidi (https://www.tobias-erichsen.de/software/loopmidi.html) 
create two virtual Ports:
`loopMIDI Port` and `loopMIDI Port 1`

# Reaper 
Install reaper and find the path to its exe. 
copy this path to the variable `reaperPath` in the file server.js line 10.
Also copy the file `dkjson.lua`from "vibefm/src/luaScript" next to the "reaper.exe".

Open Reaper a single time to set preferences:
open Options -> Preference 
Goto MIDI Inputs and tick 'input', 'all' and 'control' for both loopMIDI ports
Goto MIDI Outputs and tick 'enable' for both loopMIDI ports

Apply and close reaper again.

# dexed
Install the standalone version of Dexed (https://asb2m10.github.io/dexed/).
go to options -> Active Midi inputs -> the "loopMIDI Port" has to be ticked, the other not

# Project 
Go to vibefm in console. 
Once: `npm install .` and create three folders in the 'public' directory named 'sampled', 'reference' and 'upload'.

Then each time to start the project:
Start the project `npm run dev`

Open the link in a browser.

Open a second cmd and run `npm run server` also from the vibefm directory


# Functions

1.  multi exclude: press `b` and brush the points to exclude
2.  Interpolation: select a point, press `ctrl` and select the other point, drag the handle
3.  Zoom + Pan: press `alt` and drag or zoom
