export default function OfflineBanner() {
  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 text-center text-xs py-1.5 font-semibold"
      style={{
        background: 'linear-gradient(90deg, #e67e22, #e05c5c)',
        color: '#fff',
        fontFamily: 'Nunito',
      }}
    >
      📡 Mode hors-ligne — Vos données sont sauvegardées localement
    </div>
  );
}
