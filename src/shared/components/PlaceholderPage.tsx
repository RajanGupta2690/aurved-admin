import { Construction } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="p-6">
      <div className="card text-center py-16">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center">
            <Construction size={40} className="text-primary-500" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-charcoal-950 mb-2">{title}</h1>
        <p className="text-charcoal-600 mb-6">{description}</p>
        <p className="text-sm text-charcoal-500">
          This module is part of the AURVED platform and will be implemented in upcoming phases.
        </p>
      </div>
    </div>
  );
}
