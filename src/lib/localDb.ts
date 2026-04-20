/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeddingEvent, Photo } from '../types';

const STORAGE_KEYS = {
  EVENTS: 'vv_events',
  PHOTOS: 'vv_photos',
};

// Minimal polyfill for uuid if needed, but we'll just use crypto.randomUUID
const generateId = () => crypto.randomUUID();

export const localDb = {
  // Events
  async getEvents(): Promise<WeddingEvent[]> {
    const data = localStorage.getItem(STORAGE_KEYS.EVENTS);
    return data ? JSON.parse(data) : [];
  },

  async getEvent(id: string): Promise<WeddingEvent | null> {
    const events = await this.getEvents();
    return events.find(e => e.id === id) || null;
  },

  async createEvent(event: Omit<WeddingEvent, 'id' | 'created_at'>): Promise<WeddingEvent> {
    const events = await this.getEvents();
    const newEvent: WeddingEvent = {
      ...event,
      id: generateId(),
      created_at: new Date().toISOString(),
    };
    events.unshift(newEvent);
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    return newEvent;
  },

  // Photos
  async getPhotos(eventId: string): Promise<Photo[]> {
    const photos: Photo[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PHOTOS) || '[]');
    return photos
      .filter(p => p.event_id === eventId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async savePhoto(eventId: string, uploaderName: string, base64Data: string): Promise<Photo> {
    const photos: Photo[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PHOTOS) || '[]');
    const newPhoto: Photo = {
      id: generateId(),
      event_id: eventId,
      storage_path: `mock/${generateId()}.jpg`,
      public_url: base64Data, // Store base64 directly as URL for local mode
      uploader_name: uploaderName,
      created_at: new Date().toISOString(),
    };
    
    photos.unshift(newPhoto);
    
    // Safety check: if local storage is getting full, remove older photos
    // This is a crude way to handle the 5MB limit
    try {
      localStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(photos));
    } catch (e) {
      console.warn('LocalStorage limit exceeded, removing oldest photos to compensate');
      while (photos.length > 5) {
        photos.pop();
        try {
          localStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(photos));
          break;
        } catch (innerE) {
          continue;
        }
      }
    }
    
    return newPhoto;
  },

  async deletePhoto(photoId: string): Promise<void> {
    let photos: Photo[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PHOTOS) || '[]');
    photos = photos.filter(p => p.id !== photoId);
    localStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(photos));
  },

  async getPhotoCount(eventId: string): Promise<number> {
    const photos = await this.getPhotos(eventId);
    return photos.length;
  }
};
