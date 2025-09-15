"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [nicknameError, setNicknameError] = useState('');
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
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

  // Check for existing nickname on component mount
  useEffect(() => {
    const savedNickname = localStorage.getItem('bvcoeTalkZoneNickname');
    if (savedNickname) {
      setNickname(savedNickname);
    }
  }, []);

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

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!selectedYear || !selectedClass) {
        throw new Error('Please select both year and class');
      }

      // Check if nickname is set
      if (!nickname.trim()) {
        setShowNicknameModal(true);
        setIsLoading(false);
        return;
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

      // Save nickname to localStorage
      localStorage.setItem('bvcoeTalkZoneNickname', nickname.trim());

      // Create slug from class name
      const classSlug = `${selectedClass}-${selectedYear}`;
      router.push(`/chat/${classSlug}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

const handleNicknameSubmit = async () => {
  if (!nickname.trim()) {
    setNicknameError('Nickname is required.');
    return;
  }
  if (!selectedClass || !selectedYear) {
    setNicknameError('Please select class and year first.');
    return;
  }

  setIsCheckingNickname(true);
  setNicknameError('');

  try {
    const response = await fetch('/api/check-nickname', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nickname: nickname.trim(),
        classname: selectedClass,
        year: selectedYear,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Nickname check error:", data);
      setNicknameError(data.error || 'Error checking nickname. Please try again.');
      return;
    }

    if (data.exists) {
      setNicknameError('This nickname is already taken. Please choose a different one.');
    } else {
      // Save locally so user doesn’t re-enter
      localStorage.setItem('nickname', nickname.trim());
      setShowNicknameModal(false);

      // Continue with form submission
      handleSubmit({ preventDefault: () => {} });
    }
  } catch (err) {
    console.error("Network error:", err);
    setNicknameError('Network error. Please check your connection and try again.');
  } finally {
    setIsCheckingNickname(false);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"></div>
      
      {/* Nickname Modal */}
      <AnimatePresence>
        {showNicknameModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowNicknameModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-gray-800">Set Your Nickname</h2>
              <p className="text-gray-600">Choose a unique nickname that will be displayed in the chat</p>
              
              <div className="space-y-2">
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => {
                    setNickname(e.target.value);
                    setNicknameError('');
                  }}
                  placeholder="Enter your nickname"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  maxLength={20}
                  autoFocus
                />
                
                {nicknameError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 flex items-start"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>{nicknameError}</span>
                  </motion.div>
                )}
                
                <p className="text-xs text-gray-500">
                  This nickname will be visible to others in your class
                </p>
              </div>
              
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  onClick={() => setShowNicknameModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={isCheckingNickname}
                >
                  Cancel
                </button>
                <button
                  onClick={handleNicknameSubmit}
                  disabled={!nickname.trim() || isCheckingNickname}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center min-w-[80px]"
                >
                  {isCheckingNickname ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    'Continue'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 space-y-8 relative z-10 border border-gray-100"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0c0 .993-.241 1.929-.668 2.754l-1.524-1.525a3.997 3.997 0 00.078-2.183l1.562-1.562C15.802 8.249 16 9.1 16 10zm-5.165 3.913l1.58 1.58A5.98 5.98 0 0110 16a5.976 5.96 0 01-2.516-.552l1.562-1.562a4.006 4.006 0 001.789.027zm-4.677-2.796a4.002 4.002 0 01-.041-2.08l-.08.08-1.53-1.533A5.98 5.98 0 004 10c0 .954.223 1.856.619 2.657l1.54-1.54zm1.088-6.45A5.974 5.974 0 0110 4c.954 0 1.856.223 2.657.619l-1.54 1.54a4.002 4.002 0 00-2.346.033L7.246 4.668zM12 10a2 2 0 11-4 0 2 2 0 014 0z" clipRule="evenodd" />
            </svg>
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-800">BVCOE TalkZone</h1>
          <p className="text-gray-500 mt-2">Anonymous group chat for your class</p>
          
          {/* Display current nickname if set */}
          {nickname && (
            <div className="mt-3 inline-flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
              <span>Nickname: {nickname}</span>
              <button 
                onClick={() => {
                  setNickname('');
                  localStorage.removeItem('bvcoeTalkZoneNickname');
                }}
                className="ml-2 text-blue-500 hover:text-blue-700 transition-colors"
                title="Change nickname"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Year Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Your Year
            </label>
            <div className="grid grid-cols-3 gap-3">
              {Object.keys(classesByYear).map((year) => (
                <motion.button
                  key={year}
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className={`px-3 py-3 rounded-lg border transition-all font-medium ${
                    selectedYear === year
                      ? 'bg-blue-100 border-blue-500 text-blue-700 shadow-sm'
                      : 'border-gray-200 hover:border-blue-300 text-gray-700 bg-white'
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
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Your Class
                </label>
                <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1">
                  {classesByYear[selectedYear]?.map((cls) => (
                    <motion.button
                      key={cls}
                      type="button"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      className={`px-3 py-3 rounded-lg border transition-all text-sm font-medium ${
                        selectedClass === cls
                          ? 'bg-blue-100 border-blue-500 text-blue-700 shadow-sm'
                          : 'border-gray-200 hover:border-blue-300 text-gray-700 bg-white'
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
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter class password"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all pr-12 text-black"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500">Click the eye icon to show/hide password</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 flex items-start"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </motion.div>
          )}

          {/* Join Button */}
          <motion.button
            type="submit"
            disabled={!password || isLoading || !selectedClass}
            whileHover={password && selectedClass ? { scale: 1.02 } : {}}
            whileTap={password && selectedClass ? { scale: 0.98 } : {}}
            className={`w-full py-3.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center ${
              password && selectedClass
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Joining...
              </>
            ) : (
              'Join Chat'
            )}
          </motion.button>
        </form>

        <div className="text-center text-xs text-gray-400 pt-4 border-t border-gray-100">
          <p>Your identity remains anonymous in all chats</p>
        </div>
      </motion.div>
    </div>
  );
}