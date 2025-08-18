"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Real class structure
  const classesByYear = {
    '1st Year': [
      'CSE1', 'CSE2', 'CSE3', 'CSE4', 'CSE-ALML', 'CSE-AIDS',
      'ECE1', 'ECE2', 'ECE3', 'ECE4',
      'IT1', 'IT2', 'IT3', 'IT4'
    ],
    '2nd Year': [
      'CSE1', 'CSE2', 'CSE3', 'CSE4', 'CSE-ALML', 'CSE-AIDS',
      'ECE1', 'ECE2', 'ECE3', 'ECE4',
      'IT1', 'IT2', 'IT3', 'IT4'
    ],
    '3rd Year': [
      'CSE1', 'CSE2', 'IT1', 'IT2',
      'ECE1', 'ECE2', 'ECE3'
    ],
  };

  const handleYearSelect = (year) => {
    setSelectedYear(year);
    setSelectedClass(null);
    setPassword('');
    setError(null);
  };

  const handleClassSelect = (cls) => {
    setSelectedClass(cls);
    setPassword('');
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!selectedYear || !selectedClass) {
        throw new Error('Please select both year and class');
      }

      const res = await fetch('/api/auth', {
        method: 'POST',
        body: JSON.stringify({
          className: selectedClass,
          year: selectedYear,
          password: password,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Invalid credentials');
      }

      // Create slug from class name
      const classSlug = selectedClass.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      router.push(`/chat/${classSlug}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-xl shadow-sm p-8 space-y-8"
      >
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">BVCOE TalkZone</h1>
          <p className="text-gray-500 mt-2">Anonymous group chat for your class</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Year Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Your Year
            </label>
            <div className="grid grid-cols-2 gap-3">
              {Object.keys(classesByYear).map((year) => (
                <motion.button
                  key={year}
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className={`px-4 py-3 rounded-lg border transition-all ${
                    selectedYear === year
                      ? 'bg-blue-50 border-blue-500 text-blue-600'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                  onClick={() => handleYearSelect(year)}
                >
                  {year}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Class Selection */}
          <AnimatePresence>
            {selectedYear && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Your Class
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {classesByYear[selectedYear]?.map((cls) => (
                    <motion.button
                      key={cls}
                      type="button"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      className={`px-4 py-3 rounded-lg border transition-all ${
                        selectedClass === cls
                          ? 'bg-blue-50 border-blue-500 text-blue-600'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                      onClick={() => handleClassSelect(cls)}
                    >
                      {cls}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Password Field */}
          <AnimatePresence>
            {selectedClass && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-2"
              >
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Class Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter class password"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-50 text-red-600 rounded-lg text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Join Button */}
          <motion.button
            type="submit"
            disabled={!password || isLoading || !selectedClass}
            whileHover={{ scale: password ? 1.02 : 1 }}
            whileTap={{ scale: password ? 0.98 : 1 }}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
              password && selectedClass
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0..." />
                </svg>
                Joining...
              </span>
            ) : (
              'Join Chat'
            )}
          </motion.button>
        </form>

        <div className="text-center text-xs text-gray-400">
          <p>Your identity remains anonymous in all chats</p>
        </div>
      </motion.div>
    </div>
  );
}
