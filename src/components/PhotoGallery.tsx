/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { localDb } from '../lib/localDb';
import { WeddingEvent, Photo } from '../types';
import { Heart, Maximize2, X, Download } from 'lucide-react';

interface PhotoGalleryProps {
  event: WeddingEvent;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ event }) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    fetchPhotos();

    // In local mode, we don't have cross-device real-time.
    // However, we could listen to storage events if we wanted.
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'vv_photos') {
        fetchPhotos();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [event.id]);

  const fetchPhotos = async () => {
    const data = await localDb.getPhotos(event.id);
    setPhotos(data);
  };

  return (
    <div className="flex-grow p-6 pb-32">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="text-center space-y-4 pt-12">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.4em] text-accent/80 font-bold">Local Archive Mode</span>
          </div>
          <p className="text-[10px] uppercase tracking-[0.5em] text-accent font-bold">The Collective Memory of</p>
          <h2 className="text-5xl md:text-7xl serif italic leading-tight text-white">{event.name}</h2>
          <div className="w-24 h-px bg-accent/20 mx-auto" />
        </header>

        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          <AnimatePresence>
            {photos.map((photo, index) => (
              <motion.div 
                key={photo.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="break-inside-avoid relative group rounded-xl overflow-hidden cursor-zoom-in border border-border"
                onClick={() => setSelectedPhoto(photo)}
              >
                <img 
                  src={photo.public_url} 
                  alt={`Memory by ${photo.uploader_name}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-auto object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                  <p className="text-accent text-[9px] uppercase tracking-[0.2em] font-bold">Gifted by {photo.uploader_name}</p>
                  <p className="text-text-dim text-[8px] uppercase tracking-widest mt-1">
                    {new Date(photo.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="absolute top-4 right-4 text-accent opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                  <Maximize2 size={16} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {photos.length === 0 && (
          <div className="text-center py-24 luxury-card border-dashed space-y-6 opacity-30">
            <Heart size={40} strokeWidth={1} className="mx-auto text-accent animate-pulse" />
            <p className="serif italic text-2xl">Awaiting the first contribution...</p>
            <p className="nav-label">The gallery is currently silent</p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col"
          >
            <div className="flex justify-between items-center p-6 text-white/50">
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-widest text-[#d4af37]">By {selectedPhoto.uploader_name}</span>
                <span className="text-[10px] uppercase tracking-widest opacity-60">Collective Memory • {event.name}</span>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => window.open(selectedPhoto.public_url, '_blank')}
                  className="p-3 hover:bg-white/10 rounded-xl text-white transition-colors flex items-center gap-2"
                >
                  <Download size={20} />
                  <span className="text-[10px] uppercase tracking-widest font-bold">Save Memory</span>
                </button>
                <button 
                  onClick={() => setSelectedPhoto(null)}
                  className="p-3 hover:bg-white/10 rounded-full text-white transition-colors"
                >
                  <X size={28} />
                </button>
              </div>
            </div>
            
            <div className="flex-grow flex items-center justify-center p-4">
              <motion.img 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                src={selectedPhoto.public_url} 
                alt="Selected memory"
                className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
