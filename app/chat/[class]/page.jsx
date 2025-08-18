"use client";

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { FiSend, FiImage, FiX, FiDownload } from 'react-icons/fi';

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params.class;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const className = classId
    ? decodeURIComponent(classId).split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')
    : '';

  // Fetch messages
 useEffect(() => {
  if (!classId) return;
  const fetchMessages = async () => {
    const res = await fetch(`/api/messages?classId=${classId}`);
    const data = await res.json();
    setMessages(data);
  };
  fetchMessages();
  const interval = setInterval(fetchMessages, 5000); // every 5 seconds

  return () => clearInterval(interval);
}, [classId]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">← Back</button>
        <h1 className="text-lg font-semibold">{className}</h1>
        <div className="w-8" />
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md rounded-lg p-3 ${msg.sender === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none shadow'}`}>
              {msg.image_url && (
                <div className="mb-2 relative group">
                  <img src={msg.image_url} alt="" className="rounded-lg max-h-48 w-full object-cover cursor-pointer" onClick={() => downloadImage(msg.image_url, 'chat-image')} />
                  <button onClick={(e) => { e.stopPropagation(); downloadImage(msg.image_url, 'chat-image'); }} className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100">
                    <FiDownload size={16} />
                  </button>
                </div>
              )}
              {msg.text && <p>{msg.text}</p>}
              <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="bg-white border-t p-4">
        {imagePreview && (
          <div className="relative mb-3 group">
            <div className="w-32 h-32 rounded-lg overflow-hidden">
              <img src={imagePreview} alt="" className="w-full h-full object-cover cursor-pointer" onClick={() => downloadImage(imagePreview, 'preview-image')} />
            </div>
            <div className="absolute top-0 right-0 flex space-x-1">
              <button onClick={removeImagePreview} className="bg-red-500 text-white rounded-full p-1">
                <FiX size={16} />
              </button>
              <button onClick={() => downloadImage(imagePreview, 'preview-image')} className="bg-black bg-opacity-50 text-white rounded-full p-1">
                <FiDownload size={16} />
              </button>
            </div>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1 border border-gray-200 rounded-full py-2 px-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
          <button type="button" onClick={() => fileInputRef.current.click()} disabled={isUploading} className="p-2 text-gray-500 hover:text-blue-500">
            {isUploading ? <span className="animate-spin">...</span> : <FiImage size={20} />}
          </button>
          <button type="submit" disabled={(!newMessage.trim() && !imagePreview) || isUploading} className="p-2 bg-blue-500 text-white rounded-full">
            <FiSend size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}