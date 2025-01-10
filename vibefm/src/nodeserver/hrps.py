import os, sys
import numpy as np
from scipy import signal
import matplotlib.pyplot as plt
import IPython.display as ipd
import librosa.display
import soundfile as sf
import pandas as pd
from collections import OrderedDict

import json

sys.path.append('..')
import libfmp.b
import libfmp.c8
from libfmp.c8 import convert_l_sec_to_frames, convert_l_hertz_to_bins, make_integer_odd


def hrps(x, Fs, N, H, L_h, L_p, beta=2.0, L_unit='physical', detail=False):
    """Harmonic-residual-percussive separation (HRPS) algorithm

    Notebook: C8/C8S1_HRPS.ipynb

    Args:
        x (np.ndarray): Input signal
        Fs (scalar): Sampling rate of x
        N (int): Frame length
        H (int): Hopsize
        L_h (float): Horizontal median filter length given in seconds or frames
        L_p (float): Percussive median filter length given in Hertz or bins
        beta (float): Separation factor (Default value = 2.0)
        L_unit (str): Adjusts unit, either 'pyhsical' or 'indices' (Default value = 'physical')
        detail (bool): Returns detailed information (Default value = False)

    Returns:
        x_h (np.ndarray): Harmonic signal
        x_p (np.ndarray): Percussive signal
        x_r (np.ndarray): Residual signal
        details (dict): Dictionary containing detailed information; returned if "detail=True"
    """
    assert L_unit in ['physical', 'indices']
    # stft
    X = librosa.stft(x, n_fft=N, hop_length=H, win_length=N, window='hann', center=True, pad_mode='constant')
    # power spectrogram
    Y = np.abs(X) ** 2
    # median filtering
    if L_unit == 'physical':
        L_h = convert_l_sec_to_frames(L_h_sec=L_h, Fs=Fs, N=N, H=H)
        L_p = convert_l_hertz_to_bins(L_p_Hz=L_p, Fs=Fs, N=N, H=H)
    L_h = make_integer_odd(L_h)
    L_p = make_integer_odd(L_p)
    Y_h = signal.medfilt(Y, [1, L_h])
    Y_p = signal.medfilt(Y, [L_p, 1])

    # masking
    M_h = np.int8(Y_h >= beta * Y_p)
    M_p = np.int8(Y_p > beta * Y_h)
    M_r = 1 - (M_h + M_p)
    X_h = X * M_h
    X_p = X * M_p
    X_r = X * M_r

    # istft
    x_h = librosa.istft(X_h, hop_length=H, win_length=N, window='hann', center=True, length=x.size)
    x_p = librosa.istft(X_p, hop_length=H, win_length=N, window='hann', center=True, length=x.size)
    x_r = librosa.istft(X_r, hop_length=H, win_length=N, window='hann', center=True, length=x.size)

    if detail:
        return x_h, x_p, x_r, dict(Y_h=Y_h, Y_p=Y_p, M_h=M_h, M_r=M_r, M_p=M_p, X_h=X_h, X_r=X_r, X_p=X_p)
    else:
        return x_h, x_p, x_r
    
    