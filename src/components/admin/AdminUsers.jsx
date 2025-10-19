import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Pencil, Trash2, Shield, X, RefreshCw, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AVAILABLE_ROLES = ['admin', 'farmer', 'wholesaler', 'moderator', 'viewer'];

const AdminUsers = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Edit user state
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  // Delete user state
  const [deletingUser, setDeletingUser] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Role management state
  const [managingRoles, setManagingRoles] = useState(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');

  useEffect(() => {
    fetchData();
    
    // Set up realtime subscriptions
    const profilesChannel = supabase
      .channel('profiles_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        console.log('Profiles changed, refreshing...');
        fetchData();
      })
      .subscribe();

    const rolesChannel = supabase
      .channel('roles_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, () => {
        console.log('Roles changed, refreshing...');
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(rolesChannel);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('=== Fetching data ===');
      
      // Check authentication first
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Auth error:', authError);
        throw new Error('Not authenticated');
      }
      console.log('Current user:', currentUser?.email);
      
      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (profilesError) {
        console.error('Profiles error:', profilesError);
        console.error('Error code:', profilesError.code);
        console.error('Error message:', profilesError.message);
        console.error('Error details:', profilesError.details);
        throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
      }
      
      console.log(`Fetched ${profilesData?.length || 0} profiles`);
      
      // Fetch roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');
      
      if (rolesError) {
        console.error('Roles error:', rolesError);
        console.error('Error code:', rolesError.code);
        console.error('Error message:', rolesError.message);
        throw new Error(`Failed to fetch roles: ${rolesError.message}`);
      }
      
      console.log(`Fetched ${rolesData?.length || 0} roles`);
      
      // Combine data
      const usersWithRoles = profilesData?.map(profile => ({
        ...profile,
        user_roles: rolesData?.filter(role => role.user_id === profile.id) || []
      })) || [];
      
      console.log('Users with roles:', usersWithRoles.length);
      
      setUsers(usersWithRoles);
      setRoles(rolesData || []);
      
    } catch (error) {
      console.error('=== Error in fetchData ===', error);
      setError(error.message);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Edit User Functions
  const openEditDialog = (user) => {
    console.log('=== Opening edit dialog ===');
    console.log('User:', user);
    setEditingUser(user);
    setEditForm({
      full_name: user.full_name || '',
      location: user.location || '',
      phone: user.phone || ''
    });
    setShowEditDialog(true);
  };

  const handleEditUser = async () => {
    console.log('=== Updating user ===');
    console.log('User ID:', editingUser.id);
    console.log('Form data:', editForm);
    
    setActionLoading(true);
    
    try {
      // Verify authentication
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !currentUser) {
        throw new Error('Not authenticated');
      }
      
      // Update profile
      const { data, error } = await supabase
        .from('profiles')
        .update(editForm)
        .eq('id', editingUser.id)
        .select();
      
      if (error) {
        console.error('=== Update error ===');
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        
        // Provide more helpful error messages
        if (error.code === '42501') {
          throw new Error('Permission denied. Check RLS policies for profiles table.');
        } else if (error.code === '23505') {
          throw new Error('Duplicate entry. This data already exists.');
        }
        
        throw new Error(`Update failed: ${error.message}`);
      }
      
      console.log('Update success:', data);
      
      await fetchData();
      setShowEditDialog(false);
      setEditingUser(null);
      
      toast({
        title: "Success",
        description: "User updated successfully!",
        duration: 3000,
      });
      
    } catch (error) {
      console.error('=== Error updating user ===', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Delete User Functions
  const openDeleteDialog = (user) => {
    console.log('=== Opening delete dialog ===');
    console.log('User:', user);
    setDeletingUser(user);
    setShowDeleteDialog(true);
  };

  const handleDeleteUser = async () => {
    console.log('=== Deleting user ===');
    console.log('User ID:', deletingUser.id);
    
    setActionLoading(true);
    
    try {
      // Verify authentication
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !currentUser) {
        throw new Error('Not authenticated');
      }
      
      // Delete user roles first (foreign key constraint)
      const { error: rolesError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', deletingUser.id);
      
      if (rolesError) {
        console.error('=== Delete roles error ===');
        console.error('Error code:', rolesError.code);
        console.error('Error message:', rolesError.message);
        
        if (rolesError.code === '42501') {
          throw new Error('Permission denied. Check RLS policies for user_roles table.');
        }
        
        throw new Error(`Failed to delete roles: ${rolesError.message}`);
      }
      
      console.log('Roles deleted successfully');
      
      // Then delete the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', deletingUser.id);
      
      if (profileError) {
        console.error('=== Delete profile error ===');
        console.error('Error code:', profileError.code);
        console.error('Error message:', profileError.message);
        
        if (profileError.code === '42501') {
          throw new Error('Permission denied. Check RLS policies for profiles table.');
        }
        
        throw new Error(`Failed to delete profile: ${profileError.message}`);
      }
      
      console.log('Delete success');
      
      await fetchData();
      setShowDeleteDialog(false);
      setDeletingUser(null);
      
      toast({
        title: "Success",
        description: "User deleted successfully!",
        duration: 3000,
      });
      
    } catch (error) {
      console.error('=== Error deleting user ===', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Role Management Functions
  const openRoleDialog = (user) => {
    console.log('=== Opening role dialog ===');
    console.log('User:', user);
    setManagingRoles(user);
    setSelectedRole('');
    setShowRoleDialog(true);
  };

  const handleAddRole = async () => {
    if (!selectedRole) {
      toast({
        title: "Warning",
        description: "Please select a role",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    console.log('=== Adding role ===');
    console.log('User ID:', managingRoles.id);
    console.log('Role:', selectedRole);
    
    setActionLoading(true);
    
    try {
      // Verify authentication
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !currentUser) {
        throw new Error('Not authenticated');
      }
      
      // Check if role already exists
      const existingRole = managingRoles.user_roles.find(ur => ur.role === selectedRole);
      if (existingRole) {
        throw new Error('User already has this role');
      }
      
      const { data, error } = await supabase
        .from('user_roles')
        .insert({
          user_id: managingRoles.id,
          role: selectedRole
        })
        .select();
      
      if (error) {
        console.error('=== Add role error ===');
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        if (error.code === '42501') {
          throw new Error('Permission denied. Check RLS policies for user_roles table.');
        } else if (error.code === '23505') {
          throw new Error('This role is already assigned to the user.');
        }
        
        throw new Error(`Failed to add role: ${error.message}`);
      }
      
      console.log('Add role success:', data);
      
      await fetchData();
      setSelectedRole('');
      
      toast({
        title: "Success",
        description: `Role "${selectedRole}" added successfully!`,
        duration: 3000,
      });
      
    } catch (error) {
      console.error('=== Error adding role ===', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveRole = async (roleId, roleName) => {
    if (!confirm(`Remove role "${roleName}"?`)) return;
    
    console.log('=== Removing role ===');
    console.log('Role ID:', roleId);
    
    setActionLoading(true);
    
    try {
      // Verify authentication
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !currentUser) {
        throw new Error('Not authenticated');
      }
      
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);
      
      if (error) {
        console.error('=== Remove role error ===');
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        if (error.code === '42501') {
          throw new Error('Permission denied. Check RLS policies for user_roles table.');
        }
        
        throw new Error(`Failed to remove role: ${error.message}`);
      }
      
      console.log('Remove role success');
      
      await fetchData();
      
      toast({
        title: "Success",
        description: `Role "${roleName}" removed successfully!`,
        duration: 3000,
      });
      
    } catch (error) {
      console.error('=== Error removing role ===', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <p className="text-muted-foreground">Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Card className="border-destructive">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <p className="text-destructive font-medium mb-2">Error Loading Users</p>
                <p className="text-sm text-muted-foreground mb-4">{error}</p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p><strong>Possible causes:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Row Level Security (RLS) policies not configured</li>
                    <li>Missing admin role or permissions</li>
                    <li>Database connection issues</li>
                    <li>Table doesn't exist or has been renamed</li>
                  </ul>
                </div>
              </div>
            </div>
            <Button onClick={fetchData} className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Users</p>
            <p className="text-2xl font-bold">{users.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Roles</p>
            <p className="text-2xl font-bold">{roles.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Admins</p>
            <p className="text-2xl font-bold">
              {users.filter(u => u.user_roles.some(r => r.role === 'admin')).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Farmers</p>
            <p className="text-2xl font-bold">
              {users.filter(u => u.user_roles.some(r => r.role === 'farmer')).length}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {users.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No users found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Users will appear here once they sign up
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => (
            <Card key={user.id} className="relative hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">
                      {user.full_name || 'Unnamed User'}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {user.email || 'No email'}
                    </p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(user)}
                      disabled={actionLoading}
                      title="Edit user"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => openDeleteDialog(user)}
                      disabled={actionLoading}
                      title="Delete user"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Location</p>
                      <p className="font-medium truncate">{user.location || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Phone</p>
                      <p className="font-medium truncate">{user.phone || 'N/A'}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground pt-2 border-t">
                    Joined: {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Roles</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => openRoleDialog(user)}
                      disabled={actionLoading}
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      Manage
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {user.user_roles && user.user_roles.length > 0 ? (
                      user.user_roles.map((ur, i) => (
                        <Badge 
                          key={i} 
                          variant={ur.role === 'admin' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {ur.role}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline" className="text-xs">No roles</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information for {editingUser?.full_name || 'this user'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={editForm.full_name || ''}
                onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                placeholder="Enter full name"
                disabled={actionLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={editForm.location || ''}
                onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                placeholder="Enter location"
                disabled={actionLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={editForm.phone || ''}
                onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                placeholder="Enter phone number"
                disabled={actionLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowEditDialog(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleEditUser} disabled={actionLoading}>
              {actionLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deletingUser?.full_name || 'this user'}</strong> and all associated data including:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>User profile</li>
                <li>All assigned roles</li>
                <li>Related transactions (if any)</li>
              </ul>
              <p className="mt-2 text-destructive font-medium">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? 'Deleting...' : 'Delete User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Manage Roles Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Roles</DialogTitle>
            <DialogDescription>
              Manage roles for {managingRoles?.full_name || 'this user'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <h4 className="text-sm font-medium mb-3">Current Roles</h4>
              {managingRoles?.user_roles.length > 0 ? (
                <div className="space-y-2">
                  {managingRoles.user_roles.map((ur) => (
                    <div key={ur.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <Badge variant={ur.role === 'admin' ? 'default' : 'secondary'}>
                        {ur.role}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveRole(ur.id, ur.role)}
                        disabled={actionLoading}
                        title="Remove role"
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground p-3 border rounded-lg bg-muted/30">
                  No roles assigned
                </p>
              )}
            </div>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">Add New Role</h4>
              <div className="flex gap-2">
                <Select 
                  value={selectedRole} 
                  onValueChange={setSelectedRole}
                  disabled={actionLoading}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_ROLES.filter(role => 
                      !managingRoles?.user_roles.some(ur => ur.role === role)
                    ).map(role => (
                      <SelectItem key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </SelectItem>
                    ))}
                    {AVAILABLE_ROLES.every(role => 
                      managingRoles?.user_roles.some(ur => ur.role === role)
                    ) && (
                      <SelectItem value="none" disabled>
                        All roles assigned
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleAddRole} 
                  disabled={!selectedRole || actionLoading}
                >
                  {actionLoading ? 'Adding...' : 'Add'}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => setShowRoleDialog(false)}
              disabled={actionLoading}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;