// frontend/src/components/RateLimiterComparison.js
import  { useState } from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

const RateLimiterComparison = () => {
  const [responses, setResponses] = useState({ safe: [], unsafe: [] });
  const [loading, setLoading] = useState({ safe: false, unsafe: false });
  const [numRequests, setNumRequests] = useState(10);
  const [error, setError] = useState(null);

  const getStatusIcon = (status) => {
    if (status === 200) return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    if (status === 429) return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    return <AlertCircle className="w-5 h-5 text-red-500" />;
  };

  const getStatusColor = (status) => {
    if (status === 200) return 'bg-green-50 border-green-200';
    if (status === 429) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const sendRequests = async (type) => {
    if (numRequests < 1 || numRequests > 100) {
      setError("Please enter a number between 1 and 100");
      return;
    }

    setLoading(prev => ({ ...prev, [type]: true }));
    setError(null);

    try {
      const startTime = performance.now();
      const requestArray = Array.from({ length: numRequests }, (_, i) => i);
      
      const promises = requestArray.map(async (_, index) => {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/data/${type}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          const data = await response.json();
          return {
            id: index + 1,
            status: response.status,
            message: data.message,
            limit: response.headers.get("X-RateLimit-Limit"),
            remaining: response.headers.get("X-RateLimit-Remaining"),
            retryAfter: response.headers.get("X-RateLimit-Retry-After"),
            timestamp: performance.now() - startTime
          };
        } catch (error) {
          console.log(error);
          
          return {
            id: index + 1,
            status: 500,
            message: "Failed to fetch data",
            limit: null,
            remaining: null,
            retryAfter: null,
            timestamp: performance.now() - startTime
          };
        }
      });

      const results = await Promise.all(promises);
      setResponses(prev => ({
        ...prev,
        [type]: results.sort((a, b) => a.timestamp - b.timestamp)
      }));
    } catch (err) {
      console.log(err);
      
      setError("Failed to send requests. Please try again.");
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const getSuccessRate = (responses) => {
    if (!responses.length) return 0;
    return ((responses.filter(r => r.status === 200).length / responses.length) * 100).toFixed(1);
  };

  const getTotalTime = (responses) => {
    if (!responses.length) return 0;
    return (responses[responses.length - 1]?.timestamp / 1000).toFixed(2);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Rate Limiter Comparison</h2>
        
        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Concurrent Requests
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={numRequests}
                onChange={(e) => setNumRequests(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 
                         focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter number (1-100)"
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => sendRequests('unsafe')}
                disabled={loading.unsafe}
                className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 
                         focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 
                         disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading.unsafe ? 'Testing Unsafe...' : 'Test Unsafe Version'}
              </button>
              <button
                onClick={() => sendRequests('safe')}
                disabled={loading.safe}
                className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 
                         focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 
                         disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading.safe ? 'Testing Safe...' : 'Test Safe Version'}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Unsafe Version Results */}
          <div className="border rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-4 text-red-600">Unsafe Version Results</h3>
            {responses.unsafe.length > 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="font-medium text-gray-900 mb-2">Success Rate</h4>
                    <p className="text-2xl font-bold text-gray-900">
                      {getSuccessRate(responses.unsafe)}%
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="font-medium text-gray-900 mb-2">Total Time</h4>
                    <p className="text-2xl font-bold text-gray-900">
                      {getTotalTime(responses.unsafe)}s
                    </p>
                  </div>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {responses.unsafe.map((response) => (
                    <div
                      key={response.id}
                      className={`p-4 border rounded-md ${getStatusColor(response.status)}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(response.status)}
                          <span className="font-medium">Request #{response.id}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {(response.timestamp / 1000).toFixed(3)}s
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p>Status: {response.status}</p>
                          <p>Remaining: {response.remaining || 'N/A'}</p>
                        </div>
                        <div>
                          <p>Limit: {response.limit || 'N/A'}</p>
                          {response.retryAfter && (
                            <p>Retry After: {response.retryAfter}s</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Safe Version Results */}
          <div className="border rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-4 text-green-600">Safe Version Results</h3>
            {responses.safe.length > 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="font-medium text-gray-900 mb-2">Success Rate</h4>
                    <p className="text-2xl font-bold text-gray-900">
                      {getSuccessRate(responses.safe)}%
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="font-medium text-gray-900 mb-2">Total Time</h4>
                    <p className="text-2xl font-bold text-gray-900">
                      {getTotalTime(responses.safe)}s
                    </p>
                  </div>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {responses.safe.map((response) => (
                    <div
                      key={response.id}
                      className={`p-4 border rounded-md ${getStatusColor(response.status)}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(response.status)}
                          <span className="font-medium">Request #{response.id}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {(response.timestamp / 1000).toFixed(3)}s
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p>Status: {response.status}</p>
                          <p>Remaining: {response.remaining || 'N/A'}</p>
                        </div>
                        <div>
                          <p>Limit: {response.limit || 'N/A'}</p>
                          {response.retryAfter && (
                            <p>Retry After: {response.retryAfter}s</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RateLimiterComparison;