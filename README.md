# O Salão

Tela de barbearia para a TV da casa: uma playlist do YouTube em cena, e os produtos da vitrine ao redor.

A barbershop screen for the shop TV: a YouTube playlist on stage, and the product showcase around it.

[Português](#português) · [English](#english)

---

## Português

### O que é

Uma tela para deixar rodando na TV da barbearia. Você cola o link de uma playlist, cadastra os produtos com foto, nome e descrição, e abre o salão.

O vídeo fica sempre visível e continua passando. Os anúncios ocupam o entorno, em dois tempos:

| Tempo | O que acontece |
| --- | --- |
| **Sala** | A playlist fica maior, no centro, em 16:9. Os produtos ficam nas laterais. |
| **Vitrine** | A imagem recolhe para uma telinha e um produto assume a cena. |

Uma linha dourada no topo marca a troca. Os produtos revezam sozinhos, na ordem em que foram cadastrados. Com um produto só, um lado vira foto e o outro vira a descrição em letra grande. Com vários, a parede se divide.

### Como rodar

```bash
npm install
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173).

Na TV da mesma rede, use o endereço de rede que o terminal mostrar. O cadastro fica no navegador daquela tela: o que você salvar no notebook não aparece na TV.

Para gerar a versão de produção:

```bash
npm run build
npm run preview
```

### Como usar

1. Escreve o nome da casa e uma assinatura curta.
2. Cola o link da playlist. Vale o link de compartilhar (`.../playlist?list=...`) ou um vídeo que já traga o `list=` na URL.
3. Adiciona os produtos: foto, nome e descrição. **Subir** e **descer** mudam a ordem da vitrine.
4. Clica em **Abrir o salão**. A tela entra em tela cheia.

Durante a exibição, o nome da barbearia abre a gestão. O vídeo escorrega para o lado e continua passando enquanto você edita.

| Tecla | Ação |
| --- | --- |
| `G` | Abre ou fecha a gestão |
| `F` | Entra ou sai da tela cheia |
| `Esc` | Fecha a gestão |

Se o navegador segurar o áudio, aparece **Ativar som**.

### Os dados

Por enquanto tudo fica no cache deste navegador (`localStorage`). Nome, playlist, produtos e fotos. Nada sai da máquina. Uma foto muito pesada é reduzida antes de salvar. Se o cache encher, a tela avisa.

### Playlist

O YouTube precisa deixar o vídeo ser incorporado. Quando um título da lista não entra, a tela avisa e a playlist segue para o próximo.

---

## English

### What it is

A screen meant to stay on the barbershop TV. Paste a playlist link, register products with a photo, a name, and a description, then open the room.

The video stays visible and keeps playing. The ads live around it, in two beats:

| Beat | What happens |
| --- | --- |
| **Sala** | The playlist sits larger, centered, at 16:9. Products line the sides. |
| **Vitrine** | The picture shrinks to a smaller window and one product takes the stage. |

A thin gold line at the top marks the change. Products rotate on their own, in the order you saved them. One product becomes a photo on one side and large type on the other. Several products split the wall.

### Run it

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

On a TV in the same network, use the network address printed in the terminal. The catalog lives in that screen's browser: what you save on a laptop does not show up on the TV.

Production build:

```bash
npm run build
npm run preview
```

### How to use it

1. Set the shop name and a short signature.
2. Paste the playlist link. A share link (`.../playlist?list=...`) works, and so does a watch URL that already includes `list=`.
3. Add products: photo, name, and description. **Subir** and **descer** change the order on screen.
4. Choose **Abrir o salão**. The screen goes fullscreen.

While it is live, the shop name opens the desk. The video slides aside and keeps playing while you edit.

| Key | Action |
| --- | --- |
| `G` | Open or close the desk |
| `F` | Enter or leave fullscreen |
| `Esc` | Close the desk |

If the browser holds the audio, **Ativar som** appears.

### Data

For now everything stays in this browser's cache (`localStorage`): name, playlist, products, and photos. Nothing leaves the machine. Large photos are resized before they are saved. If the cache fills up, the screen says so.

### Playlists

YouTube has to allow the video to be embedded. When a title in the list cannot enter the screen, a note appears and the playlist moves on.
