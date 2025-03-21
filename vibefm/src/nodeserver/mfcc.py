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

def plot_mfcc(mfcc, output_path):
    """
    Plot the MFCC matrix as a heatmap and save it as an image.
    """

    mfcc = np.array(mfcc)

    # Adjust figure size to achieve desired pixel dimensions
    dpi = 100  # Dots per inch (scaling factor)
    width_in_inches = 350 / dpi
    height_in_inches = 120 / dpi

    fig = plt.figure(figsize=(width_in_inches, height_in_inches), dpi=dpi)
    from matplotlib.gridspec import GridSpec

    gs = GridSpec(1, 8, figure=fig, wspace=0.1)
    ax = fig.add_subplot(gs[:, :-1])  # Heatmap on the left (7/8)
    cax = fig.add_subplot(gs[:, -1])  # Colorbar on the right (1/8)


    img = librosa.display.specshow(mfcc, sr=22050, cmap='coolwarm', ax=ax)
    colorbar = plt.colorbar(img, cax=cax, format='%+2.0f dB')
    colorbar.ax.tick_params(labelsize=6) 


     # Remove extra space around the plot
    ax.axis("off")  # Turn off axis for clean output

    # Save the plot as a PNG image
    image_path = output_path.replace(".json", "_mfcc.png")
    plt.savefig(image_path, dpi=dpi, bbox_inches="tight", pad_inches=0.1)
    plt.close()


def plot_mel(mel, output_path):
    """
    Plot the MFCC matrix as a heatmap and save it as an image.
    """

    mel = np.array(mel)

    # Adjust figure size to achieve desired pixel dimensions
    dpi = 100  # Dots per inch (scaling factor)
    width_in_inches = 350 / dpi
    height_in_inches = 120 / dpi

    fig = plt.figure(figsize=(width_in_inches, height_in_inches), dpi=dpi)
    from matplotlib.gridspec import GridSpec

    gs = GridSpec(1, 8, figure=fig, wspace=0.1)
    ax = fig.add_subplot(gs[:, :-1])  # Heatmap on the left (7/8)
    cax = fig.add_subplot(gs[:, -1])  # Colorbar on the right (1/8)

    mel_spectrogram_db = librosa.power_to_db(mel, ref=np.max)

    img = librosa.display.specshow(mel_spectrogram_db, x_axis='time', y_axis='mel', sr=22050, fmax=8000, ax=ax)
    colorbar = plt.colorbar(img, cax=cax, format='%+2.0f dB')
    colorbar.ax.tick_params(labelsize=6) 


     # Remove extra space around the plot
    # ax.axis("off")  # Turn off axis for clean output

    # Save the plot as a PNG image
    image_path = output_path.replace(".json", "_mel.png")
    plt.savefig(image_path, dpi=dpi, bbox_inches="tight", pad_inches=0.1)
    plt.close()


def plot_mel_glyph(mel, output_path):
    """
    Plot the MFCC matrix as a heatmap and save it as an image.
    """

    mel = np.array(mel)

    # Adjust figure size to achieve desired pixel dimensions
    dpi = 100  # Dots per inch (scaling factor)
    width_in_inches = 350 / dpi
    height_in_inches = 350 / dpi

    fig = plt.figure(figsize=(width_in_inches, height_in_inches), dpi=dpi)
    from matplotlib.gridspec import GridSpec

    ax = fig.add_subplot(111)  # Heatmap on the left (7/8)

    mel_spectrogram_db = librosa.power_to_db(mel, ref=np.max)

    img = librosa.display.specshow(mel_spectrogram_db, x_axis='time', y_axis='mel', sr=22050, fmax=8000, ax=ax)


     # Remove extra space around the plot
    ax.axis("off")  # Turn off axis for clean output

    # Save the plot as a PNG image
    image_path = output_path.replace(".json", "_mel_glyph.png")
    plt.savefig(image_path, dpi=dpi, bbox_inches="tight", pad_inches=0)
    plt.close()


def main():
    path = sys.argv[1]
    count = 0

    for jsonFile in json.loads(sys.argv[2]):
        input = os.path.join(path, jsonFile)

        with open(input, 'r') as file:
            data = json.load(file)


        #mfcc = data["mfcc"]
        #plot_mfcc(mfcc, input)

        if 'mel' in data:
            mel = data["mel"]
        else:
            wav = input.replace(".json", '.wav')
            Fs = 22050
            x, Fs = librosa.load(wav, sr=Fs)
            mel = librosa.feature.melspectrogram(y=x, sr=Fs, n_mels=128, fmax=8000)
            data['mel'] = mel
            clean_data = convert_ndarray_to_list(data)
            with open(input, 'w') as file:
                json.dump(clean_data, file, indent=4)
        plot_mel(mel, input)
        plot_mel_glyph(mel, input)
        count += 1
    
    
if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(1)
    main()
    