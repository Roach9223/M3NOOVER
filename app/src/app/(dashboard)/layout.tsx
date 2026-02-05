'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar, Header, AdminLayout } from '@/components/dashboard';
import { createClient } from '@/lib/supabase/client';
import type { UserRole } from '@/types/auth';

interface UserData {
  email: string;
  fullName: string | null;
  role: UserRole;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (authUser) {
        // Try to get profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', authUser.id)
          .single();

        setUser({
          email: authUser.email || '',
          fullName: profile?.full_name || authUser.user_metadata?.full_name || null,
          role: (profile?.role as UserRole) || 'parent',
        });
      }
    };

    fetchUser();
  }, []);

  const isAdmin = user?.role === 'admin';
  const isAdminRoute = pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-black flex">
      {/* Hide sidebar on mobile for admin */}
      <div className={isAdmin ? 'hidden lg:block' : ''}>
        <Sidebar
          userRole={user?.role}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      </div>
      <div className="flex-1 flex flex-col">
        <Header
          userName={user?.fullName || undefined}
          userEmail={user?.email}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className={`flex-1 p-4 lg:p-6 overflow-auto ${isAdmin ? 'pb-20 md:pb-6' : ''}`}>
          {isAdmin && isAdminRoute ? (
            <AdminLayout>{children}</AdminLayout>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
