import React from 'react';
import { ArrowLeft, Scissors } from 'lucide-react';
import { Link } from 'react-router-dom';
import LoyaltyCardView from '../components/booking/LoyaltyCard';

export default function Loyalty() {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/" className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <Scissors className="w-5 h-5 text-primary" />
            <span className="font-bold text-foreground tracking-tight">FELLAS BARBERS</span>
          </div>
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 py-8">
        <LoyaltyCardView />
      </div>
    </div>
  );
}