export function Alert({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-900">
      <p className="font-semibold">{title}</p>
      <div>{children}</div>
    </div>
  );
}
