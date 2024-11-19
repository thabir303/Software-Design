// frontend/src/App.js
import RateLimiterComparison from './components/RateLimiterComparison';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Rate Limiter Comparison Demo
          </h1>
          <p className="mt-2 text-gray-600">
            Compare rate limiting with and without race condition handling
          </p>
        </div>
      </header>
      <main className="py-8">
        <RateLimiterComparison />
      </main>
    </div>
  );
}

export default App;