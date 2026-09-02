import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../api/axios';
import { isTokenValid } from '../utils/auth';

function LoginPage() {
    const [isRegister, setIsRegister] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (isTokenValid(token)) {
            navigate('/projects', { replace: true });
        }
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        try {
            if (isRegister) {
                await api.post('/users/register', { name, email, password });
                const loginResponse = await api.post('/users/login', { email, password });
                localStorage.setItem('token', loginResponse.data as string);
                navigate('/projects');
            } else {
                const response = await api.post('/users/login', { email, password });
                localStorage.setItem('token', response.data as string);
                navigate('/projects');
            }
        } catch (err: unknown) {
            if (isRegister) {
                if (axios.isAxiosError(err) && err.response?.data) {
                    const data = err.response.data as { message?: string };
                    setError(data.message || 'Kayıt işlemi başarısız. Lütfen bilgilerinizi kontrol edin.');
                } else {
                    setError('Kayıt işlemi başarısız. Lütfen bilgilerinizi kontrol edin.');
                }
            } else {
                setError('Email veya şifre hatalı.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo">✓</div>
                    <h1 className="auth-title">{isRegister ? 'Hesap Oluştur' : 'Giriş Yap'}</h1>
                    <p className="auth-subtitle">
                        {isRegister
                            ? 'Projelerinizi ve görevlerinizi kolayca yönetin'
                            : 'Görevlerinizi yönetmeye devam etmek için giriş yapın'}
                    </p>
                </div>

                {error && <div className="auth-error">{error}</div>}
                {successMessage && (
                    <div
                        className="auth-error"
                        style={{ backgroundColor: '#f0fdf4', color: '#15803d', borderColor: '#bbf7d0' }}
                    >
                        {successMessage}
                    </div>
                )}

                <form className="auth-form" onSubmit={handleSubmit}>
                    {isRegister && (
                        <div className="auth-field">
                            <label className="auth-label">Ad Soyad</label>
                            <input
                                className="form-input"
                                type="text"
                                placeholder="Adınız Soyadınız"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div className="auth-field">
                        <label className="auth-label">Email Adresi</label>
                        <input
                            className="form-input"
                            type="email"
                            placeholder="ornek@mail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="auth-field">
                        <label className="auth-label">Şifre</label>
                        <input
                            className="form-input"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ marginTop: '8px', padding: '12px' }}
                    >
                        {loading ? 'İşlem yapılıyor...' : isRegister ? 'Kayıt Ol' : 'Giriş Yap'}
                    </button>
                </form>

                <div className="auth-toggle">
                    {isRegister ? (
                        <>
                            Zaten bir hesabınız var mı?
                            <button
                                type="button"
                                className="auth-toggle-link"
                                onClick={() => {
                                    setIsRegister(false);
                                    setError('');
                                }}
                            >
                                Giriş Yap
                            </button>
                        </>
                    ) : (
                        <>
                            Hesabınız yok mu?
                            <button
                                type="button"
                                className="auth-toggle-link"
                                onClick={() => {
                                    setIsRegister(true);
                                    setError('');
                                }}
                            >
                                Kayıt Ol
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
