export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white py-16">
      <div className="px-8 max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-10 border border-pink-200">
          <h2 className="text-3xl font-bold mb-8 text-pink-400 text-center">About GiftChoice 🎁</h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-8">
            GiftChoice is your one-stop destination for thoughtful gifts for every
            occasion — birthdays, anniversaries, festivals, and more.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
            <div className="bg-pink-50 rounded-lg p-6 border border-pink-200">
              <h3 className="font-semibold text-pink-400 mb-3">✨ Quality First</h3>
              <p className="text-gray-700 text-sm">We curate only the finest products</p>
            </div>
            <div className="bg-pink-50 rounded-lg p-6 border border-pink-200">
              <h3 className="font-semibold text-pink-400 mb-3">🎯 Perfect Gifts</h3>
              <p className="text-gray-700 text-sm">Thoughtful selections for every occasion</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
  