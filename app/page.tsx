'use client';

import { useState } from 'react';

const UploadForm = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const file = e.target.files[0];
      setVideoFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile) {
      setMessage('Please select a video file.');
      return;
    }

    const formData = new FormData();
    formData.append('video', videoFile);

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/generateVtt', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setMessage(data.message);
      } else {
        const error = await res.json();
        setMessage(error.error || 'Something went wrong!');
      }
    } catch (error) {
      setMessage('Error occurred while uploading video');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center bg-gray-100 p-8 rounded-lg shadow-lg max-w-md mx-auto">
      <h1 className="text-3xl font-semibold mb-6 text-center text-indigo-600">
        Upload Video for Thumbnails & VTT
      </h1>
      <form
        onSubmit={handleSubmit}
        className="w-full flex flex-col items-center space-y-4"
      >
        <input
          type="file"
          onChange={handleFileChange}
          name="video"
          accept="video/*"
          className="file:border-2 file:border-gray-300 file:rounded-lg file:px-4 file:py-2 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-600 hover:file:bg-indigo-200"
        />

        {videoFile && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">{videoFile.name}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full px-6 py-3 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-50"
        >
          {loading ? 'Uploading...' : 'Upload Video'}
        </button>
      </form>

      {message && (
        <p
          className={`mt-4 text-center p-2 rounded-md ${
            message.includes('Error') ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default UploadForm;