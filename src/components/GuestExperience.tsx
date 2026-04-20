/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { localDb } from '../lib/localDb';
import { WeddingEvent, Photo } from '../types';
import { Camera, Image as ImageIcon, Upload, X, Check, ArrowRight, Loader2, Heart, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useDropzone } from 'react-dropzone';

interface GuestExperienceProps {
  event: WeddingEvent;
}

export const GuestExperience: React.FC<GuestExperienceProps> = ({ event }) => {
  const [step, setStep] = useState<'welcome' | 'capture' | 'preview' | 'uploading' | 'success'>('welcome');
  const [uploaderName, setUploaderName] = useState(() => localStorage.getItem(`vv_name_${event.id}`) || '');
  const [userPhotoCount, setUserPhotoCount] = useState(() => {
    const saved = localStorage.getItem(`vv_count_${event.id}`);
    const parsed = saved ? parseInt(saved) : 0;
    return isNaN(parsed) ? 0 : parsed;
  });
  const [showCameraFallbackAlert, setShowCameraFallbackAlert] = useState(false);
  
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [totalPhotoCount, setTotalPhotoCount] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isBrowserCameraSupported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  useEffect(() => {
    fetchPhotoCount();
    localStorage.setItem(`vv_count_${event.id}`, userPhotoCount.toString());
  }, [event.id, userPhotoCount]);

  useEffect(() => {
    if (uploaderName) {
      localStorage.setItem(`vv_name_${event.id}`, uploaderName);
    }
  }, [uploaderName, event.id]);

  const fetchPhotoCount = async () => {
    const count = await localDb.getPhotoCount(event.id);
    setTotalPhotoCount(count);
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  };

  const compressImage = async (file: Blob | File): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 800; // Smaller for local storage

        if (width > height) {
          if (width > maxDim) {
            height *= maxDim / width;
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width *= maxDim / height;
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/jpeg', 0.6); // Lower quality for local storage
      };
    });
  };

  const startCamera = async () => {
    if (!isBrowserCameraSupported) {
      // Fallback for non-HTTPS or unsupported browsers
      setShowCameraFallbackAlert(true);
      setTimeout(() => {
        setShowCameraFallbackAlert(false);
        fileInputRef.current?.click();
      }, 2500);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStep('capture');
    } catch (err) {
      // If permission denied or other error, fallback to native file picker
      console.warn('Camera API failed, falling back to file input:', err);
      setShowCameraFallbackAlert(true);
      setTimeout(() => {
        setShowCameraFallbackAlert(false);
        fileInputRef.current?.click();
      }, 2500);
    }
  };

  const handleNativeCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file);
      setPhotoBlob(compressed);
      setPreviewUrl(URL.createObjectURL(compressed));
      setStep('preview');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const takePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);
      
      canvas.toBlob(async (blob) => {
        if (blob) {
          const compressed = await compressImage(blob);
          setPhotoBlob(compressed);
          setPreviewUrl(URL.createObjectURL(compressed));
          stopCamera();
          setStep('preview');
        }
      }, 'image/jpeg', 0.85);
    }
  };

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const compressed = await compressImage(file);
      setPhotoBlob(compressed);
      setPreviewUrl(URL.createObjectURL(compressed));
      setStep('preview');
    }
  };

  const { getRootProps, getInputProps } = useDropzone({ 
    onDrop, 
    accept: { 'image/*': [] },
    multiple: false
  } as any);

  const uploadPhoto = async () => {
    if (!photoBlob || !uploaderName.trim()) return;

    if (totalPhotoCount >= event.photo_limit) {
      setError('Event photo capacity reached. Thank you for your contributions!');
      return;
    }

    setStep('uploading');
    
    try {
      const base64Data = await blobToBase64(photoBlob);
      await localDb.savePhoto(event.id, uploaderName, base64Data);
      
      setUserPhotoCount(prev => prev + 1);
      setStep('success');
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#1a1a1a', '#C5A059', '#E1E1E1']
      });
      fetchPhotoCount();
    } catch (err: any) {
      setError('Disk full or write failed.');
      setStep('preview');
    }
  };

  const reset = () => {
    setPhotoBlob(null);
    setPreviewUrl(null);
    setError(null);
    setStep('welcome');
  };

  return (
    <div className="flex-grow flex flex-col p-6 items-center">
      <AnimatePresence>
        {showCameraFallbackAlert && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-6 right-6 z-[100]"
          >
            <div className="luxury-card border-accent/20 bg-surface/90 backdrop-blur-xl p-6 flex items-start gap-4">
              <div className="p-3 bg-accent/10 rounded-full shrink-0">
                <AlertCircle className="text-accent" size={24} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm serif italic text-white leading-tight">Camera Access Restricted</h4>
                <p className="text-[10px] uppercase tracking-wider text-text-dim leading-relaxed">
                  Switching to your system's camera for a secure capture experience.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {step === 'welcome' && (
          <motion.div 
            key="welcome"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="flex-grow flex flex-col justify-center items-center text-center space-y-12 max-w-sm w-full"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                <span className="text-[9px] uppercase tracking-[0.3em] text-accent font-bold">Validated via Official QR</span>
              </div>
              <span className="text-[10px] uppercase tracking-[0.3em] text-text-dim font-bold block">Celebration at</span>
              <h2 className="text-5xl serif italic leading-tight text-white">{event.name}</h2>
              <div className="w-12 h-px bg-accent/20 mx-auto" />
              <p className="text-sm text-text-dim tracking-wider uppercase text-[9px] opacity-60">Memory Vault • Limited Capacity</p>
            </div>

            <div className="space-y-6 w-full pt-8">
              {!localStorage.getItem(`vv_name_${event.id}`) && (
                <div className="space-y-2 text-left">
                  <label className="nav-label ml-1">Identity</label>
                  <input 
                    value={uploaderName}
                    onChange={e => setUploaderName(e.target.value)}
                    placeholder="Guest Name"
                    className="w-full bg-surface border border-border p-5 rounded-xl focus:outline-none focus:border-accent shadow-lg transition-all text-text-main"
                  />
                </div>
              )}
              
              {localStorage.getItem(`vv_name_${event.id}`) && (
                <div className="text-center pb-4">
                  <p className="text-sm serif italic text-accent">Welcome back, {uploaderName}</p>
                  <button 
                    onClick={() => {
                      localStorage.removeItem(`vv_name_${event.id}`);
                      setUploaderName('');
                    }}
                    className="text-[9px] uppercase tracking-widest text-text-dim hover:text-white mt-1"
                  >
                    Change Guest Identity
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Hidden input for native camera fallback */}
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  ref={fileInputRef} 
                  onChange={handleNativeCameraCapture}
                  className="hidden"
                />
                
                <button 
                  onClick={startCamera}
                  disabled={!uploaderName.trim()}
                  className="btn-primary flex flex-col items-center justify-center p-8 rounded-2xl space-y-4 disabled:opacity-20 transition-all"
                >
                  <Camera size={32} strokeWidth={1} />
                  <span className="text-[10px] uppercase tracking-widest font-bold">Capture</span>
                </button>
                <div 
                  {...getRootProps()} 
                  className={`flex flex-col items-center justify-center p-8 bg-surface border border-border rounded-2xl space-y-4 cursor-pointer hover:bg-surface/80 transition-all ${!uploaderName.trim() ? 'opacity-20 pointer-events-none' : ''}`}
                >
                  <input {...getInputProps()} />
                  <ImageIcon size={32} strokeWidth={1} className="text-text-dim" />
                  <span className="text-[10px] uppercase tracking-widest font-bold text-text-dim">Library</span>
                </div>
              </div>
            </div>

            <p className="text-[10px] uppercase tracking-widest text-text-dim mt-auto">
              Photos Contributed: {userPhotoCount} • Gallery Total: {totalPhotoCount}
            </p>
          </motion.div>
        )}

        {step === 'capture' && (
          <motion.div 
            key="capture"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 flex flex-col"
          >
            <button 
              onClick={() => { stopCamera(); setStep('welcome'); }}
              className="absolute top-6 right-6 p-3 bg-white/10 backdrop-blur-md rounded-full text-white z-10"
            >
              <X size={24} />
            </button>
            
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="flex-grow w-full object-cover"
            />
            
            <canvas ref={canvasRef} className="hidden" />

            <div className="p-12 flex justify-center bg-black">
              <button 
                onClick={takePhoto}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center"
              >
                <div className="w-14 h-14 bg-white rounded-full active:scale-90 transition-transform" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 'preview' && previewUrl && (
          <motion.div 
            key="preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm flex flex-col space-y-8"
          >
            <div className="aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl bg-[#1a1a1a]">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setStep('welcome')}
                className="btn-secondary flex-1 py-4 px-6 rounded-xl flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest font-bold"
              >
                <X size={16} /> Discard
              </button>
              <button 
                onClick={uploadPhoto}
                className="btn-primary flex-[2] py-4 px-6 rounded-xl flex items-center justify-center gap-3 text-[10px] uppercase tracking-widest font-bold shadow-lg"
              >
                Gift to Gallery <ArrowRight size={16} />
              </button>
            </div>

            {error && (
              <p className="p-4 bg-red-50 text-red-500 text-xs text-center rounded-xl border border-red-100 italic">
                {error}
              </p>
            )}
          </motion.div>
        )}

        {step === 'uploading' && (
          <motion.div 
            key="uploading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-grow flex flex-col items-center justify-center space-y-6"
          >
            <div className="relative">
              <Loader2 className="w-16 h-16 animate-spin text-accent opacity-20" />
              <Heart className="absolute inset-0 m-auto w-6 h-6 animate-pulse text-accent" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm serif italic text-accent">Enshrining memory...</p>
              <p className="text-[10px] uppercase tracking-[0.3em] text-text-dim">To the collective vault</p>
            </div>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-grow flex flex-col items-center justify-center space-y-12 text-center"
          >
            <div className="w-24 h-24 bg-accent text-bg rounded-full flex items-center justify-center shadow-xl">
              <Check size={48} />
            </div>
            <div className="space-y-3">
              <h2 className="text-4xl serif italic text-white">Successfully Received</h2>
              <p className="text-xs text-text-dim uppercase tracking-[0.2em] max-w-[240px] mx-auto">Your contribution to {event.name} is now live.</p>
            </div>
            
            <div className="space-y-4 w-full max-w-xs">
               <button 
                onClick={reset}
                className="btn-primary w-full py-5 rounded-xl flex items-center justify-center gap-3 text-[10px] uppercase tracking-widest font-bold shadow-lg"
              >
                Capture Another
              </button>
               <button 
                onClick={() => window.location.reload()} 
                className="btn-secondary w-full py-5 rounded-xl text-[10px] uppercase tracking-widest font-bold"
              >
                Enter the Gallery
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
