'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { FiUser, FiMail, FiLock, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

export default function RegisterPage() {
    const [data, setData] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const router = useRouter();

    const registerUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!data.name || !data.email || !data.password) {
            setError('Veuillez remplir tous les champs.');
            return;
        }

        if (!data.email.endsWith('@supinfo.com')) {
            setError('L\'adresse email doit se terminer par @supinfo.com');
            return;
        }

        try {
            await axios.post('/api/register', data);
            setSuccess('Compte créé ! En attente de validation par un admin.');
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch (err: any) {
            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else if (typeof err.response?.data === 'string') {
                setError(err.response.data);
            } else {
                setError('Une erreur est survenue !');
            }
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Inscription</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Rejoignez SupGallery.</p>
                </div>

                <form onSubmit={registerUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {error && (
                        <div style={{
                            background: 'rgba(239, 68, 68, 0.2)',
                            border: '1px solid rgba(239, 68, 68, 0.5)',
                            color: '#f87171',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.9rem'
                        }}>
                            <FiAlertCircle /> {error}
                        </div>
                    )}
                    {success && (
                        <div style={{
                            background: 'rgba(16, 185, 129, 0.2)',
                            border: '1px solid rgba(16, 185, 129, 0.5)',
                            color: '#34d399',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.9rem'
                        }}>
                            <FiCheckCircle /> {success}
                        </div>
                    )}

                    <div style={{ position: 'relative' }}>
                        <FiUser style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Pseudo"
                            value={data.name}
                            onChange={(e) => setData({ ...data, name: e.target.value })}
                            className="input-field"
                            style={{ paddingLeft: '2.5rem' }}
                        />
                    </div>
                    <div style={{ position: 'relative' }}>
                        <FiMail style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="email"
                            placeholder="Email (@supinfo.com)"
                            value={data.email}
                            onChange={(e) => setData({ ...data, email: e.target.value })}
                            className="input-field"
                            style={{ paddingLeft: '2.5rem' }}
                        />
                    </div>
                    <div style={{ position: 'relative' }}>
                        <FiLock style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="password"
                            placeholder="Mot de passe"
                            value={data.password}
                            onChange={(e) => setData({ ...data, password: e.target.value })}
                            className="input-field"
                            style={{ paddingLeft: '2.5rem' }}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                        Créer un compte
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Déjà un compte ? <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Se connecter</Link>
                </div>
            </div>
        </div>
    );
}
