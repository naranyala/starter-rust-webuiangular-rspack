import React from 'react';
import { useUsers, useDbStats } from '../hooks/useDatabase';
import { logger } from '../../../shared/utils/logger';

export const UserManagementComponent: React.FC = () => {
  const { data: usersData, loading: usersLoading, error: usersError } = useUsers();
  const { data: statsData, loading: statsLoading, error: statsError } = useDbStats();

  React.useEffect(() => {
    logger.info('UserManagement component mounted');
    return () => {
      logger.info('UserManagement component unmounted');
    };
  }, []);

  if (usersLoading || statsLoading) return <div>Loading user data...</div>;
  if (usersError || statsError) return <div>Error loading user data</div>;

  const users = usersData?.data || [];
  const stats = statsData?.stats || {};

  return (
    <div className="user-management">
      <h2>User Management</h2>
      
      <div className="stats-summary">
        <h3>Database Statistics</h3>
        <p>Total Users: {stats.users || 0}</p>
        <p>Tables: {stats.tables?.join(', ') || 'N/A'}</p>
      </div>
      
      <div className="users-list">
        <h3>Users</h3>
        {users.length === 0 ? (
          <p>No users found.</p>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: any) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{user.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};