import * as faceapi from 'face-api.js';
import { apiRequest } from './queryClient';

const MODEL_URL = '/models';

let modelsLoaded = false;

export async function loadModels() {
  if (modelsLoaded) return;
  
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);
  
  modelsLoaded = true;
}

export async function detectFace(videoEl: HTMLVideoElement): Promise<faceapi.TinyFaceDetectorOptions> {
  await loadModels();
  
  const options = new faceapi.TinyFaceDetectorOptions({
    inputSize: 512,
    scoreThreshold: 0.5
  });
  
  const result = await faceapi.detectSingleFace(videoEl, options)
    .withFaceLandmarks()
    .withFaceDescriptor();
    
  if (!result) {
    throw new Error('No face detected. Please ensure your face is clearly visible.');
  }
  
  return options;
}

export async function getFaceDescriptor(videoEl: HTMLVideoElement): Promise<Float32Array> {
  await loadModels();
  
  const options = new faceapi.TinyFaceDetectorOptions({
    inputSize: 512,
    scoreThreshold: 0.5
  });
  
  const result = await faceapi.detectSingleFace(videoEl, options)
    .withFaceLandmarks()
    .withFaceDescriptor();
    
  if (!result) {
    throw new Error('No face detected. Please ensure your face is clearly visible.');
  }
  
  return result.descriptor;
}

export async function captureFaceData(videoEl: HTMLVideoElement): Promise<string> {
  const descriptor = await getFaceDescriptor(videoEl);
  return JSON.stringify(Array.from(descriptor));
}

export async function saveFaceData(faceData: string): Promise<void> {
  await apiRequest('POST', '/api/save-face-data', { faceData });
}

export async function compareFaceWithStored(
  videoEl: HTMLVideoElement, 
  storedFaceData: string
): Promise<boolean> {
  try {
    const liveDescriptor = await getFaceDescriptor(videoEl);
    const storedDescriptor = new Float32Array(JSON.parse(storedFaceData));
    
    const distance = faceapi.euclideanDistance(liveDescriptor, storedDescriptor);
    
    // Threshold for face matching (lower is more strict)
    const THRESHOLD = 0.5;
    return distance < THRESHOLD;
  } catch (error) {
    console.error('Face comparison error:', error);
    return false;
  }
}

export async function setupWebcam(videoEl: HTMLVideoElement): Promise<void> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('Browser API navigator.mediaDevices.getUserMedia not available');
  }
  
  videoEl.srcObject = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false
  });
  
  return new Promise((resolve) => {
    videoEl.onloadedmetadata = () => {
      resolve();
    };
  });
}

export async function stopWebcam(videoEl: HTMLVideoElement): Promise<void> {
  if (videoEl && videoEl.srcObject) {
    const stream = videoEl.srcObject as MediaStream;
    const tracks = stream.getTracks();
    
    tracks.forEach(track => {
      track.stop();
    });
    
    videoEl.srcObject = null;
  }
}
