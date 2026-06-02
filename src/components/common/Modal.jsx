export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80] flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-t-xl p-6 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: "slideUp 0.3s ease",
        }}
      >
        <div className="w-12 h-1 bg-outline-variant/30 rounded-full mx-auto mb-6" />
        {title && (
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-4">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}
