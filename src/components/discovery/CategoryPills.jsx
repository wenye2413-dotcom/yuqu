export default function CategoryPills({ categories, active, onChange }) {
  return (
    <div className="flex gap-stack-sm overflow-x-auto pb-stack-md pt-stack-sm no-scrollbar -mx-margin-mobile px-margin-mobile">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`px-4 py-2 rounded-full font-label-md text-label-md whitespace-nowrap shadow-sm transition-colors ${
            active === cat
              ? "bg-primary-container text-on-primary-container"
              : "bg-secondary/10 text-secondary"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
