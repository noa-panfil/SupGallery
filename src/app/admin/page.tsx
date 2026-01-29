'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { FiCheck, FiX, FiUser } from 'react-icons/fi';

interface User {
    id: number;
    name: string;
    email: string;
    isApproved: boolean;
    createdAt: string;
}

export default function AdminPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            if (!session?.user?.isAdmin) {
                router.push('/');
            } else {
                fetchUsers();
            }
        }
    }, [status, session, router]);

    const fetchUsers = async () => {
        try {
            const res = await axios.get('/api/admin/users');
            setUsers(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const approveUser = async (id: number) => {
        try {
            await axios.patch(`/api/admin/users/${id}/approve`);
            setUsers(users.map(u => u.id === id ? { ...u, isApproved: true } : u));
        } catch (error) {
            console.error(error);
        }
    };

    const deleteUser = async (id: number) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
        try {
            await axios.delete(`/api/admin/users/${id}`);
            setUsers(users.filter(u => u.id !== id));
        } catch (error) {
            console.error(error);
        }
    }

    if (status === 'loading' || loading) return <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>Chargement Panel Admin...</div>;

    return (
        <div className="container">
            <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', fontWeight: 800 }}>Tableau de Bord Admin</h1>

            <div className="glass-panel" style={{ padding: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                    Gestion des Utilisateurs & Approbations
                </h2>

                <div style={{ display: 'grid', gap: '1rem' }}>
                    {users.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)' }}>Aucun utilisateur trouvé.</p>
                    ) : (
                        users.map((user) => (
                            <div key={user.id} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '1rem',
                                background: 'rgba(255,255,255, 0.03)',
                                borderRadius: '0.75rem',
                                border: '1px solid var(--glass-border)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: 'rgba(255,255,255,0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <FiUser />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{user.name}</h3>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{user.email}</p>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Inscrit le : {new Date(user.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {!user.isApproved && (
                                        <button
                                            onClick={() => approveUser(user.id)}
                                            className="btn"
                                            style={{ background: '#10b981', color: 'white', padding: '0.5rem 1rem' }}
                                        >
                                            <FiCheck style={{ marginRight: '0.25rem' }} /> Approuver
                                        </button>
                                    )}
                                    <button
                                        onClick={() => deleteUser(user.id)}
                                        className="btn"
                                        style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid #f87171', padding: '0.5rem 1rem' }}
                                    >
                                        <FiX style={{ marginRight: '0.25rem' }} /> Supprimer
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
