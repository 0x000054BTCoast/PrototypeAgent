import { UISchema } from "@prd2prototype/schema";

const esc = (value: string): string => value.replace(/[&<>\"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch] as string));

export const exportSvg = (schema: UISchema): string => {
  const width = 1440;
  const sectionHeight = 220;
  const gap = 24;
  const height = Math.max(400, schema.sections.length * (sectionHeight + gap) + 80);

  const sections = schema.sections
    .map((section, index) => {
      const y = 40 + index * (sectionHeight + gap);
      const components = section.components
        .map((component, componentIndex) => {
          const boxY = y + 48 + componentIndex * 42;
          return `<rect x="90" y="${boxY}" width="1260" height="34" rx="8" style="fill:#f8fafc;stroke:#cbd5e1;stroke-width:1"/><text x="106" y="${boxY + 22}" style="font-size:13px;fill:#0f172a">${esc(component.type)} · ${esc(component.id)}</text>`;
        })
        .join("");

      return `<g><rect x="72" y="${y}" width="1296" height="${sectionHeight}" rx="20" style="fill:#ffffff;stroke:#e2e8f0;stroke-width:1.2"/><text x="96" y="${y + 30}" style="font-size:16px;font-weight:700;fill:#0f172a">${esc(section.name)}</text>${components}</g>`;
    })
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" style="fill:#f1f5f9"/><text x="72" y="28" style="font-size:18px;font-weight:700;fill:#0f172a">${esc(schema.page_name)}</text>${sections}</svg>`;
};

export const exportHtml = (schema: UISchema): string => {
  const sections = schema.sections
    .map(
      (section) => `<section class="rounded-2xl bg-white shadow-sm border border-slate-200 p-6 space-y-4">
<h2 class="text-xl font-semibold capitalize">${esc(section.name.replaceAll("_", " "))}</h2>
<div class="space-y-3">
${section.components
  .map(
    (component) => `<div class="rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm"><span class="font-semibold">${esc(component.type)}</span> — ${esc(component.id)}</div>`
  )
  .join("\n")}
</div>
</section>`
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(schema.page_name)}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-100 text-slate-900">
  <main class="min-h-screen p-6 md:p-8 lg:p-12">
    <div class="mx-auto max-w-7xl space-y-6">
      <h1 class="text-3xl font-semibold capitalize">${esc(schema.page_name.replaceAll("_", " "))}</h1>
      <div class="space-y-6">${sections}</div>
    </div>
  </main>
</body>
</html>`;
};
