'use client';
     import { useState, useEffect } from 'react';
     import supabase from './lib/supabase';
     import Auth from './components/Auth';
     import Profile from './components/Profile';
     import Upload from './components/Upload';

     export default function Home() {
       const [user, setUser] = useState(null);
       const [loading, setLoading] = useState(false);
       const [error, setError] = useState('');

       // Check session on mount
       useEffect(() => {
         const getSession = async () => {
           const { data: { session } } = await supabase.auth.getSession();
           setUser(session?.user ?? null);
         };
         getSession();

         // Listen for auth state changes
         const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
           setUser(session?.user ?? null);
         });

         return () => subscription.unsubscribe();
       }, []);

       const handleAuthChange = () => {
         supabase.auth.getSession().then(({ data: { session } }) => {
           setUser(session?.user ?? null);
         });
       };

       const handleSignOut = async () => {
         setError('');
         setLoading(true);
         const { error } = await supabase.auth.signOut();
         setLoading(false);
         if (error) {
           setError(error.message);
         }
       };

       if (user) {
         return (
           <div className="min-h-screen bg-gray-100 relative">
             {/* Profile Button */}
             <div className="absolute top-4 right-4">
               <Profile user={user} onSignOut={handleSignOut} />
             </div>
             {/* Upload Section */}
             <div className="flex items-center justify-center min-h-screen">
               <Upload />
             </div>
           </div>
         );
       }

       return (
         <div className="min-h-screen flex items-center justify-center bg-gray-100">
           <Auth onAuthChange={handleAuthChange} />
           {error && <p className="mt-4 text-red-600 text-center">{error}</p>}
         </div>
       );
     }