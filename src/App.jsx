import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Trips from './pages/Trips';
import NewTrip from './pages/NewTrip';
import TripDetail from './pages/TripDetail';
import NewEntry from './pages/NewEntry';
import EntryDetail from './pages/EntryDetail';
import Gallery from './pages/Gallery';
import TripMap from './pages/TripMap';
import Budget from './pages/Budget';
import Checklist from './pages/Checklist';
import Settings from './pages/Settings';
import Search from './pages/Search';

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="trips" element={<Trips />} />
            <Route path="trips/new" element={<NewTrip />} />
            <Route path="trips/:tripId" element={<TripDetail />} />
            <Route path="trips/:tripId/entry/new" element={<NewEntry />} />
            <Route path="trips/:tripId/entry/:entryId" element={<EntryDetail />} />
            <Route path="trips/:tripId/gallery" element={<Gallery />} />
            <Route path="trips/:tripId/map" element={<TripMap />} />
            <Route path="trips/:tripId/budget" element={<Budget />} />
            <Route path="trips/:tripId/checklist" element={<Checklist />} />
            <Route path="search" element={<Search />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}
