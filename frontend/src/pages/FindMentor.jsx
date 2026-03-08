import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import Navbar from '../components/Navbar';

const SKILL_FILTERS = ['All', 'Python', 'JavaScript', 'React', 'Node.js', 'Java', 'Machine Learning', 'Data Science', 'SQL', 'C++', 'TypeScript'];

export default function FindMentor() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    API.get('/users/me').then(r => setProfile(r.data)).catch(() => {});
    fetchMentors();
  }, []);

  const fetchMentors = async (skill) => {
    setLoading(true);
    try {
      const url = skill && skill !== 'All' ? `/users/mentors?skill=${encodeURIComponent(skill)}` : '/users/mentors';
      const res = await API.get(url);
      setMentors(res.data);
    } catch {}
    setLoading(false);
  };

  const handleFilter = (skill) => {
    setActiveFilter(skill);
    fetchMentors(skill);
  };

  const filtered = mentors.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.teachingSkills?.some(sk => sk.toLowerCase().includes(search.toLowerCase()))
  );

  const trustColor = (score) => score >= 80 ? '#22c97e' : score >= 50 ? '#f5c842' : '#ff5c7a';

  return (
    <div style={s.root}>
      <Navbar profile={profile} />
      <div style={s.content}>
        <h1 style={s.title}>Find a Mentor</h1>
        <p style={s.sub}>Connect with experts who can teach you one-on-one</p>

        {/* Search + filters */}
        <div style={s.searchRow}>
          <input
            className="nx-input"
            placeholder="Search by name or skill…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 360 }}
          />
        </div>

        <div style={s.filters}>
          {SKILL_FILTERS.map(f => (
            <button
              key={f}
              style={{ ...s.filter, ...(activeFilter === f ? s.filterActive : {}) }}
              onClick={() => handleFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={s.empty}>Loading mentors…</div>
        ) : filtered.length === 0 ? (
          <div style={s.empty}>No mentors found. Try a different search or filter.</div>
        ) : (
          <div style={s.grid}>
            {filtered.map(mentor => (
              <div key={mentor._id} style={s.card}>
                <div style={s.cardTop}>
                  <div style={s.avatar}>{mentor.name[0].toUpperCase()}</div>
                  <div>
                    <div style={s.mentorName}>{mentor.name}</div>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:4 }}>
                      <span style={{ color: trustColor(mentor.trustScore), fontWeight:700, fontSize:13 }}>{mentor.trustScore}</span>
                      <span style={{ color:'#555570', fontSize:12 }}>trust score</span>
                    </div>
                  </div>
                </div>

                <div style={s.skills}>
                  {mentor.teachingSkills?.slice(0, 4).map(sk => (
                    <span key={sk} className="nx-badge nx-badge-blue" style={{ fontSize:11 }}>{sk}</span>
                  ))}
                  {mentor.teachingSkills?.length > 4 && (
                    <span style={{ color:'#555570', fontSize:11 }}>+{mentor.teachingSkills.length - 4} more</span>
                  )}
                </div>

                <button
                  className="nx-btn"
                  onClick={() => navigate(`/book/${mentor._id}`)}
                  style={{ width:'100%', padding:'10px', marginTop:'auto', fontSize:13 }}
                >
                  Book Session →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  root: { minHeight:'100vh', background:'#05050f' },
  content: { maxWidth:1100, margin:'0 auto', padding:'28px 24px' },
  title: { fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:26, color:'#e8e8f0', marginBottom:6 },
  sub: { color:'#8888aa', fontSize:14, marginBottom:24 },
  searchRow: { marginBottom:14 },
  filters: { display:'flex', flexWrap:'wrap', gap:8, marginBottom:24 },
  filter: { padding:'7px 16px', borderRadius:20, border:'1.5px solid #1a1a35', background:'transparent', color:'#8888aa', fontSize:13, cursor:'pointer', transition:'all 0.15s' },
  filterActive: { border:'1.5px solid #6c63ff', background:'rgba(108,99,255,0.15)', color:'#8b83ff' },
  empty: { color:'#8888aa', textAlign:'center', padding:'60px 0', fontSize:15 },
  grid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:16 },
  card: { background:'#0a0a1a', border:'1.5px solid #1a1a35', borderRadius:16, padding:20, display:'flex', flexDirection:'column', gap:14, transition:'border-color 0.2s' },
  cardTop: { display:'flex', alignItems:'center', gap:12 },
  avatar: { width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg, #6c63ff, #22c97e)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:800, color:'#fff', flexShrink:0 },
  mentorName: { fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:16, color:'#e8e8f0' },
  skills: { display:'flex', flexWrap:'wrap', gap:6, flex:1 },
};
