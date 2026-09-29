import { useEffect, useId, useRef, useState } from "react";
import { searchPlaylists, type PlaylistHit } from "./api";
import { displayShop, displayTagline, monogram } from "./format";
import { compressImage } from "./image";
import { extractPlaylistId } from "./playlist";
import type { SalonState } from "./storage";
import { appearanceNames, appearances, palettes, type Appearance, type PaletteId } from "./theme";

type ProductDraft = {
  id: string | null;
  name: string;
  description: string;
  image: string;
};

type ConsoleProps = {
  variant: "page" | "drawer";
  state: SalonState;
  onUpdateField: (field: "shopName" | "tagline" | "playlistUrl", value: string) => void;
  onSaveProduct: (draft: ProductDraft) => Promise<string | null>;
  onDeleteProduct: (id: string) => Promise<string | null>;
  onMoveProduct: (index: number, direction: -1 | 1) => Promise<string | null>;
  onOpenSalon: () => Promise<string | null>;
  onEndSalon: () => void;
  onSelectPlaylist: (id: string) => Promise<string | null>;
  onChooseTheme: (appearance: Appearance, palette: PaletteId) => Promise<string | null>;
  onClose?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onTogglePlayback?: () => void;
  playing?: boolean;
  nowPlaying?: string;
};

const emptyDraft: ProductDraft = { id: null, name: "", description: "", image: "" };

export function Console({
  variant,
  state,
  onUpdateField,
  onSaveProduct,
  onDeleteProduct,
  onMoveProduct,
  onOpenSalon,
  onEndSalon,
  onSelectPlaylist,
  onChooseTheme,
  onClose,
  onNext,
  onPrevious,
  onTogglePlayback,
  playing = true,
  nowPlaying,
}: ConsoleProps) {
  const shop = displayShop(state.shopName);
  const tagline = displayTagline(state.tagline);
  const fields = (
    <SalonFields
      state={state}
      onUpdateField={onUpdateField}
      onSaveProduct={onSaveProduct}
      onDeleteProduct={onDeleteProduct}
      onMoveProduct={onMoveProduct}
      onOpenSalon={onOpenSalon}
      onEndSalon={onEndSalon}
      onSelectPlaylist={onSelectPlaylist}
      onChooseTheme={onChooseTheme}
      variant={variant}
    />
  );

  if (variant === "drawer") {
    return (
      <aside className="drawer" aria-label="Gestão do salão">
        <div className="drawer-inner">
          <div className="drawer-head">
            <div>
              <p className="eyebrow">Gestão</p>
              <h2>O vídeo continua ao lado.</h2>
            </div>
            {onClose ? (
              <button type="button" className="btn btn-primary" onClick={onClose}>
                Voltar à tela
              </button>
            ) : null}
          </div>
          {onNext && onPrevious && onTogglePlayback ? (
            <div className="skip-row">
              <div className="skip-actions">
                <button type="button" className="btn btn-ghost" onClick={onPrevious}>
                  Música anterior
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={onTogglePlayback}
                  aria-pressed={!playing}
                >
                  {playing ? "Pausar" : "Tocar"}
                </button>
                <button type="button" className="btn btn-ghost" onClick={onNext}>
                  Próxima música
                </button>
              </div>
              <p>{nowPlaying ? nowPlaying : "A faixa em cena aparece aqui."}</p>
            </div>
          ) : null}
          {fields}
        </div>
      </aside>
    );
  }

  return (
    <main className="console-page">
      <section className="console-brand">
        <p className="watermark" aria-hidden="true">
          {monogram(shop)}
        </p>
        <p className="eyebrow">Tela do salão</p>
        <h1>{shop}</h1>
        <p className="brand-line">{tagline}</p>
        <p className="manifesto">
          A playlist fica em cena o tempo todo. A tela respira em dois tempos: primeiro a sala, com o vídeo
          maior e os produtos no entorno; depois a vitrine, quando a imagem recolhe e um produto assume.
        </p>
        <div className="schematic" aria-hidden="true">
          <figure>
            <div className="mini mini-cinema">
              <i />
              <b />
              <i />
            </div>
            <figcaption>Sala</figcaption>
          </figure>
          <figure>
            <div className="mini mini-vitrine">
              <b />
              <i />
            </div>
            <figcaption>Vitrine</figcaption>
          </figure>
        </div>
      </section>
      <section className="console-form">{fields}</section>
    </main>
  );
}

function SalonFields({
  state,
  onUpdateField,
  onSaveProduct,
  onDeleteProduct,
  onMoveProduct,
  onOpenSalon,
  onEndSalon,
  onSelectPlaylist,
  onChooseTheme,
  variant,
}: ConsoleProps) {
  const nameId = useId();
  const taglineId = useId();
  const playlistIdField = useId();
  const productNameId = useId();
  const productDescId = useId();
  const [draft, setDraft] = useState<ProductDraft>(emptyDraft);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [playlistQuery, setPlaylistQuery] = useState("");
  const [history, setHistory] = useState<PlaylistHit[]>([]);
  const [historyReady, setHistoryReady] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const playlistId = extractPlaylistId(state.playlistUrl);
  const savedPlaylist = state.playlists.find((item) => item.youtubeId === playlistId);
  const productToRemove = state.products.find((product) => product.id === pendingDelete) ?? null;
  const playlistQueryId = useId();

  useEffect(() => {
    const query = playlistQuery.trim();
    if (!query) {
      setHistory(state.playlists);
      setHistoryError(null);
      setHistoryReady(true);
      return;
    }

    let alive = true;
    const handle = window.setTimeout(() => {
      searchPlaylists(query)
        .then((items) => {
          if (!alive) return;
          setHistory(items);
          setHistoryError(null);
          setHistoryReady(true);
        })
        .catch(() => {
          if (!alive) return;
          setHistory([]);
          setHistoryError("Não consegui carregar as playlists.");
          setHistoryReady(true);
        });
    }, 250);
    return () => {
      alive = false;
      window.clearTimeout(handle);
    };
  }, [playlistQuery, state.playlists]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
  }, [productToRemove]);

  const update = (field: "shopName" | "tagline" | "playlistUrl", value: string) => {
    onUpdateField(field, value);
    setBanner(null);
  };

  const take = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setFormError(null);
    try {
      const image = await compressImage(file);
      setDraft((current) => ({ ...current, image }));
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : "Não consegui usar esta foto.");
    } finally {
      setBusy(false);
    }
  };

  const submit = () => {
    const name = draft.name.trim();
    const description = draft.description.trim();
    if (!name || !description) {
      setFormError("Preencha o nome e a descrição.");
      return;
    }
    if (!draft.image) {
      setFormError("Escolha uma foto do produto.");
      return;
    }
    if (busy) return;
    setBusy(true);
    void onSaveProduct({ id: draft.id, name, description, image: draft.image }).then((error) => {
      setBusy(false);
      if (error) {
        setFormError(error);
        return;
      }
      setDraft(emptyDraft);
      setFormError(null);
      setPendingDelete(null);
    });
  };

  const move = (index: number, direction: -1 | 1) => {
    void onMoveProduct(index, direction).then(setBanner);
  };

  return (
    <div className="fields">
      <section>
        <p className="section-label">A casa</p>
        <label htmlFor={nameId}>Nome da barbearia</label>
        <input
          id={nameId}
          value={state.shopName}
          maxLength={42}
          placeholder="Nome da casa"
          autoComplete="off"
          onChange={(event) => update("shopName", event.target.value)}
        />
        <label htmlFor={taglineId}>Assinatura</label>
        <input
          id={taglineId}
          value={state.tagline}
          maxLength={42}
          placeholder="Barbearia"
          autoComplete="off"
          onChange={(event) => update("tagline", event.target.value)}
        />
      </section>

      <section>
        <p className="section-label">Aparência</p>
        <p className="section-note">Escuro ou claro, e a paleta da casa. A TV usa a mesma escolha.</p>
        <div className="theme-modes" role="group" aria-label="Tema">
          {appearances.map((appearance) => (
            <button
              key={appearance}
              type="button"
              className={state.appearance === appearance ? "is-on" : undefined}
              aria-pressed={state.appearance === appearance}
              onClick={() => {
                void onChooseTheme(appearance, state.palette).then(setBanner);
              }}
            >
              {appearanceNames[appearance]}
            </button>
          ))}
        </div>
        <div className="theme-palettes" role="group" aria-label="Paleta">
          {palettes.map((palette) => (
            <button
              key={palette.id}
              type="button"
              className={state.palette === palette.id ? "is-on" : undefined}
              aria-pressed={state.palette === palette.id}
              onClick={() => {
                void onChooseTheme(state.appearance, palette.id).then(setBanner);
              }}
            >
              <span className="swatch" style={{ background: palette.swatch }} />
              {palette.name}
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="section-label">Playlist</p>
        <label htmlFor={playlistIdField}>Link da playlist do YouTube</label>
        <input
          id={playlistIdField}
          value={state.playlistUrl}
          placeholder="https://www.youtube.com/playlist?list=..."
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => update("playlistUrl", event.target.value)}
        />
        {state.playlistUrl.trim() && !playlistId ? (
          <p className="field-error">Não encontrei o código da playlist nesse link.</p>
        ) : null}
        {playlistId ? (
          <p className="field-ok">
            {savedPlaylist?.title
              ? `${savedPlaylist.title}. Os vídeos entram um após o outro.`
              : "Playlist reconhecida. Os vídeos entram um após o outro."}
          </p>
        ) : null}
        <label htmlFor={playlistQueryId} className="history-label">Histórico de playlists</label>
        <input
          id={playlistQueryId}
          value={playlistQuery}
          placeholder="Procurar por nome, link ou código"
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => setPlaylistQuery(event.target.value)}
        />
        {historyError ? <p className="field-error">{historyError}</p> : null}
        {historyReady && history.length === 0 ? (
          <p className="section-note">
            {playlistQuery.trim() ? "Nenhuma playlist com esse texto." : "Nenhuma playlist salva ainda."}
          </p>
        ) : (
          <ul className="playlist-history">
            {history.map((item) => {
              const current = extractPlaylistId(item.url) === playlistId && playlistId !== null;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={current ? "is-current" : undefined}
                    onClick={() => {
                      void onSelectPlaylist(item.id).then(setBanner);
                    }}
                  >
                    <span className="playlist-title">{item.title || item.url}</span>
                    {item.title ? <span className="playlist-link">{item.url}</span> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <p className="section-label">Produtos</p>
        <p className="section-note">
          Foto, nome e descrição. A ordem da lista é a ordem em que entram na tela.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <label
            className={drag ? "photo-drop is-drag" : "photo-drop"}
            onDragOver={(event) => {
              event.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDrag(false);
              void take(event.dataTransfer.files[0]);
            }}
          >
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                void take(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            {draft.image ? <img src={draft.image} alt="" /> : <span>{busy ? "Preparando a foto…" : "Solte a foto ou clique para escolher"}</span>}
          </label>
          <label htmlFor={productNameId}>Nome</label>
          <input
            id={productNameId}
            value={draft.name}
            maxLength={60}
            placeholder="Pomada matte"
            autoComplete="off"
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
          />
          <label htmlFor={productDescId}>Descrição</label>
          <textarea
            id={productDescId}
            value={draft.description}
            maxLength={240}
            rows={3}
            placeholder="Para quem é, o que promete, como usa."
            onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
          />
          {formError ? <p className="field-error" role="alert">{formError}</p> : null}
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {draft.id ? "Atualizar produto" : "Adicionar produto"}
            </button>
            {draft.id ? (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setDraft(emptyDraft);
                  setFormError(null);
                }}
              >
                Cancelar edição
              </button>
            ) : null}
          </div>
        </form>

        {state.products.length === 0 ? (
          <p className="section-note">Nenhum produto ainda. A tela abre mesmo assim — a vitrine espera.</p>
        ) : (
          <ul className="product-list">
            {state.products.map((product, index) => (
              <li key={product.id} className={draft.id === product.id ? "is-editing" : undefined}>
                <img src={product.image} alt="" />
                <div>
                  <strong>{product.name}</strong>
                  <p>{product.description}</p>
                </div>
                <div className="product-actions">
                  <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Subir ${product.name}`}>
                    Subir
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === state.products.length - 1}
                    aria-label={`Descer ${product.name}`}
                  >
                    Descer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDraft({
                        id: product.id,
                        name: product.name,
                        description: product.description,
                        image: product.image,
                      });
                      setFormError(null);
                      setPendingDelete(null);
                    }}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => {
                      setRemoveError(null);
                      setPendingDelete(product.id);
                    }}
                  >
                    Remover
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {banner ? <p className="field-error" role="alert">{banner}</p> : null}

      {variant === "page" ? (
        <div className="open-row">
          <button
            type="button"
            className="btn btn-primary btn-large"
            disabled={!playlistId}
            onClick={() => {
              void onOpenSalon().then(setBanner);
            }}
          >
            Abrir o salão
          </button>
          {playlistId ? null : <p className="section-note">Cole o link de uma playlist para abrir.</p>}
        </div>
      ) : (
        <div className="open-row">
          <button type="button" className="btn btn-end" onClick={onEndSalon}>
            Encerrar a tela
          </button>
        </div>
      )}

      {productToRemove ? (
        <dialog
          ref={dialogRef}
          className="confirm"
          aria-labelledby="confirm-title"
          onKeyDown={(event) => {
            if (event.key === "Escape") event.stopPropagation();
          }}
          onCancel={(event) => {
            if (removing) event.preventDefault();
          }}
          onClose={() => {
            if (!removing) setPendingDelete(null);
          }}
          onMouseDown={(event) => {
            if (event.target === dialogRef.current && !removing) dialogRef.current?.close();
          }}
        >
          <p className="eyebrow">Produto</p>
          <h2 id="confirm-title">Remover {productToRemove.name}?</h2>
          <p>A foto, o nome e a descrição saem da vitrine.</p>
          {removeError ? <p className="field-error">{removeError}</p> : null}
          <div className="confirm-actions">
            <button type="button" className="btn btn-ghost" disabled={removing} onClick={() => dialogRef.current?.close()}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-danger"
              disabled={removing}
              onClick={() => {
                const id = productToRemove.id;
                setRemoving(true);
                setRemoveError(null);
                void onDeleteProduct(id).then((error) => {
                  setRemoving(false);
                  if (error) {
                    setRemoveError(error);
                    return;
                  }
                  if (draft.id === id) setDraft(emptyDraft);
                  setPendingDelete(null);
                });
              }}
            >
              Remover
            </button>
          </div>
        </dialog>
      ) : null}
    </div>
  );
}
