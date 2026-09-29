import type { Product } from "./storage";

export type Mode = "cinema" | "vitrine";

export type Box = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export type CardVariant = "photo" | "quote" | "hero" | "thumb";

export type SceneCard = {
  key: string;
  box: Box;
  variant: CardVariant;
  productIndex: number;
};

export type VoidSpot = {
  key: string;
  box: Box;
  role: "mark" | "note" | "both";
};

export type Scene = {
  wide: boolean;
  video: Box;
  caption: Box;
  cards: SceneCard[];
  voids: VoidSpot[];
  rule: { x: number; top: number; height: number } | null;
};

type SideRegions = {
  left: Box;
  right: Box;
  leftTop: Box;
  leftBot: Box;
  rightTop: Box;
  rightBot: Box;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function fit16x9(targetWidth: number, maxHeight: number): { width: number; height: number } {
  let width = targetWidth;
  let height = (width * 9) / 16;
  if (height > maxHeight) {
    height = maxHeight;
    width = (height * 16) / 9;
  }
  return { width, height };
}

function emptyScene(width: number, height: number): Scene {
  return {
    wide: false,
    video: { top: 0, left: 0, width, height },
    caption: { top: 0, left: 0, width: 0, height: 0 },
    cards: [],
    voids: [],
    rule: null,
  };
}

function sideRegions(leftX: number, rightX: number, sideW: number, top: number, height: number): SideRegions {
  const gap = Math.max(12, height * 0.03);
  const half = (height - gap) / 2;
  return {
    left: { top, left: leftX, width: sideW, height },
    right: { top, left: rightX, width: sideW, height },
    leftTop: { top, left: leftX, width: sideW, height: half },
    leftBot: { top: top + half + gap, left: leftX, width: sideW, height: half },
    rightTop: { top, left: rightX, width: sideW, height: half },
    rightBot: { top: top + half + gap, left: rightX, width: sideW, height: half },
  };
}

function card(key: string, box: Box, variant: CardVariant, productIndex: number): SceneCard {
  return { key, box, variant, productIndex };
}

function assignCinema(products: Product[], offset: number, regions: SideRegions): SceneCard[] {
  const count = products.length;
  if (count === 0) return [];
  const indexAt = (step: number) => (offset + step) % count;
  if (count === 1) {
    return [
      card("left", regions.left, "photo", indexAt(0)),
      card("right", regions.right, "quote", indexAt(0)),
    ];
  }
  if (count === 2) {
    return [
      card("left", regions.left, "photo", indexAt(0)),
      card("right", regions.right, "photo", indexAt(1)),
    ];
  }
  if (count === 3) {
    return [
      card("lt", regions.leftTop, "photo", indexAt(0)),
      card("lb", regions.leftBot, "photo", indexAt(1)),
      card("right", regions.right, "photo", indexAt(2)),
    ];
  }
  return [
    card("lt", regions.leftTop, "photo", indexAt(0)),
    card("lb", regions.leftBot, "photo", indexAt(1)),
    card("rt", regions.rightTop, "photo", indexAt(2)),
    card("rb", regions.rightBot, "photo", indexAt(3)),
  ];
}

function cinemaScene(width: number, height: number, products: Product[], offset: number): Scene | null {
  const padX = clamp(width * 0.03, 28, 72);
  const padTop = clamp(height * 0.125, 112, 156);
  const padBottom = clamp(height * 0.05, 28, 64);
  const gap = clamp(width * 0.016, 14, 32);
  const availableH = height - padTop - padBottom;
  const captionH = clamp(availableH * 0.12, 56, 92);
  const maxVideoH = availableH - captionH - 18;
  const minSide = 168;

  let videoW = width - padX * 2 - gap * 2 - minSide * 2;
  let sized = fit16x9(videoW, maxVideoH);
  const maxVideoW = width * 0.6;
  if (sized.width > maxVideoW) sized = fit16x9(maxVideoW, maxVideoH);

  const left = (width - sized.width) / 2;
  const sideW = left - padX - gap;
  if (sideW < 156) return null;

  const minTop = padTop;
  const maxTop = Math.max(minTop, height - 28 - 86 - sized.height);
  const top = minTop + (maxTop - minTop) * 0.42;
  const video: Box = { top, left, width: sized.width, height: sized.height };
  const regions = sideRegions(padX, left + sized.width + gap, sideW, top, sized.height);
  const caption: Box = {
    top: top + sized.height + 16,
    left,
    width: sized.width,
    height: Math.max(48, height - (top + sized.height + 16) - 22),
  };

  const voids: VoidSpot[] =
    products.length === 0
      ? [
          { key: "mark", box: regions.left, role: "mark" },
          { key: "note", box: regions.right, role: "note" },
        ]
      : [];

  return {
    wide: true,
    video,
    caption,
    cards: assignCinema(products, offset, regions),
    voids,
    rule: null,
  };
}

function vitrineScene(width: number, height: number, products: Product[], offset: number): Scene | null {
  const padX = clamp(width * 0.03, 28, 72);
  const padTop = clamp(height * 0.125, 112, 156);
  const padBottom = clamp(height * 0.05, 28, 64);
  const gap = clamp(width * 0.016, 14, 32);
  const contentTop = padTop;
  const contentBottom = height - padBottom;
  const contentH = contentBottom - contentTop;

  let sized = fit16x9(Math.min(width * 0.34, 720), contentH * 0.72);
  const contentLeft = padX + sized.width + gap * 2.1;
  const contentW = width - contentLeft - padX;
  if (contentW < 300) return null;

  const thumbCount = Math.min(3, Math.max(0, products.length - 1));
  const thumbH = thumbCount > 0 ? clamp(contentH * 0.28, 108, 248) : 0;
  const midGap = thumbCount > 0 ? gap : 0;
  const heroH = contentH - thumbH - midGap;
  if (heroH < 156) return null;

  const heroTop = contentTop;
  const videoTop = clamp(
    heroTop + heroH / 2 - sized.height / 2,
    contentTop,
    contentBottom - sized.height,
  );
  const video: Box = { top: videoTop, left: padX, width: sized.width, height: sized.height };
  const captionTop = video.top + video.height + 18;
  const caption: Box = {
    top: captionTop,
    left: padX,
    width: sized.width,
    height: Math.max(0, contentBottom - captionTop),
  };

  const cards: SceneCard[] = [];
  const voids: VoidSpot[] = [];
  const stage: Box = { top: contentTop, left: contentLeft, width: contentW, height: contentH };

  if (products.length === 0) {
    voids.push({ key: "both", box: stage, role: "both" });
  } else {
    const heroIndex = offset % products.length;
    cards.push(
      card("hero", { top: heroTop, left: contentLeft, width: contentW, height: heroH }, "hero", heroIndex),
    );
    if (thumbCount > 0) {
      const thumbGap = gap * 0.75;
      const thumbW = (contentW - thumbGap * (thumbCount - 1)) / thumbCount;
      const thumbTop = heroTop + heroH + midGap;
      for (let index = 0; index < thumbCount; index += 1) {
        const productIndex = (offset + index + 1) % products.length;
        cards.push(
          card(
            `thumb-${index}`,
            {
              top: thumbTop,
              left: contentLeft + index * (thumbW + thumbGap),
              width: thumbW,
              height: thumbH,
            },
            "thumb",
            productIndex,
          ),
        );
      }
    }
  }

  return {
    wide: true,
    video,
    caption,
    cards,
    voids,
    rule: {
      x: contentLeft - gap * 0.85,
      top: contentTop,
      height: contentH,
    },
  };
}

function stackScene(width: number, height: number, frame: Mode, products: Product[], offset: number): Scene {
  const pad = clamp(width * 0.04, 16, 28);
  const topBar = 116;
  const maxVideoH = frame === "cinema" ? height * 0.42 : height * 0.32;
  const sized = fit16x9(width - pad * 2, Math.max(120, maxVideoH));
  const video: Box = {
    top: topBar,
    left: (width - sized.width) / 2,
    width: sized.width,
    height: sized.height,
  };
  const caption: Box = {
    top: video.top + video.height + 8,
    left: video.left,
    width: video.width,
    height: 28,
  };
  const contentTop = caption.top + caption.height + 10;
  const contentBottom = height - pad;
  const contentH = Math.max(0, contentBottom - contentTop);
  const contentW = width - pad * 2;

  if (products.length === 0) {
    return {
      wide: false,
      video,
      caption,
      cards: [],
      voids:
        contentH > 80
          ? [{ key: "both", box: { top: contentTop, left: pad, width: contentW, height: contentH }, role: "both" }]
          : [],
      rule: null,
    };
  }

  if (frame === "vitrine" || contentH < 150) {
    return {
      wide: false,
      video,
      caption,
      cards: [
        card(
          "hero",
          { top: contentTop, left: pad, width: contentW, height: Math.max(80, contentH) },
          "hero",
          offset % products.length,
        ),
      ],
      voids: [],
      rule: null,
    };
  }

  const visible = Math.min(3, products.length);
  const gap = 10;
  const cardW = (contentW - gap * (visible - 1)) / visible;
  const cards: SceneCard[] = [];
  for (let index = 0; index < visible; index += 1) {
    cards.push(
      card(
        `row-${index}`,
        {
          top: contentTop,
          left: pad + index * (cardW + gap),
          width: cardW,
          height: contentH,
        },
        "photo",
        (offset + index) % products.length,
      ),
    );
  }

  return { wide: false, video, caption, cards, voids: [], rule: null };
}

export function computeScene(
  width: number,
  height: number,
  frame: Mode,
  products: Product[],
  offset: number,
): Scene {
  if (width < 32 || height < 32) return emptyScene(width, height);
  if (width < 760 || height < 480) return stackScene(width, height, frame, products, offset);

  const scene =
    frame === "cinema"
      ? cinemaScene(width, height, products, offset)
      : vitrineScene(width, height, products, offset);

  return scene ?? stackScene(width, height, frame, products, offset);
}

export function tvViewportWidth(
  screenW: number,
  screenH: number,
  layoutW: number,
  outerW: number,
): number | null {
  if (screenW < 1200 || screenW <= screenH) return null;
  if (layoutW <= 0 || layoutW >= 1100) return null;
  if (screenW / layoutW < 1.35) return null;
  if (outerW > 0 && outerW < screenW * 0.85) return null;
  return screenW >= 1920 ? 1920 : Math.round(screenW);
}

export function toStyle(box: Box): { top: number; left: number; width: number; height: number } {
  return {
    top: box.top,
    left: box.left,
    width: box.width,
    height: box.height,
  };
}
