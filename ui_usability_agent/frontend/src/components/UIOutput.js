export default function UIOutput({ generatedUI }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-accent">Generated UI</h2>
      <div className="border border-gray-300 rounded-md h-72 overflow-hidden">
        {generatedUI ? (
          <iframe
            title="Generated UI Preview"
            className="w-full h-full"
            srcDoc={generatedUI}
            sandbox="allow-scripts allow-same-origin"
          />
        ) : (
          <p className="text-gray-500 p-4">No UI generated yet</p>
        )}
      </div>
    </div>
  );
}