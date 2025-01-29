import sys, os
import librosa.display
import librosa.feature
import ast
from hrps import hrps
import json
import numpy as np
import matplotlib.pyplot as plt

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


def main():
    path = sys.argv[1]
    count = 0

    for jsonFile in json.loads(sys.argv[2]):
        index = int(jsonFile.split("_")[1].split(".j")[0])
        print(f"{index}", file=sys.stderr)
        input = os.path.join(path, jsonFile)

        with open(input, 'r') as file:
            data = json.load(file)


        mfcc = data["mfcc"]

        
        plot_mfcc(mfcc, input)
        
        count += 1
    
    
if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(1)
    main()
    