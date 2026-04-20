/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { AdminPanel } from './components/AdminPanel';
import { GuestExperience } from './components/GuestExperience';
import { PhotoGallery } from './components/PhotoGallery';
import { localDb } from './lib/localDb';
import { WeddingEvent, ViewState } from './types';
import { motion } from 'motion/react';
import { Camera, Image as ImageIcon, Heart, AlertCircle, QrCode } from 'lucide-react';

export default function App() {
  const [view, setView] = useState<ViewState>('landing');
  const [event, setEvent] = useState<WeddingEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for event ID in URL
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('event');
    const isAdmin = params.get('admin') === 'true';

    if (isAdmin) {
      setView('admin_dashboard');
      setLoading(false);
    } else if (eventId) {
      loadEvent(eventId);
    } else {
      setLoading(false);
    }
  }, []);

  const loadEvent = async (id: string) => {
    setLoading(true);
    try {
      const data = await localDb.getEvent(id);
      if (data) {
        setEvent(data);
        setView('guest_entry');
      } else {
        setError('Memory Vault not found on this device. (Note: Using local-only storage)');
      }
    } catch (e) {
      setError('System retrieval error.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <motion.div 
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center space-y-4"
        >
          <Heart className="w-12 h-12 text-accent/20" strokeWidth={1} />
          <p className="font-serif italic text-xl opacity-40">Accessing offline memories...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <Layout>
      {error ? (
        <div className="flex-grow flex flex-col items-center justify-center p-6 text-center space-y-6">
          <AlertCircle size={48} className="text-accent" />
          <div className="space-y-2">
            <h2 className="text-3xl serif italic">A Local Detour</h2>
            <p className="text-sm opacity-50 max-w-xs mx-auto">{error}</p>
          </div>
          <button 
            onClick={() => window.location.href = window.location.origin}
            className="px-8 py-4 bg-surface text-white border border-border rounded-2xl text-[10px] uppercase tracking-widest font-bold"
          >
            Back to Vows & Views
          </button>
        </div>
      ) : (
        <>
          {view === 'landing' && (
            <div className="flex-grow flex flex-col items-center justify-center p-6 text-center space-y-12">
              <div className="space-y-6 max-w-2xl">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  <p className="nav-label mb-2">Registry & Visual Stream</p>
                  <h2 className="text-6xl md:text-9xl serif italic leading-[0.85] text-white">The Art of <span className="text-accent">Cherishing</span>.</h2>
                </motion.div>
                <div className="w-12 h-px bg-accent mx-auto my-8 opacity-40 shrink-0" />
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-sm md:text-base text-text-dim max-w-sm mx-auto leading-relaxed tracking-widest uppercase text-[10px]"
                >
                  A collective visual narrative of your wedding day. No applications, just pure celebration.
                </motion.p>
              </div>

              <div className="flex flex-col sm:flex-row gap-8 pt-12 items-center">
                <button 
                  onClick={() => (window.location.href = '?admin=true')}
                  className="btn-primary px-16 py-5 rounded-md text-[11px] uppercase tracking-[0.3em] shadow-2xl"
                >
                  Organizer Entry
                </button>
                  <div className="flex items-center gap-2">
                    <QrCode size={14} className="text-accent" />
                    <span className="text-text-dim text-[10px] uppercase tracking-[0.2em] italic">Scan QR to Unlock Camera</span>
                  </div>
              </div>
            </div>
          )}

          {view === 'admin_dashboard' && <AdminPanel />}

          {(view === 'guest_entry' || view === 'guest_upload') && event && (
             <GuestExperience event={event} />
          )}

          {view === 'guest_gallery' && event && (
            <PhotoGallery event={event} />
          )}

          {/* Guest Navigation */}
          {event && (view.includes('guest')) && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
              <div className="bg-surface/80 text-text-main rounded-full p-2 flex gap-1 shadow-2xl backdrop-blur-xl border border-border">
                <button 
                  onClick={() => setView('guest_upload')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all ${view === 'guest_upload' || view === 'guest_entry' ? 'bg-accent text-bg shadow-lg' : 'hover:bg-white/5'}`}
                >
                  <Camera size={18} />
                  <span className="text-[10px] uppercase tracking-widest font-bold">Capture</span>
                </button>
                <button 
                  onClick={() => setView('guest_gallery')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all ${view === 'guest_gallery' ? 'bg-accent text-bg shadow-lg' : 'hover:bg-white/5'}`}
                >
                  <ImageIcon size={18} />
                  <span className="text-[10px] uppercase tracking-widest font-bold">Gallery</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
