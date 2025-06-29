import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';

const Dashboard = () => {
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchContainers = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/containers`);
      setContainers(res.data);
    } catch (err) {
      console.error('Error fetching containers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      await axios.post(`${API_BASE_URL}/containers/${id}/${action}`);
      fetchContainers(); // refresh
    } catch (err) {
      console.error(`Failed to ${action} container:`, err);
    }
  };

  useEffect(() => {
    fetchContainers();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">🧱 Containers</h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid gap-4">
          {containers.map((c) => (
            <div key={c.Id} className="border p-4 rounded bg-white shadow">
              <h2 className="text-lg font-semibold">{c.Names[0].replace('/', '')}</h2>
              <p className="text-sm">Image: {c.Image}</p>
              <p className="text-sm">Status: {c.Status}</p>
              <p className="text-sm">State: {c.State}</p>
              <div className="mt-2 space-x-2">
                {c.State === 'running' ? (
                  <button
                    onClick={() => handleAction(c.Id, 'stop')}
                    className="px-3 py-1 bg-red-600 text-white rounded"
                  >
                    Stop
                  </button>
                ) : (
                  <button
                    onClick={() => handleAction(c.Id, 'start')}
                    className="px-3 py-1 bg-green-600 text-white rounded"
                  >
                    Start
                  </button>
                )}
                <button
                  onClick={() => handleAction(c.Id, 'remove')}
                  className="px-3 py-1 bg-gray-600 text-white rounded"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
