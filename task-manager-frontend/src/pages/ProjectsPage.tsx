import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../api/axios';

interface Project {
    id: number;
    name: string;
    description: string;
}

function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const fetchProjects = useCallback(async () => {
        try {
            const response = await api.get('/projects');
            setProjects(response.data as Project[]);
        } catch (err: unknown) {
            if (axios.isAxiosError(err) && err.response && (err.response.status === 401 || err.response.status === 403)) {
                localStorage.removeItem('token');
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            try {
                const response = await api.get('/projects');
                if (isMounted) {
                    setProjects(response.data as Project[]);
                }
            } catch (err: unknown) {
                if (isMounted && axios.isAxiosError(err) && err.response && (err.response.status === 401 || err.response.status === 403)) {
                    localStorage.removeItem('token');
                    navigate('/login');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };
        load();
        return () => {
            isMounted = false;
        };
    }, [navigate]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setSubmitting(true);
        try {
            await api.post('/projects', { name, description });
            setName('');
            setDescription('');
            fetchProjects();
        } catch (err: unknown) {
            if (axios.isAxiosError(err) && err.response && (err.response.status === 401 || err.response.status === 403)) {
                localStorage.removeItem('token');
                navigate('/login');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            {/* Top Navigation */}
            <header className="app-header">
                <div className="brand">
                    <div className="brand-icon">✓</div>
                    <span>Task Manager</span>
                </div>
                <div className="header-actions">
                    <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                        Çıkış Yap
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="page-container">
                <div className="page-title-row">
                    <div>
                        <h1 className="page-title">Projelerim</h1>
                        <p className="page-subtitle">Tüm projelerinizi görüntüleyin ve yeni bir çalışma alanı başlatın</p>
                    </div>
                </div>

                {/* Create Project Form */}
                <div className="card" style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '16px' }}>
                        Yeni Proje Oluştur
                    </h3>
                    <form className="form-inline" onSubmit={handleCreate}>
                        <input
                            className="form-input"
                            placeholder="Proje Adı (örn: E-Ticaret Platformu)"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                        <input
                            className="form-input"
                            placeholder="Açıklama (opsiyonel)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? 'Ekleniyor...' : '+ Proje Oluştur'}
                        </button>
                    </form>
                </div>

                {/* Projects List */}
                {loading ? (
                    <div className="empty-state">Projeler yükleniyor...</div>
                ) : projects.length === 0 ? (
                    <div className="card empty-state">
                        <p style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '6px' }}>
                            Henüz bir projeniz yok
                        </p>
                        <p style={{ color: 'var(--text-muted)' }}>
                            Yukarıdaki form üzerinden ilk projenizi oluşturarak başlayabilirsiniz.
                        </p>
                    </div>
                ) : (
                    <div className="project-grid">
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                className="project-card"
                                onClick={() => navigate(`/projects/${project.id}`)}
                            >
                                <div className="project-card-header">
                                    <div className="project-icon">
                                        {project.name.charAt(0).toUpperCase()}
                                    </div>
                                    <h3 className="project-name">{project.name}</h3>
                                </div>
                                <p className="project-desc">
                                    {project.description || 'Herhangi bir açıklama girilmedi.'}
                                </p>
                                <div className="project-footer">
                                    <span>Panoya Git</span>
                                    <span>→</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

export default ProjectsPage;
