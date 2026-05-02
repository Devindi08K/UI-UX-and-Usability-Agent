export default function UIOutput({ generatedUI }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-accent">Generated UI</h2>
      <div className="border border-gray-300 rounded-md h-40 overflow-auto">
        {generatedUI ? (
          <div dangerouslySetInnerHTML={{ __html: generatedUI }} />
        ) : (
          <p className="text-gray-500 p-4">No UI generated yet</p>
        )}
      </div>
    </div>
  );
}