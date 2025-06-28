'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useApi } from '@/hooks/useApi';
import { authenticatedGet, authenticatedPost } from '@/lib/api';

interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: string;
}

interface ApiResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
  };
}

/**
 * Ví dụ sử dụng useApi hook
 */
function UsersListWithHook() {
  const { user, authToken } = useAuth();
  const { data, loading, error, get, post, reset } = useApi<ApiResponse<User>>();

  useEffect(() => {
    // Tự động fetch users khi component mount
    if (authToken) {
      get('/api/users?page=1&recordsPerPage=10');
    }
  }, [authToken, get]);

  const handleRefresh = () => {
    get('/api/users?page=1&recordsPerPage=10');
  };

  const handleCreateUser = async () => {
    try {
      const newUser = {
        username: 'testuser',
        password: 'testpass123',
        fullName: 'Test User',
        email: 'test@example.com',
        role: 'viewer'
      };
      
      await post('/api/users', newUser);
      console.log('User created successfully');
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h3>Users List (using useApi hook)</h3>
      <p>Current user: {user?.username}</p>
      <p>Auth token: {authToken ? 'Available' : 'Not available'}</p>
      
      <button onClick={handleRefresh} className="btn btn-primary me-2">
        Refresh
      </button>
      <button onClick={handleCreateUser} className="btn btn-success me-2">
        Create Test User
      </button>
      <button onClick={reset} className="btn btn-secondary">
        Reset
      </button>

      {data && (
        <div>
          <h4>Users ({data.pagination.totalCount})</h4>
          <ul>
            {data.data.map(user => (
              <li key={user.id}>
                {user.username} - {user.fullName} ({user.role})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Ví dụ sử dụng API utilities trực tiếp
 */
function UsersListWithDirectApi() {
  const { user, authToken } = useAuth();
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchUsers = async () => {
    if (!authToken) {
      setError('No authentication token available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await authenticatedGet('/api/users?page=1&recordsPerPage=10');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ApiResponse<User> = await response.json();
      setUsers(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    if (!authToken) {
      setError('No authentication token available');
      return;
    }

    try {
      const newUser = {
        username: 'directuser',
        password: 'directpass123',
        fullName: 'Direct API User',
        email: 'direct@example.com',
        role: 'viewer'
      };

      const response = await authenticatedPost('/api/users', newUser);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('User created successfully');
      // Refresh the list
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (authToken) {
      fetchUsers();
    }
  }, [authToken]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h3>Users List (using direct API calls)</h3>
      <p>Current user: {user?.username}</p>
      <p>Auth token: {authToken ? 'Available' : 'Not available'}</p>
      
      <button onClick={fetchUsers} className="btn btn-primary me-2">
        Refresh
      </button>
      <button onClick={createUser} className="btn btn-success">
        Create Direct User
      </button>

      <div>
        <h4>Users ({users.length})</h4>
        <ul>
          {users.map(user => (
            <li key={user.id}>
              {user.username} - {user.fullName} ({user.role})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * Component chính để demo
 */
export default function ApiUsageExample() {
  const { user, authToken } = useAuth();

  if (!user) {
    return <div>Please login to see the API usage examples</div>;
  }

  return (
    <div className="container mt-4">
      <h2>API Usage Examples with Basic Authentication</h2>
      
      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <UsersListWithHook />
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <UsersListWithDirectApi />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <h4>Authentication Information</h4>
        <div className="card">
          <div className="card-body">
            <p><strong>Current User:</strong> {user.username}</p>
            <p><strong>Role:</strong> {user.role}</p>
            <p><strong>Full Name:</strong> {user.fullName}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Auth Token:</strong> {authToken ? '✅ Available' : '❌ Not available'}</p>
            {authToken && (
              <details>
                <summary>View Token (for debugging)</summary>
                <code className="d-block mt-2 p-2 bg-light">
                  {authToken}
                </code>
              </details>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 