import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Room } from '../types';

export default function Dashboard() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/rooms`, {
        headers: {
          Authorization: `Bearer ${user?.id}`,
        },
      });
      const data = await response.json();
      setRooms(data);
    } catch (err) {
      setError('Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const roomData = {
      name: formData.get('name'),
      type: formData.get('type'),
      game_type: formData.get('game_type'),
      max_players: parseInt(formData.get('max_players') as string),
      stake_value: parseFloat(formData.get('stake_value') as string),
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.id}`,
        },
        body: JSON.stringify(roomData),
      });
      const newRoom = await response.json();
      navigate(`/room/${newRoom.id}`);
    } catch (err) {
      setError('Failed to create room');
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/rooms/${roomId}/join`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user?.id}`,
        },
      });
      navigate(`/room/${roomId}`);
    } catch (err) {
      setError('Failed to join room');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Game Hub</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => signOut()}
                className="ml-4 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Create New Room
              </h2>
              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Room Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="type"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Room Type
                  </label>
                  <select
                    name="type"
                    id="type"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="game_type"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Game Type
                  </label>
                  <input
                    type="text"
                    name="game_type"
                    id="game_type"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="max_players"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Max Players
                  </label>
                  <input
                    type="number"
                    name="max_players"
                    id="max_players"
                    min="2"
                    max="8"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="stake_value"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Stake Value
                  </label>
                  <input
                    type="number"
                    name="stake_value"
                    id="stake_value"
                    min="0"
                    step="0.01"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Create Room
                </button>
              </form>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Available Rooms
              </h2>
              {loading ? (
                <div className="text-center">Loading rooms...</div>
              ) : error ? (
                <div className="text-red-500 text-center">{error}</div>
              ) : rooms.length === 0 ? (
                <div className="text-center text-gray-500">No rooms available</div>
              ) : (
                <div className="space-y-4">
                  {rooms.map((room) => (
                    <div
                      key={room.id}
                      className="border rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {room.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {room.game_type} • {room.type} • {room.max_players}{' '}
                            players
                          </p>
                        </div>
                        <button
                          onClick={() => handleJoinRoom(room.id)}
                          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Join
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 