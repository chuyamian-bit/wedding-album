/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { localDb } from '../lib/localDb';
import { WeddingEvent, Photo } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import { Plus, Trash2, ExternalLink, QrCode as QrIcon, Camera, Download, Loader2 } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export const AdminPanel: React.FC = () => {
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<WeddingEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);

  // Create Form State
  const [newName, setNewName] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newLimit, setNewLimit] = useState(100);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchPhotos(selectedEvent.id);
    }
  }, [selectedEvent]);

  const fetchEvents = async () => {
    setLoading(true);
    const data = await localDb.getEvents();
    setEvents(data);
    setLoading(false);
  };

  const fetchPhotos = async (eventId: string) => {
    const data = await localDb.getPhotos(eventId);
    setPhotos(data);
  };

  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const createEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setCreateError(null);
    console.log('📡 Starting local event creation...');

    try {
      const startTime = Date.now();
      const newEvent = await localDb.createEvent({
        name: newName,
        date: newDate,
        photo_limit: newLimit
      });

      console.log(`✅ Local creation took ${Date.now() - startTime}ms`);
      
      setEvents([newEvent, ...events]);
      setShowCreate(false);
      setNewName('');
      setNewDate('');
      setSelectedEvent(newEvent);
    } catch (err: any) {
      setCreateError('Disk write error.');
    } finally {
      setIsCreating(false);
    }
  };

  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const deletePhoto = async (photoId: string) => {
    if (!window.confirm('Are you sure you want to permanently remove this memory from your device?')) return;
    
    setDeletingIds(prev => new Set(prev).add(photoId));
    try {
      await localDb.deletePhoto(photoId);
      setPhotos(prev => prev.filter(p => p.id !== photoId));
    } catch (err) {
      console.error('Deletion error:', err);
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(photoId);
        return next;
      });
    }
  };

  const getEventUrl = (eventId: string) => {
    return `${window.location.origin}?event=${eventId}`;
  };

  const downloadPack = async () => {
    if (!selectedEvent || photos.length === 0) return;
    setDownloading(true);
    const zip = new JSZip();
    const folder = zip.folder(`${selectedEvent.name}_Memories`);

    try {
      const promises = photos.map(async (photo, index) => {
        const response = await fetch(photo.public_url);
        const blob = await response.blob();
        const extension = photo.public_url.split('.').pop()?.split('?')[0] || 'jpg';
        const fileName = `${photo.uploader_name}_${index + 1}.${extension}`;
        folder?.file(fileName, blob);
      });

      await Promise.all(promises);
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${selectedEvent.name}_Wedding_Album.zip`);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  const uniqueContributors = Array.from(new Set(photos.map(p => p.uploader_name))).length;

  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
        <div className="space-y-1">
          <p className="text-[11px] text-text-dim uppercase tracking-widest mb-1">Administrative Terminal</p>
          <h2 className="text-4xl serif md:text-5xl font-normal">Ceremony Dashboard</h2>
        </div>
        <div className="status-badge">
          <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
          Local Disk Storage
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="luxury-card p-6">
          <span className="stat-val text-3xl text-accent serif">{events.length}</span>
          <span className="nav-label mt-2">Active Events</span>
        </div>
        <div className="luxury-card p-6">
          <span className="stat-val text-3xl text-accent serif">{photos.length}</span>
          <span className="nav-label mt-2">Photos Streamed</span>
        </div>
        <div className="luxury-card p-6">
          <span className="stat-val text-3xl text-accent serif">{uniqueContributors}</span>
          <span className="nav-label mt-2">Unique Voices</span>
        </div>
        <div className="luxury-card p-6">
          <button 
            onClick={() => setShowCreate(!showCreate)}
            className="w-full h-full flex items-center justify-center gap-3 text-accent hover:text-white transition-colors"
          >
            <Plus size={24} />
            <span className="nav-label m-0">Initialize New</span>
          </button>
        </div>
      </div>

      {showCreate && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="luxury-card p-8 mb-12 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-accent" />
          <form onSubmit={createEvent} className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
            <div className="space-y-2">
              <label className="nav-label">Wedding Identity</label>
              <input 
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Name of the Couple"
                className="w-full bg-transparent border-b border-border p-2 focus:border-accent outline-none text-text-main transition-colors"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="nav-label">Atmosphere Date</label>
              <input 
                type="date"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
                className="w-full bg-transparent border-b border-border p-2 focus:border-accent outline-none text-text-main"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="nav-label">Capacity Limit</label>
              <input 
                type="number"
                value={newLimit || ''}
                onChange={e => setNewLimit(parseInt(e.target.value) || 0)}
                className="w-full bg-transparent border-b border-border p-2 focus:border-accent outline-none text-text-main"
              />
            </div>
            <div className="md:col-span-3 flex flex-col md:flex-row justify-end items-center gap-6 mt-4">
              {createError && (
                <p className="text-red-400 text-[10px] uppercase tracking-widest italic mr-auto">
                  Error: {createError}
                </p>
              )}
              <div className="flex gap-6">
                <button 
                  type="button" 
                  onClick={() => setShowCreate(false)} 
                  disabled={isCreating}
                  className="text-[11px] uppercase tracking-widest text-text-dim hover:text-text-main disabled:opacity-30"
                >
                  Discard
                </button>
                <button 
                  type="submit" 
                  disabled={isCreating}
                  className="btn-primary px-10 py-3 rounded-md text-xs uppercase tracking-widest disabled:opacity-50 flex items-center gap-3 shadow-xl"
                >
                  {isCreating ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Finalizing...
                    </>
                  ) : (
                    "Execute Creation"
                  )}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Event List */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="nav-label">Registry</h3>
          {events.map(event => (
            <motion.div 
              key={event.id}
              onClick={() => setSelectedEvent(event)}
              className={`p-6 rounded-xl cursor-pointer transition-all border ${selectedEvent?.id === event.id ? 'bg-surface border-accent shadow-lg scale-[1.02]' : 'bg-surface/30 hover:bg-surface/60 border-border'}`}
            >
              <h4 className={`text-xl serif italic ${selectedEvent?.id === event.id ? 'text-accent' : ''}`}>{event.name}</h4>
              <p className="text-xs text-text-dim mt-1">{new Date(event.date).toLocaleDateString()}</p>
            </motion.div>
          ))}
        </div>

        {/* Event Details */}
        <div className="lg:col-span-8">
          {selectedEvent ? (
            <motion.div 
              key={selectedEvent.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 luxury-card p-8">
                <div className="md:col-span-4 flex flex-col items-center">
                  <div className="p-3 bg-white rounded-lg mb-4">
                    <QRCodeSVG value={getEventUrl(selectedEvent.id)} size={160} level="M" />
                  </div>
                  <p className="text-[10px] text-text-dim uppercase tracking-[3px]">System ID: {selectedEvent.id.split('-')[0].toUpperCase()}</p>
                </div>
                
                <div className="md:col-span-8 space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-3xl serif text-accent">{selectedEvent.name}</h4>
                      <p className="text-xs text-text-dim mt-1">Live configuration & monitoring</p>
                    </div>
                    <button className="btn-secondary p-2 rounded-lg" onClick={() => window.open(getEventUrl(selectedEvent.id), '_blank')}>
                      <ExternalLink size={18} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-5 bg-bg/50 rounded-xl border border-border">
                      <span className="nav-label mb-1">Vault Status</span>
                      <p className="text-2xl serif text-accent">{photos.length} / {selectedEvent.photo_limit}</p>
                    </div>
                    <div className="p-5 bg-bg/50 rounded-xl border border-border flex flex-col justify-center">
                       <button className="btn-primary py-2 px-4 rounded text-[10px] uppercase tracking-widest">Generate Prints</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Photo Stream */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-border pb-4">
                  <h3 className="nav-label m-0">Live Memory Feed</h3>
                  <div className="flex gap-4">
                    <button 
                      onClick={downloadPack}
                      disabled={downloading || photos.length === 0}
                      className="text-[10px] uppercase tracking-widest text-text-dim hover:text-accent flex items-center gap-2 disabled:opacity-30"
                    >
                      {downloading ? (
                        <>
                          <Loader2 size={12} className="animate-spin" /> Packaging...
                        </>
                      ) : (
                        <>
                          <Download size={12} /> Download Pack
                        </>
                      )}
                    </button>
                    <button className="text-[10px] uppercase tracking-widest text-text-dim hover:text-red-400">Clear Cache</button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {photos.map(photo => (
                    <motion.div 
                      key={photo.id}
                      layout
                      className="group relative aspect-square luxury-card overflow-hidden"
                    >
                      <img 
                        src={photo.public_url} 
                        alt="Captured" 
                        referrerPolicy="no-referrer"
                        className={`w-full h-full object-cover group-hover:scale-110 transition-all duration-700 ${deletingIds.has(photo.id) ? 'opacity-20 grayscale' : 'opacity-80 group-hover:opacity-100'}`}
                      />
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                        <span className="text-[9px] text-accent uppercase tracking-widest mb-1">{photo.uploader_name}</span>
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] text-text-dim uppercase">{new Date(photo.created_at).toLocaleTimeString()}</span>
                          <button 
                            onClick={() => deletePhoto(photo.id)}
                            disabled={deletingIds.has(photo.id)}
                            className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white p-2 rounded-lg transition-all flex items-center justify-center disabled:opacity-30"
                          >
                            {deletingIds.has(photo.id) ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        </div>
                      </div>

                      {deletingIds.has(photo.id) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                           <span className="text-[9px] uppercase tracking-widest text-white/60">Eliminating...</span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full min-h-[400px] luxury-card border-dashed flex flex-col items-center justify-center text-center p-12 opacity-40">
              <QrIcon size={48} className="mb-6 opacity-20" />
              <h3 className="text-2xl serif italic mb-2">Awaiting Selection</h3>
              <p className="text-xs uppercase tracking-widest">Select an active registry to begin streaming.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
