'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Access Denied
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              You don't have permission to access this page or perform this action.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50 p-3">
              <Shield className="h-4 w-4 mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Your current role doesn't have the required permissions. Please contact your administrator if you believe this is an error.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Possible reasons:
              </p>
              <ul className="text-xs text-gray-500 dark:text-gray-500 space-y-1 list-disc list-inside">
                <li>Your role doesn't have access to this module</li>
                <li>You need specific permissions to perform this action</li>
                <li>Your session may have expired</li>
                <li>Your account permissions have been changed</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              
              <Link href="/dashboard" className="flex-1">
                <Button className="w-full">
                  <Home className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            </div>

            <div className="text-center pt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Need help? Contact your system administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
