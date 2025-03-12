
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <ShieldAlert className="h-20 w-20 mx-auto text-arena-red" />
          <h1 className="mt-6 text-3xl font-bold text-gray-900">Unauthorized Access</h1>
          <p className="mt-2 text-gray-600">
            You don't have permission to access this page.
          </p>
        </div>
        <div className="mt-8">
          <Button
            onClick={() => navigate(-1)}
            className="w-full"
            variant="outline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
          </Button>
          <Button
            onClick={() => navigate('/')}
            className="w-full mt-4 bg-arena-red hover:bg-arena-darkRed"
          >
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
