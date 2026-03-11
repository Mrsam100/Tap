import React from 'react';
import { useLocation } from 'react-router-dom';

const Legal: React.FC = () => {
  const { pathname } = useLocation();
  const title = pathname.includes('privacy') ? 'Privacy Policy' : 'Terms of Service';

  return (
    <div className="min-h-screen pt-40 pb-20 px-6 bg-cream dark:bg-black">
      <div className="max-w-3xl mx-auto animate-fade-up">
        <h1 className="text-4xl md:text-5xl font-serif text-ink dark:text-white mb-8">{title}</h1>
        
        <div className="prose prose-slate dark:prose-invert max-w-none font-serif text-slate-600 dark:text-slate-400 leading-relaxed">
            <p className="text-xl text-ink dark:text-white font-sans mb-8">
                Last updated: {new Date().toLocaleDateString()}
            </p>

            <p className="mb-6">
                Welcome to Tap. This document outlines the {title.toLowerCase()} for our platform. 
                We are committed to providing a transparent and secure experience for all our users. 
                Please read this document carefully as it contains important information about your rights and obligations.
            </p>

            <h3 className="text-2xl text-ink dark:text-white mb-4 mt-8">1. Introduction</h3>
            <p className="mb-6">
                By accessing or using our service, you agree to be bound by these terms. If you disagree with any part of the terms, then you may not access the service. 
                Tap provides a platform for creating and sharing personal landing pages, and by using it, you acknowledge that you are responsible for the content you publish.
            </p>

            <h3 className="text-2xl text-ink dark:text-white mb-4 mt-8">2. Use License</h3>
            <p className="mb-6">
                Permission is granted to temporarily download one copy of the materials (information or software) on Tap's website for personal, non-commercial transitory viewing only. 
                This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Modify or copy the materials;</li>
                <li>Use the materials for any commercial purpose, or for any public display;</li>
                <li>Attempt to decompile or reverse engineer any software contained on Tap's website;</li>
                <li>Remove any copyright or other proprietary notations from the materials;</li>
                <li>Transfer the materials to another person or "mirror" the materials on any other server.</li>
            </ul>

             <h3 className="text-2xl text-ink dark:text-white mb-4 mt-8">3. Disclaimer</h3>
            <p className="mb-6">
                The materials on Tap's website are provided on an 'as is' basis. Tap makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>

            <h3 className="text-2xl text-ink dark:text-white mb-4 mt-8">4. Data Protection</h3>
            <p className="mb-6">
                We take your privacy seriously. Any personal data collected through the platform is handled in accordance with our internal data protection policies and relevant international regulations. 
                We do not sell your data to third parties. For more details on how we handle your information, please refer to our full Privacy Policy.
            </p>

            <h3 className="text-2xl text-ink dark:text-white mb-4 mt-8">5. Governing Law</h3>
            <p className="mb-6">
                These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction in which Tap operates, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
            </p>
        </div>
      </div>
    </div>
  );
};

export default Legal;