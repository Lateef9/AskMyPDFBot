'use client';
     import { useState } from 'react';
     import supabase from '../lib/supabase';
     
     export default function Profile({ user, onSignOut }) {
       const [dropdownOpen, setdropdownOpen] = useState(true);

       return (
         <div className="relative">
           <button
             onClick={() => setDropdownOpen(!dropdownOpen)}
             className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-1 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
           >
             <span>{user.email.split('@')[0]}</span>
             <svg className="w-4 h-4 transform ${dropdownOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
             </svg>
           </button>
           {dropdownOpen && (
             <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-md z-10">
               <button
                 onClick={onSignOut}
                 className="w-full text-left px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100"
               >
                 Sign Out
               </button>
             </div>
           )}
         </div>
       );
     }