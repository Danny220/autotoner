import type { TonePresetResponse, UserRig } from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:8000';

export interface MatchSongRequestPayload {
  song_title: string;
  artist?: string;
  additional_notes?: string;
  user_rig: UserRig;
  ai_model_chain: string[];
}

export class ApiError extends Error {
  readonly status: number;
  readonly detail?: string;

  constructor(message: string, status: number, detail?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

export async function matchSongTone(
  payload: MatchSongRequestPayload,
  signal?: AbortSignal
): Promise<TonePresetResponse> {
  const url = `${API_BASE_URL.replace(/\/+$/, '')}/api/v1/tone/match-song`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    const message = err instanceof Error ? err.message : 'Network error';
    throw new ApiError(`Failed to connect to backend service: ${message}`, 0);
  }

  if (!response.ok) {
    let detailMessage = response.statusText;
    try {
      const errorJson = (await response.json()) as { detail?: string };
      if (errorJson?.detail) {
        detailMessage = errorJson.detail;
      }
    } catch {
      // Body was not JSON; fallback to status text
    }

    throw new ApiError(detailMessage, response.status, detailMessage);
  }

  return (await response.json()) as TonePresetResponse;
}
