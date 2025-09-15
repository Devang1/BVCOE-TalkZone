"use client";

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { FiSend, FiImage, FiX, FiDownload, FiFile, FiSearch, FiArrowLeft, FiCalendar, FiMoon, FiSun } from 'react-icons/fi';

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const classParam = params.class;
  const [className, year] = classParam.split("-");
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [filePreview, setFilePreview] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [classId, setClassId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
  const [darkMode, setDarkMode] = useState(false);
  const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const docInputRef = useRef(null);
  const searchInputRef = useRef(null);
  const dateInputRef = useRef(null);
  const messageRefs = useRef({});

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Apply dark mode class to body
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handlePaste = async (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          await uploadPastedImage(file);
        }
      }
    }
  };

  const uploadPastedImage = async (file) => {
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.secure_url) {
        setFilePreview(data.secure_url);
        setFileType('image');
      } else {
        alert('Paste upload failed');
      }
    } catch (error) {
      alert('Upload error');
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    async function getClassId(year, className) {
      try {
        const res = await fetch(`/api/auth?year=${year}&className=${className}`);
        const data = await res.json();
        if (data.success) {
          setClassId(data.classId);
        } else {
          console.error("Error:", data.message);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      }
    }
    getClassId(year, className);
  }, [year, className]);

  // Fetch messages
  useEffect(() => {
    if (!classId) return;
    const fetchMessages = async () => {
      const res = await fetch(`/api/messages?classId=${classId}`);
      const data = await res.json();
      setMessages(data);
      setFilteredMessages(data);
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);

    return () => clearInterval(interval);
  }, [classId]);

  const chatContainerRef = useRef(null);

  useEffect(() => {
    const el = chatContainerRef.current;
    if (!el) return;

    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;

    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, filteredMessages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !filePreview) return;

    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        classId,
        text: newMessage || null,
        imageUrl: filePreview || null,
        fileType: fileType || null,
      }),
    });
    const result = await res.json();
    if (result.success) {
      setMessages(prev => [...prev, result.message]);
      setFilteredMessages(prev => [...prev, result.message]);
      setNewMessage('');
      setFilePreview(null);
      setFileType(null);
    }
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size too large. Maximum size is 10MB.');
      return;
    }
    
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
      let endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/`;
      
      if (type === 'image') {
        endpoint += 'image/upload';
        setFileType('image');
      } else {
        endpoint += 'raw/upload';
        setFileType('document');
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.secure_url) {
        setFilePreview(data.secure_url);
      } else {
        alert('File upload failed');
      }
    } catch (error) {
      alert('Upload error');
    } finally {
      setIsUploading(false);
    }
  };

  const removeFilePreview = () => {
    setFilePreview(null);
    setFileType(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (docInputRef.current) docInputRef.current.value = '';
  };

  const downloadFile = async (url, fileName = 'download') => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      
      let extension = 'file';
      if (url.includes('.pdf')) extension = 'pdf';
      else if (url.includes('.doc')) extension = 'doc';
      else if (url.includes('.docx')) extension = 'docx';
      else if (url.includes('.txt')) extension = 'txt';
      else if (url.includes('.jpg') || url.includes('.jpeg')) extension = 'jpg';
      else if (url.includes('.png')) extension = 'png';
      
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `${fileName}-${Date.now()}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file');
    }
  };

  const getFileIcon = (url) => {
    if (url.includes('.pdf')) return '📄';
    if (url.includes('.doc')) return '📝';
    if (url.includes('.txt')) return '📋';
    if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png')) return '🖼️';
    return '📎';
  };

  // Search functionality
  const handleSearch = (query, date = dateFilter) => {
    setSearchQuery(query);
    setDateFilter(date);
    
    if (!query.trim() && !date) {
      setFilteredMessages(messages);
      setSearchResults([]);
      setCurrentSearchIndex(-1);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    let results = messages;
    
    // Apply text search filter
    if (query.trim()) {
      results = results.filter(msg => 
        msg.text && msg.text.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    // Apply date filter
    if (date) {
      const filterDate = new Date(date);
      results = results.filter(msg => {
        const messageDate = new Date(msg.timestamp);
        return messageDate.toDateString() === filterDate.toDateString();
      });
    }
    
    setSearchResults(results);
    
    if (results.length > 0) {
      setCurrentSearchIndex(0);
      scrollToMessage(results[0].id);
    } else {
      setCurrentSearchIndex(-1);
    }
  };

  const handleDateFilter = (date) => {
    setDateFilter(date);
    handleSearch(searchQuery, date);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDateFilter('');
    setFilteredMessages(messages);
    setSearchResults([]);
    setCurrentSearchIndex(-1);
    setIsSearching(false);
  };

  const scrollToMessage = (messageId) => {
    if (messageRefs.current[messageId]) {
      messageRefs.current[messageId].scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Highlight the message temporarily
      messageRefs.current[messageId].classList.add('bg-yellow-100', 'dark:bg-yellow-900');
      setTimeout(() => {
        if (messageRefs.current[messageId]) {
          messageRefs.current[messageId].classList.remove('bg-yellow-100', 'dark:bg-yellow-900');
        }
      }, 2000);
    }
  };

  const navigateSearchResults = (direction) => {
    if (searchResults.length === 0) return;
    
    let newIndex;
    if (direction === 'next') {
      newIndex = (currentSearchIndex + 1) % searchResults.length;
    } else {
      newIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
    }
    
    setCurrentSearchIndex(newIndex);
    scrollToMessage(searchResults[newIndex].id);
  };

  const toggleSearchPanel = () => {
    setShowSearchPanel(!showSearchPanel);
    if (!showSearchPanel) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      clearFilters();
    }
  };

  return (
    <div className={`relative flex h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} overflow-hidden transition-colors duration-300`}>
      {/* Background Design */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNlNWU1ZTUiIG9wYWNpdHk9IjAuMiI+PHBhdGggZD0iTTIwIDBDOC45NTQgMCAwIDguOTU0IDAgMjBzOC45NTQgMjAgMjAgMjAgMjAtOC45NTQgMjAtMjBTMzEuMDQ2IDAgMjAgMHptMCAzOC4xMTRjLTEwLjAwNSAwLTE4LjExNC04LjEtMTguMTE0LTE4LjExNEMxLjg4NiA5Ljk5NSAxMC4wMDEgMS44ODYgMjAgMS44ODYgMzAuMDA1IDEuODg2IDM4LjExNCA5Ljk5NSAzOC4xMTQgMjBjMCAxMC4wMTQtOC4xMSAxOC4xMTQtMTguMTE0IDE4LjExNHoiLz48L2c+PC9nPjwvc3ZnPg==')] ${darkMode ? 'opacity-5' : 'opacity-10'}`}></div>
        <div className={`absolute inset-0 bg-gradient-to-br ${darkMode ? 'from-blue-900/10 to-purple-900/10' : 'from-blue-50/10 to-purple-50/10'}`}></div>
      </div>

      {/* Search Panel */}
      {showSearchPanel && (
        <div className={`relative z-20 w-80 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r shadow-lg flex flex-col transition-colors duration-300`}>
          <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Search Messages</h2>
              <button 
                onClick={toggleSearchPanel}
                className={`p-1 ${darkMode ? 'text-gray-800 hover:text-gray-800 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'} rounded-full transition-colors`}
              >
                <FiArrowLeft size={20} />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className={darkMode ? "text-gray-800" : "text-gray-800"} />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search for words or sentences..."
                  className={`w-full pl-10 pr-4 py-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' : 'bg-white border-gray-300 text-black placeholder-gray-500 focus:ring-blue-500 focus:border-transparent'} rounded-lg focus:ring-2 transition-colors`}
                />
              </div>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiCalendar className={darkMode ? "text-gray-800" : "text-gray-800"} />
                </div>
                <input
                  ref={dateInputRef}
                  type="date"
                  value={dateFilter}
                  onChange={(e) => handleDateFilter(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500' : 'bg-white border-gray-300 text-black focus:ring-blue-500 focus:border-transparent'} rounded-lg focus:ring-2 transition-colors`}
                />
              </div>
            </div>
            
            {(searchQuery || dateFilter) && (
              <div className="mt-3">
                <button 
                  onClick={clearFilters}
                  className={`text-sm ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:text-blue-700'} transition-colors`}
                >
                  Clear filters
                </button>
              </div>
            )}
            
            {isSearching && (
              <div className="mt-4">
                <div className={`flex items-center justify-between text-sm ${darkMode ? 'text-gray-800' : 'text-gray-800'} mb-2`}>
                  <span>
                    {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                  </span>
                  
                  {searchResults.length > 0 && (
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => navigateSearchResults('prev')}
                        disabled={searchResults.length <= 1}
                        className={`px-2 py-1 text-xs ${darkMode ? 'bg-gray-700 text-gray-800' : 'bg-gray-100 text-gray-700'} rounded disabled:opacity-50 transition-colors`}
                      >
                        Previous
                      </button>
                      <button 
                        onClick={() => navigateSearchResults('next')}
                        disabled={searchResults.length <= 1}
                        className={`px-2 py-1 text-xs ${darkMode ? 'bg-gray-700 text-gray-800' : 'bg-gray-100 text-gray-700'} rounded disabled:opacity-50 transition-colors`}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
                
                {searchResults.length > 0 && (
                  <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-800'} mb-2`}>
                    Showing {currentSearchIndex + 1} of {searchResults.length}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {searchResults.length > 0 && (
            <div className="flex-1 overflow-y-auto p-2">
              <div className="space-y-2">
                {searchResults.map((result, index) => (
                  <div 
                    key={result.id}
                    className={`p-3 rounded-lg cursor-pointer ${index === currentSearchIndex ? (darkMode ? 'bg-blue-800 border border-blue-700' : 'bg-blue-50 border border-blue-200') : (darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100')} transition-colors`}
                    onClick={() => {
                      setCurrentSearchIndex(index);
                      scrollToMessage(result.id);
                    }}
                  >
                    <p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'} line-clamp-2`}>
                      {result.text}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-800'} mt-1`}>
                      {new Date(result.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chat interface */}
      <div className={`relative z-10 flex flex-col h-full ${darkMode ? 'bg-gray-800/90' : 'bg-white/90'} backdrop-blur-sm ${showSearchPanel ? 'flex-1' : 'w-full'} transition-colors duration-300`}>
        <div className="absolute inset-0 flex flex-col items-center justify-center z-9 pointer-events-none select-none">
          <h1 className={`${darkMode ? 'text-gray-700' : 'text-gray-800'} opacity-10 text-2xl md:text-[5rem] font-extrabold uppercase tracking-widest drop-shadow-md select-none user-select-none pointer-events-none`}>
            BVCOE TalkZone
          </h1>
          <h2 className={`${darkMode ? 'text-gray-700' : 'text-gray-800'} opacity-10 text-lg md:text-3xl font-semibold uppercase tracking-widest mt-4 drop-shadow-md select-none user-select-none pointer-events-none`}>
            Connect. Chat. Collaborate.
          </h2>
        </div>

        <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm p-4 flex justify-between items-center border-b transition-colors duration-300`}>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => router.back()} 
              className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-800 hover:text-gray-700'} transition-colors`}
            >
              ← Back
            </button>
            <button 
              onClick={toggleSearchPanel}
              className={`p-2 ${darkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-800 hover:text-blue-500'} transition-colors rounded-lg`}
              title="Search messages"
            >
              <FiSearch size={18} />
            </button>
          </div>
          <h1 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{className}</h1>
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-yellow-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} transition-colors`}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
          </button>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={chatContainerRef}>
          {filteredMessages.length === 0 ? (
            <div className={`flex flex-col items-center justify-center h-full ${darkMode ? 'text-gray-500' : 'text-gray-800'}`}>
              <div className="text-2xl mb-2">💬</div>
              <p className="text-lg font-medium">No messages yet</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          ) : (
            filteredMessages.map(msg => (
              <motion.div 
                key={msg.id} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                ref={el => messageRefs.current[msg.id] = el}
              >
                <div className={`max-w-xs md:max-w-md rounded-lg p-3 ${msg.sender === 'user' ? (darkMode ? 'bg-blue-600 text-white rounded-br-none' : 'bg-blue-500 text-white rounded-br-none') : (darkMode ? 'bg-gray-700 text-gray-800 rounded-bl-none' : 'bg-gray-100 text-gray-800 rounded-bl-none shadow-sm')} transition-colors duration-300`}>
                  {msg.image_url && msg.file_type === 'image' && (
                    <div className="mb-2 relative group">
                      <img 
                        src={msg.image_url} 
                        alt="" 
                        className="rounded-lg max-h-48 w-full object-cover cursor-pointer" 
                        onClick={() => downloadFile(msg.image_url, 'chat-image')} 
                      />
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          downloadFile(msg.image_url, 'chat-image'); 
                        }} 
                        className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <FiDownload size={16} />
                      </button>
                    </div>
                  )}
                  
                  {msg.image_url && msg.file_type === 'document' && (
                    <div className={`mb-2 p-3 ${darkMode ? 'bg-gray-600' : 'bg-white bg-opacity-20'} rounded-lg flex items-center space-x-2 group transition-colors`}>
                      <span className="text-2xl">{getFileIcon(msg.image_url)}</span>
                      <div className="flex-1">
                        <p className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-black'}`}>
                          {msg.image_url.split('/').pop().split('.').slice(0, -1).join('.')}
                        </p>
                        <p className={`text-xs ${darkMode ? 'text-gray-800' : 'opacity-75 text-black'}`}>
                          {msg.image_url.split('.').pop().toUpperCase()} document
                        </p>
                      </div>
                      <button 
                        onClick={() => downloadFile(msg.image_url, 'document')} 
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-black bg-opacity-50 rounded-full text-white"
                      >
                        <FiDownload size={16} />
                      </button>
                    </div>
                  )}
                  
                  {msg.text && (
                    <p className="whitespace-pre-line">
                      {isSearching && searchQuery ? (
                        <>
                          {msg.text.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, i) => 
                            part.toLowerCase() === searchQuery.toLowerCase() ? 
                            <mark key={i} className={`${darkMode ? 'bg-yellow-600 text-white' : 'bg-yellow-200'} bg-opacity-80`}>{part}</mark> : part
                          )}
                        </>
                      ) : (
                        msg.text
                      )}
                    </p>
                  )}
                  <p className={`text-xs mt-1 ${msg.sender === 'user' ? (darkMode ? 'text-blue-200' : 'text-blue-100') : (darkMode ? 'text-gray-800' : 'text-gray-800')}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={handleSendMessage} className={`relative ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t p-4 transition-colors duration-300`}>
          {filePreview && (
            <div className="relative mb-3 group">
              {fileType === 'image' ? (
                <div className={`w-32 h-32 rounded-lg overflow-hidden border ${darkMode ? 'border-gray-600' : 'border-gray-200'} transition-colors`}>
                  <img 
                    src={filePreview} 
                    alt="" 
                    className="w-full h-full object-cover cursor-pointer" 
                    onClick={() => downloadFile(filePreview, 'preview-image')} 
                  />
                </div>
              ) : (
                <div className={`p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg flex items-center space-x-2 w-64 transition-colors`}>
                  <span className="text-2xl">{getFileIcon(filePreview)}</span>
                  <div className="flex-1">
                    <p className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-black'}`}>
                      {filePreview.split('/').pop().split('.').slice(0, -1).join('.')}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                      {filePreview.split('.').pop().toUpperCase()} document
                    </p>
                  </div>
                </div>
              )}
              <div className="absolute top-0 right-0 flex space-x-1">
                <button 
                  type="button"
                  onClick={removeFilePreview} 
                  className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <FiX size={16} />
                </button>
                <button 
                  type="button"
                  onClick={() => downloadFile(filePreview, fileType === 'image' ? 'preview-image' : 'document')} 
                  className="bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70 transition-colors"
                >
                  <FiDownload size={16} />
                </button>
              </div>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onPaste={handlePaste}
              placeholder="Type a message... or paste an image"
              rows={3}
              className={`flex-1 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' : 'bg-white border-gray-300 text-black placeholder-gray-500 focus:ring-blue-500 focus:border-transparent'} rounded-lg py-2 px-4 focus:ring-2 resize-none transition-colors`}
            />

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={(e) => handleFileUpload(e, 'image')} 
              accept="image/*" 
              className="hidden" 
            />
            <input 
              type="file" 
              ref={docInputRef} 
              onChange={(e) => handleFileUpload(e, 'document')} 
              accept=".pdf,.doc,.docx,.txt" 
              className="hidden" 
            />
            
            <div className="flex flex-col space-y-2">
              <button 
                type="button" 
                onClick={() => fileInputRef.current.click()} 
                disabled={isUploading} 
                className={`p-2 ${darkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-800 hover:text-blue-500'} transition-colors`}
                title="Upload image"
              >
                {isUploading ? <span className="animate-spin">...</span> : <FiImage size={20} />}
              </button>
              
              <button 
                type="button" 
                onClick={() => docInputRef.current.click()} 
                disabled={isUploading} 
                className={`p-2 ${darkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-800 hover:text-blue-500'} transition-colors`}
                title="Upload document"
              >
                {isUploading ? <span className="animate-spin">...</span> : <FiFile size={20} />}
              </button>
            </div>
            
            <button 
              type="submit" 
              disabled={(!newMessage.trim() && !filePreview) || isUploading} 
              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              <FiSend size={20} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
