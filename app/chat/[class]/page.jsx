"use client";

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { FiSend, FiImage, FiX, FiDownload } from 'react-icons/fi';

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const classParam = params.class;
  const [className, year] = classParam.split("-");
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [classId, setClassId] = useState(null);
  const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
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
      setImagePreview(data.secure_url); // ✅ same as file input
    } else {
      alert('Paste upload failed');
    }
  } catch (error) {
    alert('Upload error');
  } finally {
    setIsUploading(false);
  }
};

  useEffect(()=>{
    async function getClassId(year, className) {
  try {
    const res = await fetch(`/api/auth?year=${year}&className=${className}`);
    const data = await res.json();
    console.log(data);
    if (data.success) {
      console.log("Class ID:", data.classId);
      setClassId(data.classId);
    } else {
      console.error("Error:", data.message);
    }
  } catch (err) {
    console.error("Fetch error:", err);
  }
}
getClassId(year, className);
  },[year, className])
  // Fetch messages
  useEffect(() => {
    if (!classId) return;
    const fetchMessages = async () => {
      const res = await fetch(`/api/messages?classId=${classId}`);
      const data = await res.json();
      setMessages(data);
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);

    return () => clearInterval(interval);
  }, [classId]);

  const chatContainerRef = useRef(null);

useEffect(() => {
  const el = chatContainerRef.current;
  if (!el) return;

  const isNearBottom =
    el.scrollHeight - el.scrollTop - el.clientHeight < 100; // within 100px of bottom

  if (isNearBottom) {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }
}, [messages]);
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !imagePreview) return;

    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        classId,
        text: newMessage || null,
        imageUrl: imagePreview || null,
      }),
    });
    const result = await res.json();
    if (result.success) {
      setMessages(prev => [...prev, result.message]);
      setNewMessage('');
      setImagePreview(null);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
        setImagePreview(data.secure_url);
      } else {
        alert('Image upload failed');
      }
    } catch (error) {
      alert('Upload error');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImagePreview = () => {
    setImagePreview(null);
    fileInputRef.current.value = '';
  };

  const downloadImage = async (url, fileName = 'download') => {
    const res = await fetch(url);
    const blob = await res.blob();
    const jpgBlob = new Blob([blob], { type: 'image/jpeg' });
    const objectUrl = URL.createObjectURL(jpgBlob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `${fileName}-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  };

  return (
    <div className="relative flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Background Design */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNlNWU1ZTUiIG9wYWNpdHk9IjAuMiI+PHBhdGggZD0iTTIwIDBDOC45NTQgMCAwIDguOTU0IDAgMjBzOC45NTQgMjAgMjAgMjAgMjAtOC45NTQgMjAtMjBTMzEuMDQ2IDAgMjAgMHptMCAzOC4xMTRjLTEwLjAwNSAwLTE4LjExNC04LjEtMTguMTE0LTE4LjExNEMxLjg4NiA5Ljk5NSAxMC4wMDEgMS44ODYgMjAgMS44ODYgMzAuMDA1IDEuODg2IDM4LjExNCA5Ljk5NSAzOC4xMTQgMjBjMCAxMC4wMTQtOC4xMSAxOC4xMTQtMTguMTE0IDE4LjExNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-10"></div>
        
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/10 to-purple-50/10"></div>
      </div>

      {/* Chat interface */}
      <div className="relative z-10 flex flex-col h-full bg-white/90 backdrop-blur-sm">
      {/* BVCOE TalkZone watermark */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-9 pointer-events-none select-none">
          {/* Main watermark text */}
          <h1
            className="
              text-gray-400
              opacity-10
              text-2xl md:text-[5rem]
              font-extrabold
              uppercase
              tracking-widest
              drop-shadow-md
              select-none
              user-select-none
              pointer-events-none
              "
          >
            BVCOE TalkZone
          </h1>

          {/* Subheading watermark */}
          <h2
            className="
              text-gray-400
              opacity-10
              text-lg md:text-3xl
              font-semibold
              uppercase
              tracking-widest
              mt-4
              drop-shadow-md
              select-none
              user-select-none
              pointer-events-none
              "
          >
            Connect. Chat. Collaborate.
          </h2>
        </div>



        <header className="bg-white shadow-sm p-4 flex justify-between items-center border-b">
          <button 
            onClick={() => router.back()} 
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-lg font-semibold text-gray-800">{className}</h1>
          <div className="w-8" />
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={chatContainerRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <div className="text-2xl mb-2">💬</div>
              <p className="text-lg font-medium">No messages yet</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          ) : (
            messages.map(msg => (
              <motion.div 
                key={msg.id} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs md:max-w-md rounded-lg p-3 ${msg.sender === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none shadow-sm'}`}>
                  {msg.image_url && (
                    <div className="mb-2 relative group">
                      <img 
                        src={msg.image_url} 
                        alt="" 
                        className="rounded-lg max-h-48 w-full object-cover cursor-pointer" 
                        onClick={() => downloadImage(msg.image_url, 'chat-image')} 
                      />
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          downloadImage(msg.image_url, 'chat-image'); 
                        }} 
                        className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <FiDownload size={16} />
                      </button>
                    </div>
                  )}
                  {msg.text && <p className="whitespace-pre-line">{msg.text}</p>}
                  <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={handleSendMessage} className="relative bg-white border-t p-4">
          {imagePreview && (
            <div className="relative mb-3 group">
              <div className="w-32 h-32 rounded-lg overflow-hidden border border-gray-200">
                <img 
                  src={imagePreview} 
                  alt="" 
                  className="w-full h-full object-cover cursor-pointer" 
                  onClick={() => downloadImage(imagePreview, 'preview-image')} 
                />
              </div>
              <div className="absolute top-0 right-0 flex space-x-1">
                <button 
                  type="button"
                  onClick={removeImagePreview} 
                  className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <FiX size={16} />
                </button>
                <button 
                  type="button"
                  onClick={() => downloadImage(imagePreview, 'preview-image')} 
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
              onChange={(e) => {
                setNewMessage(e.target.value);
            
                // Auto-grow textarea
                e.target.style.height = "auto";
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onPaste={handlePaste}
              placeholder="Type a message... or paste an image"
              rows={1}
              className="flex-1 border border-gray-700 rounded-full text-black py-2 px-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white resize-none overflow-hidden"
            />

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />
            <button 
              type="button" 
              onClick={() => fileInputRef.current.click()} 
              disabled={isUploading} 
              className="p-2 text-gray-500 hover:text-blue-500 transition-colors"
            >
              {isUploading ? <span className="animate-spin">...</span> : <FiImage size={20} />}
            </button>
            <button 
              type="submit" 
              disabled={(!newMessage.trim() && !imagePreview) || isUploading} 
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
