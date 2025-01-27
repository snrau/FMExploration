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

    plt.figure(figsize=(10, 4))
    librosa.display.specshow(mfcc, x_axis='time', sr=22050, cmap='coolwarm')
    plt.colorbar(format='%+2.0f dB')
    plt.title('MFCC')
    # Save the plot as a PNG image
    image_path = output_path.replace('.json', '_mfcc.png')
    plt.savefig(image_path)
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
    