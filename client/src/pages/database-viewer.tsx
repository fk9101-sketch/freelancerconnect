import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  phone?: string;
  firebase_uid?: string;
  created_at: string;
}

interface Lead {
  id: number;
  title: string;
  description: string;
  category: string;
  location: string;
  customer_id: number;
  budget?: number;
  status: string;
  created_at: string;
}

export default function DatabaseViewer() {
  const [users, setUsers] = useState<User[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Test API health first
      const healthResponse = await fetch('/.netlify/functions/api/health');
      if (!healthResponse.ok) {
        throw new Error('API is not responding');
      }

      // Fetch users and leads
      const [usersResponse, leadsResponse] = await Promise.all([
        fetch('/.netlify/functions/api/users'),
        fetch('/.netlify/functions/api/leads')
      ]);

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
      }

      if (leadsResponse.ok) {
        const leadsData = await leadsResponse.json();
        setLeads(leadsData);
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading database data...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-red-600 mb-4">
                <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h3 className="text-lg font-semibold mb-2">Database Connection Error</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <div className="text-sm text-gray-500 space-y-2">
                  <p>Make sure you have:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Created a Neon database</li>
                    <li>Added DATABASE_URL to Netlify environment variables</li>
                    <li>Run the database setup SQL script</li>
                    <li>Deployed the Netlify functions</li>
                  </ul>
                </div>
                <Button onClick={fetchData} className="mt-4">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Database Viewer</h1>
          <Button onClick={fetchData} variant="outline">
            Refresh Data
          </Button>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Users ({users.length})
              <Badge variant="secondary">Database Table</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No users found in database</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-2 text-left">ID</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Email</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Role</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Phone</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="border border-gray-300 px-4 py-2">{user.id}</td>
                        <td className="border border-gray-300 px-4 py-2">{user.email}</td>
                        <td className="border border-gray-300 px-4 py-2">{user.name}</td>
                        <td className="border border-gray-300 px-4 py-2">
                          <Badge variant={user.role === 'admin' ? 'destructive' : 'default'}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="border border-gray-300 px-4 py-2">{user.phone || '-'}</td>
                        <td className="border border-gray-300 px-4 py-2">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leads Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Leads ({leads.length})
              <Badge variant="secondary">Database Table</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leads.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No leads found in database</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-2 text-left">ID</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Title</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Category</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Location</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Budget</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr key={lead.id}>
                        <td className="border border-gray-300 px-4 py-2">{lead.id}</td>
                        <td className="border border-gray-300 px-4 py-2">{lead.title}</td>
                        <td className="border border-gray-300 px-4 py-2">{lead.category}</td>
                        <td className="border border-gray-300 px-4 py-2">{lead.location}</td>
                        <td className="border border-gray-300 px-4 py-2">
                          {lead.budget ? `$${lead.budget}` : '-'}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <Badge variant={lead.status === 'open' ? 'default' : 'secondary'}>
                            {lead.status}
                          </Badge>
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {new Date(lead.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Database Info */}
        <Card>
          <CardHeader>
            <CardTitle>Database Connection Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>API Endpoint:</strong> /.netlify/functions/api/</p>
              <p><strong>Health Check:</strong> <span className="text-green-600">✓ Connected</span></p>
              <p><strong>Users Table:</strong> {users.length} records</p>
              <p><strong>Leads Table:</strong> {leads.length} records</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
