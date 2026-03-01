import { useState } from 'react';
import { useGetAllUsers } from '../hooks/useQueries';
import type { UserProfile } from '../lib/types';
import { getRoleString } from '../lib/types';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search } from 'lucide-react';

function getRoleLabel(profile: UserProfile): string {
  const role = getRoleString(profile.role);
  if (role === 'admin') return 'Admin';
  if (role === 'driver') return 'Driver';
  if (role === 'customer') return 'Customer';
  return 'No role';
}

function getRoleBadgeVariant(profile: UserProfile): 'default' | 'secondary' | 'outline' | 'destructive' {
  const role = getRoleString(profile.role);
  if (role === 'admin') return 'default';
  if (role === 'driver') return 'secondary';
  if (role === 'customer') return 'outline';
  return 'outline';
}

function formatDate(timestamp: bigint): string {
  try {
    const ms = Number(timestamp) / 1_000_000;
    return new Date(ms).toLocaleDateString();
  } catch {
    return '—';
  }
}

export default function AdminUsersTab() {
  const { data: users, isLoading } = useGetAllUsers();
  const [search, setSearch] = useState('');

  const filtered = (users ?? []).filter((u) => {
    const q = search.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  {search ? 'No users match your search.' : 'No users found.'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((user) => (
                <TableRow key={user.principalId.toString()}>
                  <TableCell className="font-medium">{user.fullName || '—'}</TableCell>
                  <TableCell>{user.email || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user)}>
                      {getRoleLabel(user)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(user.createdTime)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
