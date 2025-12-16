import React from 'react';
import MainLayout from './components/Layout/MainLayout';
import Sidebar from './components/Sidebar/Sidebar';
import NoteList from './components/NoteList/NoteList';
import Editor from './components/Editor/Editor';
import TaskDashboard from './components/Tasks/TaskDashboard';
import { NoteProvider, useNotes } from './context/NoteContext';
import EmptyStateModal from './components/Modals/EmptyStateModal';
import ErrorBoundary from './components/ErrorBoundary';
import CommandPalette from './components/CommandPalette/CommandPalette';

const AppContent = () => {
  const { activePage } = useNotes();

  return (
    <>
      <MainLayout
        sidebar={<Sidebar />}
        noteList={activePage === 'tasks' ? <TaskDashboard /> : <NoteList />}
        editor={<Editor />}
      />
      <CommandPalette />
    </>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <NoteProvider>
        <AppContent />
        <EmptyStateModal />
      </NoteProvider>
    </ErrorBoundary>
  );
}

export default App;
