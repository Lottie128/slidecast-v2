export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-4">
          <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Loading SlidecastV2</h2>
        <p className="text-gray-400 text-sm">Preparing your workspace...</p>
      </div>
    </div>
  );
}
