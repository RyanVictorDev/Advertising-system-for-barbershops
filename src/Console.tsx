import { useId, useState } from "react";
import { displayShop, displayTagline, monogram } from "./format";
import { compressImage } from "./image";
import { extractPlaylistId } from "./playlist";
import type { Product, SalonState } from "./storage";

type ConsoleProps = {
  variant: "page" | "drawer";
  state: SalonState;
  onChange: (recipe: (current: SalonState) => SalonState) => string | null;
  onOpenSalon: () => string | null;
  onEndSalon: () => void;
  onClose?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  nowPlaying?: string;
};

type Draft = {
  id: string | null;
  name: string;
  description: string;
  image: string;
};

const emptyDraft: Draft = { id: null, name: "", description: "", image: "" };

export function Console({
  variant,
  state,
  onChange,
  onOpenSalon,
  onEndSalon,
  onClose,
  onNext,
  onPrevious,
  nowPlaying,
}: ConsoleProps) {
  const shop = displayShop(state.shopName);
  const tagline = displayTagline(state.tagline);
  const fields = (
    <SalonFields
      state={state}
      onChange={onChange}
      onOpenSalon={onOpenSalon}
      onEndSalon={onEndSalon}
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
          {onNext && onPrevious ? (
            <div className="skip-row">
              <div className="skip-actions">
                <button type="button" className="btn btn-ghost" onClick={onPrevious}>
                  Música anterior
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
  onChange,
  onOpenSalon,
  onEndSalon,
  variant,
}: ConsoleProps) {
  const nameId = useId();
  const taglineId = useId();
  const playlistIdField = useId();
  const productNameId = useId();
  const productDescId = useId();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const playlistId = extractPlaylistId(state.playlistUrl);

  const update = (field: "shopName" | "tagline" | "playlistUrl", value: string) => {
    setBanner(onChange((current) => ({ ...current, [field]: value })));
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
    const error = onChange((current) => {
      if (draft.id) {
        return {
          ...current,
          products: current.products.map((item) =>
            item.id === draft.id ? { ...item, name, description, image: draft.image } : item,
          ),
        };
      }
      const product: Product = { id: crypto.randomUUID(), name, description, image: draft.image };
      return { ...current, products: [...current.products, product] };
    });
    if (error) {
      setFormError(error);
      return;
    }
    setDraft(emptyDraft);
    setFormError(null);
    setPendingDelete(null);
  };

  const move = (index: number, direction: -1 | 1) => {
    setBanner(
      onChange((current) => {
        const target = index + direction;
        if (target < 0 || target >= current.products.length) return current;
        const products = current.products.slice();
        const [item] = products.splice(index, 1);
        if (!item) return current;
        products.splice(target, 0, item);
        return { ...current, products };
      }),
    );
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
        {playlistId ? <p className="field-ok">Playlist reconhecida. Os vídeos entram um após o outro.</p> : null}
      </section>

      <section>
        <p className="section-label">Produtos</p>
        <p className="section-note">
          Foto, nome e descrição. A ordem da lista é a ordem em que entram na tela. Tudo fica no cache deste
          navegador.
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
                      if (pendingDelete !== product.id) {
                        setPendingDelete(product.id);
                        return;
                      }
                      setBanner(
                        onChange((current) => ({
                          ...current,
                          products: current.products.filter((item) => item.id !== product.id),
                        })),
                      );
                      if (draft.id === product.id) setDraft(emptyDraft);
                      setPendingDelete(null);
                    }}
                  >
                    {pendingDelete === product.id ? "Confirmar" : "Remover"}
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
          <button type="button" className="btn btn-primary btn-large" disabled={!playlistId} onClick={() => setBanner(onOpenSalon())}>
            Abrir o salão
          </button>
          {playlistId ? null : <p className="section-note">Cole o link de uma playlist para abrir.</p>}
        </div>
      ) : (
        <div className="open-row">
          <button type="button" className="btn btn-text" onClick={onEndSalon}>
            Encerrar a tela
          </button>
        </div>
      )}
    </div>
  );
}
