-- Paths
--local sysex_file = "C:\\Users\\rausn\\Documents\\GitHub\\FMExploration\\vibefm\\src\\luaScript\\sysex_batch.json"  -- JSON file written by Node.js
--local midi_path = "C:\\Users\\rausn\\Documents\\GitHub\\FMExploration\\vibefm\\src\\luaScript\\c4.mid"     -- MIDI file for playback
--local output_dir = "C:\\Users\\rausn\\Documents\\GitHub\\FMExploration\\vibefm\\public\\sampled\\"          -- Output folder for WAV files

local script_path = debug.getinfo(1, "S").source:match("@(.*)"):gsub("\\", "/")
local base_dir = script_path:match("(.*/)")
base_dir = base_dir:match("(.*/).*/.*/") -- Go two levels up

reaper.ShowConsoleMsg(base_dir .. '\n')

local sysex_file = base_dir .. "/src/luaScript/sysex_batch.json"  -- JSON file written by Node.js
local midi_path = base_dir .. "/src/luaScript/c4.mid"             -- MIDI file for playback
local output_dir = base_dir .. "/public/sampled/"               -- Output folder for WAV files

local midi_port = "loopMIDI Port 1"

local json = require("dkjson")


-- Load SysEx data from JSON file
local function load_sysex_data()
    local file = io.open(sysex_file, "r")
    if not file then
        reaper.ShowMessageBox("SysEx file not found.", "Error", 0)
        return nil
    end

    local content = file:read("*all")
    file:close()
    return json.decode(content)
end

function debug_sysex_events(take)
    if not take then
        reaper.ShowConsoleMsg("No MIDI take found.\n")
        return
    end

    local retval, midiString = reaper.MIDI_GetAllEvts(take, "")
    if retval then
        reaper.ShowConsoleMsg("MIDI Events in take: " .. midiString .. "\n")
    else
        reaper.ShowConsoleMsg("Failed to retrieve MIDI events.\n")
    end

    local _, midiEventsCount = reaper.MIDI_CountEvts(take)
    reaper.ShowConsoleMsg("Number of MIDI events: " .. tostring(midiEventsCount) .. "\n")

    for i = 0, midiEventsCount - 1 do
        local retval, _, _, ppqpos, eventType, sysexString = 
            reaper.MIDI_GetTextSysexEvt(take, i)
        
        if retval and eventType == -1 then -- SysEx events have an eventType of -1
            reaper.ShowConsoleMsg("SysEx Event " .. i .. ": "  .. ppqpos .. ": " .. eventType .. ": " .. sysexString .. "\n")
        end
    end
end

function debug_track_info(track)
    if not track then
        reaper.ShowConsoleMsg("Track not found.\n")
        return
    end

    local retval, trackName = reaper.GetTrackName(track, "")
    local midiHwOut = reaper.GetMediaTrackInfo_Value(track, "I_MIDIHWOUT")
    local isArmed = reaper.GetMediaTrackInfo_Value(track, "I_RECARM") > 0
    --reaper.ShowConsoleMsg("Track Name: " .. trackName .. "\n")
    reaper.ShowConsoleMsg("MIDI Hardware Output num: Track: " .. tostring(midiHwOut) ..' OutputID: '.. tostring(midiOutId) .. "\n")
    local numMIDIOutputs = reaper.GetNumMIDIOutputs()
    for i = 0, numMIDIOutputs - 1 do
        local retval, name = reaper.GetMIDIOutputName(i, "")
        reaper.ShowConsoleMsg("MIDI Hardware Output: " .. name .. " -> ")
        if retval and midiOutId == i then
            reaper.ShowConsoleMsg("selected\n")
            break
        end
        reaper.ShowConsoleMsg("\n")
    end
    --reaper.ShowConsoleMsg("Track Armed for Recording: " .. tostring(isArmed) .. "\n")
end

function debug_track_items(track)
    local numItems = reaper.CountTrackMediaItems(track)
    reaper.ShowConsoleMsg("Number of media items on the track: " .. tostring(numItems) .. "\n")

    for i = 0, numItems - 1 do
        local item = reaper.GetTrackMediaItem(track, i)
        local pos = reaper.GetMediaItemInfo_Value(item, "D_POSITION")
        local length = reaper.GetMediaItemInfo_Value(item, "D_LENGTH")
        reaper.ShowConsoleMsg("Item " .. i .. ": Start = " .. pos .. ", Length = " .. length .. "\n")

        local take = reaper.GetTake(item, 0)
        if take then
            debug_sysex_events(take)
        else
            reaper.ShowConsoleMsg("No take found for item " .. i .. "\n")
        end
    end
end

function send_patch(sysex_data, index, track)

    --local item = reaper.AddMediaItemToTrack(track)
    --if not item then reaper.ShowConsoleMsg("Failed to create media item\n") end
    local item = reaper.CreateNewMIDIItemInProj(track, 0, 0.01, false) -- From 0 to 1 seconds, not selected
    if not item then reaper.ShowConsoleMsg("Failed to create MIDI item.\n") end

    --local take = reaper.AddTakeToMediaItem(item)
    local take = reaper.GetTake(item, 0)
    if not take then reaper.ShowConsoleMsg("Failed to create take\n") end
    if not reaper.TakeIsMIDI(take) then
        reaper.ShowConsoleMsg("The take is not a MIDI take.\n")
        return
    end
    
    reaper.MIDI_InsertNote(take, false, false, 0, 240, 0, 60, 100, false)

    -- needs some tests
    local start_time = 0  -- start from the beginning (0 seconds)
    local end_time = 10   -- extend to 10 seconds (adjust this as needed)
    reaper.SetMediaItemInfo_Value(item, "D_LENGTH", end_time - start_time)

    local success = reaper.MIDI_InsertTextSysexEvt(take, true, false, 0, -1, sysex_data)
    if not success then
        reaper.ShowConsoleMsg("Failed to insert SysEx message.\n")
    end
    
    --debug_track_info(track)
    --debug_track_items(track)
    --debug_sysex_events(take)

    reaper.SetEditCurPos(0, true, true)
    reaper.Main_OnCommand(40044, 0)

    return true
end


-- Render one patch
function render_patch(index)
    local output_wav =  "patch_" .. index .. ".wav"
    reaper.GetSetProjectInfo_String(0, "RENDER_FILE", output_dir, true)
    reaper.GetSetProjectInfo_String(0, "RENDER_PATTERN", output_wav, true)      
    -- Render
    reaper.Main_OnCommand(41824, 0) -- Render project to file
    return true
end

function convert_sysex(sysex)
    local sysexMessage = ''
    local hexMessage = ''
    for _, byte in ipairs(sysex) do
        if byte ~= 240 and byte ~= 247 then
            sysexMessage = sysexMessage .. string.char(byte)
            hexMessage = hexMessage .. string.format("%02X ", byte)
        end
    end
    --reaper.ShowConsoleMsg(hexMessage..'\n')
    return sysexMessage
end


-- Main execution
local read = load_sysex_data()
if read then
    local start = read[1]
    local sysex_data = read[2]
    if sysex_data then
        reaper.Main_OnCommand(40001, 0) -- Insert new track
        reciever = reaper.GetTrack(0, 0)    

        reaper.InsertMedia(midi_path, 0)

        reaper.Main_OnCommand(40001, 1) 
        local sender = reaper.GetTrack(0, 1)
        
        -- midi
        local numMIDIOutputs = reaper.GetNumMIDIOutputs()
        midiOutId = -1
        for i = 0, numMIDIOutputs - 1 do
            local retval, name = reaper.GetMIDIOutputName(i, "")
            if retval and name == midi_port then
                midiOutId = i
                break
            end
        end

        local numMIDIInputs = reaper.GetNumMIDIInputs()
        local midiInId = -1
        for i = 0, numMIDIInputs - 1 do
            local retval, name = reaper.GetMIDIInputName(i, "")
            if retval and name == midi_port then
                midiInId = i
                break
            end
        end
        --reaper.ShowConsoleMsg('Send: '..midiOutId..", Recieve: "..midiInId .. '\n')
        -- reciever
        reaper.SetMediaTrackInfo_Value(reciever, "I_RECARM", 1)
        reaper.SetMediaTrackInfo_Value(reciever, "I_RECMODE", 0)
        reaper.SetMediaTrackInfo_Value(reciever, "I_RECINPUT", 4096 + (midiInId * 32))
        local retval, dexed_fx = reaper.TrackFX_AddByName(reciever, "VST3i: Dexed (Digital Suburban)", false, -1)

        -- sender
        local midiHardwareOutputValue = (midiOutId << 5) | 0
        reaper.SetMediaTrackInfo_Value(sender, "I_MIDIHWOUT", midiHardwareOutputValue)

        value = true
        for index, sysex in ipairs(sysex_data) do
            --reaper.TrackFX_SetPreset(track, retval, 1)
            if value then
                local sysexstring = convert_sysex(sysex)
                value = send_patch(sysexstring, index - 1 + start, sender, receiver)
                if value then
                    value = render_patch(index - 1 + start, sysex)
                end
            end
        end
        if value then
            reaper.ShowConsoleMsg("Batch rendering completed!", "Success", 0)
            --reaper.Main_OnCommand(40860, 0)
            reaper.Main_OnCommand(40004, 0)
            return true
        else
            reaper.ShowConsoleMsg("Batch failed", "Error", 0)
            return false
        end
        
    end
end

--43 00 00 01 1B 22 49 26 1C 3A 15 0A 51 03 26 13 03 00 07 03 01 35 01 04 1C 0A 18 33 03 39 16 13 26 27 53 55 3F 00 03 01 00 04 28 00 1D 25 04 3F 09 29 41 1A 04 31 49 5F 35 36 01 02 04 02 00 17 01 01 10 0C 48 38 37 14 27 0A 31 3B 06 5F 08 00 00 03 00 04 32 00 1C 1F 0E 62 51 1A 2A 59 62 4D 38 11 3C 5F 02 00 03 02 04 20 01 00 63 02 63 20 02 34 1B 08 5B 4C 5C 5B 32 02 01 03 02 06 00 00 05 12 07 51 40 55 1A 05 47 22 5A 19 03 00 1D 26 2D 28 00 02 02 19 23 0E 38 11 76 32 01 13 3D 70 0F 65