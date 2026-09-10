import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, Target } from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface DeliverySlab {
  id: string;
  minDistance: string | number;
  maxDistance: string | number;
  charge: string | number;
}

export default function LocationManagement() {
  const [loading, setLoading] = useState(true);
  
  // Store Location State
  const [storeLat, setStoreLat] = useState('');
  const [storeLon, setStoreLon] = useState('');
  const [savingLocation, setSavingLocation] = useState(false);

  // Slabs State
  const [slabs, setSlabs] = useState<DeliverySlab[]>([]);
  const [minDist, setMinDist] = useState('');
  const [maxDist, setMaxDist] = useState('');
  const [charge, setCharge] = useState('');
  const [addingSlab, setAddingSlab] = useState(false);

  // Fetch Data on Load
  const fetchLocationData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/location');
      const data = response.data;
      
      if (data.storeLocation) {
        setStoreLat(data.storeLocation.storeLatitude?.toString() || '');
        setStoreLon(data.storeLocation.storeLongitude?.toString() || '');
      }
      if (data.slabs) {
        setSlabs(data.slabs);
      }
    } catch (error) {
      console.error('Failed to fetch location data', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocationData();
  }, []);

  // Update Store Location
  const handleUpdateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeLat || !storeLon) return toast.error('Latitude and Longitude are required!');

    try {
      setSavingLocation(true);
      await api.post('/admin/location/store', {
        lat: Number(storeLat),
        lon: Number(storeLon),
      });
      toast.success('Store location updated successfully!');
    } catch (error) {
      toast.error('Failed to update store location');
    } finally {
      setSavingLocation(false);
    }
  };

  // Add Distance Slab
  const handleAddSlab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!minDist || !maxDist || !charge) return toast.error('All fields are required!');

    try {
      setAddingSlab(true);
      await api.post('/admin/location/slab', {
        minDistance: Number(minDist),
        maxDistance: Number(maxDist),
        charge: Number(charge),
      });
      toast.success('Delivery rate slab added!');
      setMinDist('');
      setMaxDist('');
      setCharge('');
      fetchLocationData(); // Refresh list
    } catch (error) {
      toast.error('Failed to add delivery slab');
    } finally {
      setAddingSlab(false);
    }
  };

  // Delete Distance Slab
  const handleDeleteSlab = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this slab?')) return;

    try {
      await api.delete(`/admin/location/slab/${id}`);
      toast.success('Slab deleted!');
      fetchLocationData(); // Refresh list
    } catch (error) {
      toast.error('Failed to delete slab');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading settings...</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Delivery & Location Settings</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Store Coordinates */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center mb-4">
              <MapPin className="w-5 h-5 text-yellow-500 mr-2" />
              <h2 className="text-lg font-bold text-gray-900">Store Origin Base</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">Set your main store's coordinates to calculate accurate KM distance for delivery charges.</p>
            
            <form onSubmit={handleUpdateLocation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                <input 
                  type="number" step="any" required
                  placeholder="e.g. 29.8543" 
                  value={storeLat} onChange={(e) => setStoreLat(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                <input 
                  type="number" step="any" required
                  placeholder="e.g. 77.8880" 
                  value={storeLon} onChange={(e) => setStoreLon(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500"
                />
              </div>
              <button 
                type="submit" disabled={savingLocation}
                className="w-full px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium"
              >
                {savingLocation ? 'Saving...' : 'Update Coordinates'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Distance Slabs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Target className="w-5 h-5 text-indigo-500 mr-2" />
                <h2 className="text-lg font-bold text-gray-900">Distance-Based Delivery Rates</h2>
              </div>
            </div>
            
            {/* Add Slab Form */}
            <form onSubmit={handleAddSlab} className="grid grid-cols-4 gap-3 items-end bg-gray-50 p-4 rounded-lg mb-6 border border-gray-100">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Min KM</label>
                <input 
                  type="number" step="any" required placeholder="0" 
                  value={minDist} onChange={(e) => setMinDist(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Max KM</label>
                <input 
                  type="number" step="any" required placeholder="1.5" 
                  value={maxDist} onChange={(e) => setMaxDist(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Delivery Charge (₹)</label>
                <input 
                  type="number" step="any" required placeholder="15" 
                  value={charge} onChange={(e) => setCharge(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <button type="submit" disabled={addingSlab} className="w-full px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium flex items-center justify-center">
                  <Plus className="w-4 h-4 mr-1" /> Add Slab
                </button>
              </div>
            </form>

            {/* Slabs List */}
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Distance Range</th>
                    <th className="px-4 py-3 font-semibold">Delivery Fee</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {slabs.length === 0 ? (
                    <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-500">No slabs added yet.</td></tr>
                  ) : (
                    slabs.map((slab) => (
                      <tr key={slab.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{slab.minDistance} km - {slab.maxDistance} km</td>
                        <td className="px-4 py-3 text-gray-700">₹{slab.charge}</td>
                        <td className="px-4 py-3 text-right">
                          <button 
                            onClick={() => handleDeleteSlab(slab.id)}
                            className="text-red-500 hover:bg-red-50 p-2 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}