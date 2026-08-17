import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2 } from 'lucide-react';
import { useToast } from '../components/Toast';
import Button from '../../components/Button';

export default function AdminSettings() {
  const [settings, setSettings] = useState({ seat_lock_duration: 10, gst_rate: 18, spotlight_movie_id: null, surge_rules: [] });
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmInput, setConfirmInput] = useState('');
  const { addToast } = useToast();

  const fetchSettings = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const headers = { 'x-admin-email': user.email };
      const [setRes, movRes] = await Promise.all([
        axios.get('http://localhost:8080/api/admin/settings', { headers }),
        axios.get('http://localhost:8080/api/admin/movies?limit=100', { headers })
      ]);
      if (setRes.data) setSettings(setRes.data);
      if (movRes.data.data) setMovies(movRes.data.data);
    } catch (e) {
      addToast('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const saveSetting = async (key, value) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      await axios.put('http://localhost:8080/api/admin/settings', { [key]: value }, { headers: { 'x-admin-email': user.email } });
      addToast('Settings updated', 'success');
      setSettings(prev => ({ ...prev, [key]: value }));
    } catch (e) {
      addToast('Failed to save settings', 'error');
    }
  };

  const handleSurgeChange = (index, field, value) => {
    const newRules = [...(settings.surge_rules || [])];
    newRules[index][field] = value;
    setSettings({ ...settings, surge_rules: newRules });
  };

  const addSurgeRule = () => {
    const newRules = [...(settings.surge_rules || []), { day_of_week: 'Mon', time_from: '18:00', time_to: '22:00', multiplier: 1.5 }];
    setSettings({ ...settings, surge_rules: newRules });
  };

  const deleteSurgeRule = (index) => {
    const newRules = settings.surge_rules.filter((_, i) => i !== index);
    setSettings({ ...settings, surge_rules: newRules });
  };

  const testEmail = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      await axios.post('http://localhost:8080/api/admin/settings/test-email', {}, { headers: { 'x-admin-email': user.email } });
      addToast('Test email sent successfully', 'success');
    } catch (e) {
      addToast('Failed to send test email', 'error');
    }
  };

  const clearLocks = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      await axios.post('http://localhost:8080/api/seats/cleanup', {}, { headers: { 'x-admin-email': user.email } });
      addToast('Expired seat locks cleared', 'success');
      setConfirmInput('');
    } catch (e) {
      addToast('Failed to clear seat locks', 'error');
    }
  };

  const spotlightMovie = movies.find(m => m.id === settings.spotlight_movie_id);

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: 800 }}>
      <h1 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '24px' }}>Settings</h1>

      <div style={{ background: 'var(--bg-surface)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
        <h2 style={{ color: 'var(--text-primary)', margin: '0 0 8px 0', fontSize: 18 }}>Spotlight Movie</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '0 0 16px 0' }}>Select a movie to feature on the homepage hero section.</p>
        
        {spotlightMovie && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: 16 }}>
            <img src={spotlightMovie.poster_url || 'http://localhost:8080/resources/images/posters/default_poster.png'} alt="spotlight" style={{ width: 40, height: 60, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{spotlightMovie.title}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px' }}>
          <select value={settings.spotlight_movie_id || ''} onChange={e => setSettings({...settings, spotlight_movie_id: parseInt(e.target.value)})} style={{ flex: 1, padding: '8px', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}>
            <option value="">Select Movie</option>
            {movies.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>
          <Button primary onClick={() => saveSetting('spotlight_movie_id', settings.spotlight_movie_id)}>Save</Button>
        </div>
      </div>

      <div style={{ background: 'var(--bg-surface)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
        <h2 style={{ color: 'var(--text-primary)', margin: '0 0 8px 0', fontSize: 18 }}>Seat Lock Duration</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '0 0 16px 0' }}>Minutes seats are held during checkout (1-30)</p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input type="number" min={1} max={30} value={settings.seat_lock_duration} onChange={e => setSettings({...settings, seat_lock_duration: parseInt(e.target.value)})} style={{ width: 120, padding: '8px', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
          <Button primary onClick={() => saveSetting('seat_lock_duration', settings.seat_lock_duration)}>Save</Button>
        </div>
      </div>

      <div style={{ background: 'var(--bg-surface)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
        <h2 style={{ color: 'var(--text-primary)', margin: '0 0 8px 0', fontSize: 18 }}>GST Rate</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '0 0 16px 0' }}>GST percentage applied to all ticket purchases</p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input type="number" min={0} max={28} step={0.1} value={settings.gst_rate} onChange={e => setSettings({...settings, gst_rate: parseFloat(e.target.value)})} style={{ width: 120, padding: '8px', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
          <Button primary onClick={() => saveSetting('gst_rate', settings.gst_rate)}>Save</Button>
        </div>
      </div>

      <div style={{ background: 'var(--bg-surface)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
        <h2 style={{ color: 'var(--text-primary)', margin: '0 0 16px 0', fontSize: 18 }}>Surge Pricing Rules</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: 16 }}>
          {(settings.surge_rules || []).map((rule, index) => (
            <div key={index} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <select value={rule.day_of_week} onChange={e => handleSurgeChange(index, 'day_of_week', e.target.value)} style={{ padding: '8px', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}>
                <option value="Mon">Mon</option><option value="Tue">Tue</option><option value="Wed">Wed</option>
                <option value="Thu">Thu</option><option value="Fri">Fri</option><option value="Sat">Sat</option><option value="Sun">Sun</option>
              </select>
              <input type="time" value={rule.time_from} onChange={e => handleSurgeChange(index, 'time_from', e.target.value)} style={{ padding: '8px', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
              <span style={{ color: 'var(--text-secondary)' }}>to</span>
              <input type="time" value={rule.time_to} onChange={e => handleSurgeChange(index, 'time_to', e.target.value)} style={{ padding: '8px', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
              <input type="number" min={1.0} max={3.0} step={0.1} value={rule.multiplier} onChange={e => handleSurgeChange(index, 'multiplier', parseFloat(e.target.value))} style={{ width: 80, padding: '8px', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
              <button onClick={() => deleteSurgeRule(index)} style={{ background: 'transparent', border: 'none', color: 'var(--brand-red)', cursor: 'pointer', padding: 4 }}><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button secondary onClick={addSurgeRule}>Add Rule</Button>
          <Button primary onClick={() => saveSetting('surge_rules', settings.surge_rules)}>Save All Rules</Button>
        </div>
      </div>

      <div style={{ background: 'var(--bg-surface)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
        <h2 style={{ color: 'var(--text-primary)', margin: '0 0 16px 0', fontSize: 18 }}>Email Configuration</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: '12px' }}><span style={{ color: 'var(--text-secondary)', width: 100 }}>FROM_EMAIL</span><span style={{ color: 'var(--text-primary)' }}>--</span></div>
          <div style={{ display: 'flex', gap: '12px' }}><span style={{ color: 'var(--text-secondary)', width: 100 }}>FROM_NAME</span><span style={{ color: 'var(--text-primary)' }}>--</span></div>
        </div>
        <Button secondary onClick={testEmail}>Test Email</Button>
      </div>

      <div style={{ background: 'rgba(232, 54, 74, 0.05)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--brand-red)' }}>
        <h2 style={{ color: 'var(--brand-red)', margin: '0 0 8px 0', fontSize: 18 }}>Danger Zone</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '0 0 16px 0' }}>Clear all expired seat locks forcefully. This may interrupt ongoing checkouts.</p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input value={confirmInput} onChange={e => setConfirmInput(e.target.value)} placeholder="Type CONFIRM" style={{ width: 160, padding: '8px', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
          <Button danger disabled={confirmInput !== 'CONFIRM'} onClick={clearLocks}>Clear Expired Seat Locks</Button>
        </div>
      </div>
    </div>
  );
}
