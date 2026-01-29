'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { FiMail, FiLock, FiAlertCircle } from 'react-icons/fi';

export default function LoginPage() {
    const [data, setData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const router = useRouter();

    const headerStyle = {
        textAlign: 'center' as const,
        marginBottom: '2rem',
    };

    const loginUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Quick validation
        if (!data.email || !data.password) {
            setError('Veuillez remplir tous les champs.');
            return;
        }

        try {
            const result = await signIn('credentials', {
                ...data,
                redirect: false,
            });

            if (result?.error) {
                // Translate common next-auth errors if possible, or just show generic
                if (result.error === 'CredentialsSignin') {
                    setError('Email ou mot de passe incorrect.');
                } else {
                    setError(result.error);
                }
            } else {
                router.push('/');
                router.refresh();
            }
        } catch (err: any) {
            setError('Une erreur inattendue est survenue.');
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
                <div style={headerStyle}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Connexion</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Accédez à la galerie.</p>
                </div>

                <form onSubmit={loginUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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

                    <div style={{ position: 'relative' }}>
                        <FiMail style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="email"
                            placeholder="Adresse Email"
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
                        Se connecter
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Pas encore de compte ? <Link href="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>S'inscrire</Link>
                </div>
            </div>
        </div>
    );
}
