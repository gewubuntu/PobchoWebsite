// Poncho meme generator: fabric.js canvas with templates, trait assets, text, emojis, shapes and a sortable layer list.

import { Canvas, FabricImage, FabricObject, InteractiveFabricObject, Rect, Textbox } from "fabric";
import Sortable from "sortablejs";
import { defaultTemplate, templates, toTitle, type TextBox } from "../../data/memes";
// Emoji data is bundled and served from our own domain instead of the picker's default CDN (no third-party request).
import emojiDataUrl from "emoji-picker-element-data/en/emojibase/data.json?url";

const TEMPLATE_DIR = "/memes/templates";
const ASSET_DIR = "/memes/assets";
const FONT = "pricedown";

const textStyle = {
  fill: "#000",
  fontFamily: FONT,
  originX: "center",
  paintFirst: "stroke",
  stroke: "#fbffef",
  strokeWidth: 4,
  textAlign: "center",
} as const;

const messages = {
  download: [
    "success",
    "Downloading Poncho meme.",
    "Tip: tap the save button, then right-click (desktop) or press and hold (mobile) the image for more download options.",
  ],
  edit: ["success", "Editing Poncho meme."],
  reset: ["success", "Poncho meme generator reset."],
  save: ["success", "Poncho meme saved."],
  layerDeleted: ["success", "Poncho meme layer deleted."],
  noLayers: ["error", "Poncho meme has no layers."],
  uploadError: ["error", "Error uploading image.", "Only JPG/JPEG and PNG files are supported."],
} as const satisfies Record<string, readonly [string, string, string?]>;

// Selection styling shared by every object on the canvas.
InteractiveFabricObject.ownDefaults = {
  ...InteractiveFabricObject.ownDefaults,
  borderColor: "#ffa51f",
  borderDashArray: [3, 1, 3],
  borderScaleFactor: 3,
  cornerColor: "lightblue",
  cornerDashArray: [2, 2],
  cornerSize: 30,
  cornerStrokeColor: "#1d48ff",
  cornerStyle: "circle",
  padding: 30,
  touchCornerSize: 40,
  transparentCorners: false,
};

export function initMemeGenerator() {
  const root = document.querySelector<HTMLElement>("[data-generator]");
  const canvasEl = document.getElementById("meme-canvas") as HTMLCanvasElement | null;
  if (root && canvasEl) setup(root, canvasEl);
}

function setup(root: HTMLElement, canvasEl: HTMLCanvasElement) {
  const $ = <T extends Element = HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const assets: Record<string, string[]> = JSON.parse(root.dataset.assets ?? "{}");
  const canvasWrap = $("[data-canvas-wrap]");
  const layerList = $<HTMLUListElement>("[data-layers]");
  const assetGallery = $("[data-asset-gallery]");
  const assetGroup = $<HTMLSelectElement>("[data-asset-group]");
  const assetSize = $<HTMLSelectElement>("[data-asset-size]");

  const canvas = new Canvas(canvasEl, { preserveObjectStacking: true });
  // Thumbnails shown in the layer list, keyed by canvas object.
  const previews = new WeakMap<FabricObject, string>();
  let currentTemplate = defaultTemplate;

  /* ------------------------------------------------------------ helpers -- */

  const icon = (name: string) =>
    (document
      .querySelector<HTMLTemplateElement>(`template[data-icon="${name}"]`)
      ?.content.cloneNode(true) as DocumentFragment) ?? document.createDocumentFragment();

  const toast = document.querySelector<HTMLElement>("[data-toast]");
  const toastMessage = toast?.querySelector<HTMLElement>("[data-toast-message]");
  let toastTimer: number | undefined;
  toast?.querySelector("[data-toast-close]")?.addEventListener("click", () => (toast.hidden = true));

  function notify([type, text, note]: readonly [string, string, string?]) {
    if (!toast || !toastMessage) return;
    const p = document.createElement("p");
    p.append(icon(type), " ", text);
    toastMessage.replaceChildren(p);
    if (note) {
      const small = document.createElement("p");
      small.className = "font--small";
      small.textContent = note;
      toastMessage.append(small);
    }
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => (toast.hidden = true), 5000);
  }

  const clearSaved = () => {
    const saved = canvasWrap.querySelector<HTMLImageElement>(".generator__saved");
    if (!saved) return;
    URL.revokeObjectURL(saved.src);
    saved.remove();
  };
  const center = () =>
    ({ left: canvas.getWidth() / 2, top: canvas.getHeight() / 2, originX: "center", originY: "center" }) as const;

  function addObject(object: FabricObject, preview?: string) {
    clearSaved();
    if (preview) previews.set(object, preview);
    canvas.add(object);
    canvas.setActiveObject(object);
    canvas.requestRenderAll();
    renderLayers();
  }

  function createText(box: TextBox, width: number, height: number) {
    return new Textbox(box.text, {
      ...textStyle,
      fontSize: height / box.fontSize,
      left: width / box.left,
      top: height / box.top,
      width: width / box.width,
      ...(box.centerY ? { originY: "center" } : {}),
    });
  }

  async function loadBackground(src: string, preview: string, text: TextBox[]) {
    clearSaved();
    const image = await FabricImage.fromURL(src);
    canvas.clear();
    canvas.setDimensions({ width: image.width, height: image.height });
    image.set({ hasControls: false, hoverCursor: "auto", selectable: false });
    previews.set(image, preview);
    canvas.add(image);
    const boxes = text.map((box) => createText(box, image.width, image.height));
    canvas.add(...boxes);
    if (boxes[0]) canvas.setActiveObject(boxes[0]);
    canvas.requestRenderAll();
    renderLayers();
  }

  async function loadTemplate(name: string) {
    const template = templates.find((t) => t.name === name) ?? templates.find((t) => t.name === defaultTemplate)!;
    currentTemplate = template.name;
    root.querySelectorAll<HTMLButtonElement>("[data-template]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.template === template.name));
    });
    await loadBackground(
      `${TEMPLATE_DIR}/${template.name}.png`,
      `${TEMPLATE_DIR}/small/${template.name}.png`,
      template.text,
    );
  }

  async function addImage(src: string, half: boolean) {
    const image = await FabricImage.fromURL(src);
    const scale = half ? 0.5 : 1;
    image.set({ hoverCursor: "auto", ...(half ? center() : {}) });
    image.scaleToHeight(canvas.getHeight() * scale);
    image.scaleToWidth(canvas.getWidth() * scale);
    addObject(image, src);
  }

  function readFile(input: HTMLInputElement, onLoad: (dataUrl: string) => void) {
    const file = input.files?.[0];
    input.value = "";
    if (!file || !/\.(jpe?g|png)$/i.test(file.name)) return notify(messages.uploadError);
    const reader = new FileReader();
    reader.onload = () => onLoad(String(reader.result));
    reader.onerror = () => notify(messages.uploadError);
    reader.readAsDataURL(file);
  }

  function exportBlob(callback: (blob: Blob) => void) {
    canvas.discardActiveObject();
    canvas.renderAll();
    canvasEl.toBlob((blob) => blob && callback(blob));
  }

  /* -------------------------------------------------------------- layers -- */

  function renderLayers() {
    const objects = canvas.getObjects();
    const active = canvas.getActiveObject();
    layerList.replaceChildren();

    if (!objects.length) {
      const empty = document.createElement("li");
      empty.textContent = "No layers.";
      layerList.append(empty);
      return;
    }

    objects.forEach((object, index) => {
      const li = document.createElement("li");
      li.dataset.layer = String(index);
      li.classList.toggle("is-active", object === active);

      const grip = document.createElement("span");
      grip.className = "layers__grip";
      grip.append(icon("grip"));

      const select = document.createElement("button");
      select.type = "button";
      select.className = "layers__select";

      if (object instanceof Textbox) {
        select.title = "Text layer";
        const text = document.createElement("span");
        text.className = "layers__text";
        text.textContent = object.text;
        select.append(text);
      } else if (object instanceof Rect) {
        select.title = "Shape layer";
        const rect = document.createElement("span");
        rect.className = "layers__rect";
        select.append(rect);
      } else {
        select.title = "Image layer";
        const img = document.createElement("img");
        img.className = "layers__preview";
        img.src = previews.get(object) ?? "";
        img.alt = toTitle(img.src.split("/").pop() ?? "Image");
        select.append(img);
      }
      select.addEventListener("click", () => {
        canvas.setActiveObject(object);
        canvas.requestRenderAll();
        renderLayers();
      });

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "button button--transparent layers__delete";
      remove.setAttribute("aria-label", "Delete layer");
      remove.title = "Delete layer";
      remove.append(icon("delete"));
      remove.addEventListener("click", () => {
        canvas.remove(object);
        clearSaved();
        canvas.requestRenderAll();
        renderLayers();
        notify(messages.layerDeleted);
      });

      li.append(grip, select, remove);
      layerList.append(li);
    });
  }

  Sortable.create(layerList, {
    animation: 150,
    onEnd: () => {
      // Re-stack canvas objects in the order shown in the list (first item = bottom layer).
      const objects = canvas.getObjects();
      const order = Array.from(layerList.children, (li) => objects[Number((li as HTMLElement).dataset.layer)]);
      order.forEach((object, index) => object && canvas.moveObjectTo(object, index));
      canvas.requestRenderAll();
      renderLayers();
    },
  });

  canvas.on("selection:created", renderLayers);
  canvas.on("selection:updated", renderLayers);
  canvas.on("selection:cleared", renderLayers);
  canvas.on("text:changed", renderLayers);

  /* ------------------------------------------------------------- actions -- */

  const actions: Record<string, (button: HTMLButtonElement) => void> = {
    reset: () => loadTemplate(currentTemplate).then(() => notify(messages.reset)),
    edit: () => {
      clearSaved();
      renderLayers();
      notify(messages.edit);
    },
    save: () =>
      exportBlob((blob) => {
        clearSaved();
        const img = new Image();
        img.className = "generator__saved";
        img.alt = "Your Poncho meme";
        img.src = URL.createObjectURL(blob);
        canvasWrap.append(img);
        notify(messages.save);
      }),
    download: () =>
      exportBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = Object.assign(document.createElement("a"), { href: url, download: "poncho_meme.png" });
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        renderLayers();
        notify(messages.download);
      }),
    expand: (button) => {
      const expanded = root.classList.toggle("generator--expanded");
      button.setAttribute("aria-pressed", String(expanded));
      button.setAttribute("aria-label", expanded ? "Compress" : "Expand");
      button.title = expanded ? "Compress" : "Expand";
      button.querySelector<HTMLElement>("[data-icon-expand]")?.toggleAttribute("hidden", expanded);
      button.querySelector<HTMLElement>("[data-icon-compress]")?.toggleAttribute("hidden", !expanded);
    },
    text: () =>
      addObject(
        new Textbox("Create Your\nPoncho Meme", {
          ...textStyle,
          ...center(),
          fontSize: canvas.getHeight() / 10,
          width: canvas.getWidth() / 1.5,
        }),
      ),
    shape: () =>
      addObject(
        new Rect({
          ...center(),
          fill: "#fbffef",
          height: canvas.getHeight() / 2,
          stroke: "#000",
          strokeWidth: 3,
          width: canvas.getWidth() / 2,
        }),
      ),
    emoji: (button) => toggleEmojiPicker(button),
  };

  root.addEventListener("click", (event) => {
    const target = event.target as Element;
    const actionButton = target.closest<HTMLButtonElement>("[data-action]");
    if (actionButton) return actions[actionButton.dataset.action!]?.(actionButton);

    const templateButton = target.closest<HTMLButtonElement>("[data-template]");
    if (templateButton) return void loadTemplate(templateButton.dataset.template!);

    const assetButton = target.closest<HTMLButtonElement>("[data-asset]");
    if (assetButton) return void addImage(assetButton.dataset.asset!, assetSize.value === "50");
  });

  root
    .querySelector<HTMLInputElement>('[data-upload="image"]')
    ?.addEventListener("change", (event) =>
      readFile(event.currentTarget as HTMLInputElement, (url) => addImage(url, true)),
    );

  root.querySelector<HTMLInputElement>('[data-upload="template"]')?.addEventListener("change", (event) =>
    readFile(event.currentTarget as HTMLInputElement, (url) => {
      currentTemplate = defaultTemplate;
      root.querySelectorAll("[data-template]").forEach((b) => b.setAttribute("aria-pressed", "false"));
      loadBackground(url, url, templates.find((t) => t.name === "Transparent")!.text);
    }),
  );

  /* -------------------------------------------------------------- assets -- */

  function renderAssets(group: string) {
    assetGallery.replaceChildren(
      ...(assets[group] ?? []).map((file) => {
        const src = `${ASSET_DIR}/${group}/${encodeURI(file)}`;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "gallery__item";
        button.dataset.asset = src;
        button.title = toTitle(file);
        const img = Object.assign(document.createElement("img"), {
          src,
          alt: toTitle(file),
          loading: "lazy",
          width: 150,
          height: 150,
        });
        button.append(img);
        return button;
      }),
    );
  }

  assetGroup.addEventListener("change", () => renderAssets(assetGroup.value));
  renderAssets(assetGroup.value);

  /* -------------------------------------------------------------- emojis -- */

  let pickerLoaded = false;
  async function toggleEmojiPicker(button: HTMLButtonElement) {
    const wrap = root.querySelector<HTMLElement>("[data-emoji-wrap]")!;
    const open = wrap.hidden;
    wrap.hidden = !open;
    button.setAttribute("aria-expanded", String(open));
    if (!open || pickerLoaded) return;

    pickerLoaded = true;
    await import("emoji-picker-element");
    const picker = document.createElement("emoji-picker");
    picker.setAttribute("data-source", emojiDataUrl);
    picker.addEventListener("emoji-click", (event) => {
      const unicode = event.detail.unicode;
      if (!unicode) return;
      const active = canvas.getActiveObject();
      if (active instanceof Textbox) {
        active.set("text", `${active.text} ${unicode}`);
        canvas.requestRenderAll();
        renderLayers();
      } else {
        addObject(
          new Textbox(unicode, {
            ...textStyle,
            ...center(),
            fontSize: canvas.getHeight() / 10,
            width: canvas.getWidth() / 1.5,
          }),
        );
      }
    });
    wrap.append(picker);
  }

  /* ---------------------------------------------------------------- init -- */

  // Text boxes are measured on creation, so make sure the meme font is ready first.
  document.fonts
    .load(`40px ${FONT}`)
    .catch(() => undefined)
    .then(() => loadTemplate(defaultTemplate));
}
