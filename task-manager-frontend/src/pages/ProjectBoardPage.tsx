import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../api/axios';

type Status = 'TODO' | 'IN_PROGRESS' | 'DONE';

interface Task {
    id: number;
    title: string;
    description: string;
    status: Status;
}

interface ProjectInfo {
    id: number;
    name: string;
    description: string;
}

interface ProjectMember {
    id: number;
    userId: number;
    email: string;
    name: string;
    role: 'OWNER' | 'MEMBER';
}

const STATUS_CONFIG: Record<Status, { title: string }> = {
    TODO: { title: 'Yapılacak' },
    IN_PROGRESS: { title: 'Devam Ediyor' },
    DONE: { title: 'Tamamlandı' },
};

const STATUS_KEYS: Status[] = ['TODO', 'IN_PROGRESS', 'DONE'];

function ProjectBoardPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [project, setProject] = useState<ProjectInfo | null>(null);
    const [members, setMembers] = useState<ProjectMember[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(true);
    const [submittingTask, setSubmittingTask] = useState(false);

    // Pointer-based task dragging state
    const pointerDragRef = useRef<{
        taskId: number;
        pointerId: number;
        startX: number;
        startY: number;
        hasMoved: boolean;
    } | null>(null);
    const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<Status | null>(null);

    // Modal state for adding member
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [newMemberRole, setNewMemberRole] = useState<'MEMBER' | 'OWNER'>('MEMBER');
    const [memberError, setMemberError] = useState('');
    const [submittingMember, setSubmittingMember] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const fetchTasks = useCallback(async () => {
        try {
            const response = await api.get(`/projects/${id}/tasks`);
            setTasks(response.data as Task[]);
        } catch (err: unknown) {
            if (axios.isAxiosError(err) && err.response && (err.response.status === 401 || err.response.status === 403)) {
                localStorage.removeItem('token');
                navigate('/login');
            }
        }
    }, [id, navigate]);

    const fetchMembers = useCallback(async () => {
        try {
            const response = await api.get(`/projects/${id}/members`);
            setMembers(response.data as ProjectMember[]);
        } catch (err: unknown) {
            console.error('Üyeler yüklenemedi', err);
        }
    }, [id]);

    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            try {
                const [projRes, membersRes, tasksRes] = await Promise.all([
                    api.get(`/projects/${id}`),
                    api.get(`/projects/${id}/members`),
                    api.get(`/projects/${id}/tasks`),
                ]);
                if (isMounted) {
                    setProject(projRes.data as ProjectInfo);
                    setMembers(membersRes.data as ProjectMember[]);
                    setTasks(tasksRes.data as Task[]);
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

        loadData();

        return () => {
            isMounted = false;
        };
    }, [id, navigate]);

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setSubmittingTask(true);
        try {
            await api.post(`/projects/${id}/tasks`, { title, description });
            setTitle('');
            setDescription('');
            fetchTasks();
        } catch (err: unknown) {
            if (axios.isAxiosError(err) && err.response && (err.response.status === 401 || err.response.status === 403)) {
                localStorage.removeItem('token');
                navigate('/login');
            }
        } finally {
            setSubmittingTask(false);
        }
    };

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        setMemberError('');
        if (!newMemberEmail.trim()) return;

        setSubmittingMember(true);
        try {
            await api.post(`/projects/${id}/members`, {
                email: newMemberEmail.trim(),
                role: newMemberRole,
            });
            setNewMemberEmail('');
            setShowMemberModal(false);
            fetchMembers();
        } catch (err: unknown) {
            if (axios.isAxiosError(err) && err.response?.data) {
                const data = err.response.data as { message?: string };
                setMemberError(data.message || 'Üye eklenemedi. Kullanıcının kayıtlı olduğundan ve projede bulunmadığından emin olun.');
            } else {
                setMemberError('Üye eklenemedi. Kullanıcının kayıtlı olduğundan ve projede bulunmadığından emin olun.');
            }
        } finally {
            setSubmittingMember(false);
        }
    };

    const handleRemoveMember = async (memberId: number) => {
        if (!confirm('Bu üyeyi projeden çıkarmak istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/projects/${id}/members/${memberId}`);
            fetchMembers();
        } catch (err: unknown) {
            if (axios.isAxiosError(err) && err.response?.data) {
                const data = err.response.data as { message?: string };
                alert(data.message || 'Üye çıkarılamadı.');
            } else {
                alert('Üye çıkarılamadı.');
            }
        }
    };

    // Status changer (used by both click buttons and drag & drop)
    const changeTaskStatus = async (taskId: number, newStatus: Status) => {
        const targetTask = tasks.find((t) => t.id === taskId);
        if (!targetTask || targetTask.status === newStatus) return;

        // Optimistic UI update
        setTasks((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
        );

        try {
            await api.patch(`/projects/${id}/tasks/${taskId}/status`, { status: newStatus });
        } catch (err: unknown) {
            console.error('Görev durumu güncellenemedi:', err);
            if (axios.isAxiosError(err)) {
                if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                    localStorage.removeItem('token');
                    navigate('/login');
                    return;
                }
                const serverMsg = (err.response?.data as { message?: string })?.message;
                alert('Görev taşınamadı: ' + (serverMsg || err.message));
            } else {
                alert('Görev güncellenirken beklenmedik bir hata oluştu.');
            }
            fetchTasks();
        }
    };

    const getColumnAtPointer = (clientX: number, clientY: number): Status | null => {
        const element = document.elementFromPoint(clientX, clientY);
        if (!(element instanceof Element)) return null;

        const status = element.closest<HTMLElement>('.kanban-col')?.dataset.status as Status | undefined;
        return status && STATUS_KEYS.includes(status) ? status : null;
    };

    const finishPointerDrag = (e: React.PointerEvent<HTMLDivElement>, shouldMove: boolean) => {
        const pointerDrag = pointerDragRef.current;
        if (!pointerDrag || pointerDrag.pointerId !== e.pointerId) return;

        const targetStatus = getColumnAtPointer(e.clientX, e.clientY);
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }

        pointerDragRef.current = null;
        setDraggedTaskId(null);
        setDragOverColumn(null);

        if (shouldMove && pointerDrag.hasMoved && targetStatus) {
            changeTaskStatus(pointerDrag.taskId, targetStatus);
        }
    };

    const handleTaskPointerDown = (e: React.PointerEvent<HTMLDivElement>, taskId: number) => {
        if (e.button !== 0 || (e.target instanceof Element && e.target.closest('button, input, select, textarea, a'))) {
            return;
        }

        pointerDragRef.current = {
            taskId,
            pointerId: e.pointerId,
            startX: e.clientX,
            startY: e.clientY,
            hasMoved: false,
        };
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handleTaskPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const pointerDrag = pointerDragRef.current;
        if (!pointerDrag || pointerDrag.pointerId !== e.pointerId) return;

        if (!pointerDrag.hasMoved) {
            const distance = Math.hypot(e.clientX - pointerDrag.startX, e.clientY - pointerDrag.startY);
            if (distance < 8) return;

            pointerDrag.hasMoved = true;
            setDraggedTaskId(pointerDrag.taskId);
        }

        const targetStatus = getColumnAtPointer(e.clientX, e.clientY);
        setDragOverColumn((current) => (current === targetStatus ? current : targetStatus));
    };

    return (
        <div>
            {/* Top Navigation */}
            <header className="app-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate('/projects')}
                    >
                        ← Projelere Dön
                    </button>
                    <div className="brand">
                        <div className="brand-icon">✓</div>
                        <span>{project ? project.name : 'Proje Panosu'}</span>
                    </div>
                </div>

                <div className="header-actions">
                    <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                        Çıkış Yap
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="page-container">
                {/* Project Details & Members Section */}
                <div className="card" style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                {project?.name || 'Proje Panosu'}
                            </h2>
                            {project?.description && (
                                <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '0.9rem' }}>
                                    {project.description}
                                </p>
                            )}
                        </div>

                        <button
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                                setMemberError('');
                                setShowMemberModal(true);
                            }}
                        >
                            + Üye Ekle
                        </button>
                    </div>

                    {/* Members List */}
                    <div className="members-bar">
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                            Proje Üyeleri ({members.length}):
                        </span>

                        {members.map((m) => (
                            <div key={m.id} className="member-chip">
                                <div className="member-avatar">
                                    {(m.name || m.email).charAt(0).toUpperCase()}
                                </div>
                                <span>{m.name ? `${m.name} (${m.email})` : m.email}</span>
                                <span className={m.role === 'OWNER' ? 'badge-owner' : 'badge-member'}>
                                    {m.role === 'OWNER' ? 'Sahip' : 'Üye'}
                                </span>
                                {m.role !== 'OWNER' && (
                                    <button
                                        onClick={() => handleRemoveMember(m.id)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#ef4444',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            padding: '0 2px',
                                        }}
                                        title="Üyeyi Çıkar"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Create Task Card */}
                <div className="card" style={{ marginBottom: '28px' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '14px' }}>
                        Yeni Görev Ekle
                    </h3>
                    <form className="form-inline" onSubmit={handleCreateTask}>
                        <input
                            className="form-input"
                            placeholder="Görev başlığı (örn: Giriş ekranı tasarımı)"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                        <input
                            className="form-input"
                            placeholder="Açıklama (opsiyonel)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                        <button type="submit" className="btn btn-primary" disabled={submittingTask}>
                            {submittingTask ? 'Ekleniyor...' : '+ Görev Ekle'}
                        </button>
                    </form>
                </div>

                {/* Kanban Board */}
                {loading ? (
                    <div className="empty-state">Görevler yükleniyor...</div>
                ) : (
                    <>
                        <p className="board-drag-hint">Görev kartını tutup başka bir sütuna sürükleyerek de taşıyabilirsiniz.</p>
                        <div className="kanban-board">
                        {STATUS_KEYS.map((status) => {
                            const columnTasks = tasks.filter((t) => t.status === status);
                            const config = STATUS_CONFIG[status];
                            const isColumnDragOver = dragOverColumn === status;

                            return (
                                <div
                                    key={status}
                                    className={`kanban-col ${isColumnDragOver ? 'is-drag-over' : ''}`}
                                    data-status={status}
                                >
                                    <div className={`kanban-col-header ${status}`}>
                                        <div className="kanban-col-title">
                                            <span>{config.title}</span>
                                            <span className="task-count">{columnTasks.length}</span>
                                        </div>
                                    </div>

                                    <div
                                        className="task-list"
                                    >
                                        {columnTasks.length === 0 ? (
                                            <div className="empty-state">
                                                {isColumnDragOver ? 'Buraya bırakın' : 'Henüz görev yok'}
                                            </div>
                                        ) : (
                                            columnTasks.map((task) => (
                                                <div
                                                    key={task.id}
                                                    className={`task-card ${draggedTaskId === task.id ? 'is-dragging' : ''}`}
                                                    onPointerDown={(e) => handleTaskPointerDown(e, task.id)}
                                                    onPointerMove={handleTaskPointerMove}
                                                    onPointerUp={(e) => finishPointerDrag(e, true)}
                                                    onPointerCancel={(e) => finishPointerDrag(e, false)}
                                                >
                                                    <div className="task-card-top">
                                                        <h4 className="task-title">{task.title}</h4>
                                                        <span className="drag-grip" title="Sürükle">⋮⋮</span>
                                                    </div>
                                                    {task.description && (
                                                        <p className="task-desc">{task.description}</p>
                                                    )}

                                                    {/* Previous / next status controls */}
                                                    {(() => {
                                                        const statusIndex = STATUS_KEYS.indexOf(task.status);
                                                        const previousStatus = STATUS_KEYS[statusIndex - 1];
                                                        const nextStatus = STATUS_KEYS[statusIndex + 1];

                                                        return (
                                                            <div className="task-status-bar">
                                                                <span className={`status-label ${task.status}`}>
                                                                    ● {STATUS_CONFIG[task.status].title}
                                                                </span>
                                                                {previousStatus && (
                                                                    <button
                                                                        type="button"
                                                                        className="status-btn"
                                                                        onClick={() => changeTaskStatus(task.id, previousStatus)}
                                                                        title={`${STATUS_CONFIG[previousStatus].title} sütununa geri taşı`}
                                                                    >
                                                                        ← Geri
                                                                    </button>
                                                                )}
                                                                {nextStatus && (
                                                                    <button
                                                                        type="button"
                                                                        className="status-btn"
                                                                        onClick={() => changeTaskStatus(task.id, nextStatus)}
                                                                        title={`${STATUS_CONFIG[nextStatus].title} sütununa ileri taşı`}
                                                                    >
                                                                        İleri →
                                                                    </button>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        </div>
                    </>
                )}
            </main>

            {/* Add Member Modal */}
            {showMemberModal && (
                <div className="modal-overlay" onClick={() => setShowMemberModal(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '6px' }}>
                            Projeye Yeni Üye Ekle
                        </h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '18px' }}>
                            Eklemek istediğiniz kullanıcının kayıtlı email adresini girin. Proje bu kullanıcının da panosunda gözükecektir.
                        </p>

                        {memberError && (
                            <div className="auth-error" style={{ marginBottom: '16px' }}>
                                {memberError}
                            </div>
                        )}

                        <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div className="auth-field">
                                <label className="auth-label">Kullanıcı Email Adresi</label>
                                <input
                                    className="form-input"
                                    type="email"
                                    placeholder="uye@ornek.com"
                                    value={newMemberEmail}
                                    onChange={(e) => setNewMemberEmail(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="auth-field">
                                <label className="auth-label">Rol</label>
                                <select
                                    className="form-input"
                                    value={newMemberRole}
                                    onChange={(e) => setNewMemberRole(e.target.value as 'MEMBER' | 'OWNER')}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <option value="MEMBER">Üye (Görevleri görebilir, ekleyebilir ve ilerletebilir)</option>
                                    <option value="OWNER">Yönetici / Sahip (Tam yetki)</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => setShowMemberModal(false)}
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary btn-sm"
                                    disabled={submittingMember}
                                >
                                    {submittingMember ? 'Ekleniyor...' : 'Üyeyi Ekle'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProjectBoardPage;
