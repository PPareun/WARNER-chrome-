from flask import Flask, request, jsonify
import logging
import os
import tensorflow as tf
from tensorflow.keras import layers
from tensorflow.keras.layers import TimeDistributed, LayerNormalization, UpSampling3D, Dense
from tensorflow.keras.models import Model
from tensorflow.keras.regularizers import l2
from tensorflow.keras.applications.resnet50 import ResNet50
from kapre.composed import get_melspectrogram_layer
from keras.applications.mobilenet_v2 import MobileNetV2
import librosa
import soundfile as sf
import os
from tqdm import tqdm
from scipy.io import wavfile
from kapre.time_frequency import STFT, Magnitude, ApplyFilterbank, MagnitudeToDecibel
from tensorflow.keras.models import load_model
import numpy as np
from vit import AudioViT, ClassToken
from tensorflow.keras.utils import custom_object_scope
from pydub import AudioSegment
import io
class_labels = ['construction', 'siren', 'vehicle', 'scream','crying', 'explosion', 'horn', 'animal threat']
app = Flask(__name__)
logging.basicConfig(filename="project.log", level=logging.DEBUG)

os.makedirs(os.path.join(app.root_path, 'uploads'), exist_ok=True)
def save_sample(sample, rate):
    dst_path = os.path.join(app.root_path, 'uploads', 'sampled1.wav')
    wavfile.write(dst_path, rate, sample)
model_fn = 'best_mobilenetv2median.h5'
with custom_object_scope({'STFT': STFT,
                          'Magnitude': Magnitude,
                          'ApplyFilterbank': ApplyFilterbank,
                          'MagnitudeToDecibel': MagnitudeToDecibel,
                          'ClassToken': ClassToken}):
    model = load_model(model_fn)


@app.route('/analyze', methods=['POST'])
def upload():
    file = request.files['audioFile']
    file_path = os.path.join(app.root_path, 'uploads', 'now.wav')
    audio = AudioSegment.from_file(io.BytesIO(file.read()), format="webm")
    audio.export(file_path, format="wav")
    y, sr = librosa.load(file_path, sr=None)
    y_resampled = librosa.resample(y, orig_sr=sr, target_sr=1000)
    y_resampled = librosa.util.fix_length(y_resampled, size=1000 * 10)
    save_sample(y_resampled, 1000)

    rate, wav = wavfile.read('uploads/sampled1.wav')
    wav = np.resize(wav, 10000)
    wav= np.reshape(wav,(1, wav.shape[0],1))
    predicted_probabilities = model.predict(wav) 
    predicted_probabilities_rounded = np.round(predicted_probabilities * 100, decimals=1)
    print(predicted_probabilities_rounded[0])

    class_probabilities = {}
    for i, probability in enumerate(predicted_probabilities_rounded[0]):
            class_name = class_labels[i]
            class_probabilities[class_name] = f'{probability:.1f}%'
    
    predicted_class_index = np.argmax(predicted_probabilities)
    predicted_class_name = class_labels[predicted_class_index]
    response_data = {
        'probabilities': class_probabilities,
        'predicted_class': predicted_class_name  
    }
    return jsonify(response_data)
if __name__ == '__main__':
    app.run(debug=False)
