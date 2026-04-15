import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Loader2,
  Edit,
  Trash2,
  X,
  Activity,
  Shield
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../../components/shared/Card';
import { Badge } from '../../components/shared/Badge';
import { Input } from '../../components/shared/Input';
import { Button } from '../../components/shared/Button';

// Mock API URL if not globally defined, though typically it might be in an env var
// Falling back to localhost 5000 as per context
const API_URL = 'http://localhost:5000';

export function UsersPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({ username: '', email: '', role: 'patient', isActive: true });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/auth/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch users');
      }

      setUsers(data.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setEditFormData({
      username: user.username || '',
      email: user.email || '',
      role: user.role || 'patient',
      isActive: user.isActive !== false
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    // Conceptually, you would make a PUT/PATCH request here to update the user in the database
    // For now, updating local state directly to reflect changes pending backend endpoint implementation
    setUsers(prev => prev.map(u =>
      u._id === editingUser._id ? { ...u, ...editFormData } : u
    ));
    setIsEditModalOpen(false);
    setEditingUser(null);
  };

  const filteredUsers = users.filter((u) => {
    const search = searchTerm.toLowerCase();
    return (
      (u.username && u.username.toLowerCase().includes(search)) ||
      (u.email && u.email.toLowerCase().includes(search)) ||
      (u.role && u.role.toLowerCase().includes(search))
    );
  });

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <Badge variant="default" className="bg-purple-100 text-purple-700">Admin</Badge>;
      case 'doctor':
        return <Badge variant="default" className="bg-blue-100 text-blue-700">Doctor</Badge>;
      case 'patient':
        return <Badge variant="default" className="bg-emerald-100 text-emerald-700">Patient</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500">
            View and manage all users registered on the platform.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={fetchUsers} disabled={isLoading} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Total Users</p>
              <h3 className="text-2xl font-bold text-slate-900">{users.length}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <Users size={24} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Patients</p>
              <h3 className="text-2xl font-bold text-slate-900">
                {users.filter(u => u.role === 'patient').length}
              </h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Activity size={24} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Doctors</p>
              <h3 className="text-2xl font-bold text-slate-900">
                {users.filter(u => u.role === 'doctor').length}
              </h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <ShieldCheck size={24} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Admins</p>
              <h3 className="text-2xl font-bold text-slate-900">
                {users.filter(u => u.role === 'admin').length}
              </h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
              <Shield size={24} />
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2 md:col-span-1">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Active Accounts</p>
              <h3 className="text-2xl font-bold text-slate-900">
                {users.filter(u => u.isActive !== false).length}
              </h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center">
              <CheckCircle size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-center gap-4 pb-2">
          <CardTitle>User Directory</CardTitle>
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search users..."
              className="pl-10 w-full block rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {error && (
            <div className="p-6 text-red-600 bg-red-50 text-sm">
              <p>Error: {error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="p-12 flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="px-6 py-4 text-sm font-semibold text-slate-900">User</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-900">Role</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-900">Status</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-900 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                        {searchTerm ? "No users matching your search." : "No users found."}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold uppercase overflow-hidden">
                              {user.username ? user.username.charAt(0) : '?'}
                            </div>
                            <div className="ml-4">
                              <div className="font-medium text-slate-900">{user.username}</div>
                              <div className="text-sm text-slate-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getRoleBadge(user.role)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.isActive !== false ? (
                            <div className="flex items-center text-sm text-emerald-600 font-medium">
                              <CheckCircle size={16} className="mr-1.5" /> Active
                            </div>
                          ) : (
                            <div className="flex items-center text-sm text-red-600 font-medium">
                              <XCircle size={16} className="mr-1.5" /> Inactive
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEditClick(user)}
                              className="text-slate-400 hover:text-blue-600 transition-colors p-2 rounded-md hover:bg-blue-50"
                              title="Edit User"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              className="text-slate-400 hover:text-red-600 transition-colors p-2 rounded-md hover:bg-red-50"
                              title="Delete User"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-xl border-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-100">
              <CardTitle>Edit User Details</CardTitle>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
                <Input
                  label="Username"
                  type="text"
                  value={editFormData.username}
                  onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                  required
                />

                <Input
                  label="Email Address"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  required
                />

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Role</label>
                  <select
                    className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                  >
                    <option value="patient">Patient</option>
                    <option value="doctor">Doctor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-2 pb-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={editFormData.isActive}
                    onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
                    Active Account Status
                  </label>
                </div>

                <div className="flex gap-3 pt-4 mt-4 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    fullWidth
                    onClick={() => setIsEditModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" fullWidth>
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
