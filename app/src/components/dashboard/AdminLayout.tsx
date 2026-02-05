'use client';

import { useState } from 'react';
import { AdminBottomNav } from './AdminBottomNav';
import { QuickNoteModal } from '@/components/admin/QuickNoteModal';
import { useRouter } from 'next/navigation';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const [noteModalOpen, setNoteModalOpen] = useState(false);

  const handleOpenNote = () => {
    setNoteModalOpen(true);
  };

  const handleCloseNote = () => {
    setNoteModalOpen(false);
    router.refresh();
  };

  return (
    <>
      {children}
      <AdminBottomNav onAddNote={handleOpenNote} />
      <QuickNoteModal isOpen={noteModalOpen} onClose={handleCloseNote} />
    </>
  );
}
