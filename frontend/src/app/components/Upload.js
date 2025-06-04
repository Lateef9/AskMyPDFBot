'use client';
     import { useState } from 'react';

     export default function Upload() {
       const [file, setFile] = useState(null);
       const handleFileChange = (e) => {
         const selectedFile = e.target.files[0];
         if (selectedFile && selectedFile.type === 'application/pdf') {
           setFile(selectedFile);
         } else {
           alert('Please select a PDF file.');
           setFile(null);
         }
       };

       const handleUpload = () => {
         if (!file) {
           alert('Please select a PDF file to upload.');
           return;
         }
         // Placeholder for backend integration
         alert(`Selected PDF: ${file.name}`);
       };

       return (
         <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
           <h2 className="text-xl font-semibold mb-4 text-center">Upload Your PDF</h2>
           <div className="mb-4">
             <input
               type="file"
               accept="application/pdf"
               onChange={handleFileChange}
               className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
             />
           </div>
           <button
             onClick={handleUpload}
             disabled={!file}
             className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-300"
           >
             Upload PDF
           </button>
         </div>
       );
     }