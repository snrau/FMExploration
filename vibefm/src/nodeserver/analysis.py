import sys, os
import librosa.display
import librosa.feature
import ast
from hrps import hrps
import json
import numpy as np
import matplotlib.pyplot as plt

def convert_ndarray_to_list(data):
    """
    Recursively convert all NumPy ndarrays in a data structure to Python lists.
    """
    if isinstance(data, np.ndarray):
        return [convert_ndarray_to_list(item) for item in data.tolist()]
    elif isinstance(data, list):
        return [convert_ndarray_to_list(item) for item in data]
    elif isinstance(data, dict):
        return {key: convert_ndarray_to_list(value) for key, value in data.items()}
    elif isinstance(data, complex):
        return str(data)
    else:
        return data  # Return the value as-is if it's not an ndarray
    


def main():
    path = sys.argv[1]
    configs = json.loads(sys.argv[4])

    count = 0

    print(f"{json.loads(sys.argv[2])}", file=sys.stderr)

    for wavFile in json.loads(sys.argv[2]):
        index = int(wavFile.split("_")[1].split(".w")[0])
        print(f"{index}", file=sys.stderr)
        input = os.path.join(path, wavFile)
        output = os.path.join(path, input.replace('.wav', '.json'))

        data = {}

        # HRPS
        fn_wav = input
        Fs = 22050
        x, Fs = librosa.load(fn_wav, sr=Fs)
        N = 1024
        H = 512
        L_h_sec = 0.2
        L_p_Hz = 500
        beta = 2
        x_h, x_p, x_r, D = hrps(x, Fs=Fs, N=N, H=H, 
                                L_h=L_h_sec, L_p=L_p_Hz, beta=beta, detail=True)
        
        data["harmonic"] = x_h 
        data["percussive"]= x_p
        data["residual"]= x_r#, "details": D}

        ### spectral_centroid
        ### how does the input has to look like? look at the documentation
        data["centroid_frequencies"] = librosa.feature.spectral_centroid(y=x, sr=Fs, n_fft=N, win_length=N, hop_length=H, center=True, pad_mode='constant')

        ### RMS

        ### input similar to spectral_centroid
        data["rms"] = librosa.feature.rms(y=x, hop_length=H, center=True, pad_mode='constant')

        ### STFT

        ### input similar to above?.
        ### use abs for magnitude and angle for phase but check what that means and what we need actually
        stft = librosa.stft(x, n_fft=N, hop_length=H, win_length=N, window='hann', center=True, pad_mode='constant')
        data["stft"] = stft
        data["stft_magnitude"] = np.abs(stft)
        data["stft_phase"] = np.angle(stft)

        ### mfcc
        mfcc = librosa.feature.mfcc(y=x, sr=Fs, n_fft=N, hop_length=H, win_length=N, window='hann', center=True, pad_mode='constant')
        data["mfcc"] = mfcc

        mel = librosa.feature.melspectrogram(y=x, sr=Fs, n_mels=128, fmax=8000)
        data['mel'] = mel
        

        data["config"] = configs[index]

        data_cleaned = convert_ndarray_to_list(data)
        try:
            # Write JSON data to the file with pretty formatting
            with open(output, 'w', encoding='utf-8') as file:
                json.dump(data_cleaned, file, ensure_ascii=False, indent=4)
            print(f"JSON written - {count + 1} of {len(json.loads(sys.argv[2]))} done", file=sys.stderr)

        except Exception as e:
            print(f"Failed to write JSON to file: {e}", file=sys.stderr)
            sys.exit(1)
        
        count += 1

if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(1)
    main()
    