import { useCallback, useEffect, useRef, useState } from "react";
import {
  ApiError,
  createProduct,
  deleteProduct,
  fetchPulse,
  fetchSalon,
  reorderProducts,
  selectPlaylist,
  sendPlayback,
  updateProduct,
  updateSalon,
  type PlaybackAction,
} from "./api";
import { Console } from "./Console";
import { displayShop } from "./format";
import { dataUrlToBlob } from "./image";
import { extractPlaylistId } from "./playlist";
import { Stage, type VideoHandle } from "./Stage";
import type { SalonState } from "./storage";
import type { Appearance, PaletteId } from "./theme";
import { loadYouTubeApi } from "./youtube";

type HouseField = "shopName" | "tagline" | "playlistUrl";
type HousePatch = Partial<Pick<SalonState, HouseField>>;
type IssuedCommand = { seq: number; action: PlaybackAction };

const PULSE_MS = 700;

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function App() {
  const [state, setState] = useState<SalonState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [admin, setAdmin] = useState(false);
  const [nowPlaying, setNowPlaying] = useState("");
  const [playing, setPlaying] = useState(true);
  const playingRef = useRef(true);
  const playerRef = useRef<VideoHandle>(null);
  const stateRef = useRef<SalonState | null>(null);
  const pendingRef = useRef<HousePatch | null>(null);
  const timerRef = useRef<number | null>(null);
  const flightRef = useRef<Promise<string | null> | null>(null);
  const cursorRef = useRef<number | null>(null);
  const seenUpdatedAtRef = useRef<string | null>(null);
  const issuedRef = useRef<IssuedCommand[]>([]);
  const gateRef = useRef(Promise.resolve());
  const reportNowPlaying = useCallback((title: string) => {
    setNowPlaying((current) => (current === title ? current : title));
  }, []);
  const reportPlayback = useCallback((isPlaying: boolean) => {
    playingRef.current = isPlaying;
    setPlaying((current) => (current === isPlaying ? current : isPlaying));
  }, []);
  const applyServer = useCallback((salon: SalonState) => {
    seenUpdatedAtRef.current = salon.updatedAt;
    const pending = pendingRef.current;
    const next = pending ? { ...salon, ...pending } : salon;
    stateRef.current = next;
    setState(next);
  }, []);

  const runExclusive = useCallback((task: () => Promise<void> | void) => {
    const run = gateRef.current.then(task, task);
    gateRef.current = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }, []);

  const applyCommand = useCallback((action: PlaybackAction) => {
    if (stateRef.current?.live !== true) return true;
    const player = playerRef.current;
    if (!player) return false;
    if (action === "pause") return player.pause();
    if (action === "play") return player.play();
    if (action === "next") return player.next();
    if (action === "previous") return player.previous();
    return true;
  }, []);

  const absorb = useCallback(
    async (commands: IssuedCommand[], playbackSeq: number) => {
      let playing = playingRef.current;
      let touched = false;
      let blocked = false;
      for (const command of commands) {
        if (cursorRef.current !== null && command.seq <= cursorRef.current) continue;
        if (!applyCommand(command.action)) {
          blocked = true;
          break;
        }
        cursorRef.current = command.seq;
        playing = command.action !== "pause";
        touched = true;
        if (command.action === "next" || command.action === "previous") await wait(400);
      }
      if (!blocked && cursorRef.current !== null) {
        cursorRef.current = Math.max(cursorRef.current, playbackSeq);
      }
      if (touched) {
        playingRef.current = playing;
        setPlaying(playing);
      }
      issuedRef.current = issuedRef.current.filter(
        (command) => cursorRef.current === null || command.seq > cursorRef.current,
      );
    },
    [applyCommand],
  );

  const publish = useCallback(
    (action: PlaybackAction) =>
      sendPlayback(action).then((issued) => {
        issuedRef.current = [ ...issuedRef.current, issued ];
      }),
    [],
  );

  const togglePlayback = useCallback(() => {
    const next = !playingRef.current;
    const previous = playingRef.current;
    playingRef.current = next;
    setPlaying(next);
    void publish(next ? "play" : "pause").catch(() => {
      if (playingRef.current === next) {
        playingRef.current = previous;
        setPlaying(previous);
      }
    });
  }, [publish]);

  const skip = useCallback(
    (direction: "next" | "previous") => {
      playingRef.current = true;
      setPlaying(true);
      void publish(direction).catch(() => undefined);
    },
    [publish],
  );

  useEffect(() => {
    let alive = true;
    fetchSalon()
      .then((salon) => {
        if (!alive) return;
        seenUpdatedAtRef.current = salon.updatedAt;
        stateRef.current = salon;
        setState(salon);
      })
      .catch((error: unknown) => {
        if (!alive) return;
        setLoadError(error instanceof Error ? error.message : "Não consegui falar com o salão.");
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!state) return;
    document.title = state.live ? displayShop(state.shopName) : "O Salão";
  }, [state]);

  useEffect(() => {
    document.body.classList.toggle("is-live", state?.live === true);
    return () => document.body.classList.remove("is-live");
  }, [state?.live]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.appearance = state?.appearance ?? "dark";
    root.dataset.palette = state?.palette ?? "ouro";
  }, [state?.appearance, state?.palette]);

  useEffect(() => {
    if (!extractPlaylistId(state?.playlistUrl ?? "")) return;
    void loadYouTubeApi().catch(() => undefined);
  }, [state?.playlistUrl]);

  useEffect(() => {
    let alive = true;
    let timer = 0;

    const syncSalon = async (updatedAt: string) => {
      const seen = seenUpdatedAtRef.current;
      if (!updatedAt || !seen || updatedAt === seen) return;
      if (flightRef.current || pendingRef.current) return;
      try {
        const salon = await fetchSalon();
        if (!alive || flightRef.current || pendingRef.current) return;
        if (seenUpdatedAtRef.current !== seen) return;
        applyServer(salon);
      } catch {
        return;
      }
    };

    const tick = async () => {
      if (!stateRef.current) return;
      try {
        const after = cursorRef.current;
        const pulse = await fetchPulse(after);
        if (!alive) return;
        await runExclusive(async () => {
          if (!alive) return;
          if (cursorRef.current === null) {
            const mine = issuedRef.current
              .filter((command) => command.seq <= pulse.playbackSeq)
              .sort((left, right) => left.seq - right.seq);
            if (mine.length === 0) {
              cursorRef.current = pulse.playbackSeq;
              return;
            }
            const first = mine[0];
            if (!first) return;
            cursorRef.current = first.seq - 1;
            await absorb(mine, pulse.playbackSeq);
            return;
          }
          if (after === null) return;
          const pending = pulse.commands.filter((command) => command.seq > (cursorRef.current ?? 0));
          await absorb(pending, pulse.playbackSeq);
        });
        if (!alive) return;
        await syncSalon(pulse.updatedAt);
      } catch {
        return;
      }
    };

    const loop = () => {
      timer = window.setTimeout(() => {
        void tick().finally(() => {
          if (alive) loop();
        });
      }, PULSE_MS);
    };

    void tick().finally(() => {
      if (alive) loop();
    });

    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [absorb, applyServer, runExclusive]);

  const flush = useCallback(async (): Promise<string | null> => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const patch = pendingRef.current;
    if (!patch || Object.keys(patch).length === 0) return null;
    pendingRef.current = null;
    try {
      applyServer(await updateSalon(patch));
      return null;
    } catch (error) {
      const newer = pendingRef.current;
      pendingRef.current = Object.assign({}, patch, newer ?? {});
      return error instanceof ApiError ? error.message : "Não consegui salvar.";
    }
  }, [applyServer]);

  const enqueue = useCallback((run: () => Promise<string | null>) => {
    const previous = flightRef.current ?? Promise.resolve(null);
    const job = previous.then(run, run);
    flightRef.current = job;
    void job.finally(() => {
      if (flightRef.current === job) flightRef.current = null;
    });
    return job;
  }, []);

  const chooseTheme = useCallback(
    (appearance: Appearance, palette: PaletteId) => {
      const current = stateRef.current;
      if (!current || (current.appearance === appearance && current.palette === palette)) {
        return Promise.resolve(null);
      }
      const next = { ...current, appearance, palette };
      stateRef.current = next;
      setState(next);
      return enqueue(async () => {
        const flushed = await flush();
        if (flushed) return flushed;
        const latest = stateRef.current;
        if (latest) {
          const kept = { ...latest, appearance, palette };
          stateRef.current = kept;
          setState(kept);
        }
        try {
          applyServer(await updateSalon({ appearance, palette }));
          return null;
        } catch (error) {
          return error instanceof Error ? error.message : "Não consegui salvar.";
        }
      });
    },
    [applyServer, enqueue, flush],
  );

  const updateField = useCallback(
    (field: HouseField, value: string) => {
      const current = stateRef.current;
      if (!current) return;
      const next = { ...current, [field]: value };
      stateRef.current = next;
      setState(next);

      if (field === "playlistUrl" && value.trim() && !extractPlaylistId(value)) {
        if (pendingRef.current) {
          const rest = { ...pendingRef.current };
          delete rest.playlistUrl;
          pendingRef.current = Object.keys(rest).length > 0 ? rest : null;
        }
        return;
      }

      pendingRef.current = { ...pendingRef.current, [field]: value };
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        void enqueue(() => flush());
      }, 400);
    },
    [enqueue, flush],
  );

  const mutate = useCallback(
    (run: () => Promise<SalonState>) =>
      enqueue(async () => {
        const flushed = await flush();
        if (flushed) return flushed;
        try {
          applyServer(await run());
          return null;
        } catch (error) {
          return error instanceof Error ? error.message : "Não consegui salvar.";
        }
      }),
    [applyServer, enqueue, flush],
  );

  const saveProduct = useCallback(
    (draft: { id: string | null; name: string; description: string; image: string }) => {
      const image = draft.image.startsWith("data:") ? dataUrlToBlob(draft.image) : undefined;
      if (draft.id) {
        const id = draft.id;
        return mutate(() => updateProduct(id, { name: draft.name, description: draft.description, image }));
      }
      if (!image) return Promise.resolve("Escolha uma foto do produto.");
      return mutate(() => createProduct({ name: draft.name, description: draft.description, image }));
    },
    [mutate],
  );

  const removeProduct = useCallback((id: string) => mutate(() => deleteProduct(id)), [mutate]);

  const moveProduct = useCallback(
    (index: number, direction: -1 | 1) => {
      const current = stateRef.current;
      if (!current) return Promise.resolve(null);
      const target = index + direction;
      if (target < 0 || target >= current.products.length) return Promise.resolve(null);
      const products = current.products.slice();
      const [item] = products.splice(index, 1);
      if (!item) return Promise.resolve(null);
      products.splice(target, 0, item);
      return mutate(() => reorderProducts(products.map((product) => product.id)));
    },
    [mutate],
  );

  const openSalon = useCallback(async () => {
    const error = await mutate(() => updateSalon({ live: true }));
    if (error) return error;
    setAdmin(false);
    void document.documentElement.requestFullscreen?.().catch(() => undefined);
    return null;
  }, [mutate]);

  const endSalon = useCallback(() => {
    void mutate(() => updateSalon({ live: false })).then(() => {
      setAdmin(false);
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    });
  }, [mutate]);

  const choosePlaylist = useCallback(
    (id: string) => {
      if (pendingRef.current?.playlistUrl !== undefined) {
        const rest = { ...pendingRef.current };
        delete rest.playlistUrl;
        pendingRef.current = Object.keys(rest).length > 0 ? rest : null;
      }
      return mutate(() => selectPlaylist(id));
    },
    [mutate],
  );

  if (!state) {
    return (
      <main className="console-page">
        <section className="console-brand">
          <p className="eyebrow">Tela do salão</p>
          <h1>{loadError ? "O salão não respondeu" : "Abrindo o salão…"}</h1>
          {loadError ? <p className="brand-line">{loadError}</p> : null}
        </section>
      </main>
    );
  }

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
          onPlayback={reportPlayback}
        />
      ) : (
        <Console
          variant="page"
          state={state}
          onUpdateField={updateField}
          onSaveProduct={saveProduct}
          onDeleteProduct={removeProduct}
          onMoveProduct={moveProduct}
          onOpenSalon={openSalon}
          onEndSalon={endSalon}
          onSelectPlaylist={choosePlaylist}
          onChooseTheme={chooseTheme}
        />
      )}
      {state.live && admin ? (
        <Console
          variant="drawer"
          state={state}
          onUpdateField={updateField}
          onSaveProduct={saveProduct}
          onDeleteProduct={removeProduct}
          onMoveProduct={moveProduct}
          onOpenSalon={openSalon}
          onEndSalon={endSalon}
          onSelectPlaylist={choosePlaylist}
          onChooseTheme={chooseTheme}
          onClose={() => setAdmin(false)}
          onNext={() => skip("next")}
          onPrevious={() => skip("previous")}
          onTogglePlayback={togglePlayback}
          playing={playing}
          nowPlaying={nowPlaying}
        />
      ) : null}
    </>
  );
}
