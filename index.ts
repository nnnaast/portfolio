import { promises as fs, watch } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { minify as minifyHtml } from "html-minifier-terser";
import CleanCSS from "clean-css";
import { transform } from "esbuild";
import sharp from "sharp";

const SRC = "src";
const DIST = "dist";

type Row = { файл: string; до: number; после: number };
const report: Row[] = [];
const names = new Map<string, string>(); // старое имя -> имя с хешем

const hash = (data: Buffer | string) =>
  crypto.createHash("md5").update(data).digest("hex").slice(0, 8);

const hashed = (file: string, data: Buffer | string) => {
  const { name, ext } = path.parse(file);
  return `${name}.${hash(data)}${ext}`;
};

const replaceNames = (text: string) => {
  for (const [oldName, newName] of names) {
    text = text.split(oldName).join(newName);
  }
  return text;
};

const add = (файл: string, до: number, после: number) =>
  report.push({ файл, до, после });

async function build() {
  report.length = 0;
  names.clear();
  await fs.rm(DIST, { recursive: true, force: true });
  await fs.mkdir(path.join(DIST, "images"), { recursive: true });

  // 1. Картинки: копирование + сжатие + хеш в имени
  let imageFiles: string[] = [];
  try {
    imageFiles = await fs.readdir(path.join(SRC, "images"));
  } catch {
    console.log("Папка src/images не найдена, картинки пропущены");
  }

  for (const f of imageFiles) {
    const input = await fs.readFile(path.join(SRC, "images", f));
    const ext = path.extname(f).toLowerCase();
    let output: Buffer = input;

    if (ext === ".jpg" || ext === ".jpeg") {
      output = await sharp(input).jpeg({ quality: 80 }).toBuffer();
    } else if (ext === ".png") {
      output = await sharp(input).png({ compressionLevel: 9 }).toBuffer();
    }
    if (output.length > input.length) output = input; // не раздуваем файл

    const newName = hashed(f, output);
    await fs.writeFile(path.join(DIST, "images", newName), output);
    names.set(`images/${f}`, `images/${newName}`);
    add(`images/${f}`, input.length, output.length);
  }

  // 2. CSS
  const cssRaw = replaceNames(
    await fs.readFile(path.join(SRC, "style.css"), "utf8")
  );
  const css = new CleanCSS().minify(cssRaw).styles;
  const cssName = hashed("style.css", css);
  await fs.writeFile(path.join(DIST, cssName), css);
  names.set("style.css", cssName);
  add("style.css", Buffer.byteLength(cssRaw), Buffer.byteLength(css));

  // 3. JS
  const jsRaw = await fs.readFile(path.join(SRC, "script.js"), "utf8");
  const { code } = await transform(jsRaw, { minify: true });
  const jsName = hashed("script.js", code);
  await fs.writeFile(path.join(DIST, jsName), code);
  names.set("script.js", jsName);
  add("script.js", Buffer.byteLength(jsRaw), Buffer.byteLength(code));

  // 4. HTML (последним, чтобы заменить все ссылки на новые имена)
  const htmlRaw = await fs.readFile(path.join(SRC, "index.html"), "utf8");
  const html = await minifyHtml(replaceNames(htmlRaw), {
    collapseWhitespace: true,
    removeComments: true,
    minifyCSS: true,
    minifyJS: true,
  });
  await fs.writeFile(path.join(DIST, "index.html"), html);
  add("index.html", Buffer.byteLength(htmlRaw), Buffer.byteLength(html));

  // Отчёт до/после
  console.table(report);
}

await build();

// Режим --watch: пересборка при изменении файлов в src
if (process.argv.includes("--watch")) {
  console.log("Слежу за папкой src ... (остановить: Ctrl+C)");
  let timer: NodeJS.Timeout;
  watch(SRC, { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => build().catch(console.error), 200);
  });
}