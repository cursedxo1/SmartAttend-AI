import * as faceapi from 'face-api.js';

export const loadModels = async () => {
  const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models/';
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);
};

export const getFaceDescriptor = async (element: HTMLVideoElement | HTMLImageElement) => {
  const detection = await faceapi
    .detectSingleFace(element, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();
  return detection ? detection.descriptor : null;
};

export const createMatcher = (labeledDescriptors: any[]) => {
  if (labeledDescriptors.length === 0) return null;
  
  const labeledFaceDescriptors = labeledDescriptors.map(ld => {
    // Array in Firestore is number[], we need Float32Array
    const descriptors = [new Float32Array(ld.descriptors)];
    return new faceapi.LabeledFaceDescriptors(ld.userId, descriptors);
  });

  return new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);
};

export const notifyParent = async (parentEmail: string, studentName: string, courseName: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  console.log(`%c[SmartAttend Notification]`, "color: #3b82f6; font-weight: bold", {
    to: parentEmail,
    subject: `Attendance Alert: ${studentName}`,
    body: `Dear Parent, your child ${studentName} was marked ABSENT for the session: ${courseName}.`
  });

  return true;
};
