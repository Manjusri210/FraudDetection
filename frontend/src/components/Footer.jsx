import React from 'react';
import { ShieldCheck } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t border-slate-800 bg-slate-950/80 py-8 text-slate-500 text-xs mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-500" />
          <span className="font-semibold text-slate-400">Digital Fraud Detection Engine</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
        <div className="flex items-center gap-6">
          <span>AI / ML Risk Analytics</span>
          <span>REST API</span>
          <span>Security Compliant</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
