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

O salão precisa do Postgres e da API Rails, além da tela.

```bash
docker compose up --build
```

Abre [http://localhost:5173](http://localhost:5173). O Compose sobe o Postgres, a API em `back` e a tela em `front`.

Na TV da mesma rede, use o endereço de rede que o terminal mostrar. O cadastro fica no servidor, então a TV e o notebook veem a mesma casa.

O Postgres do projeto sobe na porta **5433**, para não esbarrar num Postgres que já esteja na 5432. A API fica na 3000.

### Como usar

1. Escreve o nome da casa e uma assinatura curta.
2. Cola o link da playlist. Vale o link de compartilhar (`.../playlist?list=...`) ou um vídeo que já traga o `list=` na URL. As playlists já usadas ficam embaixo, para procurar e escolher de novo.
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

Nome, assinatura, playlist atual, histórico de playlists, produtos e as fotos ficam no Postgres. A foto vai numa coluna binária do mesmo banco, então no Railway não precisa de volume nem de bucket. Ainda não há login: é uma barbearia por instalação.

A tela reduz a foto antes de enviar. O servidor recusa o que não for JPEG, PNG ou WebP, ou o que passar de 8 MB.

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

The screen needs Postgres and the Rails API.

```bash
docker compose up --build
```

Open [http://localhost:5173](http://localhost:5173). Compose starts Postgres, the API in `back`, and the screen in `front`.

On a TV in the same network, use the network address printed in the terminal. The catalog lives on the server, so the TV and the laptop share the same shop.

Project Postgres listens on port **5433**, so it does not collide with a Postgres already bound to 5432. The API listens on 3000.

### How to use it

1. Set the shop name and a short signature.
2. Paste the playlist link. A share link (`.../playlist?list=...`) works, and so does a watch URL that already includes `list=`. Playlists you have used stay underneath, so you can search and pick one again.
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

Shop name, signature, the current playlist, playlist history, products, and photos live in Postgres. A photo is a binary column in that same database, so a Railway deploy does not need a volume or a file bucket. There is no login yet: one shop per installation.

The screen shrinks the photo before upload. The server refuses anything that is not JPEG, PNG, or WebP, or anything over 8 MB.

### Playlists

YouTube has to allow the video to be embedded. When a title in the list cannot enter the screen, a note appears and the playlist moves on.
