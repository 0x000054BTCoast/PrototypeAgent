export function ChartPlaceholder({ title }: { title: string }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{title}</p>
      <div className="flex h-40 items-end gap-2">
        {[28, 62, 46, 80, 58, 70].map((height, index) => (
          <div
            key={index}
            className="flex-1 rounded-t-md bg-gradient-to-t from-blue-500 to-cyan-400"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    </div>
  );
}
