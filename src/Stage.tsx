import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { displayShop, displayTagline, formatClock, formatDay, greeting, monogram } from "./format";
import { computeScene, toStyle, type Box, type Mode, type SceneCard, type VoidSpot } from "./layout";
import { extractPlaylistId } from "./playlist";
import type { Product, SalonState } from "./storage";
import {
  PLAYER_BUFFERING,
  PLAYER_ENDED,
  PLAYER_PLAYING,
  loadYouTubeApi,
  type YouTubePlayer,
} from "./youtube";

const DWELL: Record<Mode, number> = { cinema: 48000, vitrine: 34000 };
const MOVE_MS = 1080;
const FADE_MS = 420;

type StageProps = {
  state: SalonState;
  adminOpen: boolean;
  onOpenAdmin: () => void;
  onCloseAdmin: () => void;
};

type Phase = "show" | "clear" | "move";

export type VideoHandle = {
  unmute: () => void;
};

type VideoFrameProps = {
  playlistId: string;
  box: Box;
  onTitle: (title: string) => void;
  onNeedsSound: (needs: boolean) => void;
};

export function Stage({ state, adminOpen, onOpenAdmin, onCloseAdmin }: StageProps) {
  const stageRef = useRef<HTMLElement>(null);
  const videoRef = useRef<VideoHandle>(null);
  const [size, setSize] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));
  const [mode, setMode] = useState<Mode>("cinema");
  const [phase, setPhase] = useState<Phase>("move");
  const [offset, setOffset] = useState(0);
  const [videoTitle, setVideoTitle] = useState("");
  const [needsSound, setNeedsSound] = useState(false);
  const [idle, setIdle] = useState(false);
  const frame: Mode = adminOpen ? "vitrine" : mode;
  const adsOn = phase === "show" && !adminOpen;

  const scene = useMemo(
    () => computeScene(size.width, size.height, frame, state.products, offset),
    [size.width, size.height, frame, state.products, offset],
  );

  const playlistId = extractPlaylistId(state.playlistUrl);
  const shop = displayShop(state.shopName);
  const tagline = displayTagline(state.tagline);
  const featured = scene.cards[0] ? state.products[scene.cards[0].productIndex] : undefined;

  useEffect(() => {
    const element = stageRef.current;
    if (!element) return undefined;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize((current) =>
        current.width === width && current.height === height ? current : { width, height },
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const drawerLeft = scene.wide ? scene.video.left + scene.video.width + 22 : 0;
  const drawerTop = scene.wide ? 0 : scene.video.top + scene.video.height + scene.caption.height + 12;
  document.documentElement.style.setProperty("--drawer-left", `${Math.round(drawerLeft)}px`);
  document.documentElement.style.setProperty("--drawer-top", `${Math.round(drawerTop)}px`);

  useEffect(() => {
    if (!adminOpen) return;
    setPhase("move");
  }, [adminOpen]);

  useEffect(() => {
    if (adminOpen) return undefined;
    const delay = phase === "show" ? DWELL[mode] : phase === "clear" ? FADE_MS : MOVE_MS;
    const id = window.setTimeout(() => {
      if (phase === "show") {
        setPhase("clear");
        return;
      }
      if (phase === "clear") {
        setMode((current) => (current === "cinema" ? "vitrine" : "cinema"));
        setPhase("move");
        return;
      }
      setPhase("show");
    }, delay);
    return () => window.clearTimeout(id);
  }, [adminOpen, mode, phase]);

  const modeRef = useRef(mode);
  useEffect(() => {
    if (modeRef.current === mode) return;
    modeRef.current = mode;
    setOffset((value) => value + 1);
  }, [mode]);

  useEffect(() => {
    if (adminOpen || phase !== "show" || state.products.length < 2) return undefined;
    const interval = mode === "cinema" ? 11000 : 13000;
    const id = window.setInterval(() => setOffset((value) => value + 1), interval);
    return () => window.clearInterval(id);
  }, [adminOpen, phase, mode, state.products.length]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) return;
      }
      if (event.key === "g" || event.key === "G") {
        if (adminOpen) onCloseAdmin();
        else onOpenAdmin();
      }
      if (event.key === "f" || event.key === "F") {
        if (document.fullscreenElement) void document.exitFullscreen();
        else void document.documentElement.requestFullscreen().catch(() => undefined);
      }
      if (event.key === "Escape" && adminOpen) onCloseAdmin();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [adminOpen, onCloseAdmin, onOpenAdmin]);

  const idleRef = useRef(false);
  useEffect(() => {
    if (adminOpen) {
      idleRef.current = false;
      setIdle(false);
      return undefined;
    }
    let timer = window.setTimeout(() => {
      idleRef.current = true;
      setIdle(true);
    }, 3200);
    const wake = () => {
      if (idleRef.current) {
        idleRef.current = false;
        setIdle(false);
      }
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        idleRef.current = true;
        setIdle(true);
      }, 3200);
    };
    window.addEventListener("mousemove", wake);
    window.addEventListener("pointerdown", wake);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("mousemove", wake);
      window.removeEventListener("pointerdown", wake);
    };
  }, [adminOpen]);

  const onTitle = useCallback((title: string) => {
    setVideoTitle((current) => (current === title ? current : title));
  }, []);

  const enableSound = () => {
    videoRef.current?.unmute();
    setNeedsSound(false);
  };

  return (
    <section
      ref={stageRef}
      className={idle && !adminOpen ? "stage is-idle" : "stage"}
      data-mode={frame}
    >
      <div className="atmosphere atmosphere-cinema" style={{ opacity: frame === "cinema" ? 1 : 0 }} />
      <div className="atmosphere atmosphere-vitrine" style={{ opacity: frame === "vitrine" ? 1 : 0 }} />
      <svg className="grain" aria-hidden="true">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>

      <div className={adsOn ? "ads" : "ads is-quiet"} aria-hidden={adsOn ? undefined : true}>
        {scene.rule ? (
          <div className="rule" style={{ left: scene.rule.x, top: scene.rule.top, height: scene.rule.height }} />
        ) : null}
        {scene.voids.map((spot) => (
          <VoidPanel key={spot.key} spot={spot} shop={shop} tagline={tagline} />
        ))}
        {scene.cards.map((card, index) => {
          const product = state.products[card.productIndex];
          if (!product) return null;
          return <ProductCard key={card.key} card={card} product={product} delay={index * 90} />;
        })}
      </div>

      {playlistId ? (
        <VideoFrame
          ref={videoRef}
          playlistId={playlistId}
          box={scene.video}
          onTitle={onTitle}
          onNeedsSound={setNeedsSound}
        />
      ) : (
        <div className="video-frame" style={toStyle(scene.video)}>
          <div className="poster">
            <p>Cole o link da playlist na gestão.</p>
          </div>
        </div>
      )}

      <Caption box={scene.caption} frame={frame} title={videoTitle} product={adsOn ? featured : undefined} />

      <header className="topbar">
        <button
          type="button"
          className="brand"
          onClick={adminOpen ? onCloseAdmin : onOpenAdmin}
          title="Abrir a gestão"
        >
          <span className="brand-kicker">{tagline}</span>
          <span className="brand-name">{shop}</span>
          <span className="brand-action">{adminOpen ? "Voltar" : "Gestão"}</span>
        </button>
        {adminOpen ? null : <Now />}
      </header>

      {needsSound && !adminOpen ? (
        <button type="button" className="sound" onClick={enableSound}>
          Ativar som
        </button>
      ) : null}

      {adsOn ? (
        <div className="rhythm" key={mode}>
          <span style={{ animationDuration: `${DWELL[mode]}ms` }} />
        </div>
      ) : null}

      {adminOpen ? null : <p className="hints">G gestão · F tela cheia</p>}
      <p className="sr-only" aria-live="polite">
        {frame === "cinema" ? "Sala, vídeo em destaque" : "Vitrine, produto em destaque"}
      </p>
    </section>
  );
}

function Now() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <>
      <p className="greeting">{greeting(now)}</p>
      <div className="clock">
        <strong>{formatClock(now)}</strong>
        <span>{formatDay(now)}</span>
      </div>
    </>
  );
}

function Caption({
  box,
  frame,
  title,
  product,
}: {
  box: Box;
  frame: Mode;
  title: string;
  product?: Product;
}) {
  if (box.height < 20) return null;
  return (
    <footer className="caption" style={toStyle(box)}>
      {title ? (
        <p className="now">
          <span>Em cena</span>
          {title}
        </p>
      ) : (
        <p className="now">
          <span>Em cena</span>
          A playlist vai começar
        </p>
      )}
      {frame === "cinema" && product && box.height > 64 ? (
        <p className="whisper">
          <span>{product.name}</span>
          {product.description}
        </p>
      ) : null}
    </footer>
  );
}

function ProductCard({ card, product, delay }: { card: SceneCard; product: Product; delay: number }) {
  const index = String(card.productIndex + 1).padStart(2, "0");
  return (
    <article className={`card card-${card.variant}`} style={toStyle(card.box)}>
      <div className="card-in" key={`${product.id}-${card.variant}`} style={{ animationDelay: `${delay}ms` }}>
        {card.variant === "quote" ? (
          <div className="quote">
            <p className="eyebrow">Na casa</p>
            <p className="quote-text">{product.description}</p>
            <p className="quote-name">{product.name}</p>
          </div>
        ) : (
          <>
            <img src={product.image} alt="" draggable={false} style={{ animationDelay: `${card.productIndex * -7}s` }} />
            <div className="scrim" />
            <div className="card-copy">
              {card.variant === "hero" ? <p className="eyebrow">Em destaque</p> : <p className="index">{index}</p>}
              <h2>{product.name}</h2>
              {card.box.height > 168 ? <p className="desc">{product.description}</p> : null}
            </div>
          </>
        )}
      </div>
    </article>
  );
}

function VoidPanel({ spot, shop, tagline }: { spot: VoidSpot; shop: string; tagline: string }) {
  return (
    <div className={`void void-${spot.role}`} style={toStyle(spot.box)}>
      {spot.role === "note" ? (
        <p>Cadastre os produtos da casa para ocuparem este entorno.</p>
      ) : (
        <span className="monogram">{monogram(shop)}</span>
      )}
      {spot.role === "both" ? <p>{tagline}. A vitrine acende quando os produtos entrarem.</p> : null}
    </div>
  );
}

const VideoFrame = memo(
  forwardRef<VideoHandle, VideoFrameProps>(function VideoFrame({ playlistId, box, onTitle, onNeedsSound }, ref) {
    const shellRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<YouTubePlayer | null>(null);
    const playlistRef = useRef(playlistId);
    const loadedRef = useRef<string | null>(null);
    const onTitleRef = useRef(onTitle);
    const onNeedsSoundRef = useRef(onNeedsSound);
    const [playing, setPlaying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [ready, setReady] = useState(false);

    playlistRef.current = playlistId;
    onTitleRef.current = onTitle;
    onNeedsSoundRef.current = onNeedsSound;

    useImperativeHandle(ref, () => ({
      unmute() {
        const player = playerRef.current;
        if (!player) return;
        player.unMute();
        player.setVolume(80);
        player.playVideo();
      },
    }));

    useEffect(() => {
      const shell = shellRef.current;
      if (!shell) return undefined;
      const mount = document.createElement("div");
      mount.className = "video-mount";
      shell.appendChild(mount);
      let alive = true;
      let player: YouTubePlayer | null = null;
      const lateTimers: number[] = [];

      loadYouTubeApi()
        .then(() => {
          if (!alive || !window.YT?.Player) return;
          player = new window.YT.Player(mount, {
            width: "100%",
            height: "100%",
            playerVars: {
              autoplay: 1,
              controls: 0,
              disablekb: 1,
              fs: 0,
              modestbranding: 1,
              rel: 0,
              iv_load_policy: 3,
              playsinline: 1,
              listType: "playlist",
              list: playlistRef.current,
              origin: window.location.origin,
            },
            events: {
              onReady: (event) => {
                if (!alive) return;
                playerRef.current = event.target;
                loadedRef.current = playlistRef.current;
                event.target.unMute();
                event.target.setVolume(80);
                event.target.playVideo();
                setReady(true);
              },
              onStateChange: (event) => {
                if (!alive) return;
                if (event.data === PLAYER_PLAYING) {
                  setPlaying(true);
                  setError(null);
                  const title = event.target.getVideoData()?.title ?? "";
                  if (title) onTitleRef.current(title);
                  if (event.target.isMuted()) onNeedsSoundRef.current(true);
                  return;
                }
                if (event.data !== PLAYER_ENDED) return;
                lateTimers.push(
                  window.setTimeout(() => {
                    if (!alive) return;
                    const current = playerRef.current;
                    if (!current || current.getPlayerState() !== PLAYER_ENDED) return;
                    current.loadPlaylist({ list: playlistRef.current, index: 0 });
                    current.playVideo();
                  }, 800),
                );
              },
              onError: (event) => {
                if (!alive) return;
                if (event.data === 101 || event.data === 150) {
                  setError("Um vídeo desta playlist não pode entrar na tela. O próximo segue, se o YouTube deixar.");
                  return;
                }
                setError("Não consegui abrir esta playlist.");
              },
            },
          });
        })
        .catch(() => {
          if (alive) setError("O YouTube não respondeu. Confira a conexão e tente de novo.");
        });

      return () => {
        alive = false;
        for (const id of lateTimers) window.clearTimeout(id);
        try {
          player?.destroy();
        } catch {
          // O player já pode ter sido removido.
        }
        playerRef.current = null;
        shell.replaceChildren();
      };
    }, []);

    useEffect(() => {
      if (!ready) return;
      const player = playerRef.current;
      if (!player) return;
      if (loadedRef.current === playlistId) return;
      loadedRef.current = playlistId;
      setPlaying(false);
      player.loadPlaylist({ list: playlistId, index: 0 });
      player.playVideo();
    }, [playlistId, ready]);

    useEffect(() => {
      if (!ready) return undefined;
      const id = window.setTimeout(() => {
        const player = playerRef.current;
        if (!player) return;
        try {
          const status = player.getPlayerState();
          const running = status === PLAYER_PLAYING || status === PLAYER_BUFFERING;
          if (!running) {
            player.mute();
            player.playVideo();
            onNeedsSoundRef.current(true);
            return;
          }
          if (player.isMuted()) onNeedsSoundRef.current(true);
        } catch {
          onNeedsSoundRef.current(true);
        }
      }, 1800);
      return () => window.clearTimeout(id);
    }, [ready]);

    return (
      <div className="video-frame" style={toStyle(box)}>
        <div ref={shellRef} className="video-host-slot" />
        <span className="corner tl" />
        <span className="corner tr" />
        <span className="corner bl" />
        <span className="corner br" />
        <div className={playing && !error ? "poster is-gone" : "poster"}>
          <p>{error ?? "A sessão vai começar"}</p>
        </div>
      </div>
    );
  }),
);
