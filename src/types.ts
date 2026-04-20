/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface WeddingEvent {
  id: string;
  name: string;
  date: string;
  photo_limit: number;
  admin_password?: string;
  created_at: string;
}

export interface Photo {
  id: string;
  event_id: string;
  storage_path: string;
  public_url: string;
  uploader_name: string;
  created_at: string;
}

export type ViewState = 'landing' | 'admin_login' | 'admin_dashboard' | 'guest_entry' | 'guest_upload' | 'guest_gallery';
