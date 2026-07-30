import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { API_BASE_URL, getAuthHeaders } from '../lib/supabase';
import { projectId, publicAnonKey } from '/utils/supabase/info';

export default function TestConnection() {
  const [results, setResults] = useState<any[]>([]);
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testPassword, setTestPassword] = useState('test123');
  const [testName, setTestName] = useState('Test User');

  const runTests = async () => {
    const testResults: any[] = [];

    // Test 1: Check Supabase config
    testResults.push({
      test: 'Supabase Config',
      status: projectId && publicAnonKey ? 'PASS' : 'FAIL',
      data: { projectId, hasKey: !!publicAnonKey }
    });

    // Test 2: Health check
    try {
      const healthRes = await fetch(`${API_BASE_URL}/health`);
      const healthData = await healthRes.json();
      testResults.push({
        test: 'Server Health Check',
        status: healthRes.ok ? 'PASS' : 'FAIL',
        data: healthData
      });
    } catch (error: any) {
      testResults.push({
        test: 'Server Health Check',
        status: 'FAIL',
        data: { error: error.message }
      });
    }

    // Test 3: Check localStorage
    testResults.push({
      test: 'Auth Token Check',
      status: localStorage.getItem('access_token') ? 'PASS' : 'NO TOKEN',
      data: { 
        hasToken: !!localStorage.getItem('access_token'),
        hasUserId: !!localStorage.getItem('user_id')
      }
    });

    // Test 4: Try profile fetch (if authenticated)
    if (localStorage.getItem('access_token')) {
      try {
        const profileRes = await fetch(`${API_BASE_URL}/user/profile`, {
          headers: getAuthHeaders(),
        });
        const profileData = await profileRes.json();
        testResults.push({
          test: 'Profile Fetch',
          status: profileRes.ok ? 'PASS' : 'FAIL',
          data: profileData
        });
      } catch (error: any) {
        testResults.push({
          test: 'Profile Fetch',
          status: 'FAIL',
          data: { error: error.message }
        });
      }
    }

    setResults(testResults);
  };

  const testSignup = async () => {
    const testResults: any[] = [];

    // Test 1: Server signup endpoint
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ email: testEmail, password: testPassword, name: testName }),
      });

      const data = await response.json();

      testResults.push({
        test: 'Server Signup Endpoint',
        status: response.ok ? 'PASS' : 'FAIL',
        data: {
          status: response.status,
          ok: response.ok,
          response: data
        }
      });

      // Test 2: If signup succeeded, try to sign in
      if (response.ok) {
        const { supabase } = await import('../lib/supabase');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: testPassword,
        });

        testResults.push({
          test: 'Supabase Auth Sign In',
          status: signInError ? 'FAIL' : 'PASS',
          data: {
            hasSession: !!signInData?.session,
            hasUser: !!signInData?.user,
            error: signInError ? {
              message: signInError.message,
              status: signInError.status,
              details: signInError
            } : null
          }
        });
      }

    } catch (error: any) {
      testResults.push({
        test: 'Test Signup',
        status: 'FAIL',
        data: { error: error.message, stack: error.stack }
      });
    }

    setResults(testResults);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Test Signup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={testEmail} onChange={(e) => setTestEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" value={testPassword} onChange={(e) => setTestPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={testName} onChange={(e) => setTestName(e.target.value)} />
            </div>
            <Button onClick={testSignup}>Test Signup</Button>
            <div className="text-sm text-gray-600 mt-2">
              <strong>Important:</strong> Make sure you have:
              <ul className="list-disc list-inside mt-1">
                <li>Created the kv_store_44e0fa0c table in Supabase</li>
                <li>Enabled Email auth provider in Supabase Dashboard → Authentication → Providers</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Connection Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={runTests}>Run Tests</Button>

            <div className="space-y-3">
              {results.map((result, i) => (
                <Card key={i} className={
                  result.status === 'PASS' ? 'border-green-500' : 
                  result.status === 'FAIL' ? 'border-red-500' : 
                  'border-yellow-500'
                }>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold">{result.test}</h3>
                      <span className={`px-2 py-1 rounded text-sm ${
                        result.status === 'PASS' ? 'bg-green-100 text-green-800' :
                        result.status === 'FAIL' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {result.status}
                      </span>
                    </div>
                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded">
              <h3 className="font-semibold mb-2">Instructions:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Click "Run Tests" to check the connection</li>
                <li>If "Server Health Check" fails, the backend isn't running</li>
                <li>If "Auth Token Check" shows NO TOKEN, you need to sign up/sign in first</li>
                <li>Check the browser console (F12) for detailed error messages</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
