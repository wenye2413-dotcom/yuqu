export default function Toast({ message, type = "info" }) {
  const bgMap = {
    info: "bg-primary text-white",
    success: "bg-[#356668] text-white",
    error: "bg-error text-white",
  };

  return (
    <div
      className={`px-5 py-2.5 rounded-full shadow-lg text-label-sm animate-[fadeIn_0.3s_ease] ${bgMap[type] || bgMap.info}`}
      style={{
        animation: "toastIn 0.3s ease",
      }}
    >
      {message}
    </div>
  );
}
