import * as faceapi from 'face-api.js';
import { apiRequest } from './queryClient';

const MODEL_URL = '/models';

let modelsLoaded = false;

export async function loadModels(): Promise<void> {
  if (modelsLoaded) {
    console.log('Models already loaded');
    return;
  }

  try {
    console.log('Loading face-api.js models...');
    
    // Check if face-api.js is loaded
    if (typeof faceapi === 'undefined') {
      throw new Error('face-api.js library not loaded. Please refresh the page and try again.');
    }
    
    // Check if models directory is accessible
    const response = await fetch(MODEL_URL);
    if (!response.ok) {
      throw new Error(`Models directory not accessible: ${response.statusText}`);
    }
    
    // Load models in parallel for better performance
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
    ]);
    
    modelsLoaded = true;
    console.log('All models loaded successfully');
  } catch (error) {
    console.error('Error loading face-api.js models:', error);
    throw new Error('Failed to load face recognition models. Please check your internet connection and try again.');
  }
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
    throw new Error('No face detected. Please ensure your face is clearly visible and centered in the frame.');
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
    throw new Error('No face detected. Please ensure your face is clearly visible and centered in the frame.');
  }
  
  return result.descriptor;
}

export async function captureFaceData(videoEl: HTMLVideoElement): Promise<string> {
  const descriptor = await getFaceDescriptor(videoEl);
  return JSON.stringify(Array.from(descriptor));
}

export async function saveFaceData(faceData: string): Promise<void> {
  console.log('Saving face data...');
  try {
    await apiRequest('POST', '/api/face-data', { faceData });
    console.log('Face data saved successfully');
  } catch (error) {
    console.error('Error saving face data:', error);
    throw new Error('Failed to save face data: ' + (error as Error).message);
  }
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
    // Using a slightly more lenient threshold for better user experience
    const THRESHOLD = 0.6;
    console.log('Face comparison distance:', distance, 'Threshold:', THRESHOLD);
    return distance < THRESHOLD;
  } catch (error) {
    console.error('Face comparison error:', error);
    return false;
  }
}

export async function setupWebcam(videoEl: HTMLVideoElement): Promise<void> {
  console.log('Checking browser support for mediaDevices...');
  if (!navigator.mediaDevices) {
    console.error('navigator.mediaDevices is not available');
    throw new Error('Your browser does not support camera access. Please use a modern browser like Chrome, Firefox, or Safari.');
  }
  
  if (!navigator.mediaDevices.getUserMedia) {
    console.error('navigator.mediaDevices.getUserMedia is not available');
    throw new Error('Your browser does not support getUserMedia API. Please use a modern browser like Chrome, Firefox, or Safari.');
  }
  
  // Check if we're in a secure context
  console.log('Checking secure context...');
  if (window.isSecureContext === false) {
    console.error('Not in a secure context. Camera access requires HTTPS or localhost');
    throw new Error('Camera access requires a secure connection (HTTPS or localhost).');
  }
  console.log('Secure context check passed');
  
  try {
    console.log('Checking camera permissions...');
    // Check if permissions API is available
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const permissions = await navigator.permissions.query({ name: 'camera' as PermissionName });
        console.log('Camera permission state:', permissions.state);
        
        if (permissions.state === 'denied') {
          throw new Error('Camera access was denied. Please allow camera access in your browser settings and try again.');
        }
      } catch (permError) {
        console.warn('Permissions API error:', permError);
        // Continue anyway, as some browsers might not support the permissions API
      }
    } else {
      console.log('Permissions API not available, proceeding with getUserMedia');
    }
    
    console.log('Requesting camera access...');
    // Use more flexible constraints for mobile devices
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    });
    
    console.log('Camera stream obtained:', stream);
    
    // Check if video element is valid
    if (!videoEl) {
      throw new Error('Video element not found');
    }
    
    // Set the stream to the video element
    videoEl.srcObject = stream;
    console.log('Camera access granted');
    
    return new Promise((resolve, reject) => {
      // Set a timeout to handle cases where onloadedmetadata doesn't fire
      const timeoutId = setTimeout(() => {
        console.log('Video element metadata loading timed out, resolving anyway');
        resolve();
      }, 5000);
      
      videoEl.onloadedmetadata = () => {
        console.log('Video element ready');
        clearTimeout(timeoutId);
        resolve();
      };
      
      videoEl.onerror = (error) => {
        console.error('Video element error:', error);
        clearTimeout(timeoutId);
        reject(new Error('Failed to load video stream'));
      };
    });
  } catch (error) {
    console.error('Camera setup error:', error);
    
    // Provide more specific error messages based on the error type
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        throw new Error('Camera access was denied. Please allow camera access in your browser settings.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        throw new Error('No camera found. Please ensure your device has a camera and it is not being used by another application.');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        throw new Error('Camera is already in use by another application. Please close other apps using the camera and try again.');
      } else if (error.name === 'OverconstrainedError') {
        throw new Error('Camera does not meet the required constraints. Please try a different camera.');
      } else if (error.name === 'TypeError') {
        throw new Error('Camera API error. Please refresh the page and try again.');
      }
    }
    
    throw error;
  }
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
