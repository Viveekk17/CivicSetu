// Camera utility functions for capturing photos

export const isCameraAvailable = () => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};

export const startCamera = async (videoElement) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }, // Use back camera on mobile
      audio: false
    });
    
    if (videoElement) {
      videoElement.srcObject = stream;
    }
    
    return stream;
  } catch (error) {
    console.error('Camera error:', error);
    throw new Error('Unable to access camera. Please check permissions.');
  }
};

export const stopCamera = (stream) => {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
};

export const capturePhoto = (videoElement) => {
  return new Promise((resolve, reject) => {
    try {
      if (!videoElement || !videoElement.videoWidth || !videoElement.videoHeight) {
        reject(new Error('Video not ready'));
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Canvas not supported'));
        return;
      }

      context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
          const preview = URL.createObjectURL(blob);
          resolve({ file, preview });
        } else {
          reject(new Error('Failed to create image'));
        }
      }, 'image/jpeg', 0.9);
    } catch (error) {
      reject(error);
    }
  });
};
