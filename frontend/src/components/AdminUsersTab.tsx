import { useGetAllUsers } from '../hooks/useQueries';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import type { AppRole } from '../backend';

const roleColors: Record<string, string> = {
  customer: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  driver: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  admin: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
};

export default function AdminUsersTab() {
  const { data: users, isLoading } = useGetAllUsers();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users?.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <p className="text-sm text-muted-foreground">
          Total: {filteredUsers?.length || 0} user{filteredUsers?.length !== 1 ? 's' : ''}
        </p>
      </div>

      <ScrollArea className="h-[500px] rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Full Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers && filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow key={user.principalId.toString()}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.fullName}</TableCell>
                  <TableCell>
                    {user.role ? (
                      <Badge variant="outline" className={roleColors[user.role] ?? ''}>
                        {user.role}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">No role</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(Number(user.createdTime) / 1000000).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
