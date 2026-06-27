import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';

export default function DriverDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState('overview'); 
  const token = localStorage.getItem('token');

  const [profile, setProfile] = useState(null);
  const [dashboard, setDashboard] = useState({ totalCompletedJobs: 0, totalEarnings: 0, activeJob: null, history: [] });
  const [availableJobs, setAvailableJobs] = useState([]);

  const fetchDriverData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [resMe, resDash, resJobs] = await Promise.all([
        fetch('https://seapedia-navy.vercel.app/api/auth/me', { headers }),
        fetch('https://seapedia-navy.vercel.app/api/driver/dashboard', { headers }),
        fetch('https://seapedia-navy.vercel.app/api/driver/jobs/available', { headers })
      ]);
      const dataMe = await resMe.json();
      const dataDash = await resDash.json();
      const dataJobs = await resJobs.json();
      setProfile(dataMe.profile);
      setDashboard({ totalCompletedJobs: dataDash.summary?.totalCompletedJobs || 0, totalEarnings: dataDash.summary?.totalEarnings || 0, activeJob: dataDash.activeJob || null, history: dataDash.history || [] });
      setAvailableJobs(dataJobs.data || []);
      setLoading(false);
    } catch (error) { setLoading(false); }
  };

  useEffect(() => {
    if (!token) return navigate('/login');
    const roles = JSON.parse(localStorage.getItem('roles') || '[]');
    if (!roles.includes('DRIVER')) {
      Swal.fire('Akses Ditolak', 'Kamu bukan tim ekspedisi (DRIVER).', 'error').then(() => navigate('/'));
      return;
    }
    fetchDriverData();
  }, [navigate, token]);

  const handleTakeJob = async (jobId) => {
    const result = await Swal.fire({
      title: 'Ambil paket ini?',
      text: "Kamu akan bertanggung jawab mengantarkan paket ini.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#9ca3af',
      confirmButtonText: 'Ya, Ambil!'
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`https://seapedia-navy.vercel.app/api/driver/jobs/${jobId}/take`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      Swal.fire('Berhasil!', data.message, 'success');
      setActiveMenu('overview'); 
      fetchDriverData(); 
    } catch (error) { Swal.fire('Gagal', error.message, 'error'); }
  };

  const handleCompleteJob = async (jobId) => {
    const result = await Swal.fire({
      title: 'Konfirmasi Selesai',
      text: "Pastikan paket sudah diterima di tangan pembeli.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#10b981', // Emerald color
      cancelButtonColor: '#9ca3af',
      confirmButtonText: 'Telah Diterima'
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`https://seapedia-navy.vercel.app/api/driver/jobs/${jobId}/complete`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      Swal.fire('Kerja Bagus!', data.message, 'success');
      fetchDriverData();
    } catch (error) { Swal.fire('Gagal', error.message, 'error'); }
  };

  const handleLogout = () => {
    localStorage.clear();
    Swal.fire('Shift Berakhir', 'Selamat beristirahat, Kapten.', 'success').then(() => navigate('/'));
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center text-blue-600 animate-pulse font-bold text-xl">Memuat Dasbor...</div>;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between hidden md:flex">
        <div>
          <div className="p-6 border-b border-gray-100">
            <h1 className="text-2xl font-black text-blue-600 tracking-tight">SEAPEDIA</h1>
            <p className="text-xs text-gray-500 font-semibold mt-1 uppercase tracking-wider">Ruang Kurir</p>
          </div>
          <nav className="p-4 space-y-2">
            {['overview', 'bursa', 'history'].map(menu => (
              <button key={menu} onClick={() => setActiveMenu(menu)} className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all capitalize ${activeMenu === menu ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                {menu === 'overview' ? 'Shift Saat Ini' : menu === 'bursa' ? 'Bursa Pekerjaan' : 'Riwayat & Pendapatan'}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t border-gray-100 space-y-2">
          <button onClick={handleLogout} className="w-full text-left px-4 py-3 rounded-xl font-semibold text-rose-600 hover:bg-rose-50 transition-all">Akhiri Shift</button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8 relative">
        <header className="mb-8 border-b border-gray-200 pb-4">
          <h2 className="text-3xl font-black text-gray-800 capitalize">{activeMenu === 'overview' ? 'Shift Saat Ini' : activeMenu === 'bursa' ? 'Bursa Pekerjaan (Tersedia)' : 'Riwayat & Pendapatan'}</h2>
          <p className="text-gray-500 mt-1">Mengemudi sebagai: <span className="font-bold text-blue-600">@{profile.username}</span></p>
        </header>

        {activeMenu === 'overview' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <p className="text-blue-600 font-bold uppercase tracking-wider text-sm">Status Saat Ini</p>
                <h3 className="text-2xl font-black text-gray-800 mt-1">{dashboard.activeJob ? 'Sedang Mengantar Paket 🚀' : 'Menunggu Pekerjaan ☕'}</h3>
              </div>
              {!dashboard.activeJob && (
                <button onClick={() => setActiveMenu('bursa')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition-all">Cari Paket &rarr;</button>
              )}
            </div>
            {dashboard.activeJob && (
              <div className="bg-white p-8 rounded-3xl shadow-lg border-2 border-blue-400 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-blue-400"></div>
                <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-6">
                  <div>
                    <span className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-lg text-xs uppercase">Tugas Aktif</span>
                    <h4 className="text-xl font-bold text-gray-800 mt-3">ID: {dashboard.activeJob.orderId.slice(0,8)}</h4>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-400 uppercase">Potensi Upah</p>
                    <p className="text-3xl font-black text-emerald-600">Rp {dashboard.activeJob.earning.toLocaleString('id-ID')}</p>
                  </div>
                </div>
                <button onClick={() => handleCompleteJob(dashboard.activeJob.id)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-xl shadow-lg text-lg">✔ Konfirmasi Paket Diterima</button>
              </div>
            )}
          </div>
        )}

        {activeMenu === 'bursa' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {availableJobs.length === 0 ? <p className="text-gray-500 col-span-2">Tidak ada paket tersedia.</p> : null}
              {availableJobs.map(job => (
                <div key={job.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between">
                      <span className="text-xs font-bold text-gray-400 uppercase">Toko: {job.order.store.name}</span>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Pembeli: @{job.order.user.username}</span>
                    </div>
                    <h4 className="font-bold text-gray-800 text-lg mt-3 border-b border-gray-50 pb-3">Upah: Rp {job.earning.toLocaleString('id-ID')}</h4>
                  </div>
                  <button onClick={() => handleTakeJob(job.id)} disabled={dashboard.activeJob !== null} className={`mt-4 w-full font-bold py-3 rounded-xl transition-all ${dashboard.activeJob !== null ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'}`}>
                    {dashboard.activeJob !== null ? 'Selesaikan Tugas Dulu' : 'Ambil Paket'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeMenu === 'history' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 rounded-3xl shadow-lg text-white">
                <h2 className="text-blue-200 font-bold text-sm uppercase tracking-wider">Total Pendapatan</h2>
                <p className="text-5xl font-black mt-3">Rp {dashboard.totalEarnings.toLocaleString('id-ID')}</p>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <h2 className="text-gray-400 font-bold text-sm uppercase tracking-wider">Paket Selesai</h2>
                <p className="text-5xl font-black text-gray-800 mt-3">{dashboard.totalCompletedJobs}</p>
              </div>
            </div>
            <div className="space-y-4">
              {dashboard.history.map(job => (
                <div key={job.id} className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-800">ID Pesanan: {job.orderId.slice(0,8)}</p>
                    <p className="text-xs text-gray-500 mt-1">Selesai pada: {new Date(job.updatedAt).toLocaleString('id-ID')}</p>
                  </div>
                  <span className="font-black text-emerald-600">+ Rp {job.earning.toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}