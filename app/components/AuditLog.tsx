'use client';

import React, { useState, useEffect } from 'react';
import { usePermissions } from '../hooks/usePermissions';

interface AuditLogEntry {
  id: string;
  userId: number;
  username: string;
  action: string;
  resource: string;
  timestamp: string;
  details?: any;
}

export default function AuditLog() {
  const { isScheduler } = usePermissions();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isScheduler) {
      fetchAuditLogs();
    }
  }, [isScheduler]);

  const fetchAuditLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const authToken = localStorage.getItem('auth_token');
      const response = await fetch('/api/audit-logs', {
        headers: {
          'Authorization': authToken || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      } else {
        setError('Failed to fetch audit logs');
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setError('Error fetching audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isScheduler) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning" role="alert">
          <h4 className="alert-heading">Access Denied</h4>
          <p>You need scheduler permissions to view audit logs.</p>
        </div>
      </div>
    );
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('vi-VN');
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
        return 'success';
      case 'update':
        return 'warning';
      case 'delete':
        return 'danger';
      case 'login':
        return 'info';
      case 'logout':
        return 'secondary';
      default:
        return 'primary';
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Audit Log</h2>
        <button 
          className="btn btn-outline-primary"
          onClick={fetchAuditLogs}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : logs.length === 0 ? (
        <div className="alert alert-info" role="alert">
          No audit logs found.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Resource</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{formatTimestamp(log.timestamp)}</td>
                  <td>
                    <strong>{log.username}</strong>
                    <br />
                    <small className="text-muted">ID: {log.userId}</small>
                  </td>
                  <td>
                    <span className={`badge bg-${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td>{log.resource}</td>
                  <td>
                    {log.details ? (
                      <details>
                        <summary>View Details</summary>
                        <pre className="mt-2 p-2 bg-light rounded">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    ) : (
                      <span className="text-muted">No details</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 