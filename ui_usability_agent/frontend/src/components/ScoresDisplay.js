export default function ScoresDisplay({ scores }) {
  if (!scores) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-6">
      <h2 className="text-xl font-semibold mb-4 text-accent">Usability Scores</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{scores.iso}</div>
          <div className="text-sm text-gray-600">ISO 9241</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{scores.nielsen}</div>
          <div className="text-sm text-gray-600">Nielsen</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{scores.wcag}</div>
          <div className="text-sm text-gray-600">WCAG</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{scores.composite}</div>
          <div className="text-sm text-gray-600">Composite</div>
        </div>
      </div>
    </div>
  );
}