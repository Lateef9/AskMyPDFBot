'use client';
     import { useState } from 'react';
     import supabase from '../lib/supabase';

     export default function Auth({ onAuthChange }) {
       const [email, setEmail] = useState('');
       const [password, setPassword] = useState('');
       const [error, setError] = useState('');
       const [loading, setLoading] = useState(false);

       const handleSignUp = async () => {
         setError('');
         setLoading(true);
         const { error } = await supabase.auth.signUp({ email, password });
         setLoading(false);
         if (error) {
           setError(error.message);
         } else {
           setError('Check your email for confirmation link.');
         }
       };

       const handleSignIn = async () => {
         setError('');
         setLoading(true);
         const { error } = await supabase.auth.signInWithPassword({ email, password });
         setLoading(false);
         if (error) {
           setError(error.message);
         } else {
           onAuthChange(); // Trigger parent to refresh user state
         }
       };

       return (
         <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
           <h1 className="text-2xl font-bold mb-4 text-center">PDF QA Bot</h1>
           <div className="mb-4">
             <label className="block text-sm font-medium mb-1">Email</label>
             <input
               type="email"
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
               placeholder="Enter your email"
               disabled={loading}
             />
           </div>
           <div className="mb-4">
             <label className="block text-sm font-medium mb-1">Password</label>
             <input
               type="password"
               value={password}
               onChange={(e) => setPassword(e.target.value)}
               className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
               placeholder="Enter your password"
               disabled={loading}
             />
           </div>
           <div className="flex gap-4">
             <button
               onClick={handleSignUp}
               disabled={loading}
               className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 disabled:bg-blue-300"
             >
               {loading ? 'Processing...' : 'Sign Up'}
             </button>
             <button
               onClick={handleSignIn}
               disabled={loading}
               className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:bg-green-400"
             >
               {loading ? 'Processing...' : 'Sign In'}
             </button>
           </div>
           {error && <p className="mt-4 text-red-600 text-center">{error}</p>}
         </div>
       );
     }