import { useState, useEffect } from 'react';
// import { getAllOwners } from '@backend/FetchData';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card';
import { Input } from '@ui/input';
import { Button } from '@ui/button';
import { Badge } from '@ui/badge';
import { 
  User, 
  Search, 
  Mail, 
  MoreVertical,
  UserCheck,
  UserX
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@ui/dropdown-menu';
import { Owner } from '@housebookgroup/shared-types';

import { apiClient } from '@shared/api/wrappers.ts';


export const UserManagementPage = () => {
  const [owners, setOwners] = useState<Owner[]>([{
    ownerId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: ""
  }]);
  const [filteredOwners, setFilteredOwners] = useState<Owner[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOwners = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getAllOwners();
        
        if (data) {
          setOwners(data);
          setFilteredOwners(data);
        } else {
          setError('Failed to load owners');
        }
      } catch (err) {
        console.error('Error fetching owners:', err);
        setError('An error occurred while loading owners');
      } finally {
        setLoading(false);
      }
    };

    fetchOwners();
  }, []);

  // Search filter
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredOwners(owners);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = owners.filter((owner) => {
      const fullName = `${owner.firstName} ${owner.lastName}`.toLowerCase();
      const email = owner.email?.toLowerCase() || '';
      
      return (
        fullName.includes(query) ||
        owner.firstName?.toLowerCase().includes(query) ||
        owner.lastName?.toLowerCase().includes(query) ||
        email.includes(query)
      );
    });

    setFilteredOwners(filtered);
  }, [searchQuery, owners]);

  const handleViewOwner = (ownerId: string) => {
    console.log('View owner:', ownerId);
    // Add navigation or modal logic here
  };

  const handleEditOwner = (ownerId: string) => {
    console.log('Edit owner:', ownerId);
    // Add edit logic here
  };

  const handleDeactivateOwner = (ownerId: string) => {
    console.log('Deactivate owner:', ownerId);
    // Add deactivate logic here
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1>User Management</h1>
          <p className="text-muted-foreground">Manage all property owners</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 text-muted-foreground">
              Loading owners...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 >User Management</h1>
          <p className="text-muted-foreground">Manage all property owners</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 text-destructive">
              {error}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>User Management</h1>
          <p className="text-muted-foreground">
            Manage all property owners.
          </p>
        </div>
        <Button>
          <User className="h-4 w-4 mr-2" />
          Add Owner
        </Button>
      </div>

      {/* Owners Table */}
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle>All Owners</CardTitle>
          </div>
          {/* Search bar in card header */}
          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {searchQuery && (
              <Button
                variant="outline"
                onClick={() => setSearchQuery('')}
              >
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-[600px] overflow-y-auto border rounded-lg">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">First Name</TableHead>
                  <TableHead className="font-semibold">Last Name</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOwners.length > 0 ? (
                  filteredOwners.map((owner) => (
                    <TableRow key={owner.ownerId} className="hover:bg-muted/50">
                      <TableCell className="font-medium border-r">
                        {owner.firstName || 'N/A'}
                      </TableCell>
                      <TableCell className="font-medium border-r">
                        {owner.lastName || 'N/A'}
                      </TableCell>
                      <TableCell className="border-r">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {owner.email || 'No email'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="border-r">
                        <Badge variant="default" className="bg-green-500">
                          <UserCheck className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleViewOwner(owner.ownerId)}>
                              <User className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditOwner(owner.ownerId)}>
                              Edit Owner
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeactivateOwner(owner.ownerId)}
                              className="text-destructive"
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Deactivate
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <User className="h-12 w-12 mb-2" />
                        <p className="font-medium">
                          {searchQuery ? 'No owners found' : 'No owners registered'}
                        </p>
                        <p className="text-sm">
                          {searchQuery 
                            ? 'Try adjusting your search criteria' 
                            : 'Add your first owner to get started'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Results summary */}
          {searchQuery && (
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredOwners.length} of {owners.length} owners
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};


export default UserManagementPage;
