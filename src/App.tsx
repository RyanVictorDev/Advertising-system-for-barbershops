import { useCallback, useEffect, useRef, useState } from "react";
import { Console } from "./Console";
import { displayShop } from "./format";
import { extractPlaylistId } from "./playlist";
import { Stage, type VideoHandle } from "./Stage";
import { loadState, saveState, type SalonState } from "./storage";
import { loadYouTubeApi } from "./youtube";

export function App() {
  const [state, setState] = useState(loadState);
  const [admin, setAdmin] = useState(false);
  const [nowPlaying, setNowPlaying] = useState("");
  const playerRef = useRef<VideoHandle>(null);
  const reportNowPlaying = useCallback((title: string) => {
    setNowPlaying((current) => (current === title ? current : title));
  }, []);
  const stateRef = useRef(state);
  stateRef.current = state;

  const commit = useCallback((recipe: (current: SalonState) => SalonState) => {
    const next = recipe(stateRef.current);
    const error = saveState(next);
    if (error) return error;
    stateRef.current = next;
    setState(next);
    return null;
  }, []);

  useEffect(() => {
    document.title = state.live ? displayShop(state.shopName) : "O Salão";
  }, [state.live, state.shopName]);

  useEffect(() => {
    document.body.classList.toggle("is-live", state.live);
    return () => document.body.classList.remove("is-live");
  }, [state.live]);

  useEffect(() => {
    if (!extractPlaylistId(state.playlistUrl)) return;
    void loadYouTubeApi().catch(() => undefined);
  }, [state.playlistUrl]);

  const openSalon = useCallback(() => {
    const error = commit((current) => ({ ...current, live: true }));
    if (error) return error;
    setAdmin(false);
    void document.documentElement.requestFullscreen?.().catch(() => undefined);
    return null;
  }, [commit]);

  const endSalon = useCallback(() => {
    commit((current) => ({ ...current, live: false }));
    setAdmin(false);
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
  }, [commit]);

  return (
    <>
      {state.live ? (
        <Stage
          state={state}
          adminOpen={admin}
          onOpenAdmin={() => setAdmin(true)}
          onCloseAdmin={() => setAdmin(false)}
          playerRef={playerRef}
          onNowPlaying={reportNowPlaying}
        />
      ) : (
        <Console variant="page" state={state} onChange={commit} onOpenSalon={openSalon} onEndSalon={endSalon} />
      )}
      {state.live && admin ? (
        <Console
          variant="drawer"
          state={state}
          onChange={commit}
          onOpenSalon={openSalon}
          onEndSalon={endSalon}
          onClose={() => setAdmin(false)}
          onNext={() => playerRef.current?.next()}
          onPrevious={() => playerRef.current?.previous()}
          nowPlaying={nowPlaying}
        />
      ) : null}
    </>
  );
}
