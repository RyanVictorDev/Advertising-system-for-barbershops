export type YouTubePlayer = {
  loadPlaylist: (playlistId: string, index?: number) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  nextVideo: () => void;
  previousVideo: () => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  setVolume: (volume: number) => void;
  destroy: () => void;
  getPlayerState: () => number;
  getVideoData: () => { title?: string; video_id?: string };
};

type PlayerOptions = {
  host?: string;
  width?: string;
  height?: string;
  playerVars?: Record<string, string | number>;
  events?: {
    onReady?: (event: { target: YouTubePlayer }) => void;
    onStateChange?: (event: { data: number; target: YouTubePlayer }) => void;
    onError?: (event: { data: number; target: YouTubePlayer }) => void;
  };
};

declare global {
  interface Window {
    YT?: {
      Player: new (element: HTMLElement, options: PlayerOptions) => YouTubePlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export const PLAYER_ENDED = 0;
export const PLAYER_PLAYING = 1;
export const PLAYER_PAUSED = 2;
export const PLAYER_BUFFERING = 3;

let apiPromise: Promise<void> | null = null;

export function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => {
      apiPromise = null;
      reject(new Error("youtube-api"));
    };
    document.head.appendChild(script);
  });

  return apiPromise;
}
